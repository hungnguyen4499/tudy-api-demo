# KIGGLE Platform - Entity Relationship Diagram

## Overview

This document provides visual representations of the database schema for the KIGGLE Platform, including entity relationships, RBAC system, and module interactions.

---

## 1. USER & PROFILE MODELS

```mermaid
erDiagram
    User ||--o| Parent : "has"
    User ||--o| Tutor : "has"
    User ||--o| OrganizationMember : "has"
    Parent ||--|{ Child : "manages"
    Tutor }o--|| Organization : "belongs to"
    OrganizationMember }o--|| Organization : "belongs to"
    Tutor ||--o| OrganizationMember : "can be"
    
    User {
        int id PK
        string email UK
        string phone UK
        string passwordHash
        enum role
        enum status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    
    Parent {
        int id PK
        int userId FK
        string referralCode UK
        int referredBy FK
    }
    
    Child {
        int id PK
        int parentId FK
        string firstName
        string lastName
        datetime dateOfBirth
        int gradeLevel
    }
    
    Tutor {
        int id PK
        int userId FK
        int organizationId FK
        boolean isFreelance
        enum applicationStatus
        decimal averageRating
        int totalSessions
        int completedSessions
    }
    
    Organization {
        int id PK
        enum type
        string name
        string slug UK
        enum status
        decimal averageRating
    }
    
    OrganizationMember {
        int id PK
        int userId FK
        int organizationId FK
        enum role
        boolean canManageProducts
        boolean canManageBookings
        boolean canManageMembers
        boolean canViewReports
    }
```

**Key Points:**
- User is the central table with 3 profile types: Parent, Tutor, OrganizationMember
- Parent manages multiple Children
- **Tutor always belongs to Organization** (INDIVIDUAL or COMPANY type)
- Organization has multiple members with roles + permission flags
- **Simple permission system:** Enums + boolean flags (no complex RBAC tables)

---

## 2. ACCESS CONTROL (SCOPE-BASED)

**No separate RBAC tables needed!** Instead, we use:

### Simple Role System

```typescript
// System-level roles (User.role enum)
enum UserRole {
  PARENT           // Marketplace customer
  TUTOR            // Individual or employed tutor
  PARTNER_STAFF    // Organization staff
  PARTNER_ADMIN    // Organization admin
  KIGGLE_STAFF     // Platform staff
  KIGGLE_ADMIN     // Platform admin
}

// Organization-level roles (OrganizationMember.role enum)
enum OrganizationMemberRole {
  STAFF   // Regular staff
  ADMIN   // Organization admin
}

// Organization-level permissions (OrganizationMember fields)
{
  canManageProducts: boolean  // Create, edit, delete products
  canManageBookings: boolean  // Manage bookings
  canManageMembers: boolean   // Invite, remove members
  canViewReports: boolean     // Access analytics
}
```

### Scope-Based Data Filtering

```typescript
// Automatic filtering at repository level
if (user.role === 'KIGGLE_ADMIN') {
  // GLOBAL scope - see all data
  WHERE /* no filter */
}

if (user.role === 'PARTNER_ADMIN') {
  // ORGANIZATION scope - see only own org
  WHERE organizationId = user.organizationId
}

if (user.role === 'PARENT') {
  // USER scope - see public + own data
  WHERE status = 'ACTIVE' OR userId = user.userId
}
```

**Benefits:**
- ✅ No complex joins for permission checks
- ✅ No 4 extra RBAC tables
- ✅ Simple to understand and maintain
- ✅ Automatic data filtering (scope-based)
- ✅ Easy to extend (add more boolean flags)

---

## 3. PRODUCT & CATEGORY MODELS

```mermaid
erDiagram
    Product }o--o| Tutor : "owned by"
    Product }o--o| Organization : "owned by"
    Product ||--|{ ProductImage : "has"
    Product ||--|{ ProductCategory : "categorized"
    Category ||--|{ ProductCategory : "includes"
    Category ||--o{ Category : "parent-child"
    Product ||--|{ Booking : "booked"
    Product ||--|{ Review : "reviewed"
    
    Product {
        int id PK
        enum type
        string name
        string slug UK
        decimal price
        enum priceUnit
        int durationMinutes
        enum status
        int tutorId FK
        int organizationId FK
    }
    
    Category {
        int id PK
        string name
        string slug UK
        int parentId FK
        int sortOrder
        boolean isActive
    }
    
    ProductCategory {
        int id PK
        int productId FK
        int categoryId FK
    }
    
    ProductImage {
        int id PK
        int productId FK
        string url
        int sortOrder
    }
```

**Key Points:**
- Product can belong to either Tutor or Organization
- Category supports hierarchical structure (parent-child)
- Product has multiple images and categories
- Many-to-many relationship between Product and Category

---

## 4. COMMUNICATION & CONSULTATION

```mermaid
erDiagram
    User ||--|{ Conversation : "parent participates"
    User ||--|{ Conversation : "tutor participates"
    Organization ||--|{ Conversation : "participates"
    Conversation ||--|{ Message : "contains"
    Conversation ||--|{ Consultation : "includes"
    User ||--|{ Message : "sends"
    Product ||--|{ Consultation : "about"
    Child ||--|{ Consultation : "for"
    Consultation ||--o| Booking : "converts to"
    
    Conversation {
        int id PK
        int parentId FK
        int tutorId FK
        int organizationId FK
        datetime lastMessageAt
        int parentUnreadCount
        int tutorUnreadCount
        enum status
    }
    
    Message {
        int id PK
        int conversationId FK
        int senderId FK
        string content
        enum type
        boolean isRead
        datetime readAt
        json attachments
    }
    
    Consultation {
        int id PK
        int conversationId FK
        int productId FK
        int childId FK
        datetime preferredDate
        string preferredTime
        enum status
        string notes
    }
```

**Key Points:**
- Conversation between Parent and Tutor/Organization
- Message tracking with read receipts
- Consultation is intermediate step before Booking
- Unread message counter for both sides

---

## 5. BOOKING & SCHEDULE SYSTEM

```mermaid
erDiagram
    User ||--|{ Booking : "parent books"
    Child ||--|{ Booking : "for"
    Product ||--|{ Booking : "books"
    Tutor ||--|{ Booking : "teaches"
    Organization ||--|{ Booking : "provides"
    Consultation ||--o| Booking : "converts to"
    Booking ||--|{ Schedule : "has sessions"
    Booking ||--o| Payment : "requires"
    Booking ||--o| Review : "gets"
    
    Tutor ||--|{ ScheduleSlot : "defines availability"
    Organization ||--|{ ScheduleSlot : "defines availability"
    
    Booking {
        int id PK
        string bookingCode UK
        int parentId FK
        int childId FK
        int productId FK
        int tutorId FK
        int organizationId FK
        int consultationId FK
        datetime scheduledDate
        string scheduledTime
        enum status
        decimal totalPrice
        enum locationType
    }
    
    Schedule {
        int id PK
        int bookingId FK
        datetime date
        string startTime
        string endTime
        enum status
    }
    
    ScheduleSlot {
        int id PK
        int tutorId FK
        int organizationId FK
        int dayOfWeek
        string startTime
        string endTime
        boolean isAvailable
    }
```

**Key Points:**
- Booking is main transaction between Parent and Tutor/Organization
- Each Booking can have multiple Schedule sessions (for courses)
- ScheduleSlot defines available time for Tutor/Organization
- Booking links to Consultation, Payment, and Review

---

## 6. PAYMENT & SUBSCRIPTION

```mermaid
erDiagram
    Tutor ||--|{ Subscription : "subscribes"
    Organization ||--|{ Subscription : "subscribes"
    SubscriptionPackage ||--|{ Subscription : "type"
    Subscription ||--|{ Payment : "payment for"
    Booking ||--o| Payment : "payment for"
    User ||--|{ Payment : "makes"
    
    SubscriptionPackage {
        int id PK
        string name
        decimal price
        int durationDays
        json features
        int maxProducts
        int maxBookings
        enum status
    }
    
    Subscription {
        int id PK
        int tutorId FK
        int organizationId FK
        int packageId FK
        datetime startDate
        datetime endDate
        enum status
        boolean autoRenew
    }
    
    Payment {
        int id PK
        int userId FK
        int bookingId FK
        int subscriptionId FK
        decimal amount
        enum method
        enum status
        string transactionId UK
        datetime paidAt
    }
```

**Key Points:**
- Payment serves two purposes: Booking payment and Subscription payment
- SubscriptionPackage defines features and limits
- Subscription for both Tutors and Organizations
- Auto-renewal support

---

## 7. CONTENT & REVIEW SYSTEM

```mermaid
erDiagram
    User ||--|{ Notification : "receives"
    User ||--|{ Review : "parent writes"
    Product ||--|{ Review : "gets"
    Tutor ||--|{ Review : "gets"
    Organization ||--|{ Review : "gets"
    Booking ||--o| Review : "results in"
    
    Banner {
        int id PK
        string title
        string imageUrl
        string linkUrl
        enum linkType
        enum position
        enum status
        datetime startDate
        datetime endDate
    }
    
    Notification {
        int id PK
        int userId FK
        string title
        string content
        enum type
        boolean isRead
        json data
        datetime sentAt
    }
    
    Review {
        int id PK
        int parentId FK
        int productId FK
        int tutorId FK
        int organizationId FK
        int bookingId FK
        int rating
        string content
        json images
        enum status
        string response
    }
```

**Key Points:**
- Banner for marketing and promotions
- Notification can be broadcast (userId = null) or targeted
- Review can be for Product, Tutor, or Organization
- Review moderation workflow with status

---

## 8. COMPLETE SYSTEM OVERVIEW

```mermaid
graph TB
    subgraph "User Management"
        User[User]
        Parent[Parent]
        Child[Child]
        Tutor[Tutor]
        Org[Organization]
        OrgMember[OrganizationMember]
    end
    
    subgraph "Product Management"
        Product[Product]
        Category[Category]
        ProductImage[ProductImage]
    end
    
    subgraph "Communication"
        Conversation[Conversation]
        Message[Message]
        Consultation[Consultation]
    end
    
    subgraph "Booking System"
        Booking[Booking]
        Schedule[Schedule]
        ScheduleSlot[ScheduleSlot]
    end
    
    subgraph "Payment System"
        Payment[Payment]
        Subscription[Subscription]
        Package[SubscriptionPackage]
    end
    
    subgraph "Content & Feedback"
        Banner[Banner]
        Notification[Notification]
        Review[Review]
    end
    
    User --> Parent
    User --> Tutor
    User --> OrgMember
    Parent --> Child
    OrgMember --> Org
    Tutor --> Org
    
    Tutor --> Product
    Org --> Product
    Product --> Category
    
    Parent --> Conversation
    Tutor --> Conversation
    Org --> Conversation
    Conversation --> Message
    Conversation --> Consultation
    
    Consultation --> Booking
    Parent --> Booking
    Child --> Booking
    Product --> Booking
    Booking --> Schedule
    Booking --> Payment
    Booking --> Review
    
    Tutor --> Subscription
    Org --> Subscription
    Package --> Subscription
    Subscription --> Payment
    
    User --> Notification
    User --> Review
```

---

## Database Statistics

### Tables by Module

| Module | Tables | Description |
|--------|--------|-------------|
| User Management | 6 | User, Parent, Child, Tutor, Organization, OrganizationMember |
| Product Management | 4 | Product, Category, ProductCategory, ProductImage |
| Communication | 3 | Conversation, Message, Consultation |
| Booking & Schedule | 3 | Booking, Schedule, ScheduleSlot |
| Payment & Subscription | 3 | Payment, Subscription, SubscriptionPackage |
| Content & Review | 3 | Banner, Notification, Review |
| **Total** | **22** | |

**Note:** No separate RBAC tables - using simple enums + boolean permission flags instead.

### Enums Count

| Category | Count | Examples |
|----------|-------|----------|
| User-related | 6 | UserRole, UserStatus, Gender, TutorStatus, etc. |
| Product-related | 3 | ProductType, ProductStatus, PriceUnit |
| Communication | 3 | ConversationStatus, MessageType, ConsultationStatus |
| Booking-related | 3 | BookingStatus, ScheduleStatus, LocationType |
| Content-related | 5 | BannerStatus, NotificationType, ReviewStatus, etc. |
| Payment-related | 5 | PaymentMethod, PaymentStatus, SubscriptionStatus, etc. |
| **Total** | **25** | |

---

## Key Relationships

### 1-to-1 Relationships
- `User` ↔ `Parent`
- `User` ↔ `Tutor`
- `User` ↔ `OrganizationMember`
- `Booking` ↔ `Payment`
- `Booking` ↔ `Review`
- `Consultation` ↔ `Booking`

### 1-to-Many Relationships
- `Parent` → `Child`
- `Organization` → `OrganizationMember`
- `Product` → `ProductImage`
- `Conversation` → `Message`
- `Booking` → `Schedule`
- `User` → `RoleAssignment`
- `Role` → `RoleAssignment`

### Many-to-Many Relationships
- `Product` ↔ `Category` (through `ProductCategory`)
- `Role` ↔ `Permission` (through `RolePermission`)

### Optional Relationships (nullable FK)
- `Product` → `Tutor` OR `Organization` (owner)
- `Booking` → `Tutor` OR `Organization` (provider)
- `Conversation` → `Tutor` OR `Organization` (participant)
- `RoleAssignment` → `Organization` (optional scope)

---

## Design Patterns

### 1. Polymorphic Associations
```
Product can belong to either:
- Tutor (tutorId)
- Organization (organizationId)

Booking can be provided by either:
- Tutor (tutorId)
- Organization (organizationId)

Payment can be for either:
- Booking (bookingId)
- Subscription (subscriptionId)
```

### 2. Single Table Inheritance (User)
```
User (base table)
├── Parent (extends User)
├── Tutor (extends User)
└── OrganizationMember (extends User)
```

### 3. Soft Delete Pattern
```
All main entities have deletedAt field:
- User
- Product
- Booking
- etc.
```

### 4. Audit Trail Pattern
```
All entities track:
- createdAt: When created
- updatedAt: When modified
- deletedAt: When soft deleted (nullable)
```

### 5. Status Machine Pattern
```
Entities with status workflows:
- TutorStatus: PENDING → UNDER_REVIEW → APPROVED/REJECTED
- BookingStatus: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
- PaymentStatus: PENDING → PROCESSING → COMPLETED/FAILED
```

### 6. RBAC Pattern
```
Role-Based Access Control:
- User → RoleAssignment → Role → RolePermission → Permission
- Support for global and organization-scoped permissions
- Temporary role assignments with expiration
- System roles protection
```

---

## Access Control Matrix (Simplified)

### System-Level (UserRole)

| Role | Scope | Data Access | Typical Actions |
|------|-------|-------------|-----------------|
| **KIGGLE_ADMIN** | GLOBAL | All data | Manage users, approve tutors/orgs, moderate content |
| **KIGGLE_STAFF** | GLOBAL | All data (read-only) | View reports, moderate reviews |
| **PARTNER_ADMIN** | ORGANIZATION | Own org data | Manage products, bookings, members, view reports |
| **PARTNER_STAFF** | ORGANIZATION | Own org data | Limited by permission flags |
| **TUTOR** | ORGANIZATION | Own org data | Manage own products, view assigned bookings |
| **PARENT** | USER | Public + own data | Book services, manage children, write reviews |

### Organization-Level (OrganizationMemberRole + Flags)

| Role | canManageProducts | canManageBookings | canManageMembers | canViewReports | Description |
|------|-------------------|-------------------|------------------|----------------|-------------|
| **ADMIN** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | Full access to organization |
| **STAFF (typical)** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | Can manage products/bookings |
| **STAFF (limited)** | ❌ No | ✅ Yes | ❌ No | ❌ No | Can only manage bookings |
| **STAFF (viewer)** | ❌ No | ❌ No | ❌ No | ✅ Yes | Read-only + reports |

**Note:** Permission flags are checked ONLY for STAFF role. ADMIN always has all permissions.

---

## Scaling Considerations

### Horizontal Partitioning (Sharding)
```
Potential sharding keys:
- User data: by userId or geographic region
- Booking data: by organizationId or date range
- Message data: by conversationId
- Analytics: by date (time-series data)
```

### Vertical Partitioning
```
Separate databases for:
1. Core Data (users, products, bookings)
2. Communication (conversations, messages)
3. Analytics & Logs
4. File Storage metadata
```

### Read Replicas
```
Master-Slave replication for:
- Product listings (read-heavy)
- Search queries
- Analytics dashboards
- Reporting
- Permission checks (cache frequently used)
```

### Caching Strategy
```
Redis cache for:
- User context (key: user:{userId}:context) - organizationId, permissions
- Product listings
- Category trees
- Conversation lists
- Unread counts
- Dashboard statistics
```

---

## Index Strategy

### Critical Indexes

**User Management:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role_status ON users(role, status);
```

**Organization Members:**
```sql
CREATE INDEX idx_organization_members_user ON organization_members(user_id);
CREATE INDEX idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX idx_organization_members_role ON organization_members(role);
```

**Products:**
```sql
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_featured ON products(is_featured, sort_order) WHERE status = 'ACTIVE';
```

**Bookings:**
```sql
CREATE INDEX idx_bookings_code ON bookings(booking_code);
CREATE INDEX idx_bookings_date_status ON bookings(scheduled_date, status);
CREATE INDEX idx_bookings_parent ON bookings(parent_id, status);
CREATE INDEX idx_bookings_tutor ON bookings(tutor_id, scheduled_date);
```

**Messages:**
```sql
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;
```

---

## Related Documentation

- [Database Design](./DATABASE_DESIGN.md) - Detailed schema documentation

---

**Last Updated**: 2025-11-25  
**Version**: 2.0  
**Author**: Backend Team
