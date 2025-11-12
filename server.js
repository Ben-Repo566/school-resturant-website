require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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
        secure: false, // Set to true if using HTTPS
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// MySQL connection
// Railway provides MySQL variables as MYSQLHOST, MYSQLUSER, etc.
const db = mysql.createConnection({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    port: process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'school_project'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
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
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/cart', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});


// Register endpoint
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        // Check if user already exists
        db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
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
                        return res.status(500).json({ error: 'Error creating user' });
                    }
                    res.status(201).json({ message: 'User registered successfully' });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = results[0];

        // Compare password
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set session
        req.session.userId = user.id;
        req.session.username = user.username;

        res.json({ message: 'Login successful', username: user.username });
    });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logout successful' });
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
app.get('/api/users', (req, res) => {
    db.query('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching users' });
        }
        res.json(results);
    });
});

// Update user endpoint
app.put('/api/users/:id', (req, res) => {
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
app.delete('/api/users/:id', (req, res) => {
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

    const { item_name, price, quantity } = req.body;

    if (!item_name || !price || !quantity) {
        return res.status(400).json({ error: 'All fields are required' });
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
