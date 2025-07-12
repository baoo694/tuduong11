// __tests__/socket.test.js
const ioClient = require("socket.io-client");
const { server } = require("../src/server");  // Lấy HTTP server
const PORT = process.env.PORT || 3002;
let clientSocket;
let testServerInstance;

describe("Socket.IO Automated Tests", () => {
  beforeAll((done) => {
    // Sử dụng cổng ngẫu nhiên để tránh trùng lặp
    const randomPort = Math.floor(3000 + Math.random() * 1000);
    testServerInstance = server.listen(randomPort, () => {
      // Cập nhật URL dựa theo cổng được chọn
      const SOCKET_URL = `http://localhost:${randomPort}`;
      clientSocket = ioClient(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: false,
      });
      clientSocket.on("connect", () => {
        console.log("Client connected in test with id:", clientSocket.id);
        done();
      });
    });
  });

  afterAll((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    testServerInstance.close(done);
  });

  test("Client should join a room and receive chatMessage", (done) => {
    const roomId = "room1";
    // Client gửi sự kiện joinRoom
    clientSocket.emit("joinRoom", roomId);

    // Đợi một khoảng ngắn sau khi join để đảm bảo đã tham gia phòng
    setTimeout(() => {
      const messageData = { 
        roomId, 
        sender: "user1", 
        text: "Hello from automated test!", 
        createdAt: new Date().toISOString()
      };

      clientSocket.once("chatMessage", (data) => {
        try {
          expect(data.roomId).toBe(roomId);
          expect(data.sender).toBe("user1");
          expect(data.text).toBe("Hello from automated test!");
          done();
        } catch (error) {
          done(error);
        }
      });

      // Client gửi tin nhắn
      clientSocket.emit("chatMessage", messageData);
    }, 500);
  });
});
