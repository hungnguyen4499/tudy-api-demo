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
  role         UserRole
  status       UserStatus
  ...
}
```

**User Roles (UserRole enum):**
- `PARENT`: Parents looking for tutors/courses
- `TUTOR`: Individual tutors
- `PARTNER_STAFF`: Organization staff members
- `PARTNER_ADMIN`: Organization administrators
- `KIGGLE_STAFF`: Platform staff
- `KIGGLE_ADMIN`: Platform administrators

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
  role           OrganizationMemberRole
  
  // Fine-grained permissions
  canManageProducts  Boolean
  canManageBookings  Boolean
  canManageMembers   Boolean
  canViewReports     Boolean
  ...
}
```

**Member Roles:**
- `STAFF`: Regular staff member
- `ADMIN`: Organization administrator

**Permission Flags:**
- `canManageProducts`: Create, edit, delete products
- `canManageBookings`: Manage bookings and assignments
- `canManageMembers`: Invite, remove, update member permissions
- `canViewReports`: Access analytics and reports

**Features:**
- ✅ Simple role + permission flags
- ✅ No complex RBAC tables needed
- ✅ Easy to extend with more flags
- ✅ Join date tracking

**Permission Management:**
```typescript
// ADMIN role has all permissions by default
if (member.role === 'ADMIN') {
  // Auto-grant all permissions
} else {
  // Check specific flags
  if (member.canManageProducts) { /* allow */ }
}
```

---

## 2. ACCESS CONTROL ARCHITECTURE

### 2.1 Scope-Based Access Control

**Core Concept:** Automatic data filtering based on user's scope (GLOBAL, ORGANIZATION, or USER level).

```typescript
enum ScopeType {
  GLOBAL       // Platform admins - see everything
  ORGANIZATION // Partners/tutors - see only their organization's data
  USER         // Parents - see public data + own data
}
```

**Scope Determination (by UserRole):**

| UserRole | ScopeType | organizationId | Access Level |
|----------|-----------|----------------|--------------|
| `KIGGLE_ADMIN` | GLOBAL | null | All data |
| `KIGGLE_STAFF` | GLOBAL | null | All data (read-only) |
| `PARTNER_ADMIN` | ORGANIZATION | X | Organization X data |
| `PARTNER_STAFF` | ORGANIZATION | X | Organization X data |
| `TUTOR` | ORGANIZATION | X | Organization X data |
| `PARENT` | USER | null | Public + own data |

**How It Works:**

1. **User logs in** → JWT contains `userId` + `role`
2. **System determines scope:**
   ```typescript
   if (role === 'KIGGLE_ADMIN') {
     scope = { type: GLOBAL, userId }
   } else if (role === 'PARTNER_ADMIN') {
     scope = { type: ORGANIZATION, userId, organizationId }
   } else if (role === 'PARENT') {
     scope = { type: USER, userId }
   }
   ```
3. **Repository auto-filters queries:**
   ```typescript
   // Products for organization members
   WHERE products.organizationId = scope.organizationId
   
   // Bookings for parents
   WHERE bookings.parentId = scope.userId
   
   // No filter for platform admins
   ```

### 2.2 Permission Check (Simple)

**System-Level (UserRole enum):**
```typescript
// Platform admin actions
if (user.role === 'KIGGLE_ADMIN') {
  // Can do anything
}

// Parent actions
if (user.role === 'PARENT') {
  // Can only manage own children and bookings
}
```

**Organization-Level (OrganizationMemberRole + flags):**
```typescript
// Check organization membership
const member = await getOrganizationMember(userId, organizationId);

// Check role
if (member.role === 'ADMIN') {
  // Admins can do everything in their organization
  return true;
}

// Check specific permission flag
if (action === 'manage_products' && member.canManageProducts) {
  return true;
}
```

**No Complex RBAC Needed:**
- ✅ Simple role enums (UserRole, OrganizationMemberRole)
- ✅ Boolean permission flags on OrganizationMember
- ✅ Scope-based automatic filtering
- ✅ Easy to understand and maintain

### 2.3 Benefits vs Traditional RBAC

| Feature | Traditional RBAC | Scope-Based |
|---------|------------------|-------------|
| **Tables** | 4+ tables | 0 extra tables |
| **Complexity** | High (dynamic roles/permissions) | Low (enums + flags) |
| **Performance** | Multiple joins for permission check | Direct field access |
| **Maintenance** | Hard (permission matrix) | Easy (add boolean flag) |
| **Data Access** | Manual filtering | Automatic filtering |
| **Code in Services** | 30-50 lines per method | 0 lines (automatic) |

---

## 3. PRODUCT MANAGEMENT MODULE

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

## 4. COMMUNICATION MODULE

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

## 5. BOOKING & SCHEDULE MODULE

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

## 6. PAYMENT & SUBSCRIPTION MODULE

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

## 7. CONTENT MANAGEMENT MODULE

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
- ✅ Scope-based access control (automatic data filtering)
- ✅ Simple role-based permissions (enums + flags)
- ✅ Organization-scoped data access
- ✅ No complex RBAC needed

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
// In ScopeContext Service
export class ScopeContext {
  initialize(user: any): void {
    // Platform admin - GLOBAL scope
    if (user.role === 'KIGGLE_ADMIN' || user.role === 'KIGGLE_STAFF') {
      this._scope = {
        type: ScopeType.GLOBAL,
        userId: user.userId,
      };
      return;
    }

    // Partner/Tutor - ORGANIZATION scope
    if (user.role === 'PARTNER_ADMIN' || user.role === 'PARTNER_STAFF' || user.role === 'TUTOR') {
      this._scope = {
        type: ScopeType.ORGANIZATION,
        userId: user.userId,
        organizationId: user.organizationId,
      };
      return;
    }

    // Parent - USER scope
    if (user.role === 'PARENT') {
      this._scope = {
        type: ScopeType.USER,
        userId: user.userId,
      };
    }
  }
}

// In Repository
export class ProductsRepository {
  applyScope(where: any, scope: QueryScope): any {
    if (scope.type === ScopeType.GLOBAL) {
      return where; // No filter
    }
    
    if (scope.type === ScopeType.ORGANIZATION) {
      return { ...where, organizationId: scope.organizationId }; // Auto-filter
    }
    
    if (scope.type === ScopeType.USER) {
      return { ...where, status: 'ACTIVE' }; // Public products only
    }
  }
}
```

### 2. Permission Check (Simple)

```typescript
// Check organization-level permissions
async function hasOrganizationPermission(
  userId: number,
  organizationId: number,
  permission: 'canManageProducts' | 'canManageBookings' | 'canManageMembers' | 'canViewReports'
): Promise<boolean> {
  const member = await prisma.organizationMember.findUnique({
    where: { 
      userId_organizationId: { userId, organizationId } 
    },
  });
  
  if (!member) return false;
  
  // Admins have all permissions
  if (member.role === 'ADMIN') return true;
  
  // Check specific permission flag
  return member[permission] === true;
}

// Usage in service
if (await hasOrganizationPermission(userId, orgId, 'canManageProducts')) {
  // Allow product creation
}
```

### 3. Member Management Examples

```typescript
// Create organization member with permissions
await prisma.organizationMember.create({
  data: {
    userId: user.id,
    organizationId: org.id,
    role: 'STAFF',
    canManageProducts: true,
    canManageBookings: true,
    canManageMembers: false, // Staff cannot manage members
    canViewReports: false,
  },
});

// Update member permissions
await prisma.organizationMember.update({
  where: { id: memberId },
  data: {
    canViewReports: true, // Grant report access
  },
});

// Promote to admin (auto-grant all permissions)
await prisma.organizationMember.update({
  where: { id: memberId },
  data: {
    role: 'ADMIN',
    // All permissions automatically granted by role
  },
});
```

---

## Database Statistics

| Metric | Count |
|--------|-------|
| **Total Tables** | 22 |
| **Total Enums** | 25 |
| **Total Indexes** | 80+ |
| **Total Relations** | 50+ |
| **User Tables** | 6 |
| **Product Tables** | 4 |
| **Communication Tables** | 3 |
| **Booking Tables** | 3 |
| **Payment Tables** | 3 |
| **Content Tables** | 3 |

**Note:** No separate RBAC tables needed - using simple enums + boolean flags instead.

---

## Related Documentation

- [Database ERD](./DATABASE_ERD.md) - Entity Relationship Diagrams
- [API Flow](./API_FLOW.md) - API Flow Documentation

---

**Last Updated**: 2025-11-25  
**Version**: 2.0  
**Author**: Backend Team
