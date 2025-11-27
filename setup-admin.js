const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
    console.log('🔧 Admin Account Setup Tool');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get database credentials
    console.log('📝 Enter your MySQL credentials:\n');

    const dbHost = await question('MySQL Host (press Enter for localhost): ') || 'localhost';
    const dbUser = await question('MySQL Username (press Enter for root): ') || 'root';
    const dbPassword = await question('MySQL Password: ');
    const dbName = await question('Database Name (press Enter for school_project): ') || 'school_project';

    console.log('\n🔌 Connecting to database...');

    let connection;
    try {
        connection = await mysql.createConnection({
            host: dbHost,
            user: dbUser,
            password: dbPassword,
            database: dbName
        });

        console.log('✅ Connected to database\n');

        // Check if is_admin column exists
        console.log('🔍 Checking database structure...');
        const [columns] = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_admin'`,
            [dbName]
        );

        if (columns.length === 0) {
            console.log('📝 Adding is_admin column to users table...');
            await connection.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE');
            console.log('✅ Column added successfully\n');
        } else {
            console.log('✅ Database structure is good\n');
        }

        // Admin details
        const adminUsername = 'Ben';
        const adminEmail = 'benabutbul1980@gmail.com';
        const adminPassword = 'Admin123';

        console.log('🔐 Creating admin account...');

        // Check if user exists
        const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', [adminEmail]);

        if (users.length > 0) {
            // Update existing user to admin
            console.log('👤 Account found, updating to admin...');
            await connection.execute('UPDATE users SET is_admin = TRUE WHERE email = ?', [adminEmail]);

            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎉 ADMIN ACCOUNT UPDATED!');
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
            console.log('🎉 ADMIN ACCOUNT CREATED!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`👤 Username: ${adminUsername}`);
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
            console.log('\n⚠️  Change this password after first login!');
        }

        console.log('\n🌐 Admin Login URL:');
        console.log('   http://localhost:3000/admin-login');
        console.log('\n📊 Admin Panel URL:');
        console.log('   http://localhost:3000/admin');
        console.log('\n💡 Next Steps:');
        console.log('   1. Start server: npm start');
        console.log('   2. Visit: http://localhost:3000/admin-login');
        console.log('   3. Login and manage users');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Tip: Wrong MySQL username or password');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n💡 Tip: Database "' + dbName + '" does not exist');
            console.log('   Create it first: mysql -u root -p -e "CREATE DATABASE school_project;"');
        }
    } finally {
        if (connection) await connection.end();
        rl.close();
    }
}

setup();
