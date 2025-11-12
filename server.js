require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

    // Create tables if they don't exist
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
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
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Unable to connect. Please try again later.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'No account found with this email' });
        }

        const user = results[0];

        // Compare password
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ error: 'Incorrect password' });
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
