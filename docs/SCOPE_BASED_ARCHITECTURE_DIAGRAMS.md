# Scope-Based Access Control - Architecture Diagrams

> Visual representation of the Scope-Based Access Control system

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Mobile[Mobile App]
        Web[Web Dashboard]
    end

    subgraph "API Gateway"
        NGINX[NGINX/Load Balancer]
    end

    subgraph "NestJS Application"
        subgraph "Security Layer"
            JWT[JWT Guard]
            Auth[JWT Strategy]
            Scope[ScopeContext Interceptor]
        end

        subgraph "Presentation Layer"
            Controllers[Controllers]
        end

        subgraph "Business Layer"
            Services[Services<br/>Clean Code<br/>No Auth Checks]
        end

        subgraph "Data Access Layer"
            Repos[Scoped Repositories<br/>Auto-filter by Scope]
            Prisma[Prisma Client]
        end
    end

    subgraph "Data Layer"
        Redis[(Redis<br/>Context Cache)]
        Postgres[(PostgreSQL<br/>Multi-tenant DB)]
    end

    Mobile --> NGINX
    Web --> NGINX
    NGINX --> JWT
    JWT --> Auth
    Auth --> Scope
    Scope --> Controllers
    Controllers --> Services
    Services --> Repos
    Repos --> Prisma
    Prisma --> Postgres
    Auth -.Cache.-> Redis
    Scope -.Cache.-> Redis
```

---

## 2. Request Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant JWTGuard
    participant JWTStrategy
    participant ScopeInterceptor
    participant Controller
    participant Service
    participant Repository
    participant Prisma
    participant DB

    Client->>JWTGuard: GET /api/products<br/>Authorization: Bearer <token>
    JWTGuard->>JWTStrategy: Validate JWT
    JWTStrategy->>DB: Load User + OrganizationMember
    DB-->>JWTStrategy: User {id, role, orgId}
    JWTStrategy-->>JWTGuard: Attach to request.user
    JWTGuard->>ScopeInterceptor: Continue
    ScopeInterceptor->>ScopeInterceptor: Initialize ScopeContext<br/>type: ORGANIZATION<br/>orgId: 5
    ScopeInterceptor->>Controller: Execute handler
    Controller->>Service: findAll()
    Service->>Repository: findAll()
    Repository->>Repository: Apply scope filter<br/>WHERE organizationId = 5
    Repository->>Prisma: findMany({ where })
    Prisma->>DB: SELECT * FROM products<br/>WHERE organization_id = 5
    DB-->>Prisma: Results
    Prisma-->>Repository: Products[]
    Repository-->>Service: Products[]
    Service-->>Controller: Products[]
    Controller-->>Client: 200 OK + JSON
```

---

## 3. Scope Resolution Flow

```mermaid
flowchart TD
    Start([Incoming Request]) --> HasUser{User<br/>Authenticated?}
    HasUser -->|No| Reject[401 Unauthorized]
    HasUser -->|Yes| CheckRole{User Role?}
    
    CheckRole -->|KIGGLE_ADMIN<br/>KIGGLE_STAFF| GlobalScope[Set GLOBAL Scope<br/>type: GLOBAL<br/>userId: X]
    CheckRole -->|PARTNER_ADMIN<br/>PARTNER_STAFF<br/>TUTOR| OrgScope[Set ORGANIZATION Scope<br/>type: ORGANIZATION<br/>userId: X<br/>organizationId: Y]
    CheckRole -->|PARENT| UserScope[Set USER Scope<br/>type: USER<br/>userId: X<br/>parentId: P]
    
    GlobalScope --> StoreContext[Store in ScopeContext<br/>Request-scoped service]
    OrgScope --> StoreContext
    UserScope --> StoreContext
    
    StoreContext --> Continue[Continue to Controller]
    Continue --> Repository[Repository reads ScopeContext]
    Repository --> ApplyFilter{Scope Type?}
    
    ApplyFilter -->|GLOBAL| NoFilter[No filter<br/>See everything]
    ApplyFilter -->|ORGANIZATION| OrgFilter[Add filter:<br/>WHERE organizationId = Y]
    ApplyFilter -->|USER| UserFilter[Add filter:<br/>Model-specific logic]
    
    NoFilter --> Query[Execute Prisma Query]
    OrgFilter --> Query
    UserFilter --> Query
    
    Query --> Results[Return scoped results]
```

---

## 4. Database Schema - Multi-Tenant Model

```mermaid
erDiagram
    Organization ||--o{ OrganizationMember : "has"
    Organization ||--o{ Tutor : "owns"
    Organization ||--o{ Product : "owns"
    Organization ||--o{ Booking : "receives"
    Organization ||--o{ Review : "receives"
    Organization ||--o{ Conversation : "participates"
    
    User ||--o| Parent : "is"
    User ||--o| Tutor : "is"
    User ||--o| OrganizationMember : "is"
    User ||--o{ Booking : "creates"
    User ||--o{ Review : "writes"
    
    Product ||--o{ Booking : "booked_as"
    Booking ||--o| Payment : "has"
    Booking ||--o| Review : "reviewed_by"
    
    Organization {
        int id PK
        enum type "INDIVIDUAL | COMPANY"
        string name
        string slug UK
        enum status
    }
    
    User {
        int id PK
        string email UK
        enum role
        enum status
    }
    
    Product {
        int id PK
        int organizationId FK "NOT NULL - CRITICAL"
        string name
        decimal price
        enum status
    }
    
    Booking {
        int id PK
        int parentId FK
        int productId FK
        int organizationId FK "NOT NULL - CRITICAL"
        int tutorId FK "Optional"
        enum status
        datetime scheduledDate
    }
    
    Tutor {
        int id PK
        int userId FK
        int organizationId FK "NOT NULL - CRITICAL"
        boolean isFreelance
        enum applicationStatus
    }
```

---

## 5. Scope Application Matrix

```mermaid
graph LR
    subgraph "Scope Type"
        Global[GLOBAL<br/>Platform Admin]
        Org[ORGANIZATION<br/>Partner/Tutor]
        User[USER<br/>Parent]
    end

    subgraph "Product Access"
        Global --> PA1[Read: ALL products]
        Global --> PA2[Write: ALL products]
        
        Org --> PB1[Read: Own org's products]
        Org --> PB2[Write: Own org's products]
        
        User --> PC1[Read: ACTIVE products all orgs]
        User --> PC2[Write: FORBIDDEN]
    end

    subgraph "Booking Access"
        Global --> BA1[Read: ALL bookings]
        Global --> BA2[Write: ALL bookings]
        
        Org --> BB1[Read: Own org's bookings]
        Org --> BB2[Write: Own org's bookings]
        
        User --> BC1[Read: Own bookings only]
        User --> BC2[Write: Own bookings only]
    end

    subgraph "Conversation Access"
        Global --> CA1[Read: ALL conversations]
        
        Org --> CB1[Read: Own org's conversations]
        
        User --> CC1[Read: Own conversations]
    end

    style Global fill:#ff6b6b
    style Org fill:#4ecdc4
    style User fill:#95e1d3
```

---

## 6. Repository Pattern Structure

```mermaid
classDiagram
    class BaseScopedRepository {
        <<abstract>>
        #prisma: PrismaService
        #scopeContext: ScopeContext
        +applyScopeFilter(where, operation)
        #applyModelScope(where, scope, operation)*
        #checkWritePermission(resourceId)*
    }

    class ProductsRepository {
        +findAll(filters)
        +findById(id)
        +create(data)
        +update(id, data)
        +delete(id)
        #applyModelScope(where, scope, operation)
    }

    class BookingsRepository {
        +findAll(filters)
        +findById(id)
        +create(data)
        +update(id, data)
        +assignTutor(bookingId, tutorId)
        #applyModelScope(where, scope, operation)
    }

    class ConversationsRepository {
        +findAll(filters)
        +findById(id)
        +create(data)
        +markAsRead(id)
        #applyModelScope(where, scope, operation)
    }

    class ReviewsRepository {
        +findAll(filters)
        +findById(id)
        +create(data)
        +respond(id, response)
        #applyModelScope(where, scope, operation)
    }

    BaseScopedRepository <|-- ProductsRepository
    BaseScopedRepository <|-- BookingsRepository
    BaseScopedRepository <|-- ConversationsRepository
    BaseScopedRepository <|-- ReviewsRepository

    class ScopeContext {
        <<request-scoped>>
        -_scope: QueryScope
        +initialize(user)
        +getScope()
        +isGlobal()
        +isOrganization()
        +isUser()
    }

    ProductsRepository ..> ScopeContext : uses
    BookingsRepository ..> ScopeContext : uses
    ConversationsRepository ..> ScopeContext : uses
    ReviewsRepository ..> ScopeContext : uses
```

---

## 7. Multi-Tenant Organization Model

```mermaid
graph TB
    subgraph "Platform (Kiggle)"
        Admin[Platform Admin<br/>Scope: GLOBAL]
    end

    subgraph "Organization Type: COMPANY"
        Partner1[Partner Organization A<br/>Education Center]
        P1Owner[Owner/Admin<br/>Scope: ORG A]
        P1Staff[Staff Members<br/>Scope: ORG A]
        P1Tutor1[Employed Tutor 1<br/>Scope: ORG A]
        P1Tutor2[Employed Tutor 2<br/>Scope: ORG A]
        
        Partner1 --> P1Owner
        Partner1 --> P1Staff
        Partner1 --> P1Tutor1
        Partner1 --> P1Tutor2
    end

    subgraph "Organization Type: INDIVIDUAL"
        Freelance1[Freelance Organization 1<br/>Single Tutor]
        F1Tutor[Freelance Tutor<br/>Owner + Tutor<br/>Scope: ORG F1]
        
        Freelance1 --> F1Tutor
    end

    subgraph "Customers"
        Parent1[Parent 1<br/>Scope: USER]
        Parent2[Parent 2<br/>Scope: USER]
    end

    Admin -.Manages.-> Partner1
    Admin -.Manages.-> Freelance1
    
    Parent1 -.Books.-> Partner1
    Parent1 -.Books.-> Freelance1
    Parent2 -.Books.-> Partner1

    style Admin fill:#ff6b6b
    style P1Owner fill:#4ecdc4
    style P1Staff fill:#4ecdc4
    style P1Tutor1 fill:#4ecdc4
    style P1Tutor2 fill:#4ecdc4
    style F1Tutor fill:#4ecdc4
    style Parent1 fill:#95e1d3
    style Parent2 fill:#95e1d3
```

---

## 8. Performance Optimization Strategy

```mermaid
graph TD
    Request[Incoming Request] --> Cache{Check Redis Cache}
    Cache -->|HIT| FastPath[Return Cached Context<br/>~1ms]
    Cache -->|MISS| LoadDB[Load from Database<br/>~10ms]
    
    LoadDB --> StoreCache[Store in Redis<br/>TTL: 5 minutes]
    StoreCache --> UseContext[Use Context]
    FastPath --> UseContext
    
    UseContext --> QueryDB[Query Database<br/>with Scope Filter]
    QueryDB --> IndexCheck{Using Index?}
    
    IndexCheck -->|YES| FastQuery[Index Scan<br/>~5-20ms]
    IndexCheck -->|NO| SlowQuery[Sequential Scan<br/>~100-500ms<br/>⚠️ PROBLEM]
    
    FastQuery --> Result[Return Results]
    SlowQuery --> Alert[Alert: Add Index!]
    Alert --> Result

    style FastPath fill:#51cf66
    style FastQuery fill:#51cf66
    style SlowQuery fill:#ff6b6b
    style Alert fill:#ff6b6b
```

---

## 9. Security Layers

```mermaid
graph TB
    subgraph "Layer 1: Network"
        SSL[HTTPS/TLS<br/>Encrypted Transport]
        CORS[CORS Policy<br/>Origin Restrictions]
        RateLimit[Rate Limiting<br/>Per Organization]
    end

    subgraph "Layer 2: Authentication"
        JWT[JWT Validation<br/>Signature + Expiry]
        UserStatus[User Status Check<br/>ACTIVE only]
        RefreshToken[Refresh Token<br/>Rotation]
    end

    subgraph "Layer 3: Authorization"
        ScopeInit[Scope Initialization<br/>Based on Role]
        ScopeCheck[Scope Context<br/>Request-scoped]
    end

    subgraph "Layer 4: Data Access"
        RepoFilter[Repository Filter<br/>Auto-inject WHERE clause]
        IndexedQuery[Indexed Queries<br/>Performance + Security]
    end

    subgraph "Layer 5: Database"
        ForeignKey[Foreign Key Constraints<br/>Referential Integrity]
        NotNull[NOT NULL Constraints<br/>Required ownership]
        Unique[Unique Constraints<br/>Prevent duplicates]
    end

    SSL --> JWT
    CORS --> JWT
    RateLimit --> JWT
    
    JWT --> ScopeInit
    UserStatus --> ScopeInit
    RefreshToken --> ScopeInit
    
    ScopeInit --> RepoFilter
    ScopeCheck --> RepoFilter
    
    RepoFilter --> ForeignKey
    IndexedQuery --> ForeignKey
    
    ForeignKey --> DB[(Database)]
    NotNull --> DB
    Unique --> DB

    style SSL fill:#12b886
    style JWT fill:#12b886
    style ScopeInit fill:#12b886
    style RepoFilter fill:#12b886
    style ForeignKey fill:#12b886
```

---

## 10. Deployment Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[NGINX<br/>SSL Termination<br/>Load Balancing]
    end

    subgraph "Application Tier - Auto Scaling"
        API1[NestJS Instance 1<br/>Port 3000]
        API2[NestJS Instance 2<br/>Port 3000]
        API3[NestJS Instance 3<br/>Port 3000]
    end

    subgraph "Caching Layer"
        Redis1[(Redis Primary<br/>Context Cache<br/>Session Store)]
        Redis2[(Redis Replica<br/>Read-only)]
    end

    subgraph "Database Tier"
        PG_Primary[(PostgreSQL Primary<br/>Read + Write)]
        PG_Replica1[(PostgreSQL Replica 1<br/>Read-only)]
        PG_Replica2[(PostgreSQL Replica 2<br/>Read-only)]
    end

    subgraph "Monitoring"
        Prometheus[Prometheus<br/>Metrics]
        Grafana[Grafana<br/>Dashboards]
        Sentry[Sentry<br/>Error Tracking]
    end

    LB --> API1
    LB --> API2
    LB --> API3

    API1 --> Redis1
    API2 --> Redis1
    API3 --> Redis1
    
    Redis1 -.Replication.-> Redis2

    API1 --> PG_Primary
    API2 --> PG_Primary
    API3 --> PG_Primary
    
    API1 -.Read-only.-> PG_Replica1
    API2 -.Read-only.-> PG_Replica1
    API3 -.Read-only.-> PG_Replica2
    
    PG_Primary -.Replication.-> PG_Replica1
    PG_Primary -.Replication.-> PG_Replica2

    API1 -.Metrics.-> Prometheus
    API2 -.Metrics.-> Prometheus
    API3 -.Metrics.-> Prometheus
    
    Prometheus --> Grafana
    
    API1 -.Errors.-> Sentry
    API2 -.Errors.-> Sentry
    API3 -.Errors.-> Sentry

    style LB fill:#339af0
    style Redis1 fill:#ff6b6b
    style PG_Primary fill:#51cf66
```

---

## 11. Code Organization

```
src/
├── 🔐 common/                           # Shared utilities
│   ├── services/
│   │   ├── scope-context.service.ts     # ⭐ Core: Request-scoped context
│   │   └── user-context.service.ts      # User data caching
│   ├── repositories/
│   │   └── base-scoped.repository.ts    # ⭐ Core: Base repository
│   ├── interceptors/
│   │   └── scope-context.interceptor.ts # ⭐ Initialize scope
│   └── guards/
│       └── jwt-auth.guard.ts            # JWT validation
│
├── 📦 modules/                          # Feature modules
│   ├── products/
│   │   ├── repositories/
│   │   │   └── products.repository.ts   # Extends BaseScopedRepository
│   │   ├── products.service.ts          # ✅ Clean business logic
│   │   └── products.controller.ts       # HTTP handlers
│   │
│   ├── bookings/
│   │   ├── repositories/
│   │   │   └── bookings.repository.ts
│   │   ├── bookings.service.ts
│   │   └── bookings.controller.ts
│   │
│   └── auth/
│       ├── strategies/
│       │   └── jwt.strategy.ts          # Load user + org context
│       └── auth.service.ts
│
└── 🏗️ infrastructure/                   # External services
    ├── db/
    │   ├── prisma.service.ts
    │   └── prisma-scoped.extension.ts   # Optional: Prisma middleware
    └── cache/
        └── redis.service.ts             # Context caching

Legend:
⭐ = Core scope-based access control components
✅ = Benefits from automatic scope filtering
🔐 = Security layer
📦 = Business logic layer
🏗️ = Infrastructure layer
```

---

## 12. Migration Timeline

```mermaid
gantt
    title Scope-Based Access Control Implementation
    dateFormat  YYYY-MM-DD
    section Phase 1: Database
    Add Organization.type column           :done, db1, 2025-11-25, 1d
    Create INDIVIDUAL organizations        :done, db2, after db1, 1d
    Add Tutor.organizationId              :done, db3, after db2, 1d
    Link tutors to organizations          :done, db4, after db3, 1d
    Add database indexes                   :done, db5, after db4, 1d
    
    section Phase 2: Core Implementation
    Implement ScopeContext service         :active, code1, 2025-11-26, 3d
    Implement BaseScopedRepository         :code2, after code1, 2d
    Create concrete repositories           :code3, after code2, 3d
    Update JWT strategy                    :code4, after code3, 2d
    
    section Phase 3: Service Migration
    Refactor ProductsService               :migrate1, after code4, 2d
    Refactor BookingsService               :migrate2, after migrate1, 2d
    Refactor other services                :migrate3, after migrate2, 3d
    
    section Phase 4: Testing
    Unit tests                             :test1, after migrate3, 3d
    Integration tests                      :test2, after test1, 2d
    Performance tests                      :test3, after test2, 2d
    
    section Phase 5: Deployment
    Deploy to staging                      :deploy1, after test3, 1d
    Monitor and fix issues                 :deploy2, after deploy1, 3d
    Production rollout                     :deploy3, after deploy2, 1d
    
    section Documentation
    Technical documentation                :crit, docs1, 2025-11-25, 2d
    API documentation                      :docs2, after docs1, 2d
    Team training                          :docs3, after deploy3, 1d
```

---

**End of Diagrams Document**

