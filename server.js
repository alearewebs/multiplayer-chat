const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const accounts = require("./accounts.js");

app.use(express.static("public"));
app.use(express.json());

app.post("/signup", (req, res) => {
    const { username, password } = req.body;

    if (accounts.findUser(username)) {
        return res.json({ success: false, msg: "Username already exists" });
    }

    accounts.addUser(username, password);
    res.json({ success: true });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const user = accounts.findUser(username);

    if (!user || user.password !== password) {
        return res.json({ success: false, msg: "Wrong username or password" });
    }

    res.json({ success: true });
});

io.on("connection", socket => {
    let username = "Unknown";

    socket.on("setUsername", u => {
        username = u;
    });

    socket.on("chat message", msg => {
        io.emit("chat message", `${username}: ${msg}`);
    });
});

http.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
