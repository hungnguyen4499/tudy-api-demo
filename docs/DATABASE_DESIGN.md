# KIGGLE Platform - Database Design Documentation

## Overview

This document describes the complete database architecture for the **KIGGLE Platform** - a marketplace that connects:
- **Parents**: Looking for courses and tutoring services for their children
- **Tutors/Organizations**: Providing educational services
- **Kiggle Staff**: Managing the entire platform

## Design Goals

1. **Flexibility**: Support both individual tutors and educational organizations
2. **Scalability**: Easy to add new features and handle growth
3. **Performance**: Optimized queries with proper indexing
4. **Data Integrity**: Complete foreign keys and constraints
5. **Audit Trail**: Track all changes with timestamps
6. **Security**: Scope-based access control with simple role management

## Database Architecture

### Technology Stack
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5
- **Schema**: 22 tables, 25 enums
- **Indexes**: 80+ strategic indexes
- **Relations**: 50+ foreign key relationships
- **Access Control**: Scope-based (organization-centric)

---

## 1. USER MANAGEMENT MODULE

### 1.1 User (Core Table)

```prisma
model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  phone        String?  @unique
  passwordHash String
  status       UserStatus
  ...
}
```

**RBAC Relationship:**
- Roles are stored in the `Role` table and assigned via `UserRole` (many-to-many bridge)
- `UserRole` (TypeScript enum) is only used for request validation/mapping during registration

**User Status (UserStatus enum):**
- `ACTIVE`: Active user
- `INACTIVE`: Temporarily inactive
- `BANNED`: Permanently banned

**Features:**
- ✅ Email/Phone authentication
- ✅ Email/Phone verification
- ✅ Geolocation support (lat/lng) for location-based search
- ✅ Soft delete (deletedAt)
- ✅ Profile information (name, avatar, gender, date of birth)
- ✅ Address details with geo-coordinates
- ✅ `userRoles` relation used by RBAC for permissions & data scopes

### 1.2 Parent Profile

```prisma
model Parent {
  id                     Int @id
  userId                 Int @unique
  preferredCommunication String?
  emergencyContactName   String?
  emergencyContactPhone  String?
  referralCode           String? @unique
  referredBy             Int?
  ...
}
```

**Features:**
- ✅ Referral system for user acquisition
- ✅ Emergency contact information
- ✅ Multiple children management
- ✅ Preferred communication channel

### 1.3 Child

```prisma
model Child {
  id           Int @id
  parentId     Int
  firstName    String
  lastName     String
  dateOfBirth  DateTime
  gradeLevel   Int?
  learningStyle String?
  specialNeeds String?
  ...
}
```

**Features:**
- ✅ Multiple children per parent
- ✅ Learning profile (style, special needs)
- ✅ Academic information (school, grade)
- ✅ Active/Inactive status

### 1.4 Tutor Profile

```prisma
model Tutor {
  id                   Int @id
  userId               Int @unique
  bio                  String?
  university           String?
  applicationStatus    TutorStatus
  averageRating        Decimal
  totalSessions        Int
  completedSessions    Int
  totalEarnings        Decimal
  ...
}
```

**Tutor Status Flow:**
```
PENDING → UNDER_REVIEW → INTERVIEW_SCHEDULED → TRAINING → APPROVED
                                                         ↓
                                                      REJECTED
```

**Features:**
- ✅ Academic credentials (university, major, GPA, student ID)
- ✅ English proficiency (IELTS score, certificates)
- ✅ Background check tracking
- ✅ Banking information for payments
- ✅ Performance metrics (sessions, earnings, ratings)
- ✅ Featured tutor support
- ✅ Application approval workflow

### 1.5 Organization

```prisma
model Organization {
  id          Int @id
  type        OrganizationType
  name        String
  slug        String @unique
  taxCode     String?
  status      OrganizationStatus
  ...
}
```

**Organization Types:**
- `PARTNER`: External partner organizations
- `KIGGLE`: Kiggle-owned organizations

**Features:**
- ✅ Business registration (tax code, license)
- ✅ Multi-location support with geo-coordinates
- ✅ Performance metrics (bookings, ratings)
- ✅ Staff member management
- ✅ Status approval workflow

### 1.6 OrganizationMember

```prisma
model OrganizationMember {
  id             Int @id
  userId         Int @unique
  organizationId Int
  joinedAt       DateTime @default(now())
  ...
}
```

**Features:**
- ✅ Tracks which organization a user belongs to
- ✅ One-to-one relationship (a user belongs to at most one organization)
- ✅ All authorization logic comes from RBAC (`UserRole` + `Role.dataScope`)
- ✅ Keeps membership concerns separate from permissions
```

---

## 2. RBAC (Role-Based Access Control) MODULE

### 2.1 Role

```prisma
model Role {
  id          Int       @id @default(autoincrement())
  name        String    @unique // e.g., "partner_admin", "partner_staff"
  displayName String    // e.g., "Partner Administrator"
  description String?
  dataScope   ScopeType @default(USER) // GLOBAL | ORGANIZATION | USER - what data can users access?
  isSystem    Boolean   @default(false)  // Prevents modification
  
  permissions RolePermission[]
  userRoles   UserRole[]
}

enum ScopeType {
  GLOBAL       // Platform admins - see all data
  ORGANIZATION // Partners/tutors - see only their org
  USER         // Parents - see only own data
}
```

**Features:**
- ✅ Flexible role definition stored in database
- ✅ `dataScope` determines what data users can access (GLOBAL/ORGANIZATION/USER)
- ✅ System roles protected from modification
- ✅ Extensible for custom organization roles
- ✅ Works together with `UserRole` to assign roles to users

**Predefined System Roles:**
- `kiggle_admin` - Full platform access
- `kiggle_staff` - Read-only platform access
- `partner_admin` - Full access within organization
- `partner_staff` - Limited access within organization
- `tutor` - Own resources only
- `parent` - View all + manage own

### 2.2 Permission

```prisma
model Permission {
  id          Int    @id @default(autoincrement())
  code        String @unique // e.g., "product.create"
  resource    String         // e.g., "product"
  action      String         // e.g., "create"
  displayName String
  description String?
  
  roles RolePermission[]
}
```

**Features:**
- ✅ Granular action-level permissions
- ✅ Consistent naming convention (`{resource}.{action}`)
- ✅ Easy to query by resource or action
- ✅ Supports wildcard permissions (`product.*`, `*.*`)

**Permission Categories:**

| Category | Examples |
|----------|----------|
| **Product** | `product.create`, `product.read`, `product.update`, `product.delete` |
| **Booking** | `booking.read`, `booking.update`, `booking.approve`, `booking.cancel` |
| **Report** | `report.view`, `report.export` |
| **Member** | `member.manage`, `member.invite`, `member.remove` |
| **Organization** | `organization.manage`, `organization.view` |
| **Admin** | `*.*` (all permissions) |

### 2.3 RolePermission (Join Table)

```prisma
model RolePermission {
  id           Int @id @default(autoincrement())
  roleId       Int
  permissionId Int
  
  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@unique([roleId, permissionId])
}
```

**Features:**
- ✅ Many-to-many relationship between roles and permissions
- ✅ Cascade delete when role or permission is removed
- ✅ Unique constraint prevents duplicate assignments

### 2.4 UserRole

```prisma
model UserRole {
  id     Int @id @default(autoincrement())
  userId Int
  roleId Int
  
  // Optional: Temporary assignments (future extension)
  expiresAt DateTime?
  assignedBy Int?
  assignedAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@unique([userId, roleId])
}
```

**Features:**
- ✅ Single source of truth for user-role assignments
- ✅ Works with `Role.dataScope` + `OrganizationMember` to determine access
- ✅ Supports audit fields for future temporary assignments
- ✅ Cascade delete keeps assignments in sync

**Example:**
```typescript
await prisma.userRole.create({
  data: {
    userId: user.id,
    roleId: partnerAdminRole.id,
  },
});
```

---

## 3. MENU SYSTEM (UI-Driven Permissions)

### 3.1 Menu

```prisma
model Menu {
  id   Int    @id @default(autoincrement())
  code String @unique // e.g., "menu.products", "btn.product.create"
  
  type      MenuType // MENU | BUTTON | TAB
  name      String   // Display name
  icon      String?  // Icon name
  path      String?  // Route path (for MENU type)
  component String?  // Component name
  
  parentId  Int?     // Hierarchy support
  sortOrder Int      // Display order
  
  isVisible Boolean  // Show/hide
  isEnabled Boolean  // Enable/disable
  
  permissionId Int?  // ⭐ Optional reference to Permission
  
  metadata Json?    // Extra config
}

enum MenuType {
  MENU   // Sidebar navigation item
  BUTTON // Action button (add, edit, delete, export)
  TAB    // Tab item
}
```

**Features:**
- ✅ Dynamic UI structure managed in database
- ✅ Hierarchy support (parent-child menus)
- ✅ Multiple types: MENU (navigation), BUTTON (actions), TAB (sub-nav)
- ✅ Optional link to Permission (hybrid approach)
- ✅ Sorting and visibility control
- ✅ Metadata for extra configuration

**Why each column stays:**
- `nameEn`, `icon`, `path`, `component` keep the admin UI multilingual and decoupled from hardcoded routes/components.
- `parentId` + `sortOrder` allow the backend to assemble trees in a predictable order for any client (web/mobile).
- `isVisible` vs `isEnabled` separates hiding a feature from disabling it while showing a tooltip.
- `permissionId` connects RBAC to UI elements without duplicating permission codes in frontends.
- `description` documents menu purpose for operators, while `metadata` (JSON) carries per-item flags (badges, experiment toggles, deep links) without forcing schema changes.
- Every field is optional where appropriate, so lean deployments can omit unused metadata while preserving the flexibility for future SaaS tenants.

**Menu Types:**

| Type | Use Case | Examples |
|------|----------|----------|
| **MENU** | Sidebar navigation | "Products", "Bookings", "Reports" |
| **BUTTON** | Action buttons | "Add Product", "Delete", "Export", "Approve" |
| **TAB** | Tab navigation | "Basic Info", "Pricing", "Settings" |

**Hybrid Permission Model:**

```typescript
// Menu WITHOUT permission (pure UI)
{
  code: 'menu.dashboard',
  type: 'MENU',
  name: 'Dashboard',
  permissionId: null // Just navigation, no API
}

// Menu WITH permission (UI + backend)
{
  code: 'menu.products',
  type: 'MENU',
  name: 'Products',
  permissionId: permission('product.read') // Needs API permission
}

// Multiple menus, SAME permission (reusable)
{
  code: 'btn.product.create.list',
  type: 'BUTTON',
  permissionId: permission('product.create')
}
{
  code: 'btn.product.create.dashboard',
  type: 'BUTTON',
  permissionId: permission('product.create') // Same permission!
}
```

### 3.2 RoleMenu

```prisma
model RoleMenu {
  id     Int @id @default(autoincrement())
  roleId Int
  menuId Int
  
  role Role @relation(fields: [roleId], references: [id])
  menu Menu @relation(fields: [menuId], references: [id])
  
  @@unique([roleId, menuId])
}
```

**Features:**
- ✅ Assign menus to roles
- ✅ Different roles see different UI elements
- ✅ Admin can manage without code changes

**Benefits of Menu System:**

| Feature | Traditional Hardcoded UI | Menu System |
|---------|-------------------------|-------------|
| Add new button | Code change + deploy | Insert DB row |
| Change menu order | Code change | Update sortOrder |
| Role-based UI | Hardcoded checks | Load from DB |
| Multi-language | Hardcoded translations | Store nameEn field |
| A/B testing | Feature flags | Toggle isVisible |

**Example: Frontend Usage**

```typescript
// Load user's menus
const menus = await api.get('/api/auth/menus');

// Render sidebar
{menus.filter(m => m.type === 'MENU').map(menu => (
  <SidebarItem icon={menu.icon} label={menu.name} to={menu.path} />
))}

// Render action buttons
{menus.some(m => m.code === 'btn.product.create') && (
  <Button onClick={handleCreate}>Add Product</Button>
)}

// Render tabs
{menus.filter(m => m.type === 'TAB' && m.parentId === currentMenu).map(tab => (
  <Tab>{tab.name}</Tab>
))}
```

---

## 4. ACCESS CONTROL ARCHITECTURE

### 3.1 Scope-Based Access Control

**Core Concept:** Automatic data filtering based on user's scope (GLOBAL, ORGANIZATION, or USER level).

```typescript
enum ScopeType {
  GLOBAL       // Platform admins - see everything
  ORGANIZATION // Partners/tutors - see only their organization's data
  USER         // Parents - see public data + own data
}
```

**Scope Determination (by Role.dataScope):**

| UserRole (DB Role.name) | ScopeType (Role.dataScope) | organizationId (from OrganizationMember) | Access Level |
|-------------------------|----------------------------|-------------------------------------------|--------------|
| `kiggle_admin` | GLOBAL | null | All data |
| `kiggle_staff` | GLOBAL | null | All data (read-only) |
| `partner_admin` | ORGANIZATION | X | Organization X data |
| `partner_staff` | ORGANIZATION | X | Organization X data |
| `tutor` | ORGANIZATION | X | Organization X data |
| `parent` | USER | null | Public + own data |

**How It Works (Runtime Flow):**

1. **User logs in** → JWT contains `userId` + `role` (role name from `Role`)
2. **UserContextService**:
   - Loads all `UserRole` rows for the user
   - Aggregates `Role.dataScope` (priority: `GLOBAL` > `ORGANIZATION` > `USER`)
   - Resolves `organizationId` from `OrganizationMember` (if any)
3. **DataScopeContext** (request-scoped) is initialized by `ScopeInterceptor` using `UserContext.dataScope`
4. **Repositories** rely on `DataScopeContext` helpers:
   ```typescript
   // Products for organization members
   const where = dataScopeContext.getOrganizationFilter();
   return this.prisma.product.findMany({ where });
   
   // Bookings for parents
   const where = dataScopeContext.getParentFilter();
   return this.prisma.booking.findMany({ where });
   
   // Admins (GLOBAL) → filters are empty objects ⇒ see all data
   ```

### 3.2 Hybrid Model: RBAC + Scope

**For fine-grained permission management**, the system implements full RBAC with:

#### 4 Additional Tables:
1. **roles** - Role definitions (business roles)
2. **permissions** - Permission definitions  
3. **role_permissions** - Many-to-many mapping Role ↔ Permission
4. **user_roles** - User role assignments (single source of truth for roles)

#### Data Scope Types:
```prisma
enum ScopeType {
  GLOBAL       // Platform admins - see all data (e.g., KIGGLE_ADMIN)
  ORGANIZATION // Partners/tutors - see only their org (e.g., PARTNER_ADMIN, TUTOR)
  USER         // Parents - see only own data
}
```

**Note:** Data scope is **role-based** via `Role.dataScope`.  
Organization membership is modeled separately in `OrganizationMember`:
- A user belongs to at most one organization via `OrganizationMember`
- Roles are assigned via `UserRole` and determine data scope, not the organization itself

#### Permission Naming Convention:
```
{resource}.{action}

Examples:
- product.create
- product.read
- product.update
- product.delete
- booking.approve
- report.export
- member.manage
- *.* (admin wildcard)
```

#### Usage Examples:

**Check Permission (in code):**
```typescript
// Decorator-based (recommended)
@RequirePermission('product.create')
async createProduct() { }

// Programmatic check
if (await hasPermission(user, 'report.export')) {
  // Allow export
}

// UI visibility check
<Button show={hasPermission('booking.approve')}>
  Approve Booking
</Button>
```

**Assign Role to User (UserRole):**
```typescript
// Assign role to user
await prisma.userRole.create({
  data: {
    userId: 1,
    roleId: kiggleAdminRoleId,
  },
});

// Ensure uniqueness per (user, role)
model UserRole {
  id     Int @id @default(autoincrement())
  userId Int
  roleId Int

  @@unique([userId, roleId]) // A user can have same role only once
}
```

**Benefits:**
- ✅ Fine-grained action permissions (UI buttons, menu items, exports)
- ✅ Easy to add/modify permissions without code changes
- ✅ Supports both system-wide and organization-scoped roles
- ✅ Permission caching in Redis for performance
- ✅ Temporary role assignments (with expiresAt)
- ✅ Scope-based automatic filtering
- ✅ Easy to understand and maintain

### 2.3 Benefits vs Traditional RBAC

| Feature | Traditional RBAC Only | Hybrid RBAC + Data Scope |
|---------|-----------------------|---------------------------|
| **Tables** | 4+ tables | 4 tables (Role, Permission, RolePermission, UserRole) |
| **Complexity** | High (dynamic roles/permissions) | Medium (RBAC + dataScope per role) |
| **Performance** | Multiple joins per request | Permissions cached in Redis + lightweight joins |
| **Maintenance** | Hard (permission matrix) | Easier (menu-based permissions + DB-driven roles) |
| **Data Access** | Manual filtering | Automatic filtering via `DataScopeContext` |
| **Code in Services** | Many manual checks | Thin services, repositories use helpers |

---

## 5. PRODUCT MANAGEMENT MODULE

### 3.1 Product

```prisma
model Product {
  id              Int @id
  type            ProductType
  name            String
  slug            String @unique
  price           Decimal
  priceUnit       PriceUnit
  durationMinutes Int
  status          ProductStatus
  tutorId         Int?
  organizationId  Int?
  ...
}
```

**Product Types:**
- `COURSE`: Structured course with multiple sessions
- `TUTORING_SERVICE`: One-on-one or group tutoring

**Price Units:**
- `SESSION`: Per session pricing
- `MONTH`: Monthly subscription
- `COURSE`: Full course pricing

**Product Status Flow:**
```
DRAFT → PENDING → APPROVED (ACTIVE)
                → REJECTED (INACTIVE)
```

**Features:**
- ✅ Flexible ownership (tutor or organization)
- ✅ SEO optimization (slug, meta tags)
- ✅ Age range targeting
- ✅ Multiple pricing models
- ✅ Featured products
- ✅ Draft/Published workflow
- ✅ Multiple images support
- ✅ Category assignments

### 3.2 Category

```prisma
model Category {
  id       Int @id
  name     String
  slug     String @unique
  parentId Int?
  sortOrder Int
  isActive Boolean
  ...
}
```

**Features:**
- ✅ Hierarchical structure (parent-child)
- ✅ Icon support
- ✅ Multi-language (name, nameEn)
- ✅ Sort order control
- ✅ Active/Inactive status

### 3.3 ProductCategory (Many-to-Many)

Links products to categories with many-to-many relationship.

### 3.4 ProductImage

```prisma
model ProductImage {
  id        Int @id
  productId Int
  url       String
  alt       String?
  sortOrder Int
  ...
}
```

**Features:**
- ✅ Multiple images per product
- ✅ Custom sort order
- ✅ Alt text for SEO and accessibility

---

## 6. COMMUNICATION MODULE

### 4.1 Conversation

```prisma
model Conversation {
  id                Int @id
  parentId          Int
  tutorId           Int?
  organizationId    Int?
  lastMessageAt     DateTime?
  parentUnreadCount Int
  tutorUnreadCount  Int
  status            ConversationStatus
  ...
}
```

**Features:**
- ✅ 1-1 chat between parent and tutor/organization
- ✅ Unread message tracking for both sides
- ✅ Last message tracking
- ✅ Status management (ACTIVE, ARCHIVED, BLOCKED)

### 4.2 Message

```prisma
model Message {
  id             Int @id
  conversationId Int
  senderId       Int
  content        String
  type           MessageType
  attachments    Json?
  isRead         Boolean
  readAt         DateTime?
  ...
}
```

**Message Types:**
- `TEXT`: Plain text message
- `IMAGE`: Image attachment
- `FILE`: File attachment
- `SYSTEM`: System-generated message

**Features:**
- ✅ Multiple message types
- ✅ Attachments support (JSON field)
- ✅ Read receipts
- ✅ System messages for automation

### 4.3 Consultation

```prisma
model Consultation {
  id             Int @id
  conversationId Int
  productId      Int?
  childId        Int?
  preferredDate  DateTime?
  preferredTime  String?
  status         ConsultationStatus
  ...
}
```

**Consultation Status Flow:**
```
PENDING → ACCEPTED → Convert to Booking
        → REJECTED
        → COMPLETED
```

**Features:**
- ✅ Link to product and child
- ✅ Preferred schedule information
- ✅ Convert to booking
- ✅ Status tracking

---

## 7. BOOKING & SCHEDULE MODULE

### 5.1 Booking

```prisma
model Booking {
  id             Int @id
  bookingCode    String @unique
  parentId       Int
  childId        Int
  productId      Int
  tutorId        Int?
  organizationId Int?
  scheduledDate  DateTime
  scheduledTime  String
  status         BookingStatus
  totalPrice     Decimal
  locationType   LocationType
  ...
}
```

**Booking Status Flow:**
```
PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
                                  → CANCELLED_BY_*
                                  → NO_SHOW_*
        → RESCHEDULED
```

**Location Types:**
- `ONLINE`: Online session
- `AT_HOME`: At student's home
- `AT_PARTNER`: At organization's location
- `OTHER`: Other location

**Features:**
- ✅ Unique booking code
- ✅ Check-in/Check-out tracking
- ✅ Actual duration tracking
- ✅ Location management with geo-coordinates
- ✅ Cancellation tracking with reason
- ✅ Notes from multiple parties (parent, tutor, admin)
- ✅ Platform fee calculation
- ✅ Link to consultation

### 5.2 Schedule

```prisma
model Schedule {
  id        Int @id
  bookingId Int
  date      DateTime
  startTime String
  endTime   String
  status    ScheduleStatus
  ...
}
```

**Features:**
- ✅ Multiple sessions per booking (for courses)
- ✅ Individual session status tracking
- ✅ Time management

### 5.3 ScheduleSlot

```prisma
model ScheduleSlot {
  id             Int @id
  tutorId        Int?
  organizationId Int?
  dayOfWeek      Int
  startTime      String
  endTime        String
  isAvailable    Boolean
  ...
}
```

**Features:**
- ✅ Define available time slots
- ✅ Support for both tutors and organizations
- ✅ Weekly recurring schedule
- ✅ Day of week (0-6: Sunday-Saturday)

---

## 8. PAYMENT & SUBSCRIPTION MODULE

### 6.1 SubscriptionPackage

```prisma
model SubscriptionPackage {
  id              Int @id
  name            String
  price           Decimal
  durationDays    Int
  features        Json?
  maxProducts     Int?
  maxBookings     Int?
  maxStaffMembers Int?
  status          PackageStatus
  ...
}
```

**Features:**
- ✅ Flexible features (JSON field)
- ✅ Resource limits (products, bookings, staff)
- ✅ Duration-based pricing
- ✅ Multi-language support

### 6.2 Subscription

```prisma
model Subscription {
  id             Int @id
  tutorId        Int?
  organizationId Int?
  packageId      Int
  status         SubscriptionStatus
  startDate      DateTime
  endDate        DateTime
  autoRenew      Boolean
  ...
}
```

**Subscription Status:**
- `ACTIVE`: Currently active
- `EXPIRED`: Past end date
- `CANCELLED`: Manually cancelled

**Features:**
- ✅ Support both tutors and organizations
- ✅ Auto-renewal option
- ✅ Date range tracking

### 6.3 Payment

```prisma
model Payment {
  id              Int @id
  userId          Int?
  bookingId       Int?
  subscriptionId  Int?
  amount          Decimal
  method          PaymentMethod
  status          PaymentStatus
  transactionId   String?
  gatewayResponse Json?
  paidAt          DateTime?
  ...
}
```

**Payment Methods:**
- `BANK_TRANSFER`: Bank transfer
- `E_WALLET`: E-wallet (Momo, ZaloPay, etc.)
- `CREDIT_CARD`: Credit/Debit card
- `CASH`: Cash payment

**Payment Status:**
- `PENDING`: Awaiting payment
- `PROCESSING`: Processing payment
- `COMPLETED`: Successfully paid
- `FAILED`: Payment failed
- `REFUNDED`: Refunded
- `CANCELLED`: Cancelled

**Features:**
- ✅ Multiple payment purposes (booking, subscription)
- ✅ Payment gateway integration
- ✅ Transaction tracking
- ✅ Refund support
- ✅ Gateway response storage

---

## 9. CONTENT MANAGEMENT MODULE

### 7.1 Banner

```prisma
model Banner {
  id          Int @id
  title       String
  imageUrl    String
  linkUrl     String?
  linkType    BannerLinkType?
  position    BannerPosition
  status      BannerStatus
  startDate   DateTime?
  endDate     DateTime?
  sortOrder   Int
  ...
}
```

**Banner Positions:**
- `HOME`: Home page
- `COURSE_LIST`: Course listing page
- `TUTORING_LIST`: Tutoring service listing page
- `PROFILE`: User profile page

**Link Types:**
- `PRODUCT`: Link to product detail
- `CATEGORY`: Link to category page
- `EXTERNAL`: External URL
- `NONE`: No link

**Features:**
- ✅ Multiple positions support
- ✅ Date range scheduling
- ✅ Custom sort order
- ✅ Active/Inactive status

### 7.2 Notification

```prisma
model Notification {
  id      Int @id
  userId  Int?
  title   String
  content String
  type    NotificationType
  data    Json?
  isRead  Boolean
  readAt  DateTime?
  sentAt  DateTime?
  ...
}
```

**Notification Types:**
- `BOOKING`: Booking-related notifications
- `MESSAGE`: New message notifications
- `PAYMENT`: Payment-related notifications
- `REVIEW`: Review-related notifications
- `SYSTEM`: System notifications
- `PROMOTION`: Promotional notifications

**Features:**
- ✅ Broadcast notifications (userId = null)
- ✅ Targeted notifications
- ✅ Read tracking
- ✅ Flexible data structure (JSON)
- ✅ Send timestamp tracking

### 7.3 Review

```prisma
model Review {
  id             Int @id
  parentId       Int
  productId      Int?
  tutorId        Int?
  organizationId Int?
  bookingId      Int?
  rating         Int
  title          String?
  content        String?
  images         Json?
  status         ReviewStatus
  response       String?
  respondedBy    Int?
  respondedAt    DateTime?
  ...
}
```

**Review Status:**
- `PENDING`: Awaiting moderation
- `APPROVED`: Approved and visible
- `REJECTED`: Rejected by moderator
- `HIDDEN`: Hidden by moderator

**Features:**
- ✅ 5-star rating system (1-5)
- ✅ Photo reviews (JSON array)
- ✅ Review moderation workflow
- ✅ Response from service provider
- ✅ Link to booking for verification

---

## Security Features

### 1. Authentication & Authorization
- ✅ Password hashing (bcrypt)
- ✅ JWT tokens (access + refresh)
- ✅ Hybrid RBAC + DataScopeContext (automatic data filtering)
- ✅ Database-driven roles & permissions (Role, Permission, UserRole, RoleMenu)
- ✅ Menu-based UI permissions + API permissions
- ✅ Organization membership isolation via `OrganizationMember`

### 2. Data Protection
- ✅ Email/Phone verification
- ✅ User status management (ACTIVE, INACTIVE, BANNED)
- ✅ Soft delete for data preservation
- ✅ Sensitive data encryption

### 3. Audit Trail
- ✅ Complete timestamps (createdAt, updatedAt)
- ✅ Soft delete tracking (deletedAt)
- ✅ Action tracking (approvedBy, cancelledBy, assignedBy)
- ✅ Transaction logs

---

## Performance Optimization

### 1. Indexing Strategy

**Single Column Indexes:**
```sql
-- Lookup indexes
email, phone, slug, bookingCode, transactionId

-- Status indexes
status, isActive, isRead

-- Foreign key indexes (automatic in most cases)
userId, parentId, tutorId, organizationId, productId, etc.
```

**Composite Indexes:**
```sql
-- Filtered queries
(status, createdAt)
(type, status)
(resource, action) -- for permissions
(scheduledDate, status)

-- Range queries with filters
(date, status)
(startDate, endDate)
```

**Partial Indexes:**
```sql
-- Index only active records
WHERE status = 'ACTIVE'
WHERE deletedAt IS NULL
```

### 2. Query Optimization
- ✅ Select only required fields
- ✅ Use pagination for lists
- ✅ Implement cursor-based pagination for large datasets
- ✅ Use database views for complex queries
- ✅ Proper JOIN strategy

### 3. Caching Strategy
```typescript
// Redis cache for:
- User sessions and permissions
- Product listings
- Category trees
- Conversation lists
- Unread message counts
- Dashboard statistics
```

---

## Scalability Considerations

### 1. Horizontal Partitioning (Sharding)
```
Potential sharding keys:
- User data: by userId or geographic region
- Booking data: by organizationId or date range
- Message data: by conversationId
- Analytics: by date (time-series data)
```

### 2. Vertical Partitioning
```
Separate databases for:
1. Core Data (users, products, bookings)
2. Communication (conversations, messages)
3. Analytics & Logs
4. File Storage metadata
```

### 3. Read Replicas
```
Master-Slave replication for:
- Product listings (read-heavy)
- Search queries
- Analytics dashboards
- Reporting
```

### 4. Archiving Strategy
```
Archive old data to cold storage:
- Bookings older than 1 year
- Messages older than 6 months
- Notifications older than 3 months
- Audit logs older than 2 years
```

---

## Access Control Implementation Guide

### 1. Scope-Based Filtering (Automatic)

```typescript
// DataScopeContext (request-scoped)
@Injectable({ scope: Scope.REQUEST })
export class DataScopeContext {
  private context: UserContext | null = null;
  private type: DataScopeType | null = null;

  initialize(userContext: UserContext) {
    this.context = userContext;
    this.type = this.mapDataScopeType(userContext.dataScope);
  }

  getOrganizationFilter() {
    if (this.type === DataScopeType.ORGANIZATION && this.context?.organizationId) {
      return { organizationId: this.context.organizationId };
    }
    return {};
  }

  getParentFilter() {
    if (this.type === DataScopeType.USER) {
      return { parentId: this.context!.userId };
    }
    return {};
  }

  applyFilter(where: Prisma.ProductWhereInput = {}) {
    if (this.type === DataScopeType.GLOBAL) return where;
    if (this.type === DataScopeType.ORGANIZATION) {
      return { ...where, organizationId: this.context!.organizationId };
    }
    return { ...where, status: ProductStatus.ACTIVE };
  }

  // mapDataScopeType(...) omitted for brevity
}

// Repository usage
export class ProductsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeContext: DataScopeContext,
  ) {}

  async findMany(where: Prisma.ProductWhereInput = {}) {
    return this.prisma.product.findMany({
      where: this.dataScopeContext.applyFilter(where),
    });
  }
}
```

### 2. Permission Check (RBAC)

```typescript
// Decorator-based usage
@RequirePermission('product.create')
async create(@Body() dto: CreateProductRequest) {
  return this.productsService.create(dto);
}

// Programmatic usage
if (!(await this.permissionService.hasPermission(userId, 'report.export'))) {
  throw new ForbiddenException();
}
```

### 3. Assign Role to User

```typescript
// Map from DTO enum to database role name
const role = await this.prisma.role.findUnique({ where: { name: 'partner_admin' } });
await this.prisma.userRole.create({
  data: {
    userId: user.id,
    roleId: role.id,
  },
});
```

---

## Database Statistics

| Metric | Count |
|--------|-------|
| **Total Tables** | 28 |
| **Total Enums** | 27 |
| **Total Indexes** | 100+ |
| **Total Relations** | 65+ |
| **User Tables** | 6 |
| **RBAC Tables** | 4 |
| **Menu System** | 2 |
| **Product Tables** | 4 |
| **Communication Tables** | 3 |
| **Booking Tables** | 3 |
| **Payment Tables** | 3 |
| **Content Tables** | 3 |

**Note:** Hybrid model combining RBAC (permissions) + Menu system (UI) + Scope-based access control (data isolation).

---

## Related Documentation

- [Data Scope Context](./DATA_SCOPE_CONTEXT.md) - Request-scoped data filtering service
- [Menu-Based Permissions](./MENU_BASED_PERMISSIONS.md) - Menu system + Permission hybrid approach
- [Database ERD](./DATABASE_ERD.md) - Entity Relationship Diagrams
- [DB User & Authorization Evaluation](./DB_USER_AUTHORIZATION_EVALUATION.md) - In-depth analysis

---

**Last Updated**: 2025-11-25  
**Version**: 2.0  
**Author**: Backend Team
