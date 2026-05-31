const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

/* ================= UPLOADS ================= */
const UPLOADS_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

const upload = multer({ dest: UPLOADS_DIR });

const ADMIN_PASS = "mbark#7171124";

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

/* ❗ منع منشور فارغ (إلا إذا فيه ملف) */
if ((!text || text.trim() === "") && !file) {
    return res.json({
        ok: false,
        error: "لا يمكن نشر منشور فارغ"
    });
}

POSTS.push({
    id: Date.now(),
    user,
    text: text || "",
    file: file || null,
    type: type || null,
    likes: 0,
    dislikes: 0,
    likedBy: [],
    dislikedBy: []
});

res.json({ ok: true });
});

/* ================= GET POSTS ================= */
app.get("/posts", (req, res) => {
    res.json(POSTS);
});

/* ================= LIKE ================= */
app.post("/like", (req, res) => {

let post = POSTS.find(p => p.id == req.body.id);
if (!post) return res.json({ ok: false });

if (post.likedBy.includes(req.body.user)) return res.json({ ok: true });

post.likes++;
post.likedBy.push(req.body.user);

res.json({ ok: true });
});

/* ================= DISLIKE ================= */
app.post("/dislike", (req, res) => {

let post = POSTS.find(p => p.id == req.body.id);
if (!post) return res.json({ ok: false });

if (post.dislikedBy.includes(req.body.user)) return res.json({ ok: true });

post.dislikes++;
post.dislikedBy.push(req.body.user);

res.json({ ok: true });
});

/* ================= DELETE (PASSWORD) ================= */
app.post("/delete", (req, res) => {

let index = POSTS.findIndex(p => p.id == req.body.id);
if (index === -1) return res.json({ ok: false });

if (req.body.pass !== ADMIN_PASS) {
    return res.json({
        ok: false,
        error: "كلمة السر خطأ"
    });
}

POSTS.splice(index, 1);

res.json({ ok: true });
});

/* ================= CHAT ================= */
app.post("/send", (req, res) => {

const { user, text } = req.body;

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
