const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Use Railway environment variables
const connection = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306
});

async function createAdmin() {
    try {
        connection.connect((err) => {
            if (err) {
                console.error('❌ Error connecting to Railway MySQL:', err);
                process.exit(1);
            }
            console.log('✅ Connected to Railway MySQL database');
        });

        const email = 'benabutbul1980@gmail.com';
        const password = 'Admin123'; // Change this to your desired password
        const name = 'Ben';

        // Check if user already exists
        connection.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('❌ Error checking user:', err);
                connection.end();
                return;
            }

            if (results.length > 0) {
                console.log('✅ User already exists! Updating to admin...');
                connection.query('UPDATE users SET is_admin = TRUE WHERE email = ?', [email], (err) => {
                    if (err) {
                        console.error('❌ Error updating admin status:', err);
                    } else {
                        console.log('✅ Admin status updated successfully!');
                    }
                    connection.end();
                });
            } else {
                // Create new admin user
                const hashedPassword = await bcrypt.hash(password, 10);

                connection.query(
                    'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, TRUE)',
                    [name, email, hashedPassword],
                    (err, result) => {
                        if (err) {
                            console.error('❌ Error creating admin user:', err);
                        } else {
                            console.log('✅ Admin user created successfully!');
                            console.log(`Email: ${email}`);
                            console.log(`Password: ${password}`);
                            console.log('⚠️  Please change this password after logging in!');
                        }
                        connection.end();
                    }
                );
            }
        });
    } catch (error) {
        console.error('❌ Error:', error);
        connection.end();
    }
}

createAdmin();
