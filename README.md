# Tudy Platform

A modern tutoring platform backend built with NestJS, providing authentication and user management capabilities.

## 🚀 Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma 5
- **Authentication**: JWT (Access Token + Refresh Token)
- **Validation**: class-validator, class-transformer
- **API Documentation**: Swagger/OpenAPI

## 📁 Project Structure

```
src/
├── common/           # Shared utilities, DTOs, filters, guards, decorators
├── infrastructure/   # Database, cache, file storage modules
└── modules/          # Business modules
    ├── auth/         # Authentication module
    └── users/        # User management module
```

## 🏗️ Architecture

- **Modular Monolith**: Organized by business domains
- **Repository Pattern**: Abstracts database access
- **Entity Pattern**: Domain models independent of ORM
- **Mapper Pattern**: Handles mapping between Prisma models, entities, and DTOs
- **Clean Architecture**: Separation of concerns across layers

## ✨ Features

### Authentication
- User registration and login
- JWT-based authentication (Access Token + Refresh Token)
- Role-based access control (RBAC)
- Public route decorator for unprotected endpoints

### User Management
- CRUD operations for users
- User profile management
- Soft delete support
- Search and filtering capabilities
- Pagination support

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or use Docker)
- Yarn or npm
- Docker & Docker Compose (optional, for quick setup)

### Quick Start with Docker

The easiest way to get started is using Docker Compose to set up all required services:

```bash
# Start all services (PostgreSQL, MongoDB, Redis)
$ docker-compose -f docker/docker-compose.yml up -d

# Check services status
$ docker-compose -f docker/docker-compose.yml ps

# Stop all services
$ docker-compose -f docker/docker-compose.yml down

# Stop and remove volumes (clean reset)
$ docker-compose -f docker/docker-compose.yml down -v
```

**Services included:**
- **PostgreSQL** (port 5432): Main database
- **MongoDB** (port 27017): Logs database
- **Redis** (port 6379): Cache and session storage

**Default credentials:**
- PostgreSQL: `postgres/postgres` (database: `tudy_dev`)
- MongoDB: No authentication (database: `tudy_logs`)
- Redis: No password

After starting Docker services, configure your `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tudy_dev"
MONGODB_URI="mongodb://localhost:27017/tudy_logs"
REDIS_HOST="localhost"
REDIS_PORT=6379
```

### Installation

```bash
# Install dependencies
$ yarn install

# Copy environment file
$ cp .env.example .env

# Configure database connection in .env
DATABASE_URL="postgresql://user:password@localhost:5432/tudy"
```

### Database Setup

```bash
# Generate Prisma Client
$ yarn prisma:generate

# Run migrations
$ yarn db:migrate

# (Optional) Open Prisma Studio
$ yarn db:studio
```

### Running the Application

```bash
# Development mode
$ yarn start:dev

# Production mode
$ yarn build
$ yarn start:prod
```

The API will be available at `http://localhost:3000/api/v1`

### API Documentation

Swagger documentation is available at:
- Development: `http://localhost:3000/api/docs`

## 📝 Available Scripts

```bash
# Development
yarn start:dev          # Start in watch mode
yarn start:debug        # Start in debug mode

# Database
yarn db:migrate         # Run migrations
yarn db:sync            # Sync schema (dev only)
yarn db:studio          # Open Prisma Studio
yarn db:reset           # Reset database

# Code Quality
yarn lint               # Run ESLint
yarn format             # Format code with Prettier
yarn test               # Run unit tests
yarn test:e2e           # Run e2e tests
```

## 🔐 Authentication Flow

1. **Register**: `POST /api/v1/auth/register`
2. **Login**: `POST /api/v1/auth/login` → Returns access token + refresh token
3. **Refresh Token**: `POST /api/v1/auth/refresh` → Get new access token
4. **Protected Routes**: Include `Authorization: Bearer <token>` header

## 📦 Modules

### Auth Module
- User registration
- User login
- Token refresh
- JWT strategy implementation

### Users Module
- Get user profile
- List users (Admin only)
- Update user profile
- Delete user (soft delete)

## 🎯 Error Handling

The application uses a centralized error handling system:
- Custom error codes with HTTP status mapping
- Consistent error response format
- Global exception filters

## 📄 License

UNLICENSED
