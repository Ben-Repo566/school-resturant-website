const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_project'
});

async function createAdmin() {
    try {
        // Connect to database
        db.connect((err) => {
            if (err) {
                console.error('❌ Error connecting to database:', err.message);
                console.log('\n💡 Make sure:');
                console.log('   1. MySQL is running');
                console.log('   2. Your .env file has correct database credentials');
                console.log('   3. The database "school_project" exists');
                process.exit(1);
            }
            console.log('✅ Connected to database');
        });

        // Admin details
        const adminUsername = 'Ben';
        const adminEmail = 'benabutbul1980@gmail.com';
        const adminPassword = 'Admin123'; // You can change this after first login

        console.log('\n🔐 Creating admin account...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Hash the password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Check if user already exists
        db.query('SELECT * FROM users WHERE email = ?', [adminEmail], async (err, results) => {
            if (err) {
                console.error('❌ Database error:', err.message);
                db.end();
                process.exit(1);
            }

            if (results.length > 0) {
                // User exists, update to admin
                console.log('👤 Account already exists, updating to admin...');

                db.query('UPDATE users SET is_admin = TRUE WHERE email = ?', [adminEmail], (err) => {
                    if (err) {
                        console.error('❌ Error updating user:', err.message);
                        db.end();
                        process.exit(1);
                    }

                    console.log('✅ Account updated successfully!');
                    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('🎉 ADMIN ACCOUNT IS READY!');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log(`📧 Email: ${adminEmail}`);
                    console.log('🔑 Password: Use your existing password');
                    console.log('\n🌐 Admin Login URL:');
                    console.log('   http://localhost:3000/admin-login');
                    console.log('\n📊 Admin Panel URL:');
                    console.log('   http://localhost:3000/admin');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

                    db.end();
                    process.exit(0);
                });
            } else {
                // Create new admin user
                console.log('👤 Creating new admin account...');

                const query = 'INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, TRUE)';
                db.query(query, [adminUsername, adminEmail, hashedPassword], (err) => {
                    if (err) {
                        console.error('❌ Error creating user:', err.message);
                        db.end();
                        process.exit(1);
                    }

                    console.log('✅ Admin account created successfully!');
                    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('🎉 ADMIN ACCOUNT CREATED!');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log(`👤 Username: ${adminUsername}`);
                    console.log(`📧 Email: ${adminEmail}`);
                    console.log(`🔑 Password: ${adminPassword}`);
                    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
                    console.log('\n🌐 Admin Login URL:');
                    console.log('   http://localhost:3000/admin-login');
                    console.log('\n📊 Admin Panel URL:');
                    console.log('   http://localhost:3000/admin');
                    console.log('\n💡 Next Steps:');
                    console.log('   1. Start your server: npm start');
                    console.log('   2. Visit: http://localhost:3000/admin-login');
                    console.log('   3. Login with the credentials above');
                    console.log('   4. Go to Dashboard and change your password');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

                    db.end();
                    process.exit(0);
                });
            }
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        db.end();
        process.exit(1);
    }
}

// Run the script
createAdmin();
