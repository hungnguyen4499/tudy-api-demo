# API Request Flow Documentation

This document describes the complete request-response flow in the Tudy Platform API, from incoming HTTP request to final response.

## Overview

The API follows a layered architecture pattern with clear separation of concerns:

```
Request → Guards → Validation → Controller → Service → Repository → Prisma → Database
                                                                              ↓
Response ← Interceptor ← Result Wrapper ← Mapper ← Entity ← Prisma Model ← Data
```

## Complete Request Flow

### 1. **Request Reception** (`main.ts`)

When a request arrives at the NestJS application:

- **Middleware Stack** (applied in order):
  - `helmet()` - Security headers
  - `compression()` - Response compression
  - `cookieParser()` - Cookie parsing
  - CORS configuration

- **Global Prefix**: All routes are prefixed with `/api/v1`

### 2. **Authentication & Authorization** (Guards)

Before reaching the controller, requests pass through guards:

#### JWT Auth Guard (`JwtAuthGuard`)
- **Location**: `src/common/guards/jwt-auth.guard.ts`
- **Behavior**:
  - Checks for `@Public()` decorator - if present, skips authentication
  - Validates JWT token from `Authorization: Bearer <token>` header
  - Extracts user payload and attaches to `request.user`
  - Throws `UnauthorizedException` if token is invalid or missing

#### Roles Guard (`RolesGuard`)
- **Location**: `src/common/guards/roles.guard.ts`
- **Behavior**:
  - Checks for `@Roles()` decorator on route handler
  - Validates user has required role(s)
  - Throws `BusinessException` with `UNAUTHORIZED` or `INSUFFICIENT_PERMISSIONS` error codes

**Example**:
```typescript
@Get()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)  // Only admins can access
async findAll() { ... }
```

### 3. **Request Validation** (ValidationPipe)

- **Location**: Configured globally in `main.ts`
- **Configuration**:
  ```typescript
  new ValidationPipe({
    transform: true,              // Transform payloads to DTO instances
    whitelist: true,              // Strip non-whitelisted properties
    forbidNonWhitelisted: true,   // Throw error for unknown properties
    enableImplicitConversion: true // Auto-convert types
  })
  ```

- **Process**:
  1. Validates request body/query/params against DTO class decorators (`@IsEmail()`, `@IsString()`, etc.)
  2. Transforms plain objects to DTO class instances
  3. Throws `BadRequestException` with validation errors if invalid

**Example DTO**:
```typescript
export class LoginRequest {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  password: string;
}
```

### 4. **Controller Layer** (`*.controller.ts`)

- **Responsibilities**:
  - Route definition and HTTP method mapping
  - Parameter extraction (`@Body()`, `@Query()`, `@Param()`)
  - Type conversion (`ParseIntPipe` for IDs)
  - Delegates business logic to service layer

**Example**:
```typescript
@Get(':id')
async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponse> {
  return this.usersService.findOne(id);
}
```

### 5. **Service Layer** (`*.service.ts`)

- **Responsibilities**:
  - Business logic orchestration
  - Validation of business rules
  - Coordination between repositories and mappers
  - Throwing `BusinessException` for business errors

**Example Flow**:
```typescript
async findOne(id: number): Promise<UserResponse> {
  // 1. Fetch entity from repository
  const user = await this.usersRepository.findById(id);

  // 2. Business validation
  if (!user || user.isDeleted) {
    throw new BusinessException(ErrorCodes.USER_NOT_FOUND);
  }

  // 3. Map entity to DTO using mapper
  return this.userMapper.toResponse(user);
}
```

### 6. **Repository Layer** (`repositories/*.repository.ts`)

- **Responsibilities**:
  - Database access abstraction
  - Prisma query construction
  - Mapping Prisma models to domain entities
  - No business logic - pure data access

**Example**:
```typescript
async findById(id: number): Promise<User | null> {
  const user = await this.prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return null;
  }

  // Map Prisma model to domain entity
  return this.userMapper.toEntity(user);
}
```

### 7. **Prisma ORM** (`@prisma/client`)

- Executes actual database queries
- Returns Prisma model objects
- Handles connection pooling and transactions

### 8. **Database** (PostgreSQL)

- Stores and retrieves data
- Enforces constraints and relationships

### 9. **Mapper Layer** (`mappers/*.mapper.ts`)

- **Responsibilities**:
  - Converts Prisma models → Domain entities
  - Converts Domain entities → Response DTOs
  - Handles type conversions (e.g., Decimal → number)
  - Uses `class-transformer` for automatic mapping

**Example**:
```typescript
@Injectable()
export class UserMapper {
  // Prisma model → Domain entity
  toEntity(prismaUser: Prisma.UserGetPayload<{}>): User {
    const data = {
      ...prismaUser,
      lat: prismaUser.lat ? Number(prismaUser.lat) : undefined,
      lng: prismaUser.lng ? Number(prismaUser.lng) : undefined,
    };
    return plainToInstance(User, data);
  }

  // Domain entity → Response DTO
  toResponse(entity: User): UserResponse {
    return plainToInstance(UserResponse, entity);
  }
}
```

### 10. **Response Transformation** (TransformInterceptor)

- **Location**: `src/common/interceptors/transform.interceptor.ts`
- **Behavior**:
  - Intercepts all successful responses
  - Wraps response data in `Result<T>` format
  - If response is already a `Result`, returns as-is
  - Ensures consistent response structure

**Result Format**:
```typescript
{
  code: "SUCCESS",
  message: "Success",
  data: { ... }  // Your actual response data
}
```

### 11. **HTTP Response**

Final response sent to client with:
- Status code (200 for success)
- JSON body in `Result<T>` format

---

## Exception Handling Flow

The application uses a **three-tier exception filter system** to handle errors consistently:

### Exception Filter Order

Filters are registered in this order (most specific to most general):

1. **BusinessExceptionFilter** - Handles business logic errors
2. **HttpExceptionFilter** - Handles HTTP exceptions (validation, etc.)
3. **AllExceptionsFilter** - Catches all unhandled exceptions

### 1. BusinessExceptionFilter

**Location**: `src/common/filters/business-exception.filter.ts`

**Catches**: `BusinessException` instances

**Behavior**:
- Extracts error code and message from exception
- Uses HTTP status from error code definition
- Returns `Result.error(code, message)` format

**Example**:
```typescript
// In service
throw new BusinessException(ErrorCodes.USER_NOT_FOUND);

// Response
{
  code: "USER_NOT_FOUND",
  message: "User not found",
  data: null
}
// HTTP Status: 404 (from ErrorCodes.USER_NOT_FOUND.httpStatus)
```

### 2. HttpExceptionFilter

**Location**: `src/common/filters/http-exception.filter.ts`

**Catches**: `HttpException` instances (including validation errors)

**Behavior**:
- Handles validation errors (400 Bad Request)
  - Formats array of validation messages into single string
  - Returns `Result.errorMessage(message)` with `INTERNAL_SERVER_ERROR` code
- Handles other HTTP exceptions
  - Extracts message from exception
  - Returns `Result.errorMessage(message)` with `INTERNAL_SERVER_ERROR` code
  - Sets HTTP status to 500

**Example** (Validation Error):
```typescript
// Request with invalid email
POST /api/v1/auth/login
{ "email": "invalid-email", "password": "123" }

// Response
{
  code: "INTERNAL_SERVER_ERROR",
  message: "Invalid email format",
  data: null
}
// HTTP Status: 400
```

### 3. AllExceptionsFilter

**Location**: `src/common/filters/all-exceptions.filter.ts`

**Catches**: All unhandled exceptions (catch-all)

**Behavior**:
- Logs error details (message, stack trace, request info)
- Returns generic error response
- Always returns HTTP 500 status
- Uses `Result.errorMessage(message)` with `INTERNAL_SERVER_ERROR` code

**Example** (Unexpected Error):
```typescript
// Database connection error
// Response
{
  code: "INTERNAL_SERVER_ERROR",
  message: "Internal server error",
  data: null
}
// HTTP Status: 500
```

### Error Code System

**Location**: `src/common/constants/error-codes.constant.ts`

**Structure**:
```typescript
interface IErrorCode {
  code: string;        // Error code (e.g., "USER_NOT_FOUND")
  message: string;     // Human-readable message
  httpStatus: number;   // HTTP status code (e.g., 404)
}
```

**Usage**:
```typescript
// Define error
export const USER_NOT_FOUND: IErrorCode = {
  code: 'USER_NOT_FOUND',
  message: 'User not found',
  httpStatus: HttpStatus.NOT_FOUND,
};

// Throw error
throw new BusinessException(ErrorCodes.USER_NOT_FOUND);
```

---

## Complete Example Flow

### Example: GET /api/v1/users/:id

1. **Request arrives** → `GET /api/v1/users/123`

2. **JWT Auth Guard**:
   - Checks `Authorization` header
   - Validates token
   - Attaches user to `request.user`

3. **ValidationPipe**:
   - Converts `:id` param to number via `ParseIntPipe`
   - Validates it's a valid integer

4. **Controller** (`UsersController.findOne`):
   ```typescript
   async findOne(@Param('id', ParseIntPipe) id: number) {
     return this.usersService.findOne(id);
   }
   ```

5. **Service** (`UsersService.findOne`):
   ```typescript
   async findOne(id: number): Promise<UserResponse> {
     const user = await this.usersRepository.findById(id);
     if (!user || user.isDeleted) {
       throw new BusinessException(ErrorCodes.USER_NOT_FOUND);
     }
     return this.userMapper.toResponse(user);
   }
   ```

6. **Repository** (`UsersRepository.findById`):
   ```typescript
   async findById(id: number): Promise<User | null> {
     const user = await this.prisma.user.findUnique({ where: { id } });
     if (!user) return null;
     return this.userMapper.toEntity(user);
   }
   ```

7. **Prisma** → Executes SQL query → Returns Prisma model

8. **Mapper** (`UserMapper.toEntity`):
   - Converts Prisma model → User entity
   - Handles type conversions

9. **Service** → **Mapper** (`UserMapper.toResponse`):
   - Converts User entity → UserResponse DTO

10. **TransformInterceptor**:
    - Wraps `UserResponse` in `Result.success(data)`

11. **Response**:
    ```json
    {
      "code": "SUCCESS",
      "message": "Success",
      "data": {
        "id": 123,
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        ...
      }
    }
    ```
    HTTP Status: 200

### Error Example: User Not Found

If user doesn't exist, flow stops at step 5:

5. **Service** throws `BusinessException(ErrorCodes.USER_NOT_FOUND)`

6. **BusinessExceptionFilter** catches it:
    - Extracts code: `"USER_NOT_FOUND"`
    - Extracts message: `"User not found"`
    - Extracts httpStatus: `404`

7. **Response**:
    ```json
    {
      "code": "USER_NOT_FOUND",
      "message": "User not found",
      "data": null
    }
    ```
    HTTP Status: 404

---

## Key Design Principles

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Dependency Injection**: All dependencies injected via constructor
3. **Type Safety**: Full TypeScript typing throughout the stack
4. **Consistent Responses**: All responses wrapped in `Result<T>` format
5. **Centralized Error Handling**: All errors handled by exception filters
6. **Domain-Driven Design**: Entities represent business concepts, not database tables
7. **Repository Pattern**: Abstracts database access from business logic
8. **Mapper Pattern**: Handles conversions between layers

---

## Response Formats

### Success Response
```json
{
  "code": "SUCCESS",
  "message": "Success",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "code": "SUCCESS",
  "message": "Success",
  "data": {
    "items": [ ... ],
    "meta": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Error Response
```json
{
  "code": "ERROR_CODE",
  "message": "Error message",
  "data": null
}
```

