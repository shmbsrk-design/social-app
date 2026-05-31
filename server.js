const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

/* ================= FIX uploads ================= */
const UPLOADS_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

const upload = multer({ dest: UPLOADS_DIR });

/* ================= DATA ================= */
let POSTS = [];
let MESSAGES = [];

/* ================= HOME ================= */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

/* ================= POSTS ================= */
app.post("/post", (req, res) => {

const { user, text, file, type } = req.body;

if (!user) {
    return res.json({ ok: false, error: "اسم المستخدم مطلوب" });
}

if (!text || text.trim() === "") {
    return res.json({ ok: false, error: "لا يمكن نشر منشور فارغ" });
}

POSTS.push({
    id: Date.now(),
    user,
    text,
    file: file || null,
    type: type || null,
    likes: 0,
    dislikes: 0
});

res.json({ ok: true });
});

app.get("/posts", (req, res) => {
    res.json(POSTS);
});

/* ================= CHAT ================= */
app.post("/send", (req, res) => {

const { user, text } = req.body;

if (!user) {
    return res.json({ ok: false, error: "اسم المستخدم مطلوب" });
}

if (!text || text.trim() === "") {
    return res.json({ ok: false, error: "رسالة فارغة" });
}

MESSAGES.push({
    id: Date.now(),
    user,
    text
});

if (MESSAGES.length > 20) {
    MESSAGES = MESSAGES.slice(-20);
}

res.json({ ok: true });
});

app.get("/messages", (req, res) => {
    res.json(MESSAGES);
});

/* ================= UPLOAD ================= */
app.post("/upload", upload.single("file"), (req, res) => {

if (!req.file) {
    return res.json({ ok: false, error: "لم يتم رفع ملف" });
}

res.json({
    ok: true,
    file: req.file.filename,
    type: req.file.mimetype
});

});

/* ================= START ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Server running on " + PORT);
});
