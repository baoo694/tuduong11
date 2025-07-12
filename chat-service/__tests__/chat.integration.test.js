jest.setTimeout(15000);
const request = require("supertest");
const axios = require('axios');
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { server } = require("../src/server");

// Giả lập Notification Service bằng cách spy trên axios.post
jest.mock('axios');

describe("Chat Service Integration with Notification Service", () => {
  let roomId;
  
  beforeAll(async () => {
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const randomPort = Math.floor(3000 + Math.random() * 1000);
    // Khởi chạy server trên cổng ngẫu nhiên
    server.listen(randomPort);
  });
  
  afterAll(async () => {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.connection.close();
    }
  });
  
  it("should send a message and trigger notification", async () => {
    // Tạo phòng chat mới thông qua endpoint /api/chat/createRoom
    const createRes = await request(server)
      .post("/api/chat/createRoom")
      .send({ roomName: "general" });
    
    roomId = createRes.body.chatRoom._id;
    expect(roomId).toBeDefined();

    // Sử dụng ObjectId hợp lệ cho sender
    const senderId = new mongoose.Types.ObjectId();
    const text = "Hello integration!";
    
    // Thiết lập spy axios.post trả về phản hồi thành công cho Notification Service
    axios.post.mockResolvedValue({ data: { message: "Notification sent successfully" } });
    
    // Gửi tin nhắn qua endpoint sendMessage
    const res = await request(server)
      .post("/api/chat/sendMessage")
      .send({ roomId, sender: senderId, text });
    
    expect(res.statusCode).toEqual(200);
    // Kiểm tra axios.post đã được gọi với các tham số chính xác
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/api/notifications/send"),
      expect.objectContaining({
        userId: senderId.toString(),
        title: expect.any(String),
        message: expect.stringContaining(text),
      })
    );
  });
});
