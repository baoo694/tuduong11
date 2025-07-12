# Hệ thống Chat Bệnh viện - Phiên bản Admin

Hệ thống chat bệnh viện với quản lý tài khoản tập trung, chỉ admin mới có quyền tạo tài khoản cho bác sĩ và bệnh nhân.

## 🏥 Tính năng chính

### 👨‍⚕️ Quản trị viên (Admin)

- **Quản lý tài khoản tập trung**: Chỉ admin mới có quyền tạo tài khoản
- **Tạo tài khoản bác sĩ**: Thêm bác sĩ mới với thông tin chuyên khoa
- **Tạo tài khoản bệnh nhân**: Thêm bệnh nhân mới với thông tin cá nhân
- **Gán bác sĩ cho bệnh nhân**: Quản lý mối quan hệ bác sĩ-bệnh nhân
- **Xóa tài khoản**: Xóa tài khoản không còn sử dụng
- **Thống kê hệ thống**: Xem tổng quan về người dùng và hoạt động

### 👨‍⚕️ Bác sĩ

- **Chat với bệnh nhân**: Nhắn tin trực tiếp với bệnh nhân được gán
- **Chat với đồng nghiệp**: Tạo phòng chat với bác sĩ khác
- **Quản lý bệnh nhân**: Xem danh sách bệnh nhân được gán
- **Hoàn thành tư vấn**: Đánh dấu kết thúc cuộc tư vấn

### 👤 Bệnh nhân

- **Chat với bác sĩ**: Chỉ có thể chat với bác sĩ được gán
- **Cập nhật thông tin**: Chỉnh sửa thông tin cá nhân
- **Xem lịch sử chat**: Theo dõi các cuộc trò chuyện trước đó

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   User Service  │
│                 │    │                 │    │                 │
│ - Admin Dashboard│◄──►│ - Route requests│◄──►│ - User management│
│ - Doctor Chat   │    │ - Load balancing│    │ - Authentication│
│ - Patient Chat  │    │ - Rate limiting │    │ - Role control  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Chat Service  │
                       │                 │
                       │ - Real-time chat│
                       │ - Room management│
                       │ - Message history│
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │Notification Svc │
                       │                 │
                       │ - Push notifications│
                       │ - Email alerts  │
                       └─────────────────┘
```

## 🚀 Cài đặt và chạy

### 1. Clone repository

```bash
git clone <repository-url>
cd chat-app-main
```

### 2. Cài đặt dependencies

```bash
# Cài đặt dependencies cho tất cả services
npm install
cd user-service && npm install
cd ../chat-service && npm install
cd ../notification-service && npm install
cd ../api-gateway && npm install
```

### 3. Cấu hình môi trường

Tạo file `.env` trong mỗi service với các biến môi trường cần thiết:

**user-service/.env:**

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/hospital_chat
JWT_SECRET=your_jwt_secret_key
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password
```

**chat-service/.env:**

```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/hospital_chat
JWT_SECRET=your_jwt_secret_key
```

**notification-service/.env:**

```env
PORT=3003
REDIS_URL=redis://localhost:6379
```

**api-gateway/.env:**

```env
PORT=3000
USER_SERVICE_URL=http://localhost:3001
CHAT_SERVICE_URL=http://localhost:3002
NOTIFICATION_SERVICE_URL=http://localhost:3003
```

### 4. Chạy với Docker Compose

```bash
# Khởi động tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

### 5. Tạo tài khoản admin đầu tiên

```bash
# Cài đặt axios nếu chưa có
npm install axios

# Chạy script tạo admin
node create-admin.js
```

Thông tin đăng nhập admin mặc định:

- **Email**: admin@hospital.com
- **Mật khẩu**: admin123

## 📱 Sử dụng hệ thống

### 1. Đăng nhập Admin

- Truy cập: http://localhost:3000
- Đăng nhập với tài khoản admin
- Chuyển hướng đến admin dashboard

### 2. Quản lý tài khoản

**Tạo bác sĩ mới:**

- Vào tab "Quản lý Bác sĩ"
- Click "Thêm Bác sĩ"
- Điền thông tin: username, email, password, chuyên khoa, số giấy phép, khoa

**Tạo bệnh nhân mới:**

- Vào tab "Quản lý Bệnh nhân"
- Click "Thêm Bệnh nhân"
- Điền thông tin: username, email, password, số điện thoại, địa chỉ

**Gán bác sĩ cho bệnh nhân:**

- Vào tab "Gán Bác sĩ"
- Chọn bệnh nhân và bác sĩ
- Click "Gán Bác sĩ"

### 3. Đăng nhập người dùng

**Bác sĩ:**

- Đăng nhập với tài khoản được admin tạo
- Truy cập chat dashboard
- Chat với bệnh nhân được gán

**Bệnh nhân:**

- Đăng nhập với tài khoản được admin tạo
- Truy cập patient dashboard
- Chat với bác sĩ được gán

## 🔌 API Endpoints

### User Service (Port 3001)

#### Admin Endpoints

```http
POST /api/users/create-initial-admin
POST /api/users/create-doctor
POST /api/users/create-patient
POST /api/users/assign-doctor
DELETE /api/users/users/:userId
GET /api/users/doctors
GET /api/users/patients
```

#### Authentication

```http
POST /api/users/login
POST /api/users/forgotPassword
POST /api/users/resetPassword
```

#### User Management

```http
GET /api/users/doctor/patients
GET /api/users/patient/doctor
PUT /api/users/profile
```

### Chat Service (Port 3002)

#### Chat Management

```http
POST /api/chat/rooms
GET /api/chat/rooms
GET /api/chat/rooms/:roomId/messages
POST /api/chat/rooms/:roomId/messages
GET /api/chat/doctor/rooms
GET /api/chat/patient/rooms
POST /api/chat/doctor-patient-room
POST /api/chat/doctor-doctor-room
PUT /api/chat/rooms/:roomId/complete
GET /api/chat/stats
```

### Notification Service (Port 3003)

#### Notifications

```http
POST /api/notifications/send
GET /api/notifications/user/:userId
DELETE /api/notifications/:notificationId
```

## 🔐 Bảo mật

### Authentication

- JWT tokens cho xác thực
- Role-based access control (RBAC)
- Token expiration (1 giờ)

### Authorization

- **Admin**: Toàn quyền quản lý hệ thống
- **Doctor**: Quản lý bệnh nhân được gán, chat với đồng nghiệp
- **Patient**: Chỉ chat với bác sĩ được gán

### Data Protection

- Mật khẩu được mã hóa với bcrypt
- HTTPS cho production
- Input validation và sanitization

## 📊 Monitoring và Logging

### Health Checks

```http
GET /api/health
GET /api/users/health
GET /api/chat/health
GET /api/notifications/health
```

### Logging

- Structured logging với Winston
- Error tracking
- Performance monitoring

## 🧪 Testing

### Unit Tests

```bash
# User Service
cd user-service && npm test

# Chat Service
cd chat-service && npm test

# Notification Service
cd notification-service && npm test
```

### Integration Tests

```bash
# Run all integration tests
npm run test:integration
```

## 🚀 Deployment

### Production Setup

1. Cấu hình environment variables
2. Setup MongoDB và Redis
3. Configure reverse proxy (Nginx)
4. Setup SSL certificates
5. Configure monitoring và logging

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Troubleshooting

### Common Issues

**1. Không thể tạo admin đầu tiên**

```bash
# Kiểm tra server có đang chạy không
curl http://localhost:3000/api/health

# Kiểm tra MongoDB connection
docker-compose logs user-service
```

**2. Không thể đăng nhập**

- Kiểm tra email và mật khẩu
- Đảm bảo tài khoản đã được tạo bởi admin
- Kiểm tra JWT_SECRET trong .env

**3. Chat không hoạt động**

- Kiểm tra Socket.IO connection
- Đảm bảo Redis đang chạy
- Kiểm tra CORS configuration

**4. Email không gửi được**

- Kiểm tra Gmail credentials
- Đảm bảo 2FA được bật và app password được tạo
- Kiểm tra firewall settings

### Logs

```bash
# Xem logs của tất cả services
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f user-service
docker-compose logs -f chat-service
docker-compose logs -f notification-service
```

## 📝 Changelog

### Version 2.0.0 (Current)

- ✅ Hệ thống admin tập trung
- ✅ Chỉ admin mới có quyền tạo tài khoản
- ✅ Giao diện admin dashboard
- ✅ Quản lý bác sĩ và bệnh nhân
- ✅ Gán bác sĩ cho bệnh nhân
- ✅ Xóa tài khoản
- ✅ Thống kê hệ thống

### Version 1.0.0

- ✅ Chat real-time
- ✅ Authentication
- ✅ Role-based access
- ✅ Doctor-patient relationships

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: support@hospital-chat.com
- **Hotline**: 1900-xxxx
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)

---

**Lưu ý**: Đây là hệ thống demo, không nên sử dụng trong môi trường production mà không có các biện pháp bảo mật bổ sung.
