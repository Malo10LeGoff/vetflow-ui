# Category Endpoints

All endpoints require `Authorization: Bearer <token>` header.

---

## GET /categories

Get all categories for the clinic.

**Response (200 OK):**
```json
[
  {
    "id": "00000000-0000-0000-0000-000000000801",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Colique",
    "color": "#EF4444",
    "sort_order": 0,
    "created_at": "2024-02-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000802",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Chirurgie",
    "color": "#3B82F6",
    "sort_order": 1,
    "created_at": "2024-02-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000803",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Soins Intensifs",
    "color": "#F97316",
    "sort_order": 2,
    "created_at": "2024-02-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000804",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Poulain",
    "color": "#22C55E",
    "sort_order": 3,
    "created_at": "2024-02-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000805",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Castration",
    "color": "#8B5CF6",
    "sort_order": 4,
    "created_at": "2024-02-01T00:00:00Z"
  }
]
```

---

## GET /categories/{categoryID}

Get a single category.

**Response (200 OK):**
```json
{
  "id": "00000000-0000-0000-0000-000000000801",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "name": "Colique",
  "color": "#EF4444",
  "sort_order": 0,
  "created_at": "2024-02-01T00:00:00Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Category not found"
}
```

---

## POST /categories

Create a new category.

**Request:**
```json
{
  "name": "Urgence",
  "color": "#DC2626",
  "sort_order": 5
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Category name |
| `color` | string | No | Hex color code (e.g., `#DC2626`) |
| `sort_order` | int | No | Display order (default: 0) |

**Response (201 Created):**
```json
{
  "id": "new-category-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "name": "Urgence",
  "color": "#DC2626",
  "sort_order": 5,
  "created_at": "2024-02-05T14:00:00Z"
}
```

---

## PUT /categories/{categoryID}

Update a category.

**Request:**
```json
{
  "name": "Urgence Critique",
  "color": "#B91C1C",
  "sort_order": 0
}
```

**Response (200 OK):**
```json
{
  "id": "category-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "name": "Urgence Critique",
  "color": "#B91C1C",
  "sort_order": 0,
  "created_at": "2024-02-05T14:00:00Z"
}
```

---

## DELETE /categories/{categoryID}

Delete a category.

**Response (204 No Content)**

**Note:** Consider handling existing hospitalizations with this category before deleting. You may want to reassign them to another category first.
