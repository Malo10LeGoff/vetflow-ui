# Medication Endpoints

All endpoints require `Authorization: Bearer <token>` header.

---

## GET /medications

Get all medications for the clinic.

**Response (200 OK):**
```json
[
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
  },
  {
    "id": "00000000-0000-0000-0000-000000000503",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Métamizole (Novalgin)",
    "reference_unit": "ml",
    "dose_min_per_kg": 15,
    "dose_max_per_kg": 30,
    "dose_unit": "mg/kg",
    "notes": "Antispasmodique",
    "created_at": "2024-02-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000504",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Butorphanol (Torbugesic)",
    "reference_unit": "ml",
    "dose_min_per_kg": 0.02,
    "dose_max_per_kg": 0.1,
    "dose_unit": "mg/kg",
    "notes": "Analgésique opioïde",
    "created_at": "2024-02-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000505",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Détomidine (Domosedan)",
    "reference_unit": "ml",
    "dose_min_per_kg": 10,
    "dose_max_per_kg": 40,
    "dose_unit": "µg/kg",
    "notes": "Sédatif alpha-2",
    "created_at": "2024-02-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000506",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Xylazine (Rompun)",
    "reference_unit": "ml",
    "dose_min_per_kg": 0.5,
    "dose_max_per_kg": 1.1,
    "dose_unit": "mg/kg",
    "notes": "Sédatif alpha-2",
    "created_at": "2024-02-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000507",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Pénicilline procaïne",
    "reference_unit": "ml",
    "dose_min_per_kg": 22000,
    "dose_max_per_kg": 22000,
    "dose_unit": "UI/kg",
    "notes": "Antibiotique",
    "created_at": "2024-02-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000508",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Gentamicine",
    "reference_unit": "ml",
    "dose_min_per_kg": 6.6,
    "dose_max_per_kg": 6.6,
    "dose_unit": "mg/kg",
    "notes": "Antibiotique aminoglycoside",
    "created_at": "2024-02-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000509",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Oméprazole (Gastrogard)",
    "reference_unit": "seringue",
    "dose_min_per_kg": 1,
    "dose_max_per_kg": 4,
    "dose_unit": "mg/kg",
    "notes": "Anti-ulcéreux",
    "created_at": "2024-02-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000510",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Huile de paraffine",
    "reference_unit": "L",
    "dose_min_per_kg": null,
    "dose_max_per_kg": null,
    "dose_unit": null,
    "notes": "Laxatif",
    "created_at": "2024-02-01T00:00:00Z"
  }
]
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
