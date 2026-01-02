const socket = io();

const messages = document.getElementById("messages");
const input = document.getElementById("input");
const send = document.getElementById("send");

send.onclick = () => {
    if (input.value.trim() !== "") {
        socket.emit("chat message", input.value);
        input.value = "";
    }
};

socket.on("chat message", (msg) => {
    const div = document.createElement("div");
    div.textContent = msg;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
});
