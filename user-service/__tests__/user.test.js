const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');

let mongoServer;
let jwtToken;
let verificationToken;
let resetToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  process.env.MONGO_URI = mongoUri; // Đảm bảo mọi nơi dùng MongoDB in-memory

  // Dùng cổng ngẫu nhiên để tránh lỗi trùng cổng
  const port = Math.floor(3000 + Math.random() * 1000);
  app.listen(port);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

jest.setTimeout(10000); // Tăng timeout của Jest để tránh lỗi async.

describe("User Service Endpoints", () => {
  
  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ username: "testuser", email: "test@example.com", password: "123456" });

    expect(res.statusCode).toEqual(201);
    
    const user = await User.findOne({ email: "test@example.com" });
    expect(user).not.toBeNull();
    expect(user.isVerified).toBe(false);

    // Cập nhật trạng thái xác thực email
    await User.updateOne({ email: "test@example.com" }, { isVerified: true });
  });

  it("should verify the user's email", async () => {
    const user = await User.findOne({ email: "test@example.com" });
    verificationToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const res = await request(app)
      .get(`/api/users/verify?token=${verificationToken}`);

    expect(res.statusCode).toEqual(200);

    const updatedUser = await User.findOne({ email: "test@example.com" });
    expect(updatedUser.isVerified).toBe(true);
  });

  it("should login an existing user", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "test@example.com", password: "123456" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");

    jwtToken = res.body.token; // Lưu lại token để test đổi mật khẩu & xóa tài khoản
  });

  it("should request a password reset", async () => {
    const res = await request(app)
      .post("/api/users/forgotPassword")
      .send({ email: "test@example.com" });

    expect(res.statusCode).toEqual(200);

    const user = await User.findOne({ email: "test@example.com" });
    resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  });

  it("should reset the password", async () => {
    const res = await request(app)
      .post(`/api/users/resetPassword?token=${resetToken}`)
      .send({ newPassword: "newPassword123" });

    expect(res.statusCode).toEqual(200);
  });

  it("should delete the account", async () => {
    const res = await request(app)
      .delete("/api/users/deleteAccount")
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.statusCode).toEqual(200);
  });
});
