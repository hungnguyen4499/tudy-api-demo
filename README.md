# KIGGLE Platform

A comprehensive tutoring marketplace platform connecting parents with tutors and educational organizations.

## 📚 Documentation

> 📖 **[Scope-Based Access Control](./docs/SCOPE_BASED_ACCESS_CONTROL.md)** - Complete technical architecture  
> 🎨 **[Architecture Diagrams](./docs/SCOPE_BASED_ARCHITECTURE_DIAGRAMS.md)** - Visual representation with Mermaid diagrams  
> 📘 **[Database Design](./docs/DATABASE_DESIGN.md)** - Complete database schema with scope-based access control  
> 📊 **[Database ERD](./docs/DATABASE_ERD.md)** - Entity relationship diagrams  

## 🚀 Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5
- **Cache**: Redis
- **Logs**: MongoDB
- **Authentication**: JWT (Access Token + Refresh Token)
- **Authorization**: Scope-Based Access Control
- **Validation**: class-validator, class-transformer
- **API Documentation**: Swagger/OpenAPI
- **File Storage**: MinIO / AWS S3

## 📁 Project Structure

```
src/
├── common/           # Shared utilities, DTOs, filters, guards, decorators
├── infrastructure/   # Database, cache, file storage modules
└── modules/          # Business modules
    ├── auth/         # Authentication module
    ├── users/        # User management module
    └── files/        # File upload module

docs/
├── DATABASE_DESIGN.md  # Complete database design with RBAC
├── DATABASE_ERD.md     # Entity relationship diagrams
└── API_FLOW.md         # API flow documentation

prisma/
├── schema.prisma        # Current active schema
└── schema-kiggle.prisma # Complete KIGGLE platform schema
```

## 🏗️ Architecture

- **Modular Monolith**: Organized by business domains
- **Repository Pattern**: Abstracts database access with automatic scope filtering
- **Entity Pattern**: Domain models independent of ORM
- **Mapper Pattern**: Handles mapping between Prisma models, entities, and DTOs
- **Clean Architecture**: Separation of concerns across layers
- **Scope-Based Access Control**: Automatic data filtering by organization/user context

## ✨ Features

### Core Platform Features

#### 1. Scope-Based Access Control
- **Automatic Data Filtering**: Repository layer automatically filters data by scope
- **Three Scope Types**: GLOBAL (admins), ORGANIZATION (partners/tutors), USER (parents)
- **Simple Permissions**: Boolean flags on OrganizationMember (canManageProducts, canManageBookings, etc.)
- **Multi-Tenant Architecture**: Every resource belongs to an organization (INDIVIDUAL or COMPANY)
- **Performance Optimized**: Single query instead of multiple permission checks
- **Zero Boilerplate**: No manual authorization code in services

#### 2. Multi-Role User System
- **Parents**: Browse, book courses, chat with tutors
- **Tutors**: Create products, manage bookings, earn income
- **Organizations**: Manage centers, staff, multiple products
- **Admins**: Full platform management and moderation
- User verification (email/phone)
- Geolocation support for location-based search

#### 3. Product Management
- Courses and tutoring services
- Multi-category support (hierarchical)
- Featured products
- Rich media (multiple images)
- SEO optimization
- Organization-owned products (single ownership model)
- Freelance tutors have their own INDIVIDUAL organization
- Draft/Published workflow

#### 4. Communication System
- Real-time chat between parents and tutors/organizations
- Consultation requests
- Message attachments (JSON support)
- Read receipts
- Unread message tracking

#### 5. Booking & Schedule
- Flexible booking system with unique codes
- Multiple session support (for courses)
- Location types (online, at home, at center)
- Schedule management with time slots
- Check-in/check-out tracking
- Cancellation tracking with reasons

#### 6. Payment & Subscription
- Multiple payment methods (bank transfer, e-wallet, credit card, cash)
- Subscription packages for tutors/organizations
- Platform fee calculation
- Payment history
- Refund support
- Auto-renewal option

#### 7. Reviews & Ratings
- 5-star rating system
- Photo reviews (JSON array)
- Review moderation workflow
- Response from service providers
- Linked to bookings for verification

#### 8. Content Management
- Banner management with scheduling
- Notifications (broadcast & targeted)
- Multi-language support
- Position-based display

### Technical Features
- JWT-based authentication (Access Token + Refresh Token)
- Scope-based access control (automatic data filtering)
- Simple role-based permissions (enums + boolean flags)
- Multi-tenant architecture (organization-centric)
- Soft delete support on all major entities
- Complete audit trail (created/updated timestamps)
- Search and filtering capabilities
- Pagination support
- File upload (MinIO/S3 support)
- Redis caching (user context and permissions)
- MongoDB logging
- 80+ strategic indexes for performance

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

# Or use push for development
$ yarn prisma db push

# (Optional) Open Prisma Studio
$ yarn db:studio
```

### 📊 Database Documentation

KIGGLE uses a comprehensive database schema designed for a multi-tenant marketplace platform with scope-based access control.

**Documentation:**
- **[Database Design](./docs/DATABASE_DESIGN.md)** - Complete schema documentation with scope-based access control
- **[Entity Relationship Diagrams](./docs/DATABASE_ERD.md)** - Visual representations
- **[Schema Migration Guide](./docs/SCHEMA_MIGRATION_GUIDE.md)** - Migration instructions

**Database Statistics:**
- **22 tables** organized in 6 modules
- **25 enums** for type safety
- **80+ indexes** for performance (including scope-based indexes)
- **50+ relationships**
- **Multi-tenant**: Organization-centric design (INDIVIDUAL or COMPANY)

**Key Modules:**
1. **User Management** (6 tables): User, Parent, Child, Tutor, Organization, OrganizationMember
2. **Product Management** (4 tables): Product, Category, ProductCategory, ProductImage
3. **Communication** (3 tables): Conversation, Message, Consultation
4. **Booking & Schedule** (3 tables): Booking, Schedule, ScheduleSlot
5. **Payment & Subscription** (3 tables): Payment, Subscription, SubscriptionPackage
6. **Content Management** (3 tables): Banner, Notification, Review

**Access Control Features:**
- Scope-based automatic filtering (GLOBAL, ORGANIZATION, USER)
- Simple role system (UserRole enum + OrganizationMemberRole enum)
- Permission flags on OrganizationMember (canManageProducts, canManageBookings, etc.)
- Every resource belongs to an organization
- Freelance tutors have INDIVIDUAL organizations
- Zero extra RBAC tables needed

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

### Currently Implemented

#### Auth Module
- User registration and login
- Token refresh (access + refresh tokens)
- JWT strategy implementation
- Role-based guards

#### Users Module
- Get user profile
- List users (Admin only)
- Update user profile
- Delete user (soft delete)
- User search and filtering

#### Files Module
- File upload to MinIO/S3
- File metadata management
- Multiple storage providers

### 🚧 Upcoming (Based on KIGGLE Schema)

#### Parents Module
- Parent profile management
- Children management
- Referral system

#### Tutors Module
- Tutor registration & verification
- Profile management
- Schedule availability
- Performance metrics

#### Organizations Module
- Organization registration & approval
- Member management
- Multi-location support
- Performance tracking

#### Products Module
- Course & service management
- Category management (hierarchical)
- Product images
- Search & filtering
- Featured products

#### Conversations Module
- Real-time chat (WebSocket/Socket.io)
- Message management
- Read receipts
- Consultations

#### Bookings Module
- Booking creation & management
- Schedule management
- Check-in/check-out
- Status tracking
- Cancellation handling

#### Payments Module
- Payment processing (multiple gateways)
- Subscription management
- Transaction history
- Refund processing
- Invoice generation

#### Reviews Module
- Rating & review system
- Moderation
- Response management
- Photo reviews

#### Notifications Module
- Push notifications
- Email notifications
- SMS notifications (optional)
- Broadcast messages
- Notification preferences

#### Banners Module
- Banner management
- Position-based display
- Date-range scheduling
- Link management

## 🔐 Scope-Based Access Control

### How It Works

Access control is automatically handled at the **repository layer** based on the user's **scope**:

```typescript
// User logs in → System determines scope
enum ScopeType {
  GLOBAL       // Platform admins - see all data
  ORGANIZATION // Partners/tutors - see only their org's data
  USER         // Parents - see public data + own data
}

// Repository automatically filters queries
if (scope.type === ScopeType.ORGANIZATION) {
  // Auto-inject: WHERE organizationId = user.organizationId
}
```

### System-Level Roles (User.role)

| Role | Scope | Access Level |
|------|-------|-------------|
| `KIGGLE_ADMIN` | GLOBAL | Full platform access |
| `KIGGLE_STAFF` | GLOBAL | Platform data (read-only) |
| `PARTNER_ADMIN` | ORGANIZATION | Own organization's data (full access) |
| `PARTNER_STAFF` | ORGANIZATION | Own organization's data (limited by flags) |
| `TUTOR` | ORGANIZATION | Own organization's products/bookings |
| `PARENT` | USER | Public products + own bookings |

### Organization-Level Permissions

For `PARTNER_STAFF`, permissions are controlled by boolean flags on `OrganizationMember`:

```typescript
// OrganizationMember model
{
  role: 'STAFF' | 'ADMIN',
  
  // Permission flags (checked for STAFF only)
  canManageProducts: boolean,  // Create/edit/delete products
  canManageBookings: boolean,  // Manage bookings
  canManageMembers: boolean,   // Invite/remove members
  canViewReports: boolean,     // View analytics
}

// ADMIN role → All permissions automatically granted
```

### Permission Check Example

```typescript
// In your service - NO manual authorization needed!
async findProducts() {
  // Repository automatically filters by scope
  return this.productsRepository.findAll();
  // If ORGANIZATION scope: WHERE organizationId = X
  // If USER scope: WHERE status = 'ACTIVE'
  // If GLOBAL scope: No filter
}

// Check organization-level permission (when needed)
async createProduct(data: CreateProductDto, userId: number, orgId: number) {
  const member = await this.getMember(userId, orgId);
  
  if (member.role === 'ADMIN' || member.canManageProducts) {
    // Repository auto-injects organizationId
    return this.productsRepository.create(data);
  }
  
  throw new ForbiddenException();
}
```

### Multi-Tenant Architecture

Every resource belongs to an **Organization**:

```typescript
// Freelance tutor
{
  type: 'INDIVIDUAL',  // Virtual organization for single person
  tutors: [freelanceTutor],
  products: [tutorProducts]
}

// Partner organization
{
  type: 'COMPANY',     // Actual organization with multiple staff
  tutors: [employedTutor1, employedTutor2],
  products: [orgProducts]
}
```

### Benefits

- ✅ **Zero boilerplate**: Services don't need authorization code
- ✅ **Automatic filtering**: Repository handles all scope checks
- ✅ **Fast**: Single query instead of 3-4 permission checks
- ✅ **Simple**: Enums + boolean flags, no complex RBAC tables
- ✅ **Safe**: Impossible to forget access control
- ✅ **Scalable**: Supports 1000+ organizations efficiently

## 🎯 Error Handling

The application uses a centralized error handling system:
- Custom error codes with HTTP status mapping
- Consistent error response format
- Global exception filters
- Business exception handling

## 📄 License

UNLICENSED
