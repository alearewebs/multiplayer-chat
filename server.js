// --------------------------------------------
// BASIC SETUP
// --------------------------------------------
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// Use Replit/Railway port automatically
const PORT = process.env.PORT || 3000;

// Parse form POST data
app.use(express.urlencoded({ extended: true }));

// --------------------------------------------
// USER ACCOUNTS (SAVED IN MEMORY)
// --------------------------------------------
let accounts = {
    // example:
    // "alex": { password: "1234" }
};

// --------------------------------------------
// SERVE LOGIN + SIGNUP PAGE
// --------------------------------------------
app.get("/", (req, res) => {
    res.send(`
        <html>
        <body style="font-family: Arial; background:#222; color:#fff; text-align:center;">

            <h1>Login</h1>
            <form method="POST" action="/login">
                <input name="username" placeholder="Username" required /><br><br>
                <input name="password" type="password" placeholder="Password" required /><br><br>
                <button>Login</button>
            </form>

            <h2>Or Create Account</h2>
            <form method="POST" action="/signup">
                <input name="newUser" placeholder="New Username" required /><br><br>
                <input name="newPass" type="password" placeholder="New Password" required /><br><br>
                <button>Create Account</button>
            </form>

        </body>
        </html>
    `);
});

// --------------------------------------------
// LOGIN HANDLER
// --------------------------------------------
app.post("/login", (req, res) => {
    const user = req.body.username;
    const pass = req.body.password;

    if (!accounts[user]) {
        return res.send("❌ User does not exist.<br><a href='/'>Back</a>");
    }

    if (accounts[user].password !== pass) {
        return res.send("❌ Wrong password.<br><a href='/'>Back</a>");
    }

    res.send(chatPage(user));
});

// --------------------------------------------
// SIGNUP HANDLER
// --------------------------------------------
app.post("/signup", (req, res) => {
    const user = req.body.newUser;
    const pass = req.body.newPass;

    if (accounts[user]) {
        return res.send("❌ Username already taken.<br><a href='/'>Back</a>");
    }

    accounts[user] = { password: pass };

    res.send(`Account created! <br><a href="/">Login</a>`);
});

// --------------------------------------------
// CHAT PAGE HTML
// --------------------------------------------
function chatPage(username) {
    return `
    <html>
    <body style="font-family: Arial; background:#111; color:white;">

        <h2>Chat Room — Logged in as <b>${username}</b></h2>

        <div id="messages" style="
            height:300px;
            overflow-y:scroll;
            border:1px solid white;
            padding:10px;
            margin-bottom:10px;
        "></div>

        <input id="msg" placeholder="Type message..." style="width:70%;" />
        <button onclick="send()">Send</button>

        <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
        <script>
            const socket = io();
            const username = "${username}";

            socket.emit("join", username);

            socket.on("chat", data => {
                let box = document.getElementById("messages");
                box.innerHTML += "<p><b>" + data.user + ":</b> " + data.msg + "</p>";
                box.scrollTop = box.scrollHeight;
            });

            function send() {
                let m = document.getElementById("msg").value;
                socket.emit("chat", { user: username, msg: m });
                document.getElementById("msg").value = "";
            }
        </script>

    </body>
    </html>
    `;
}

// --------------------------------------------
// SOCKET.IO EVENTS
// --------------------------------------------
io.on("connection", (socket) => {
    socket.on("join", (user) => {
        console.log(user + " joined");
    });

    socket.on("chat", (data) => {
        io.emit("chat", data);
    });
});

// --------------------------------------------
// START SERVER
// --------------------------------------------
http.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
