# KIGGLE Platform

A comprehensive tutoring marketplace platform connecting parents with tutors and educational organizations.

## 📚 Documentation

> 🔐 **[Hybrid Access Control](./docs/HYBRID_ACCESS_CONTROL.md)** - Complete RBAC + Scope implementation guide  
> 🎨 **[Menu-Based Permissions](./docs/MENU_BASED_PERMISSIONS.md)** - Dynamic UI with menu system (NEW!)  
> 📖 **[Scope-Based Access Control](./docs/SCOPE_BASED_ACCESS_CONTROL.md)** - Detailed scope architecture  
> 🖼️ **[Architecture Diagrams](./docs/SCOPE_BASED_ARCHITECTURE_DIAGRAMS.md)** - Visual representation with Mermaid diagrams  
> 📘 **[Database Design](./docs/DATABASE_DESIGN.md)** - Complete database schema (28 tables)  
> 📊 **[Database ERD](./docs/DATABASE_ERD.md)** - Entity relationship diagrams  

## 🚀 Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5
- **Cache**: Redis
- **Logs**: MongoDB
- **Authentication**: JWT (Access Token + Refresh Token)
- **Authorization**: Hybrid (RBAC + Menu System + Scope-Based Access Control)
- **Validation**: class-validator, class-transformer
- **API Documentation**: Swagger/OpenAPI
- **File Storage**: MinIO / AWS S3

## 📁 Project Structure

```
src/
├── common/           # Shared utilities, DTOs, filters, guards, decorators
│   ├── services/     # Global services (UserContext, Permission, Menu, Scope)
│   ├── decorators/   # Custom decorators (@RequirePermission, @Public, etc.)
│   └── guards/       # Authorization guards (JWT, Permissions)
│
├── infrastructure/   # Database, cache, file storage modules
│
└── modules/          # Business modules
    ├── system/       # @Global System module (RBAC, Menu, Settings)
    │   ├── controllers/ # Roles, Permissions, Menus management
    │   ├── services/    # System services
    │   └── dto/         # System DTOs
    │
    ├── auth/         # Authentication module
    │   ├── strategies/  # JWT, OAuth strategies
    │   └── dto/         # Auth DTOs (login, register)
    │
    ├── users/        # User management module
    ├── products/     # Products module (example with permissions)
    └── files/        # File upload module

docs/
├── DATABASE_DESIGN.md           # Complete database schema (28 tables)
├── DATABASE_ERD.md              # Entity relationship diagrams
├── HYBRID_ACCESS_CONTROL.md     # RBAC + Scope implementation
├── MENU_BASED_PERMISSIONS.md    # Menu system documentation
├── MODULE_SEPARATION.md         # Auth vs Access Control separation
└── IMPLEMENTATION_GUIDE.md      # How to use the system

prisma/
├── schema.prisma     # Database schema with RBAC + Menu system
└── seeds/            # Seed data for permissions, roles, menus
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

#### 1. Separated Auth & System Modules

**AuthModule** (Authentication):
- User login/register
- JWT token generation & validation
- OAuth providers support (Google, Facebook - ready to add)
- Password reset & email verification (TODO)

**SystemModule** (@Global - Authorization & System Management):
- **RBAC**: Fine-grained permissions with CRUD APIs
  - Roles management
  - Permissions management
  - Assign permissions/menus to roles
- **Menu System**: Dynamic UI with full management API
  - Create/update/delete menus via API
  - Hierarchical structure (parent-child)
  - Types: MENU (sidebar), BUTTON (actions), TAB (navigation)
- **Scope-Based**: Automatic multi-tenant data filtering
  - GLOBAL scope (platform admins)
  - ORGANIZATION scope (partners/tutors)
  - USER scope (parents)
- **System Settings**: (TODO) Platform configuration
- **Audit Logs**: (TODO) Track system changes
- **Performance**: Redis caching (5min TTL), automatic cache invalidation
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

### Key API Endpoints

#### Authentication
```
POST   /api/auth/register             - Register new user
POST   /api/auth/login                - Login
POST   /api/auth/refresh              - Refresh token
POST   /api/auth/logout               - Logout
GET    /api/auth/me                   - Get current user
```

#### User's Menus & Permissions (Loaded on login)
```
GET    /api/system/menus                - Get user's menus for UI rendering
GET    /api/system/permissions          - Get user's permissions
```

#### Admin: Roles Management
```
GET    /api/system/roles                - List all roles
POST   /api/system/roles                - Create role
PATCH  /api/system/roles/:id            - Update role
DELETE /api/system/roles/:id            - Delete role
POST   /api/system/roles/:id/permissions - Assign permissions to role
POST   /api/system/roles/:id/menus      - Assign menus to role
```

#### Admin: Permissions Management
```
GET    /api/system/permissions          - List all permissions
GET    /api/system/permissions/grouped  - Grouped by resource
POST   /api/system/permissions          - Create permission
PATCH  /api/system/permissions/:id      - Update permission
DELETE /api/system/permissions/:id      - Delete permission
```

#### Admin: Menus Management
```
GET    /api/system/menus          - List all menus
GET    /api/system/menus/tree     - Get menu tree
POST   /api/system/menus          - Create menu
PATCH  /api/system/menus/:id      - Update menu
DELETE /api/system/menus/:id      - Delete menu
```

#### Products (Example with Permissions)
```
GET    /api/products/marketplace      - Public: View all active products
GET    /api/products                  - Protected: Scope-filtered products
POST   /api/products                  - Protected: Requires product.create
PATCH  /api/products/:id              - Protected: Requires product.update
DELETE /api/products/:id              - Protected: Requires product.delete
POST   /api/products/export           - Protected: Requires product.export
```

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

## 🔐 Hybrid Access Control

The platform uses a **Hybrid Access Control** model combining:

### 1. RBAC (Role-Based Access Control)
**Controls WHAT actions users can perform** - Fine-grained permissions for UI elements and actions.

```typescript
// Check if user can export reports
@RequirePermission('report.export')
async exportReport() { ... }

// Show/hide UI elements based on permissions
<Button show={hasPermission('product.create')}>Create Product</Button>
```

**Permission Format**: `{resource}.{action}` (e.g., `product.create`, `booking.approve`, `report.export`)

### 2. Scope-Based Access Control
**Controls WHAT data users can access** - Automatic data filtering by organization/user context.

```typescript
// Automatically applies scope filter
enum ScopeType {
  GLOBAL       // Platform admins - see all data
  ORGANIZATION // Partners/tutors - see only their org's data
  USER         // Parents - see public + own data
}

// Repository auto-filters queries
if (scope === ORGANIZATION) {
  WHERE organizationId = user.organizationId
}
```

### Complete Access Flow

```
Request → JWT Auth → Load User Context → RBAC Check → Scope Filter → Result

1. "Can user DO this action?"     → RBAC checks permissions
2. "What DATA can user access?"   → Scope filters by organization
```

### System Roles

| Role | Scope | RBAC Permissions | Data Access |
|------|-------|-----------------|-------------|
| `KIGGLE_ADMIN` | GLOBAL | `*.*` (all) | All organizations |
| `KIGGLE_STAFF` | GLOBAL | Read-only | All organizations |
| `PARTNER_ADMIN` | ORGANIZATION | Full org permissions | Own org only |
| `PARTNER_STAFF` | ORGANIZATION | Limited permissions | Own org only |
| `TUTOR` | USER | Own resources | Own products/bookings |
| `PARENT` | USER | View + manage own | Public + own bookings |

### Permission Examples

**RBAC Tables** (4 tables):
- `roles` - Role definitions (partner_admin, partner_staff, etc.)
- `permissions` - Permission definitions (product.create, booking.approve, etc.)
- `role_permissions` - Role-permission mapping
- `role_assignments` - User role assignments (can be org-scoped)

**Usage in Controller:**
```typescript
@Controller('products')
export class ProductsController {
  // RBAC: Check permission
  // SCOPE: Auto-filter by organization
  @RequirePermission('product.create')
  @Post()
  async create(@Body() dto: CreateProductDto) {
    // Permission check passes
    // Repository auto-injects organizationId from scope
    return this.service.create(dto);
  }

  // RBAC: Check permission
  // SCOPE: Filter results by organization
  @RequirePermission('product.read')
  @Get()
  async findAll() {
    // Returns only products from user's organization
    return this.service.findAll();
  }
}
```

### Benefits

✅ **RBAC**: Fine-grained UI permissions (buttons, menus, exports)  
✅ **Scope**: Multi-tenant data isolation (Organization A ≠ Organization B)  
✅ **Performance**: Permissions cached in Redis  
✅ **Security**: Automatic scope filtering at repository layer  
✅ **Maintainable**: Add permissions without code changes

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
