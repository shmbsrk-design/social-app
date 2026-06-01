const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
    path.join(__dirname, "gaza-social.db"),
    err => {
        if (err) {
            console.error(err);
        } else {
            console.log("Database Connected");
        }
    }
);

/* ==========================
   POSTS
========================== */

db.run(`
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    author TEXT,
    text TEXT,
    file TEXT,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    createdAt INTEGER
)
`);

/* ==========================
   COMMENTS
========================== */

db.run(`
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    postId TEXT,
    author TEXT,
    text TEXT
)
`);

/* ==========================
   MESSAGES
========================== */

db.run(`
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    author TEXT,
    text TEXT,
    createdAt INTEGER
)
`);

/* ==========================
   NOTIFICATIONS
========================== */

db.run(`
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    text TEXT,
    createdAt INTEGER
)
`);

/* ==========================
   SETTINGS
========================== */

db.run(`
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    notificationsEnabled INTEGER DEFAULT 1
)
`);

/* ==========================
   INITIAL SETTINGS
========================== */

db.get(
    "SELECT * FROM settings WHERE id=1",
    (err, row) => {

        if (!row) {

            db.run(`
                INSERT INTO settings
                (id, notificationsEnabled)
                VALUES (1,1)
            `);

        }

    }
);

module.exports = db;
