# Swagger API Documentation Guide

## Overview

KhetConnect API is fully documented using **Swagger/OpenAPI 3.0** specification. The interactive API documentation provides a beautiful UI where you can explore all endpoints, test them, and view detailed request/response schemas.

## Accessing Swagger UI

### Development Environment
```
http://localhost:8080/api/v1/swagger-ui.html
```

### Production Environment
```
https://api.khetconnect.com/api/v1/swagger-ui.html
```

## API Documentation

### OpenAPI JSON Specification
```
Development:  http://localhost:8080/v3/api-docs
Production:   https://api.khetconnect.com/v3/api-docs
```

## API Endpoints Overview

### 1. Authentication (`/api/v1/auth`)
User registration, login, password reset, and profile management.

#### Key Endpoints:
- `POST /register` - Create new user account
- `POST /login` - Authenticate and get JWT token
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Complete password reset
- `POST /change-password` - Change password (authenticated)
- `POST /fcm-token` - Update Firebase Cloud Messaging token
- `PUT /location` - Update user geolocation
- `GET /me` - Get current user profile
- `PUT /profile` - Update profile information
- `POST /refresh` - Refresh JWT token
- `POST /logout` - Logout and invalidate token

### 2. Jobs (`/api/v1/jobs`)
Job posting, searching, and management.

#### Key Endpoints:
- `POST /` - Create new job (FARMER only)
- `GET /nearby` - Search nearby jobs (LABOURER only)
- `GET /my-posts` - Get farmer's posted jobs (FARMER only)
- `GET /{id}` - Get job details
- `POST /{id}/apply` - Apply to job (LABOURER only)
- `PUT /{id}/accept/{labourerId}` - Accept labourer (FARMER only)
- `PUT /{id}/reject/{labourerId}` - Reject labourer (FARMER only)
- `PUT /{id}/complete` - Mark job completed (FARMER only)
- `PUT /{id}/cancel` - Cancel job (FARMER only)
- `PUT /{id}/withdraw` - Withdraw from accepted job (LABOURER only)
- `GET /{id}/applicants` - Get job applicants (FARMER only)

### 3. Ratings & Users (`/api/v1/ratings` and `/api/v1/users`)
User ratings and profile management.

#### Key Endpoints:
- `POST /ratings` - Submit rating for labourer (FARMER only)
- `GET /users/{id}/ratings` - Get labourer ratings
- `GET /ratings/given` - Get ratings submitted by current user
- `GET /users/{id}/profile` - Get user profile

### 4. Notifications (`/api/v1/notifications`)
User notifications management.

#### Key Endpoints:
- `GET /` - Get all notifications
- `PUT /read` - Mark all notifications as read

### 5. History (`/api/v1/history`)
User work history.

#### Key Endpoints:
- `GET /farmer` - Get farmer's job history (FARMER only)
- `GET /labourer` - Get labourer's work history (LABOURER only)

## Authentication

The API uses **JWT (JSON Web Token)** authentication. 

### How to Authenticate:

1. **Login** using `/auth/login` endpoint
   ```json
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

2. **Receive JWT Token**
   ```json
   {
     "data": {
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "refreshToken": "...",
       "expiresIn": 3600
     }
   }
   ```

3. **Use Token in Requests**
   - In Swagger UI: Click the **Authorization** button (lock icon) in top-right corner
   - Enter: `Bearer <your-jwt-token>`
   - All subsequent requests will include the token

4. **Refresh Token** when expired
   - Use `/auth/refresh` endpoint with refresh token
   - Get new access token

### Token Details:
- **Type**: Bearer JWT
- **Format**: `Authorization: Bearer <token>`
- **Expiration**: Configurable (default 1 hour)
- **Refresh Token**: Long-lived token for getting new access tokens

## Testing Endpoints in Swagger UI

### Step 1: Login
1. Navigate to **Authentication** section
2. Find `POST /auth/login`
3. Click "Try it out"
4. Enter your credentials:
   ```json
   {
     "email": "farmer@example.com",
     "password": "password123"
   }
   ```
5. Click "Execute"
6. Copy the JWT token from response

### Step 2: Authorize Swagger UI
1. Click the **Authorization** button (🔒 lock icon) at top-right
2. Select "Bearer"
3. Paste your JWT token
4. Click "Authorize"
5. Click "Close"

### Step 3: Test Protected Endpoints
1. Navigate to **Jobs** section
2. Find `GET /nearby` (search jobs)
3. Click "Try it out"
4. Enter parameters:
   - `lat`: 17.3850
   - `lng`: 78.4867
   - `pageSize`: 20
5. Click "Execute"
6. View the response

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "timestamp": "2024-08-16T12:30:45.123Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "fieldName": "Validation error details"
  },
  "timestamp": "2024-08-16T12:30:45.123Z"
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Successful request |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Missing or invalid JWT token |
| 403 | Forbidden - Insufficient permissions (wrong role) |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Rate Limiting

The API enforces rate limits to prevent abuse:

- **Authentication Endpoints**: 20 requests per minute
  - `/auth/login`
  - `/auth/register`
  - `/auth/forgot-password`
  - `/auth/reset-password`
  - `/auth/refresh`

- **General Endpoints**: 250 requests per minute
  - All other endpoints

### Rate Limit Headers:
```
X-RateLimit-Limit: 250
X-RateLimit-Remaining: 249
Retry-After: 60
```

When rate limit is exceeded, you'll receive a 429 status code with:
```json
{
  "success": false,
  "message": "Too many requests from this IP address"
}
```

## Example Workflows

### Workflow 1: Farmer Posting a Job

```
1. POST /api/v1/auth/login
   → Get JWT token

2. POST /api/v1/jobs
   → Post new agricultural job

3. PUT /api/v1/location
   → Update farmer's location

4. GET /api/v1/jobs/{id}/applicants
   → View applications from labourers

5. PUT /api/v1/jobs/{id}/accept/{labourerId}
   → Accept a labourer

6. PUT /api/v1/jobs/{id}/complete
   → Mark job as complete

7. POST /api/v1/ratings
   → Rate the labourer
```

### Workflow 2: Labourer Finding and Taking a Job

```
1. POST /api/v1/auth/login
   → Get JWT token

2. PUT /api/v1/location
   → Update labourer's location

3. GET /api/v1/jobs/nearby
   → Search jobs within 5km radius

4. GET /api/v1/jobs/{id}
   → View job details

5. POST /api/v1/jobs/{id}/apply
   → Apply to the job

6. Wait for farmer to accept... (notifications)
   → GET /api/v1/notifications

7. PUT /api/v1/jobs/{id}/withdraw
   → Withdraw if needed

8. GET /api/v1/history/labourer
   → View work history
```

## SDK / API Clients

### Using cURL
```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Search nearby jobs (requires JWT token)
curl -X GET "http://localhost:8080/api/v1/jobs/nearby?lat=17.3850&lng=78.4867" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Using JavaScript/Fetch API
```javascript
// Login
const loginResponse = await fetch('http://localhost:8080/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});

const { data: { token } } = await loginResponse.json();

// Search jobs
const jobsResponse = await fetch(
  'http://localhost:8080/api/v1/jobs/nearby?lat=17.3850&lng=78.4867',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const jobsData = await jobsResponse.json();
```

### Using Postman

1. **Import OpenAPI Spec**
   - Click "Import"
   - Enter: `http://localhost:8080/v3/api-docs`

2. **Create Environment Variables**
   - Create variable `jwt_token` for storing JWT
   - Create variable `base_url` for API base URL

3. **Setup Pre-request Script** (for auth endpoints)
   ```javascript
   // Auto-refresh token before each request
   ```

4. **Test Endpoints**
   - Use variables: `{{base_url}}/api/v1/jobs`
   - Auth header: `Authorization: Bearer {{jwt_token}}`

## Troubleshooting

### Issue: 401 Unauthorized
**Cause**: Missing or invalid JWT token
**Solution**:
1. Verify token is included in Authorization header
2. Token format must be: `Bearer <token>`
3. Token may have expired - use refresh endpoint
4. Check token expiration time in response

### Issue: 403 Forbidden
**Cause**: Insufficient permissions (wrong role)
**Solution**:
1. FARMER endpoints: User must have FARMER role
2. LABOURER endpoints: User must have LABOURER role
3. Check user role in `/auth/me` response
4. Some endpoints (like `/jobs/{id}`) allow both roles

### Issue: 429 Too Many Requests
**Cause**: Rate limit exceeded
**Solution**:
1. Check `Retry-After` header for wait time
2. Auth endpoints: Max 20 req/min
3. Other endpoints: Max 250 req/min
4. Implement exponential backoff in client

### Issue: Validation Errors (400 Bad Request)
**Cause**: Invalid input parameters
**Solution**:
1. Check error details in response
2. Verify required fields are included
3. Check data types (lat/lng are decimal numbers)
4. Ratings must be 1-5
5. Email format must be valid

## Performance Tips

1. **Minimize Requests**
   - Get job details instead of listing all
   - Use cursor-based pagination

2. **Cache Results**
   - Cache user profile data
   - Cache job search results

3. **Handle Pagination**
   - Use cursor-based pagination for job lists
   - Set appropriate page sizes (20-50)

4. **Geolocation Optimization**
   - Update location only when changed significantly
   - Use device location instead of fixed coordinates

5. **Error Handling**
   - Implement retry logic with exponential backoff
   - Handle network timeouts gracefully

## API Versioning

- **Current Version**: v1 (`/api/v1/...`)
- **Base URL**: `https://api.khetconnect.com`
- **Documentation**: Auto-generated from code annotations

## Additional Resources

- **GitHub Repository**: https://github.com/khetconnect/backend
- **API Status**: https://status.khetconnect.com
- **Support Email**: support@khetconnect.com
- **Documentation**: https://docs.khetconnect.com

---

**Last Updated**: 2024-08-16  
**Version**: 1.0.0  
**Status**: Production Ready
