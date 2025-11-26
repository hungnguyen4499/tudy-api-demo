# Data Scope Context - Multi-Tenant Data Access Control

## Overview

`DataScopeContext` is a **request-scoped service** that manages data access scope for multi-tenant isolation. It works alongside RBAC to provide a complete access control solution.

| Component | Question Answered | Example |
|-----------|-------------------|---------|
| **RBAC** (PermissionsGuard) | "Can user DO this action?" | Can user create a product? |
| **DataScopeContext** | "What DATA can user access?" | Which products can user see? |

---

## Architecture

```
Request
   │
   ▼
┌─────────────────┐
│  JwtAuthGuard   │ ─── Validates JWT token
│                 │     Attaches user to request
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ DataScopeInterceptor│ ─── Loads UserContext (Redis cached)
│                 │     Initializes DataScopeContext
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│PermissionsGuard │ ─── RBAC: Checks permissions
│ (optional)      │     e.g., @RequirePermission('product.create')
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Controller    │
│   Service       │
│   Repository    │ ─── Uses dataScopeContext.getOrganizationFilter()
└─────────────────┘
```

---

## Scope Types

| Data Scope | Roles | Data Access |
|------------|-------|-------------|
| `GLOBAL` | KIGGLE_ADMIN, KIGGLE_STAFF | All data, no filters |
| `ORGANIZATION` | PARTNER_ADMIN, PARTNER_STAFF, TUTOR | Only organization's data |
| `USER` | PARENT | Only own data (bookings, children) |

---

## Understanding `dataScope` Field

The `Role` model has a **`dataScope`** field that determines what data users with this role can access:

### `dataScope` (ScopeType: GLOBAL | ORGANIZATION | USER)

**Question:** "What data can users with this role access?"

| Value | Meaning | Example |
|-------|---------|---------|
| `GLOBAL` | Can access all data from all organizations | KIGGLE_ADMIN sees everything |
| `ORGANIZATION` | Can only access data from their organization | PARTNER_ADMIN sees only org's products |
| `USER` | Can only access their own data | PARENT sees only their bookings |

**Usage:** Controls **data access** - determines what data DataScopeContext filters.

### Example: PARTNER_ADMIN Role

```typescript
{
  name: 'partner_admin',
  dataScope: 'ORGANIZATION', // ⬅️ Can only see org's data
}
```

**Note:** In the current design:
- Data access scope is determined **only** by `Role.dataScope` (GLOBAL / ORGANIZATION / USER)
- Organization membership is modeled via `OrganizationMember` (one org per user)
- Role assignments are stored in `UserRole` (no `organizationId` field)

`DataScopeContext` combines:
- `Role.dataScope` (what data can be accessed)
- `OrganizationMember.organizationId` (which organization's data)

---

## API Reference

### Properties

```typescript
// Check data scope type
dataScopeContext.type          // DataScopeType.GLOBAL | ORGANIZATION | USER
dataScopeContext.isGlobal      // boolean
dataScopeContext.isOrganizationScoped  // boolean
dataScopeContext.isUserScoped  // boolean

// User info
dataScopeContext.userId        // number
dataScopeContext.organizationId // number | null
dataScopeContext.tutorId       // number | null
dataScopeContext.role          // string
dataScopeContext.permissions   // string[]
```

### Methods

```typescript
// Apply automatic filter based on data scope
dataScopeContext.applyFilter(baseFilter)

// Get specific filters (explicit)
dataScopeContext.getOrganizationFilter() // { organizationId?: number }
dataScopeContext.getUserFilter()         // { userId?: number }
dataScopeContext.getParentFilter()       // { parentId?: number }

// Access checks
dataScopeContext.canAccessOrganization(orgId)  // boolean
dataScopeContext.canAccessResource(resource)   // boolean
```

---

## Usage Examples

### 1. Basic Repository Usage

```typescript
@Injectable()
export class ProductsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeContext: DataScopeContext,
  ) {}

  // List products - automatically filtered by organization
  async findAll(filter: any = {}) {
    return this.prisma.product.findMany({
      where: {
        ...filter,
        ...this.dataScopeContext.getOrganizationFilter(),
      },
    });
  }

  // Create product - inject organizationId
  async create(data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...data,
        organizationId: this.dataScopeContext.organizationId!,
      },
    });
  }
}
```

### 2. Access Check Before Update/Delete

```typescript
async findById(id: number) {
  const product = await this.prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new NotFoundException('Product not found');
  }

  // Check if user can access this resource
  if (!this.dataScopeContext.canAccessResource(product)) {
    throw new ForbiddenException('Access denied');
  }

  return product;
}
```

### 3. Parent's Own Data (Bookings, Children)

```typescript
@Injectable()
export class BookingsRepository {
  async findAll() {
    // Parents see only their bookings
    // Admins see all, Partners see org bookings
    return this.prisma.booking.findMany({
      where: this.dataScopeContext.applyFilter(),
    });
  }

  async findMyBookings() {
    // Explicitly get parent's own bookings
    return this.prisma.booking.findMany({
      where: this.dataScopeContext.getParentFilter(),
    });
  }
}
```

### 4. Combined with RBAC

```typescript
@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Post()
  @RequirePermission('product.create') // RBAC check
  create(@Body() dto: CreateProductDto) {
    // DataScopeContext is already initialized
    // Repository will auto-inject organizationId
    return this.service.create(dto);
  }

  @Delete(':id')
  @RequirePermission('product.delete') // RBAC check
  delete(@Param('id') id: number) {
    // Repository will check canAccessResource
    return this.service.delete(id);
  }
}
```

### 5. Conditional Logic Based on Scope

```typescript
async findProducts(query: ProductsQueryDto) {
  if (this.dataScopeContext.isGlobal) {
    // Admin: can see all, including draft products
    return this.prisma.product.findMany({ where: query });
  }

  if (this.dataScopeContext.isOrganizationScoped) {
    // Partner: see only org's products
    return this.prisma.product.findMany({
      where: {
        ...query,
        organizationId: this.dataScopeContext.organizationId,
      },
    });
  }

  // Parent: see only active products (marketplace view)
  return this.prisma.product.findMany({
    where: {
      ...query,
      status: 'ACTIVE',
    },
  });
}
```

---

## Which Modules Need DataScopeContext?

### ✅ NEEDS DataScopeContext (Multi-tenant data)

| Module | Reason |
|--------|--------|
| **Products** | Filter by organizationId |
| **Bookings** | Filter by organizationId or parentId |
| **Reviews** | Filter by organizationId or parentId |
| **Conversations** | Filter by organizationId or parentId |
| **Schedules** | Filter by organizationId or tutorId |
| **Children** | Filter by parentId |
| **Notifications** | Filter by userId |
| **Reports** | Filter by organizationId |

### ❌ DOES NOT NEED DataScopeContext

| Module | Reason |
|--------|--------|
| **Auth** | Registration/login - no scope needed |
| **System (Roles/Permissions/Menus)** | Admin-only, RBAC is sufficient |
| **Users** | User management is admin-only |
| **Files** | Generic file upload, no tenant data |
| **Categories** | Public/shared data |
| **Banners** | Public/shared data |
| **Settings** | System settings, admin-only |

---

## Performance Analysis

### Per-Request Overhead

| Step                               | Time | Cached? |
|------------------------------------|------|---------|
| DataScopeInterceptor instantiation | ~0.1ms | No (request-scoped) |
| UserContextService.loadContext()   | ~1-5ms | **Yes (Redis, 5 min TTL)** |
| DataScopeContext.initialize()      | ~0.01ms | N/A |
| **Total (cache hit)**              | **~1-2ms** | - |
| **Total (cache miss)**             | **~10-30ms** | - |

### Memory Footprint

```
DataScopeContext instance: ~1 KB per request
UserContext data: ~2-5 KB (permissions, menuCodes)
```

### Benchmark Comparison

| Scenario | Without DataScopeContext | With DataScopeContext | Overhead |
|----------|---------------------|-------------------|----------|
| GET /products (list) | 15ms | 17ms | +2ms (+13%) |
| POST /products (create) | 20ms | 22ms | +2ms (+10%) |
| Complex query | 50ms | 52ms | +2ms (+4%) |

### Conclusion

**Overhead is negligible** (~2ms per request) because:
1. Redis caching reduces DB queries
2. Simple object initialization (no heavy computation)
3. No interceptor for public routes (@Public)

---

## Best Practices

### 1. Always Use Explicit Filters

```typescript
// ✅ Good - explicit and clear
where: {
  ...this.scopeContext.getOrganizationFilter(),
  status: 'ACTIVE',
}

// ❌ Avoid - applyFilter() may not fit all models
where: this.scopeContext.applyFilter({ status: 'ACTIVE' })
```

### 2. Check Access for Single Resource

```typescript
// ✅ Always check before update/delete
const product = await this.findById(id);
if (!this.scopeContext.canAccessResource(product)) {
  throw new ForbiddenException();
}
```

### 3. Don't Use in Public Routes

```typescript
@Controller('products')
export class ProductsController {
  @Get()
  @Public() // No auth, no ScopeContext
  findAllPublic() {
    // Don't use scopeContext here!
    return this.service.findAllActive();
  }
}
```

### 4. Handle Marketplace View (Parents)

```typescript
// Parents can see ALL active products (marketplace)
async findMarketplaceProducts() {
  // Don't filter by organization for marketplace
  return this.prisma.product.findMany({
    where: { status: 'ACTIVE' },
  });
}

// Parents see only THEIR bookings
async findMyBookings() {
  return this.prisma.booking.findMany({
    where: this.scopeContext.getParentFilter(),
  });
}
```

---

## Troubleshooting

### Error: "DataScopeContext not initialized"

**Cause:** Route is missing authentication or marked @Public

**Fix:**
```typescript
// Ensure route has JwtAuthGuard
@UseGuards(JwtAuthGuard)
@Get('protected')
getProtected() { ... }

// Or check if initialized before use
if (this.dataScopeContext.isInitialized) {
  return this.dataScopeContext.getOrganizationFilter();
}
return {};
```

### DataScopeContext returns wrong organizationId

**Cause:** User's organization membership changed but cache not invalidated

**Fix:**
```typescript
// Invalidate cache when membership changes
await this.userContextService.invalidateContext(userId);
```

---

## Files Reference

```
src/common/
├── services/
│   ├── data-scope-context.service.ts   # Main DataScopeContext class
│   └── user-context.service.ts    # Loads/caches user permissions
├── interceptors/
│   └── data-scope.interceptor.ts  # Initializes DataScopeContext per request
```

---

## Related Documentation

- [Hybrid Access Control](./HYBRID_ACCESS_CONTROL.md) - RBAC + Scope combined
- [Database Design](./DATABASE_DESIGN.md) - Multi-tenant schema
- [API Flow](./API_FLOW.md) - Request lifecycle


