# Authentication Endpoints

## POST /auth/login

Login with email and password.

**Request:**
```json
{
  "email": "malolegoff@gmail.com",
  "password": "malo1997"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAyIiwiY2xpbmljX2lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwiZW1haWwiOiJtYWxvbGVnb2ZmQGdtYWlsLmNvbSIsInJvbGUiOiJWRVQiLCJleHAiOjE3MzkyMDAwMDB9.abc123",
  "user": {
    "id": "00000000-0000-0000-0000-000000000002",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "email": "malolegoff@gmail.com",
    "role": "VET",
    "first_name": "Malo",
    "last_name": "Le Goff",
    "created_at": "2024-02-05T10:00:00Z"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

---

## POST /auth/register

Register a new user using a clinic activation code.

**Request:**
```json
{
  "activation_code": "DEMO2024",
  "email": "newuser@clinic.com",
  "password": "securepassword123",
  "role": "ASV",
  "first_name": "Jean",
  "last_name": "Dupont"
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "email": "newuser@clinic.com",
    "role": "ASV",
    "first_name": "Jean",
    "last_name": "Dupont",
    "created_at": "2024-02-05T10:00:00Z"
  }
}
```

**Response (400 Bad Request - Invalid activation code):**
```json
{
  "error": "Invalid activation code"
}
```

**Response (409 Conflict):**
```json
{
  "error": "User already exists"
}
```

---

## GET /auth/me

Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "00000000-0000-0000-0000-000000000002",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "email": "malolegoff@gmail.com",
  "role": "VET",
  "first_name": "Malo",
  "last_name": "Le Goff",
  "created_at": "2024-02-05T10:00:00Z"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Authorization header required"
}
```
