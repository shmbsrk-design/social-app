const socket = io();

let username = localStorage.getItem("username") || "";

/* ==========================
   STARTUP
========================== */

window.onload = async () => {

    if (username) {
        document.getElementById("nameDialog").style.display = "none";
        document.getElementById("settingsName").value = username;
    }

    await loadPosts();
    await loadMessages();
    await loadNotifications();
    await loadSettings();
};

/* ==========================
   USERNAME
========================== */

function saveUsername() {

    const value =
        document.getElementById("usernameInput").value.trim();

    if (!value) {
        alert("اكتب اسمك");
        return;
    }

    username = value;

    localStorage.setItem("username", username);

    document.getElementById("nameDialog").style.display = "none";

    document.getElementById("settingsName").value = username;
}

/* ==========================
   NAVIGATION
========================== */

function showPage(pageId) {

    document.querySelectorAll(".page")
        .forEach(page => {
            page.classList.remove("active");
        });

    document.getElementById(pageId)
        .classList.add("active");
}

/* ==========================
   POSTS
========================== */

async function createPost() {

    if (!username) {
        alert("أدخل اسمك أولاً");
        return;
    }

    const text =
        document.getElementById("postText").value;

    const file =
        document.getElementById("postFile").files[0];

    const formData = new FormData();

    formData.append("author", username);
    formData.append("text", text);

    if (file) {
        formData.append("file", file);
    }

    await fetch("/api/posts", {
        method: "POST",
        body: formData
    });

    document.getElementById("postText").value = "";
    document.getElementById("postFile").value = "";

    loadPosts();
    loadNotifications();
}

async function loadPosts() {

    const res = await fetch("/api/posts");
    const posts = await res.json();

    const container =
        document.getElementById("postsContainer");

    container.innerHTML = "";

    posts.forEach(post => {

        const div = document.createElement("div");

        let media = "";

        if (post.file) {

            const ext =
                post.file.split(".").pop().toLowerCase();

            if (
                ["jpg", "jpeg", "png", "gif", "webp"]
                .includes(ext)
            ) {
                media =
                    `<img class="post-media" src="${post.file}">`;
            } else {
                media =
                    `<video class="post-media" controls src="${post.file}"></video>`;
            }
        }

        let commentsHTML = "";

        post.comments.forEach(comment => {

            commentsHTML += `
            <div class="comment">
                <b>${comment.author}</b><br>
                ${comment.text}
            </div>
            `;
        });

        div.className = "post";

        div.innerHTML = `
        <div class="post-border"></div>

        <div class="post-content">

            <div class="post-author">
                ${post.author}
            </div>

            <div class="post-text">
                ${post.text}
            </div>

            ${media}

            <div class="post-actions">

                <button onclick="likePost('${post.id}')">
                    👍 ${post.likes}
                </button>

                <button onclick="dislikePost('${post.id}')">
                    👎 ${post.dislikes}
                </button>

            </div>

            <div class="comment-box">

                <input
                    id="comment-${post.id}"
                    placeholder="اكتب تعليق..."
                >

                <button
                    onclick="addComment('${post.id}')">

                    تعليق

                </button>

            </div>

            ${commentsHTML}

        </div>
        `;

        container.appendChild(div);
    });
}

async function likePost(id) {

    await fetch(`/api/posts/${id}/like`, {
        method: "POST"
    });

    loadPosts();
}

async function dislikePost(id) {

    await fetch(`/api/posts/${id}/dislike`, {
        method: "POST"
    });

    loadPosts();
}

async function addComment(id) {

    const input =
        document.getElementById(`comment-${id}`);

    const text = input.value.trim();

    if (!text) return;

    await fetch(`/api/posts/${id}/comment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            author: username,
            text
        })
    });

    input.value = "";

    loadPosts();
}

/* ==========================
   MESSAGES
========================== */

async function sendMessage() {

    const input =
        document.getElementById("messageInput");

    const text = input.value.trim();

    if (!text) return;

    await fetch("/api/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            author: username,
            text
        })
    });

    input.value = "";

    loadMessages();
}

async function loadMessages() {

    const res =
        await fetch("/api/messages");

    const messages =
        await res.json();

    const container =
        document.getElementById("messagesContainer");

    container.innerHTML = "";

    messages.forEach(msg => {

        const div =
            document.createElement("div");

        div.className = "message";

        div.innerHTML = `
            <div class="message-author">
                ${msg.author}
            </div>

            <div>
                ${msg.text}
            </div>
        `;

        container.appendChild(div);
    });

    container.scrollTop =
        container.scrollHeight;
}

/* ==========================
   SOCKET
========================== */

socket.on("new-message", () => {

    loadMessages();

});

/* ==========================
   NOTIFICATIONS
========================== */

async function loadNotifications() {

    const res =
        await fetch("/api/notifications");

    const notifications =
        await res.json();

    const container =
        document.getElementById(
            "notificationsContainer"
        );

    container.innerHTML = "";

    notifications.forEach(notification => {

        const div =
            document.createElement("div");

        div.className = "notification";

        div.textContent =
            notification.text;

        container.appendChild(div);
    });
}

socket.on(
    "notifications-update",
    () => {
        loadNotifications();
    }
);

/* ==========================
   SETTINGS
========================== */

async function saveSettings() {

    const newName =
        document.getElementById(
            "settingsName"
        ).value.trim();

    if (newName) {

        username = newName;

        localStorage.setItem(
            "username",
            newName
        );
    }

    const enabled =
        document.getElementById(
            "notificationToggle"
        ).checked;

    await fetch("/api/settings", {
        method: "POST",
        headers: {
            "Content-Type":
                "application/json"
        },
        body: JSON.stringify({
            notificationsEnabled:
                enabled
        })
    });

    alert("تم الحفظ");
}

async function loadSettings() {

    const res =
        await fetch("/api/settings");

    const settings =
        await res.json();

    document.getElementById(
        "notificationToggle"
    ).checked =
        settings.notificationsEnabled;
}

/* ==========================
   SMART REFRESH
========================== */

setInterval(() => {

    if (
        document
            .getElementById("postsPage")
            .classList.contains("active")
    ) {
        loadPosts();
    }

}, 15000);
