# Frontend Docker Setup

This directory contains the frontend application for the hospital chat system, containerized with Docker.

## Structure

- `login/` - Login page
- `chat/` - Chat dashboard
- `admin/` - Admin dashboard
- `patient/` - Patient dashboard

## Building the Docker Image

To build the frontend Docker image:

```bash
docker build -t chat-app-frontend .
```

## Running the Container

To run the frontend container:

```bash
docker run -d -p 3000:80 --name frontend chat-app-frontend
```

The application will be available at `http://localhost:3000`

## Routes

- `/` or `/login` - Login page
- `/chat` - Chat dashboard
- `/admin` - Admin dashboard
- `/patient` - Patient dashboard

## Docker Compose Integration

To include this frontend in your docker-compose.yml:

```yaml
frontend:
  build: ./front-end
  ports:
    - '3000:80'
  depends_on:
    - api-gateway
```

## Features

- Static file serving with nginx
- Gzip compression for better performance
- Security headers
- Proper caching headers
- Fallback routing to login page
- Optimized for production use
