const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function setup() {
    console.log('🔧 Quick Admin Account Setup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Try common MySQL configurations
    const configs = [
        { host: 'localhost', user: 'root', password: '', database: 'school_project' },
        { host: 'localhost', user: 'root', password: 'root', database: 'school_project' },
        { host: 'localhost', user: 'root', password: 'password', database: 'school_project' },
        { host: '127.0.0.1', user: 'root', password: '', database: 'school_project' }
    ];

    let connection = null;
    let connectedConfig = null;

    console.log('🔌 Trying to connect to MySQL...\n');

    for (const config of configs) {
        try {
            console.log(`   Trying: ${config.user}@${config.host} ${config.password ? '(with password)' : '(no password)'}`);
            connection = await mysql.createConnection(config);
            connectedConfig = config;
            console.log('   ✅ Connected!\n');
            break;
        } catch (err) {
            console.log('   ❌ Failed');
        }
    }

    if (!connection) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('❌ Could not connect to MySQL');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n💡 Please run setup manually with your MySQL password:');
        console.log('\n   node setup-admin.js\n');
        console.log('Or set your MySQL password to empty:');
        console.log('   mysql -u root -p');
        console.log('   ALTER USER \'root\'@\'localhost\' IDENTIFIED BY \'\';');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        process.exit(1);
    }

    try {
        // Check if database exists
        const [dbs] = await connection.execute("SHOW DATABASES LIKE 'school_project'");
        if (dbs.length === 0) {
            console.log('📝 Creating database "school_project"...');
            await connection.execute('CREATE DATABASE school_project');
            console.log('✅ Database created\n');

            // Reconnect to the new database
            await connection.end();
            connection = await mysql.createConnection(connectedConfig);
        }

        // Check if users table exists
        const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
        if (tables.length === 0) {
            console.log('📝 Creating users table...');
            await connection.execute(`
                CREATE TABLE users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    is_admin BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Table created\n');
        }

        // Check if is_admin column exists
        console.log('🔍 Checking database structure...');
        const [columns] = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = 'school_project' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_admin'`
        );

        if (columns.length === 0) {
            console.log('📝 Adding is_admin column...');
            await connection.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE');
            console.log('✅ Column added\n');
        } else {
            console.log('✅ Database structure is good\n');
        }

        // Admin details
        const adminUsername = 'Ben';
        const adminEmail = 'benabutbul1980@gmail.com';
        const adminPassword = 'Admin123';

        console.log('🔐 Setting up admin account...');

        // Check if user exists
        const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', [adminEmail]);

        if (users.length > 0) {
            // Update existing user to admin
            console.log('👤 Account found, making it admin...');
            await connection.execute('UPDATE users SET is_admin = TRUE WHERE email = ?', [adminEmail]);

            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ ADMIN ACCOUNT UPDATED!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📧 Email: ${adminEmail}`);
            console.log('🔑 Password: Use your existing password');
        } else {
            // Create new admin
            console.log('👤 Creating new admin account...');
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            await connection.execute(
                'INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, TRUE)',
                [adminUsername, adminEmail, hashedPassword]
            );

            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ ADMIN ACCOUNT CREATED!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`👤 Username: ${adminUsername}`);
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
            console.log('\n⚠️  IMPORTANT: Change this password after first login!');
        }

        console.log('\n🌐 Access Admin Panel:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Start server: npm start');
        console.log('2. Admin Login: http://localhost:3000/admin-login');
        console.log('3. Admin Panel: http://localhost:3000/admin');
        console.log('\n💡 In Admin Panel you can:');
        console.log('   • View all users');
        console.log('   • Delete unwanted accounts');
        console.log('   • Search for users');
        console.log('   • See member statistics');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

setup();
