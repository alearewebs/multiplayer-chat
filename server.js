const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.json());

// -----------------------------
// ACCOUNTS STORED IN MEMORY
// -----------------------------
let accounts = [];  // Example: [{ username: "test", password: "1234" }]

// -----------------------------
// SERVE HTML DIRECTLY
// -----------------------------
app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Chat</title>
    <script src="/socket.io/socket.io.js"></script>
</head>

<body>
    <div id="login">
        <h2>Login / Signup</h2>

        <input id="user" placeholder="Username"><br>
        <input id="pass" type="password" placeholder="Password"><br>

        <button onclick="login()">Login</button>
        <button onclick="signup()">Signup</button>

        <p id="msg"></p>
    </div>

    <div id="chat" style="display:none;">
        <h2>Chat Room</h2>

        <ul id="messages"></ul>

        <input id="text" autocomplete="off">
        <button onclick="sendMsg()">Send</button>
    </div>

<script>
const socket = io();

// SIGNUP
function signup() {
    fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: user.value,
            password: pass.value
        })
    })
    .then(r => r.json())
    .then(data => {
        msg.innerText = data.success
            ? "Account created!"
            : data.msg;
    });
}

// LOGIN
function login() {
    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: user.value,
            password: pass.value
        })
    })
    .then(r => r.json())
    .then(data => {
        if (!data.success) {
            msg.innerText = data.msg;
            return;
        }

        // SUCCESS -> show chat
        document.getElementById("login").style.display = "none";
        document.getElementById("chat").style.display = "block";

        socket.emit("setUser", user.value);
    });
}

// RECEIVE CHAT
socket.on("chat message", msg => {
    const li = document.createElement("li");
    li.textContent = msg;
    messages.appendChild(li);
});

// SEND CHAT
function sendMsg() {
    socket.emit("chat message", text.value);
    text.value = "";
}
</script>

</body>
</html>
    `);
});

// -----------------------------
// API ROUTES
// -----------------------------

// SIGNUP
app.post("/signup", (req, res) => {
    const { username, password } = req.body;

    if (accounts.find(u => u.username === username))
        return res.json({ success: false, msg: "Username already exists" });

    accounts.push({ username, password });
    return res.json({ success: true });
});

// LOGIN
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const user = accounts.find(
        u => u.username === username && u.password === password
    );

    if (!user)
        return res.json({ success: false, msg: "Wrong username or password" });

    return res.json({ success: true });
});

// -----------------------------
// SOCKET CHAT
// -----------------------------
io.on("connection", socket => {
    let username = "Unknown";

    socket.on("setUser", user => {
        username = user;
    });

    socket.on("chat message", msg => {
        io.emit("chat message", username + ": " + msg);
    });
});

// -----------------------------
http.listen(3000, () => console.log("Server running on port 3000"));
