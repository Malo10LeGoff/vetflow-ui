# Users Endpoints

All endpoints require authentication via Bearer token.

## GET /users

List users for the clinic with pagination.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Search term (matches email, first name, or last name) |
| `page` | int | No | 1 | Page number |
| `page_size` | int | No | 20 | Items per page (max 100) |

**Examples:**
- `GET /users` - returns first 20 users
- `GET /users?search=malo` - search users by name/email
- `GET /users?page=2&page_size=10` - paginated results

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "00000000-0000-0000-0000-000000000002",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "email": "malolegoff@gmail.com",
      "role": "VET",
      "first_name": "Malo",
      "last_name": "Le Goff",
      "created_at": "2024-02-05T10:00:00Z"
    },
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "email": "jean.dupont@clinic.com",
      "role": "ASV",
      "first_name": "Jean",
      "last_name": "Dupont",
      "created_at": "2024-02-06T14:30:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "page_size": 20
}
```

---

## GET /users/:id

Get a specific user by ID.

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

**Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Access denied"
}
```

---

## PUT /users/:id

Update a user.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "email": "malo.legoff@newclinic.com",
  "role": "ADMIN",
  "first_name": "Malo",
  "last_name": "Le Goff"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `role` | string | Yes | User role: `VET`, `ASV`, or `ADMIN` |
| `first_name` | string | Yes | User's first name |
| `last_name` | string | Yes | User's last name |

**Response (200 OK):**
```json
{
  "id": "00000000-0000-0000-0000-000000000002",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "email": "malo.legoff@newclinic.com",
  "role": "ADMIN",
  "first_name": "Malo",
  "last_name": "Le Goff",
  "created_at": "2024-02-05T10:00:00Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Access denied"
}
```

---

## DELETE /users/:id

Delete a user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "User deleted"
}
```

**Response (400 Bad Request - Self deletion):**
```json
{
  "error": "Cannot delete yourself"
}
```

**Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Access denied"
}
```
