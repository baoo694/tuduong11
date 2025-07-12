jest.setTimeout(15000);
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { server } = require("../src/server");
const ChatRoom = require("../src/models/ChatRoom");

let testServerInstance;
let mongoServer;
let roomId;

describe("Chat Service Endpoints", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const randomPort = Math.floor(3000 + Math.random() * 1000);
    testServerInstance = server.listen(randomPort);
  });

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        await mongoose.connection.db.dropDatabase();
        await mongoose.connection.close();
      }
      await mongoServer.stop();
    } catch (err) {
      console.error(err);
    }
    testServerInstance.close();
  });

  it("should create a new chat room", async () => {
    const res = await request(server)
      .post("/api/chat/createRoom")
      .send({ roomName: "general" });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.chatRoom).toHaveProperty("_id");
    roomId = res.body.chatRoom._id;
  });

  it("should send a message to chat room", async () => {
    const senderId = new mongoose.Types.ObjectId();
    const res = await request(server)
      .post("/api/chat/sendMessage")
      .send({ roomId, sender: senderId, text: "Hello everyone!" });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.chatRoom.messages.length).toBeGreaterThan(0);
  });

  it("should get messages from chat room", async () => {
    const res = await request(server)
      .get(`/api/chat/${roomId}`);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
  });
});
