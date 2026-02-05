# Material Endpoints

All endpoints require `Authorization: Bearer <token>` header.

---

## GET /materials

Get all materials for the clinic.

**Response (200 OK):**
```json
[
  {
    "id": "00000000-0000-0000-0000-000000000601",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Cathéter IV 14G",
    "unit": "unité",
    "created_at": "2024-02-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000602",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Perfuseur",
    "unit": "unité",
    "created_at": "2024-02-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000603",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Soluté NaCl 0.9%",
    "unit": "L",
    "created_at": "2024-02-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000604",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Soluté Ringer Lactate",
    "unit": "L",
    "created_at": "2024-02-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000605",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Sonde nasogastrique",
    "unit": "unité",
    "created_at": "2024-02-01T00:00:00Z"
  }
]
```

---

## POST /materials

Create a new material.

**Request:**
```json
{
  "name": "Tube de prélèvement EDTA",
  "unit": "unité"
}
```

**Response (201 Created):**
```json
{
  "id": "new-material-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "name": "Tube de prélèvement EDTA",
  "unit": "unité",
  "created_at": "2024-02-05T14:00:00Z"
}
```

---

## PUT /materials/{materialID}

Update a material.

**Request:**
```json
{
  "name": "Tube EDTA 5ml",
  "unit": "unité"
}
```

**Response (200 OK):**
```json
{
  "id": "material-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "name": "Tube EDTA 5ml",
  "unit": "unité",
  "created_at": "2024-02-05T14:00:00Z"
}
```

---

## DELETE /materials/{materialID}

Delete a material.

**Response (204 No Content)**

---

# Material Usage (per hospitalization)

## GET /hospitalizations/{hospitalizationID}/materials

Get all material usage for a hospitalization.

**Response (200 OK):**
```json
[
  {
    "usage": {
      "id": "usage-uuid-1",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "material_id": "00000000-0000-0000-0000-000000000601",
      "quantity": 1,
      "at_time": "2024-02-04T08:00:00Z",
      "author_user_id": "00000000-0000-0000-0000-000000000002",
      "created_at": "2024-02-04T08:00:00Z"
    },
    "material": {
      "id": "00000000-0000-0000-0000-000000000601",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "name": "Cathéter IV 14G",
      "unit": "unité",
      "created_at": "2024-02-01T00:00:00Z"
    }
  },
  {
    "usage": {
      "id": "usage-uuid-2",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "material_id": "00000000-0000-0000-0000-000000000603",
      "quantity": 10,
      "at_time": "2024-02-04T08:00:00Z",
      "author_user_id": "00000000-0000-0000-0000-000000000002",
      "created_at": "2024-02-04T08:00:00Z"
    },
    "material": {
      "id": "00000000-0000-0000-0000-000000000603",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "name": "Soluté NaCl 0.9%",
      "unit": "L",
      "created_at": "2024-02-01T00:00:00Z"
    }
  }
]
```

---

## POST /hospitalizations/{hospitalizationID}/materials

Add material usage to a hospitalization.

**Request:**
```json
{
  "material_id": "00000000-0000-0000-0000-000000000602",
  "quantity": 2,
  "at_time": "2024-02-05T10:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "id": "new-usage-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "material_id": "00000000-0000-0000-0000-000000000602",
  "quantity": 2,
  "at_time": "2024-02-05T10:00:00Z",
  "author_user_id": "00000000-0000-0000-0000-000000000002",
  "created_at": "2024-02-05T10:05:00Z"
}
```

---

## PUT /hospitalizations/{hospitalizationID}/materials/{usageID}

Update material usage quantity.

**Request:**
```json
{
  "quantity": 3
}
```

**Response (200 OK):**
```json
{
  "id": "usage-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "material_id": "00000000-0000-0000-0000-000000000602",
  "quantity": 3,
  "at_time": "2024-02-05T10:00:00Z",
  "author_user_id": "00000000-0000-0000-0000-000000000002",
  "created_at": "2024-02-05T10:05:00Z"
}
```

---

## DELETE /hospitalizations/{hospitalizationID}/materials/{usageID}

Delete material usage entry.

**Response (204 No Content)**

---

## GET /hospitalizations/{hospitalizationID}/materials/summary

Get aggregated material usage summary.

**Response (200 OK):**
```json
[
  {
    "material_id": "00000000-0000-0000-0000-000000000601",
    "material_name": "Cathéter IV 14G",
    "unit": "unité",
    "total_quantity": 2
  },
  {
    "material_id": "00000000-0000-0000-0000-000000000602",
    "material_name": "Perfuseur",
    "unit": "unité",
    "total_quantity": 3
  },
  {
    "material_id": "00000000-0000-0000-0000-000000000603",
    "material_name": "Soluté NaCl 0.9%",
    "unit": "L",
    "total_quantity": 25
  }
]
```
