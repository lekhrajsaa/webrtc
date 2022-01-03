window.onload = () => {
  document.getElementById("my-button").onclick = function () {
    let peer = new ServerPeer(document.getElementById("video"));
    peer.startStream();
    this.disabled = true;
  };
};

class ServerPeer {
  socket = null;
  videoElement = null;
  peerConnection = null;
  stream = null;
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

  constructor(videoElement) {
    this.socket = io("https://webstreamcamera.herokuapp.com/");
    this.videoElement = videoElement;
    this.socket.on("newviewer", () => {
      console.log("newviewer");
      this.createPeer();
      this.stream
        .getTracks()
        .forEach((track) => this.peerConnection.addTrack(track, this.stream));
    });
    this.socket.on("answer", async (message) => {
      console.log("answer", message);
      const remoteDesc = new RTCSessionDescription(message);
      await this.peerConnection.setRemoteDescription(remoteDesc);
    });
    this.socket.on("addviewer", async (mess) => {
      console.log("addviewer", mess);
      try {
        await this.peerConnection.addIceCandidate(mess);
      } catch (e) {
        console.error("Error adding received ice candidate", e);
      }
    });
    this.socket.on("close", () => {
      this.peerConnection.close();
    });
  }

  createPeer() {
    const peerConnection = new RTCPeerConnection(this.configuration);
    peerConnection.onicecandidate = (event) => {
      console.log("onicecandidate");
      event.candidate &&
        this.socket.emit("servercandidate", event.candidate.toJSON());
    };
    peerConnection.onnegotiationneeded = async () => {
      console.log("onnegotiationneeded");
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      this.socket.emit("offer", offer.toJSON());
    };
    this.peerConnection = peerConnection;
  }

  async startStream() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    this.videoElement.srcObject = this.stream;
    this.socket.emit("startstream", true);
  }
}
