const http = require("http");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const server = http.createServer(app);
const io = require("socket.io")(server);

const webrtc = require("wrtc");

let senderStream;

//app.use(express.static("public"));
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static("frontend/build"));
//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
//   });
// }

app.use(express.json());
app.use(cors({ origin: "*" }));
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let viewerstart = false;
let serverstart = false;
let offer = null;
let servercandidate = null;

let idStreamer = null;
let isStreaming = false;
let hasViewer = false;
let viewerId = null;

io.on("connection", (socket) => {
  socket.on("streamerdata", (data) => {
    socket.broadcast.emit("stream", data);
  });
  socket.on("sendmestreamdata", () => {
    socket.broadcast.emit("senddata", "sendit");
  });
  socket.on("viewerdata", (data) => {
    socket.broadcast.emit("viewdata", data);
  });
  socket.on("message", (data) => {
    socket.broadcast.emit("message", data);
  });
  socket.on("viewercandidate", (data) => {
    socket.broadcast.emit("addviewer", data);
  });
  socket.on("answer", (data) => {
    socket.broadcast.emit("answer", data);
  });
  socket.on("serverbeforestart", (data) => {
    serverstart = false;
    offer = null;
    servercandidate = null;
  });
  socket.on("serverstart", (data) => {
    console.log("serverstart");
    serverstart = true;
  });

  socket.on("servercandidate", (data) => {
    servercandidate = data;
    socket.broadcast.emit("addserver", data);
  });
  socket.on("offer", (data) => {
    offer = data;
    socket.broadcast.emit("offer", data);
  });

  socket.on("startstream", () => {
    isStreaming = true;
    if (viewerId) {
      socket.emit("newviewer", true);
    }
  });

  socket.on("startview", () => {
    if (viewerId) {
      return;
    }
    viewerId = socket.id;
    socket.broadcast.emit("newviewer", true);
  });

  socket.on("disconnect", (reason) => {
    if (viewerId === socket.id) {
      viewerId = null;
    }
    socket.broadcast.emit("close", reason);
  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log("server started"));
