# Medication Endpoints

All endpoints require `Authorization: Bearer <token>` header.

---

## GET /medications

Get medications for the clinic with pagination.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Search term (matches name or notes) |
| `page` | int | No | 1 | Page number |
| `page_size` | int | No | 20 | Items per page (max 100) |

**Examples:**
- `GET /medications` - returns first 20 medications
- `GET /medications?search=flunixine` - search by name or notes
- `GET /medications?search=AINS&page=1&page_size=10` - paginated search

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "00000000-0000-0000-0000-000000000501",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "name": "Flunixine méglumine (Finadyne)",
      "reference_unit": "ml",
      "dose_min_per_kg": 0.5,
      "dose_max_per_kg": 1.1,
      "dose_unit": "mg/kg",
      "notes": "AINS - Anti-douleur",
      "created_at": "2024-02-01T00:00:00Z"
    },
    {
      "id": "00000000-0000-0000-0000-000000000502",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "name": "Phénylbutazone (Equipalazone)",
      "reference_unit": "g",
      "dose_min_per_kg": 2.2,
      "dose_max_per_kg": 4.4,
      "dose_unit": "mg/kg",
      "notes": "AINS - Anti-inflammatoire",
      "created_at": "2024-02-01T00:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "page_size": 20
}
```

---

## GET /medications/{medicationID}

Get a single medication.

**Response (200 OK):**
```json
{
  "id": "00000000-0000-0000-0000-000000000501",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "name": "Flunixine méglumine (Finadyne)",
  "reference_unit": "ml",
  "dose_min_per_kg": 0.5,
  "dose_max_per_kg": 1.1,
  "dose_unit": "mg/kg",
  "notes": "AINS - Anti-douleur",
  "created_at": "2024-02-01T00:00:00Z"
}
```

---

## POST /medications

Create a new medication.

**Request (with dosing info):**
```json
{
  "name": "Acépromazine (Calmivet)",
  "reference_unit": "ml",
  "dose_min_per_kg": 0.02,
  "dose_max_per_kg": 0.05,
  "dose_unit": "mg/kg",
  "notes": "Tranquillisant phénothiazine"
}
```

**Request (simple, without dosing):**
```json
{
  "name": "Electrolytes oraux",
  "reference_unit": "sachet",
  "notes": "Réhydratation orale"
}
```

**Response (201 Created):**
```json
{
  "id": "new-medication-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "name": "Acépromazine (Calmivet)",
  "reference_unit": "ml",
  "dose_min_per_kg": 0.02,
  "dose_max_per_kg": 0.05,
  "dose_unit": "mg/kg",
  "notes": "Tranquillisant phénothiazine",
  "created_at": "2024-02-05T14:00:00Z"
}
```

---

## PUT /medications/{medicationID}

Update a medication.

**Request:**
```json
{
  "name": "Flunixine méglumine (Finadyne) 50mg/ml",
  "reference_unit": "ml",
  "dose_min_per_kg": 0.5,
  "dose_max_per_kg": 1.1,
  "dose_unit": "mg/kg",
  "notes": "AINS - Anti-douleur. IV ou IM."
}
```

**Response (200 OK):**
```json
{
  "id": "00000000-0000-0000-0000-000000000501",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "name": "Flunixine méglumine (Finadyne) 50mg/ml",
  "reference_unit": "ml",
  "dose_min_per_kg": 0.5,
  "dose_max_per_kg": 1.1,
  "dose_unit": "mg/kg",
  "notes": "AINS - Anti-douleur. IV ou IM.",
  "created_at": "2024-02-01T00:00:00Z"
}
```

---

## DELETE /medications/{medicationID}

Delete a medication.

**Response (204 No Content)**

**Note:** Deletion will fail if the medication is referenced by template rows or chart entries.
