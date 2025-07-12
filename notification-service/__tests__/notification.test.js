const request = require('supertest');
const app = require('../src/server');

describe("Notification Service Endpoints", () => {
  it("should send a notification successfully", async () => {
    const res = await request(app)
      .post("/api/notifications/send")
      .send({ userId: "12345", title: "Test Notification", message: "This is a test" });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toMatch(/Notification sent successfully/i);
  });
});
