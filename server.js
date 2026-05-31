const express = require("express");
const multer = require("multer");

const app = express();

app.use(express.json());
app.use("/uploads", express.static("uploads"));

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

/* ================= LINK ================= */
let currentLink = "https://your-link.trycloudflare.com";

app.get("/link",(req,res)=>{
    return res.redirect(currentLink);
});

app.get("/set-link",(req,res)=>{
    if(req.query.url){
        currentLink = req.query.url;
        return res.json({ok:true,newLink:currentLink});
    }
    res.json({ok:false});
});

/* ================= HOME ================= */
app.get("/",(req,res)=>{
    res.sendFile(__dirname + "/index.html");
});

/* ================= USERS ================= */
app.post("/login",(req,res)=>{
    if(!USERS.includes(req.body.user)){
        USERS.push(req.body.user);
    }
    res.json({ok:true});
});

app.get("/users",(req,res)=>{
    res.json(USERS);
});

/* ================= UPLOAD ================= */
app.post("/upload", upload.single("file"), (req,res)=>{
    res.json({
        file:req.file.filename,
        type:req.file.mimetype
    });
});

/* ================= POSTS ================= */
app.post("/post",(req,res)=>{

const user = req.body.user;

/* empty post */
if(!req.body.text || req.body.text.trim() === ""){
    return res.json({ok:false,error:"لا يمكن نشر منشور فارغ"});
}

/* ban check */
if(isBanned(user)){
    return res.json({ok:false,error:"أنت محظور مؤقتًا"});
}

/* spam check */
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

/* ================= LIKE ================= */
app.post("/like",(req,res)=>{
    let p = POSTS.find(x=>x.id==req.body.id);
    if(!p) return res.json({error:true});

    if(p.likedBy.includes(req.body.user)) return;

    p.likes++;
    p.likedBy.push(req.body.user);

    res.json({ok:true});
});

/* ================= DISLIKE ================= */
app.post("/dislike",(req,res)=>{
    let p = POSTS.find(x=>x.id==req.body.id);
    if(!p) return;

    if(p.dislikedBy.includes(req.body.user)) return;

    p.dislikes++;
    p.dislikedBy.push(req.body.user);

    res.json({ok:true});
});

/* ================= DELETE ================= */
app.post("/delete",(req,res)=>{

const i = POSTS.findIndex(p=>p.id==req.body.id);

if(i === -1){
    return res.json({ok:false,error:"Post not found"});
}

if(req.body.pass !== ADMIN_PASS){
    return res.json({ok:false,error:"Wrong password"});
}

POSTS.splice(i,1);

res.json({ok:true});

});

/* ================= CHAT ================= */
app.post("/send",(req,res)=>{

if(isBanned(req.body.user)){
    return res.json({ok:false,error:"محظور من الرسائل"});
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

/* ================= START ================= */
app.listen(process.env.PORT || 3000,()=>{
    console.log("🚀 Server running");
});
