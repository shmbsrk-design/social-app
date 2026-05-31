const express = require("express");
const multer = require("multer");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use("/uploads", express.static("uploads"));

const upload = multer({ dest: "uploads/" });

const ADMIN_PASS = "mbark#7171124";

/* ================= DATA ================= */
let POSTS = [];
let MESSAGES = [];
let USERS = [];

/* ================= LINK STORAGE ================= */
const LINK_FILE = "link.json";

/* تحميل الرابط عند التشغيل */
let currentLink = "https://detective-police-diagnostic-fixtures.trycloudflare.com";

try {
    if (fs.existsSync(LINK_FILE)) {
        const data = JSON.parse(fs.readFileSync(LINK_FILE));
        if (data.link) currentLink = data.link;
    }
} catch (e) {
    console.log("No saved link, using default");
}

/* ================= BRIDGE (الرابط الوسيط الثابت) ================= */
app.get("/link", (req, res) => {
    return res.redirect(currentLink);
});

/* ================= تحديث الرابط الحقيقي ================= */
app.get("/set-link", (req, res) => {
    if (!req.query.url) {
        return res.json({ ok: false, error: "No URL provided" });
    }

    currentLink = req.query.url;

    /* حفظ الرابط */
    fs.writeFileSync(LINK_FILE, JSON.stringify({ link: currentLink }));

    res.json({
        ok: true,
        message: "Link updated successfully",
        newLink: currentLink
    });
});

/* ================= HOME ================= */
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

/* ================= USERS ================= */
app.post("/login", (req, res) => {
    if (!USERS.includes(req.body.user)) {
        USERS.push(req.body.user);
    }
    res.json({ ok: true });
});

app.get("/users", (req, res) => {
    res.json(USERS);
});

/* ================= UPLOAD ================= */
app.post("/upload", upload.single("file"), (req, res) => {
    res.json({
        file: req.file.filename,
        type: req.file.mimetype
    });
});

/* ================= POSTS ================= */
app.post("/post", (req, res) => {
    POSTS.push({
        id: Date.now(),
        user: req.body.user,
        text: req.body.text,
        file: req.body.file,
        type: req.body.type,
        likes: 0,
        dislikes: 0,
        likedBy: [],
        dislikedBy: []
    });

    res.json({ ok: true });
});

app.get("/posts", (req, res) => {
    res.json(POSTS);
});

/* ================= LIKE ================= */
app.post("/like", (req, res) => {
    let p = POSTS.find(x => x.id == req.body.id);
    if (!p) return res.json({ error: true });

    if (p.likedBy.includes(req.body.user)) return;

    p.likes++;
    p.likedBy.push(req.body.user);

    res.json({ ok: true });
});

/* ================= DISLIKE ================= */
app.post("/dislike", (req, res) => {
    let p = POSTS.find(x => x.id == req.body.id);
    if (!p) return res.json({ error: true });

    if (p.dislikedBy.includes(req.body.user)) return;

    p.dislikes++;
    p.dislikedBy.push(req.body.user);

    res.json({ ok: true });
});

/* ================= DELETE ================= */
app.post("/delete", (req, res) => {
    let i = POSTS.findIndex(p => p.id == req.body.id);

    if (i == -1) return res.json({ error: true });

    if (req.body.pass === ADMIN_PASS) {
        POSTS.splice(i, 1);
        return res.json({ ok: true });
    }

    res.json({ ok: false, error: "Wrong password" });
});

/* ================= CHAT ================= */
app.post("/send", (req, res) => {
    MESSAGES.push({
        id: Date.now(),
        user: req.body.user,
        text: req.body.text
    });

    if (MESSAGES.length > 5) {
        MESSAGES = MESSAGES.slice(-5);
    }

    res.json({ ok: true });
});

app.get("/messages", (req, res) => {
    res.json(MESSAGES);
});

/* ================= START ================= */
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
    console.log("🔵 Bridge link (fixed): /link");
    console.log("🟢 Current tunnel:", currentLink);
});
