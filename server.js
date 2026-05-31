const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

/* ================= FIX uploads folder ================= */
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const upload = multer({ dest: "uploads/" });

const ADMIN_PASS = "mbark#7171124";

/* ================= DATA ================= */
let POSTS = [];
let MESSAGES = [];
let USERS = [];

/* ================= BAN SYSTEM ================= */
let BANNED_USERS = [];
let USER_ACTIVITY = {};

/* ================= CHECK BAN ================= */
function isBanned(user){
    const now = Date.now();
    const ban = BANNED_USERS.find(b => b.name === user);

    if(!ban) return false;

    if(now > ban.until){
        BANNED_USERS = BANNED_USERS.filter(b => b.name !== user);
        return false;
    }

    return true;
}

/* ================= SPAM CHECK ================= */
function checkSpam(user){
    const now = Date.now();

    if(!USER_ACTIVITY[user]){
        USER_ACTIVITY[user] = [];
    }

    USER_ACTIVITY[user] = USER_ACTIVITY[user].filter(t => now - t < 60000);
    USER_ACTIVITY[user].push(now);

    return USER_ACTIVITY[user].length > 10;
}

/* ================= HOME ================= */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

/* ================= POSTS ================= */
app.post("/post",(req,res)=>{

const user = req.body.user;

/* empty post */
if(!req.body.text || req.body.text.trim() === ""){
    return res.json({ok:false,error:"لا يمكن نشر منشور فارغ"});
}

/* ban */
if(isBanned(user)){
    return res.json({ok:false,error:"أنت محظور مؤقتًا"});
}

/* spam */
if(checkSpam(user)){
    BANNED_USERS.push({
        name:user,
        until: Date.now() + 60*60*1000
    });

    return res.json({
        ok:false,
        error:"تم حظرك لمدة ساعة بسبب الإزعاج"
    });
}

POSTS.push({
    id: Date.now(),
    user,
    text: req.body.text,
    file: req.body.file,
    type: req.body.type,
    likes: 0,
    dislikes: 0,
    likedBy: [],
    dislikedBy: []
});

res.json({ok:true});
});

app.get("/posts",(req,res)=>{
    res.json(POSTS);
});

/* ================= CHAT ================= */
app.post("/send",(req,res)=>{

if(isBanned(req.body.user)){
    return res.json({ok:false,error:"محظور من الرسائل"});
}

if(!req.body.text || req.body.text.trim()===""){
    return res.json({ok:false,error:"رسالة فارغة"});
}

MESSAGES.push({
    id: Date.now(),
    user: req.body.user,
    text: req.body.text
});

if(MESSAGES.length > 5){
    MESSAGES = MESSAGES.slice(-5);
}

res.json({ok:true});
});

app.get("/messages",(req,res)=>{
    res.json(MESSAGES);
});

/* ================= UPLOAD ================= */
app.post("/upload", upload.single("file"), (req,res)=>{
    res.json({
        file: req.file.filename,
        type: req.file.mimetype
    });
});

/* ================= START ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Server running on " + PORT);
});
