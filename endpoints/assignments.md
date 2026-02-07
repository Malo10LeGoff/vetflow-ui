# Hospitalization Assignment Endpoints

All endpoints require `Authorization: Bearer <token>` header.

Assignments allow you to assign staff members (vets, ASVs) to hospitalizations.

---

## GET /hospitalizations/{hospitalizationID}/assignments

Get all users assigned to a hospitalization.

**Response (200 OK):**
```json
[
  {
    "assignment": {
      "id": "00000000-0000-0000-0000-000000000001",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "hospitalization_id": "00000000-0000-0000-0000-000000000101",
      "user_id": "00000000-0000-0000-0000-000000000002",
      "assigned_at": "2024-02-05T10:00:00Z"
    },
    "user": {
      "id": "00000000-0000-0000-0000-000000000002",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "email": "vet@clinic.com",
      "role": "VET",
      "first_name": "Jean",
      "last_name": "Dupont",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
]
```

---

## POST /hospitalizations/{hospitalizationID}/assignments

Assign a user to a hospitalization.

**Request:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000002"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | uuid | Yes | ID of the user to assign |

**Response (201 Created):**
```json
{
  "assignment": {
    "id": "00000000-0000-0000-0000-000000000001",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "hospitalization_id": "00000000-0000-0000-0000-000000000101",
    "user_id": "00000000-0000-0000-0000-000000000002",
    "assigned_at": "2024-02-05T10:00:00Z"
  },
  "user": {
    "id": "00000000-0000-0000-0000-000000000002",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "email": "vet@clinic.com",
    "role": "VET",
    "first_name": "Jean",
    "last_name": "Dupont",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid user_id or user doesn't exist
- `409 Conflict` - User is already assigned to this hospitalization

---

## DELETE /hospitalizations/{hospitalizationID}/assignments/{userID}

Remove a user's assignment from a hospitalization.

**Response (204 No Content)**

**Note:** This removes the assignment but does not affect the user account itself.
