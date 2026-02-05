# Hospitalization Endpoints

All endpoints require `Authorization: Bearer <token>` header.

---

## GET /hospitalizations

Get all active hospitalizations (dashboard).

**Response (200 OK):**
```json
[
  {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "horse": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "owner_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "VULCAIN",
      "age_years": 8.5,
      "weight_kg": 520,
      "created_at": "2024-02-05T10:00:00Z"
    },
    "owner": {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "full_name": "Marie Martin",
      "phone": "+33612345678",
      "email": "marie.martin@email.com",
      "created_at": "2024-02-05T10:00:00Z"
    },
    "category": "colique",
    "admission_at": "2024-02-04T08:00:00Z",
    "status": "ACTIVE",
    "archived_at": null,
    "duration_days": 1,
    "duration_hours": 6,
    "next_scheduled_at": "2024-02-05T16:00:00Z"
  },
  {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "horse": {
      "id": "d4e5f6a7-b8c9-0123-def0-234567890123",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "owner_id": "e5f6a7b8-c9d0-1234-ef01-345678901234",
      "name": "ECLIPSE",
      "age_years": 5,
      "weight_kg": 480,
      "created_at": "2024-02-03T14:00:00Z"
    },
    "owner": {
      "id": "e5f6a7b8-c9d0-1234-ef01-345678901234",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "full_name": "Pierre Durand",
      "phone": "+33698765432",
      "email": null,
      "created_at": "2024-02-03T14:00:00Z"
    },
    "category": "chirurgie",
    "admission_at": "2024-02-03T14:00:00Z",
    "status": "ACTIVE",
    "archived_at": null,
    "duration_days": 2,
    "duration_hours": 0,
    "next_scheduled_at": "2024-02-05T18:00:00Z"
  }
]
```

---

## GET /hospitalizations/archived

Get archived hospitalizations with pagination and search.

**Query Parameters:**
- `page` (default: 1)
- `page_size` (default: 10, max: 100)
- `search` (optional, searches horse name)

**Request:**
```
GET /hospitalizations/archived?page=1&page_size=10&search=VULCAIN
```

**Response (200 OK):**
```json
{
  "hospitalizations": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "horse": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "VULCAIN",
        "age_years": 8.5,
        "weight_kg": 520
      },
      "owner": {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "full_name": "Marie Martin"
      },
      "category": "colique",
      "admission_at": "2024-01-15T08:00:00Z",
      "status": "ARCHIVED",
      "archived_at": "2024-01-20T16:00:00Z",
      "duration_days": 5,
      "duration_hours": 8,
      "next_scheduled_at": null
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 10
}
```

---

## GET /hospitalizations/{hospitalizationID}

Get a single hospitalization with details.

**Response (200 OK):**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "horse": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "owner_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "name": "VULCAIN",
    "age_years": 8.5,
    "weight_kg": 520,
    "created_at": "2024-02-05T10:00:00Z"
  },
  "owner": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "full_name": "Marie Martin",
    "phone": "+33612345678",
    "email": "marie.martin@email.com",
    "created_at": "2024-02-05T10:00:00Z"
  },
  "category": "colique",
  "admission_at": "2024-02-04T08:00:00Z",
  "status": "ACTIVE",
  "archived_at": null,
  "duration_days": 1,
  "duration_hours": 6,
  "next_scheduled_at": "2024-02-05T16:00:00Z"
}
```

---

## POST /hospitalizations

Create a new hospitalization (admission).

**Request:**
```json
{
  "horse_name": "TORNADO",
  "owner_name": "Sophie Bernard",
  "owner_phone": "+33611223344",
  "owner_email": "sophie.bernard@email.com",
  "age_years": 6,
  "weight_kg": 550,
  "category": "colique",
  "admission_at": "2024-02-05T14:30:00Z",
  "template_id": "00000000-0000-0000-0000-000000000101"
}
```

**Alternative with age in months (for foals):**
```json
{
  "horse_name": "PETIT PRINCE",
  "owner_name": "Jean Petit",
  "owner_phone": "+33699887766",
  "owner_email": null,
  "age_months": 8,
  "weight_kg": 180,
  "category": "poulain",
  "admission_at": "2024-02-05T09:00:00Z",
  "template_id": "00000000-0000-0000-0000-000000000104"
}
```

**Response (201 Created):**
```json
{
  "id": "new-uuid-here",
  "horse": {
    "id": "horse-uuid",
    "name": "TORNADO",
    "age_years": 6,
    "weight_kg": 550
  },
  "owner": {
    "id": "owner-uuid",
    "full_name": "Sophie Bernard",
    "phone": "+33611223344",
    "email": "sophie.bernard@email.com"
  },
  "category": "colique",
  "admission_at": "2024-02-05T14:30:00Z",
  "status": "ACTIVE",
  "archived_at": null,
  "duration_days": 0,
  "duration_hours": 0,
  "next_scheduled_at": "2024-02-05T16:30:00Z"
}
```

---

## POST /hospitalizations/{hospitalizationID}/archive

Archive a hospitalization (patient discharged).

**Response (200 OK):**
```json
{
  "status": "archived"
}
```

---

## POST /hospitalizations/{hospitalizationID}/unarchive

Unarchive a hospitalization (reactivate).

**Response (200 OK):**
```json
{
  "status": "active"
}
```

---

## PUT /hospitalizations/{hospitalizationID}/weight

Update horse weight during hospitalization.

**Request:**
```json
{
  "weight_kg": 515
}
```

**Response (200 OK):**
```json
{
  "status": "updated"
}
```

---

## GET /hospitalizations/{hospitalizationID}/summary

Get summary for PDF export (medications + materials used).

**Response (200 OK):**
```json
{
  "hospitalization": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "horse": {
      "name": "VULCAIN",
      "weight_kg": 520
    },
    "owner": {
      "full_name": "Marie Martin"
    },
    "category": "colique",
    "admission_at": "2024-02-04T08:00:00Z",
    "duration_days": 3,
    "duration_hours": 12
  },
  "medication_summary": [
    {
      "medication_id": "00000000-0000-0000-0000-000000000501",
      "name": "Flunixine méglumine (Finadyne)",
      "total_amount": 60,
      "unit": "ml"
    },
    {
      "medication_id": "00000000-0000-0000-0000-000000000503",
      "name": "Métamizole (Novalgin)",
      "total_amount": 120,
      "unit": "ml"
    }
  ],
  "material_summary": [
    {
      "material_id": "00000000-0000-0000-0000-000000000601",
      "material_name": "Cathéter IV 14G",
      "unit": "unité",
      "total_quantity": 2
    },
    {
      "material_id": "00000000-0000-0000-0000-000000000603",
      "material_name": "Soluté NaCl 0.9%",
      "unit": "L",
      "total_quantity": 25
    }
  ]
}
```
