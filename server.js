require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const sgMail = require('@sendgrid/mail');

const app = express();
const PORT = process.env.PORT || 3000;
// Trigger rebuild for Railway database fix

// Email configuration using SendGrid
if (process.env.SENDGRIDAPIKEY) {
    sgMail.setApiKey(process.env.SENDGRIDAPIKEY);
} else {
    console.warn('⚠️  SENDGRIDAPIKEY not set - email functionality will be limited');
}

// Trust proxy - required for Railway/production environments
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Set to true in production (HTTPS)
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// CSRF Token Generation
const crypto = require('crypto');

function generateCsrfToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Rate Limiting
const rateLimitStore = new Map();

function rateLimit(options = {}) {
    const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
    const max = options.max || 5; // 5 requests per window default
    const message = options.message || 'Too many requests, please try again later';

    return (req, res, next) => {
        const identifier = req.ip || req.connection.remoteAddress;
        const key = `${identifier}-${req.path}`;
        const now = Date.now();

        if (!rateLimitStore.has(key)) {
            rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }

        const data = rateLimitStore.get(key);

        if (now > data.resetTime) {
            rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }

        if (data.count >= max) {
            return res.status(429).json({ error: message });
        }

        data.count++;
        next();
    };
}

// Clean up expired rate limit entries every hour
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now > data.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 60 * 60 * 1000);

// Authentication Middlewares
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// CSRF Protection Middleware
const csrfProtection = (req, res, next) => {
    // Skip CSRF check for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip CSRF for register, login, and password reset endpoints
    // Note: req.path doesn't include the /api prefix when middleware is mounted on /api
    const skipCSRFPaths = ['/register', '/login', '/forgot-password', '/verify-reset-code', '/reset-password'];
    if (skipCSRFPaths.includes(req.path)) {
        return next();
    }

    const token = req.headers['x-csrf-token'] || req.body.csrfToken;

    if (!token || token !== req.session.csrfToken) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    next();
};

// Apply CSRF protection to all API routes
app.use('/api', csrfProtection);

// Menu items with server-side validated prices
const MENU_ITEMS = {
    'Classic Golden Fries': 35,
    'Loaded Baked Potato': 58,
    'Sweet Potato Wedges': 42,
    'Truffle Mashed Potatoes': 65,
    'Crispy Potato Skins': 48,
    'Hasselback Potatoes': 52,
    'Homemade Potato Gnocchi': 72,
    'Swiss Potato Rösti': 55,
    'Patatas Bravas': 45,
    'Potato Gratin Dauphinois': 68,
    'Gourmet Tater Tots': 38,
    'Potato Croquettes': 50,
    'Classic Poutine': 62,
    'Potato Latkes': 46,
    'Roasted Garlic Herb Potatoes': 40
};

// MySQL connection pool (more robust for production)
// Railway provides MySQL variables as MYSQLHOST, MYSQLUSER, etc.
const db = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    port: process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'school_project',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection and log database info
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to database:', err);
        console.error('Database config:', {
            host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
            port: process.env.MYSQLPORT || 3306,
            user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
            database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'school_project'
        });
        return;
    }
    console.log('Connected to MySQL database');
    connection.release();

    // Create tables if they don't exist
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    const createCartTable = `
        CREATE TABLE IF NOT EXISTS cart (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            item_name VARCHAR(255) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;

    const createOrdersTable = `
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            total_amount DECIMAL(10, 2) NOT NULL,
            items TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;

    // Execute table creation queries
    db.query(createUsersTable, (err) => {
        if (err) console.error('Error creating users table:', err);
        else console.log('Users table ready');
    });

    db.query(createCartTable, (err) => {
        if (err) console.error('Error creating cart table:', err);
        else console.log('Cart table ready');
    });

    db.query(createOrdersTable, (err) => {
        if (err) console.error('Error creating orders table:', err);
        else console.log('Orders table ready');
    });

    // Create reviews table
    const createReviewsTable = `
        CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;

    db.query(createReviewsTable, (err) => {
        if (err) console.error('Error creating reviews table:', err);
        else console.log('Reviews table ready');
    });

    // Create password_resets table
    const createPasswordResetsTable = `
        CREATE TABLE IF NOT EXISTS password_resets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100) NOT NULL,
            reset_code VARCHAR(6) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (email),
            INDEX (reset_code)
        )
    `;

    db.query(createPasswordResetsTable, (err) => {
        if (err) console.error('Error creating password_resets table:', err);
        else console.log('Password resets table ready');
    });
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/menu', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'menu.html'));
});

app.get('/fun-facts', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'fun-facts.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
    if (!req.session.userId || !req.session.isAdmin) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/cart', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});


// Register endpoint
app.post('/api/register', rateLimit({ max: 5, windowMs: 60 * 60 * 1000, message: 'Too many registration attempts, please try again in an hour' }), async (req, res) => {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Strong password validation
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (!/[a-z]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
    }

    if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }

    if (!/[0-9]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one number' });
    }

    try {
        // Check if user already exists
        db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, results) => {
            if (err) {
                console.error('Database error during user check:', err);
                return res.status(500).json({ error: 'Database error. Please try again later.' });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, hashedPassword],
                (err, result) => {
                    if (err) {
                        console.error('Database error during user insertion:', err);
                        return res.status(500).json({ error: 'Error creating user. Please try again later.' });
                    }
                    res.status(201).json({ message: 'User registered successfully' });
                }
            );
        });
    } catch (error) {
        console.error('Server error during registration:', error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

// Login endpoint
app.post('/api/login', rateLimit({ max: 5, windowMs: 15 * 60 * 1000, message: 'Too many login attempts, please try again in 15 minutes' }), (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Unable to connect. Please try again later.' });
        }

        if (results.length === 0) {
            // Return generic error to prevent user enumeration
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];

        // Compare password
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            // Return same generic error as above to prevent user enumeration
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Set session
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.isAdmin = user.is_admin || false;

        // Generate CSRF token for this session
        if (!req.session.csrfToken) {
            req.session.csrfToken = generateCsrfToken();
        }

        res.json({
            message: 'Login successful',
            username: user.username,
            csrfToken: req.session.csrfToken
        });
    });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logout successful' });
});

// Change password endpoint
app.post('/api/change-password', requireAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.userId;

    // Validate inputs
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Please provide both current and new password' });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (!/[a-z]/.test(newPassword)) {
        return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
    }

    if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }

    if (!/[0-9]/.test(newPassword)) {
        return res.status(400).json({ error: 'Password must contain at least one number' });
    }

    // Get current user
    db.query('SELECT * FROM users WHERE id = ?', [userId], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = results[0];

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Check if new password is same as current
        const samePassword = await bcrypt.compare(newPassword, user.password);
        if (samePassword) {
            return res.status(400).json({ error: 'New password must be different from current password' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], (err) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to update password' });
            }

            res.json({ message: 'Password changed successfully' });
        });
    });
});

// Forgot password - send reset code
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            // Don't reveal if email exists or not for security
            return res.json({ message: 'If that email exists, a reset code has been sent' });
        }

        // Generate 6-digit code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Delete any existing reset codes for this email
        db.query('DELETE FROM password_resets WHERE email = ?', [email], (err) => {
            if (err) console.error('Error deleting old reset codes:', err);
        });

        // Store reset code
        db.query(
            'INSERT INTO password_resets (email, reset_code, expires_at) VALUES (?, ?, ?)',
            [email, resetCode, expiresAt],
            (err) => {
                if (err) {
                    console.error('Error storing reset code:', err);
                    return res.status(500).json({ error: 'Failed to generate reset code' });
                }

                // Send email with reset code using SendGrid
                const msg = {
                    to: email,
                    from: process.env.EMAILUSER || 'benabutbul1980@gmail.com',
                    subject: 'Password Reset Code - Potato Kingdom',
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
                            </div>
                            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
                                <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi there,</p>
                                <p style="color: #333; font-size: 16px; line-height: 1.6;">You requested to reset your password for Potato Kingdom. Use the code below to complete the process:</p>
                                <div style="background: white; border: 2px solid #09f; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                                    <p style="color: #666; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
                                    <p style="font-size: 36px; font-weight: 600; color: #09f; margin: 0; letter-spacing: 4px; font-family: 'Courier New', monospace;">${resetCode}</p>
                                </div>
                                <p style="color: #666; font-size: 14px; line-height: 1.6;">This code will expire in <strong>15 minutes</strong>.</p>
                                <p style="color: #666; font-size: 14px; line-height: 1.6;">If you didn't request this password reset, please ignore this email.</p>
                                <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
                                <p style="color: #999; font-size: 12px; line-height: 1.6; text-align: center;">Potato Kingdom Restaurant<br>This is an automated message, please do not reply.</p>
                            </div>
                        </div>
                    `
                };

                // Send email with SendGrid
                sgMail.send(msg)
                    .then(() => {
                        console.log('✅ Password reset email sent successfully to:', email);
                        res.json({ message: 'Reset code has been sent to your email' });
                    })
                    .catch((error) => {
                        console.error('Error sending email:', error);
                        if (error.response) {
                            console.error('SendGrid error details:', error.response.body);
                        }
                        // Still log to console as fallback
                        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('🔑 PASSWORD RESET CODE (Email failed)');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log(`Email: ${email}`);
                        console.log(`Code: ${resetCode}`);
                        console.log(`Expires: ${expiresAt.toLocaleString()}`);
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                        // Return success anyway so user can proceed (code is in logs)
                        res.json({
                            message: 'Reset code generated. Check server logs for code (email delivery issue).',
                            devMode: true
                        });
                    });
            }
        );
    });
});

// Verify reset code
app.post('/api/verify-reset-code', (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ error: 'Email and code are required' });
    }

    db.query(
        'SELECT * FROM password_resets WHERE email = ? AND reset_code = ? AND expires_at > NOW()',
        [email, code],
        (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(400).json({ error: 'Invalid or expired reset code' });
            }

            res.json({ message: 'Code verified successfully' });
        }
    );
});

// Reset password with code
app.post('/api/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({ error: 'Email, code, and new password are required' });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (!/[a-z]/.test(newPassword)) {
        return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
    }

    if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }

    if (!/[0-9]/.test(newPassword)) {
        return res.status(400).json({ error: 'Password must contain at least one number' });
    }

    // Verify reset code
    db.query(
        'SELECT * FROM password_resets WHERE email = ? AND reset_code = ? AND expires_at > NOW()',
        [email, code],
        async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(400).json({ error: 'Invalid or expired reset code' });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update user password
            db.query(
                'UPDATE users SET password = ? WHERE email = ?',
                [hashedPassword, email],
                (err) => {
                    if (err) {
                        console.error('Error updating password:', err);
                        return res.status(500).json({ error: 'Failed to reset password' });
                    }

                    // Delete used reset code
                    db.query('DELETE FROM password_resets WHERE email = ?', [email], (err) => {
                        if (err) console.error('Error deleting reset code:', err);
                    });

                    res.json({ message: 'Password reset successfully' });
                }
            );
        }
    );
});

// Get CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
    if (!req.session.csrfToken) {
        req.session.csrfToken = generateCsrfToken();
    }
    res.json({ csrfToken: req.session.csrfToken });
});

// Get current user
app.get('/api/user', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    db.query('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.session.userId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ error: 'Error fetching user' });
        }
        res.json(results[0]);
    });
});

// Get all users (for admin page)
app.get('/api/users', requireAdmin, (req, res) => {
    db.query('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching users' });
        }
        res.json(results);
    });
});

// Update user endpoint
app.put('/api/users/:id', requireAdmin, (req, res) => {
    const userId = req.params.id;
    const { username, email } = req.body;

    // Validation
    if (!username || !email) {
        return res.status(400).json({ error: 'Username and email are required' });
    }

    // Check if new username or email already exists for a different user
    db.query('SELECT * FROM users WHERE (email = ? OR username = ?) AND id != ?', [email, username, userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Update user
        db.query('UPDATE users SET username = ?, email = ? WHERE id = ?',
            [username, email, userId],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Error updating user' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'User not found' });
                }

                res.json({ message: 'User updated successfully' });
            }
        );
    });
});

// Delete user endpoint
app.delete('/api/users/:id', requireAdmin, (req, res) => {
    const userId = req.params.id;

    db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error deleting user' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    });
});

// Cart endpoints
// Add item to cart
app.post('/api/cart', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { item_name, quantity } = req.body;

    if (!item_name || !quantity) {
        return res.status(400).json({ error: 'Item name and quantity are required' });
    }

    // Validate item exists in menu and get server-side price
    const price = MENU_ITEMS[item_name];
    if (!price) {
        return res.status(400).json({ error: 'Invalid menu item' });
    }

    // Validate quantity is a positive number
    if (typeof quantity !== 'number' || quantity < 1 || quantity > 100) {
        return res.status(400).json({ error: 'Invalid quantity' });
    }

    // Check if item already exists in cart
    db.query('SELECT * FROM cart WHERE user_id = ? AND item_name = ?',
        [req.session.userId, item_name],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length > 0) {
                // Update quantity
                const newQuantity = results[0].quantity + quantity;
                db.query('UPDATE cart SET quantity = ? WHERE id = ?',
                    [newQuantity, results[0].id],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Error updating cart' });
                        }
                        res.json({ message: 'Cart updated successfully' });
                    }
                );
            } else {
                // Insert new item
                db.query('INSERT INTO cart (user_id, item_name, price, quantity) VALUES (?, ?, ?, ?)',
                    [req.session.userId, item_name, price, quantity],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Error adding to cart' });
                        }
                        res.json({ message: 'Item added to cart' });
                    }
                );
            }
        }
    );
});

// Get user's cart
app.get('/api/cart', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    db.query('SELECT * FROM cart WHERE user_id = ?', [req.session.userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching cart' });
        }
        res.json(results);
    });
});

// Remove item from cart
app.delete('/api/cart/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const cartId = req.params.id;

    db.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [cartId, req.session.userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error removing item' });
        }
        res.json({ message: 'Item removed from cart' });
    });
});

// Update cart item quantity
app.put('/api/cart/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const cartId = req.params.id;
    const { quantity } = req.body;

    if (quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    db.query('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
        [quantity, cartId, req.session.userId],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error updating quantity' });
            }
            res.json({ message: 'Quantity updated' });
        }
    );
});

// Place order
app.post('/api/orders', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get cart items
    db.query('SELECT * FROM cart WHERE user_id = ?', [req.session.userId], (err, cartItems) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching cart' });
        }

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Calculate total
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create order
        db.query('INSERT INTO orders (user_id, total_amount, items) VALUES (?, ?, ?)',
            [req.session.userId, total, JSON.stringify(cartItems)],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Error creating order' });
                }

                // Clear cart
                db.query('DELETE FROM cart WHERE user_id = ?', [req.session.userId], (err) => {
                    if (err) {
                        console.error('Error clearing cart:', err);
                    }

                    res.json({
                        message: 'Order placed successfully',
                        orderId: result.insertId,
                        total: total
                    });
                });
            }
        );
    });
});

// Get user's orders
app.get('/api/orders', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
        [req.session.userId],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error fetching orders' });
            }

            // Parse items JSON
            const orders = results.map(order => ({
                ...order,
                items: JSON.parse(order.items)
            }));

            res.json(orders);
        }
    );
});

// Get last order
app.get('/api/orders/last', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [req.session.userId],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error fetching last order' });
            }

            if (results.length === 0) {
                return res.json(null);
            }

            const order = {
                ...results[0],
                items: JSON.parse(results[0].items)
            };

            res.json(order);
        }
    );
});

// Review endpoints
// Submit a review
app.post('/api/reviews', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { product_name, rating, comment } = req.body;

    if (!product_name || !rating) {
        return res.status(400).json({ error: 'Product name and rating are required' });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    db.query('INSERT INTO reviews (user_id, product_name, rating, comment) VALUES (?, ?, ?, ?)',
        [req.session.userId, product_name, rating, comment || ''],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error submitting review' });
            }
            res.json({ message: 'Review submitted successfully' });
        }
    );
});

// Get reviews for a product
app.get('/api/reviews/:productName', (req, res) => {
    const productName = req.params.productName;

    db.query(`
        SELECT reviews.*, users.username
        FROM reviews
        JOIN users ON reviews.user_id = users.id
        WHERE reviews.product_name = ?
        ORDER BY reviews.created_at DESC
    `, [productName], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching reviews' });
        }
        res.json(results);
    });
});

// Get average rating for a product
app.get('/api/reviews/:productName/average', (req, res) => {
    const productName = req.params.productName;

    db.query('SELECT AVG(rating) as average, COUNT(*) as count FROM reviews WHERE product_name = ?',
        [productName],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error fetching rating' });
            }
            res.json({
                average: results[0].average || 0,
                count: results[0].count || 0
            });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
