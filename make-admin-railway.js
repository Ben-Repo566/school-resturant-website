const mysql = require('mysql2');
require('dotenv').config();

// Connect to Railway MySQL using environment variables
const connection = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306
});

const email = 'benabutbul1980@gmail.com';

connection.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to Railway MySQL:', err);
        process.exit(1);
    }
    console.log('✅ Connected to Railway MySQL database');

    // Make user admin
    connection.query(
        'UPDATE users SET is_admin = TRUE WHERE email = ?',
        [email],
        (err, result) => {
            if (err) {
                console.error('❌ Error updating admin status:', err);
                connection.end();
                process.exit(1);
            }

            if (result.affectedRows === 0) {
                console.log('❌ No user found with email:', email);
            } else {
                console.log('✅ Successfully made admin:', email);
                console.log('🎉 You can now access the admin panel!');
            }

            connection.end();
        }
    );
});
