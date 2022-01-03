window.onload = () => {
  document.getElementById("my-button").onclick = function () {
    const peer = new ViewerPeer(document.getElementById("video"));
    peer.startView();
    this.disabled = true;
  };
};

class ViewerPeer {
  socket = null;
  peerConnection = null;
  videoELement = null;
  configuration = {
    iceServers: [
      {
        urls: ["stun:hk-turn1.xirsys.com"],
      },
      {
        username:
          "UrHBH5oWhvk0OmwqzVtUOaN3hmCQjXq_2-bxSb0ElxgI4EGw9M7_7hYi79eexvvJAAAAAGHSUvNsaW5obmQ=",
        credential: "7a10c8c2-6c35-11ec-84ea-0242ac120004",
        urls: [
          "turn:hk-turn1.xirsys.com:80?transport=udp",
          "turn:hk-turn1.xirsys.com:3478?transport=udp",
          "turn:hk-turn1.xirsys.com:80?transport=tcp",
          "turn:hk-turn1.xirsys.com:3478?transport=tcp",
          "turns:hk-turn1.xirsys.com:443?transport=tcp",
          "turns:hk-turn1.xirsys.com:5349?transport=tcp",
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };
  constructor(videoELement) {
    this.videoELement = videoELement;
    this.socket = io("https://webstreamcamera.herokuapp.com/");
    this.socket.on("addserver", async (mess) => {
      console.log("addserver", mess);
      try {
        await this.peerConnection.addIceCandidate(mess);
      } catch (e) {
        console.error("Error adding received ice candidate", e);
      }
    });
    this.socket.on("offer", async (message) => {
      console.log("offer", message);
      this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(message)
      );
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket.emit("answer", answer.toJSON());
    });
    this.socket.on("close", () => {
      console.log("close");
      this.reconnect();
    });
  }

  createPeer() {
    const peerConnection = new RTCPeerConnection(this.configuration);
    peerConnection.onicecandidate = (event) => {
      console.log("onicecandidate");
      event.candidate &&
        this.socket.emit("viewercandidate", event.candidate.toJSON());
    };
    peerConnection.ontrack = (e) => {
      this.videoELement.srcObject = e.streams[0];
    };
    peerConnection.addTransceiver("video", { direction: "recvonly" });
    this.peerConnection = peerConnection;
  }

  startView() {
    this.createPeer();
    this.socket.emit("startview", true);
  }

  reconnect() {
    this.peerConnection.close();
    this.startView();
  }
}
