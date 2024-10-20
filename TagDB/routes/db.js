// db.js
const mysql = require('mysql2');

// Create a connection pool or single connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'taguser',
    password: 'taggy',
    database: 'TagDB'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to database as ID ' + db.threadId);
});

module.exports = db;
