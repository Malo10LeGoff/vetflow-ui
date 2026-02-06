# Template Endpoints

All endpoints require `Authorization: Bearer <token>` header.

---

## GET /templates

Get templates for the clinic with pagination.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Search term (matches name) |
| `page` | int | No | 1 | Page number |
| `page_size` | int | No | 20 | Items per page (max 100) |

**Examples:**
- `GET /templates` - returns first 20 templates
- `GET /templates?search=colique` - search by name
- `GET /templates?page=1&page_size=10` - paginated results

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "00000000-0000-0000-0000-000000000101",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "name": "Colique",
      "is_default": true,
      "created_at": "2024-02-01T00:00:00Z"
    },
    {
      "id": "00000000-0000-0000-0000-000000000102",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "name": "Chirurgie",
      "is_default": true,
      "created_at": "2024-02-01T00:00:00Z"
    },
    {
      "id": "00000000-0000-0000-0000-000000000103",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "name": "Soins Intensifs",
      "is_default": true,
      "created_at": "2024-02-01T00:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 20
}
```

---

## GET /templates/{templateID}

Get a template with all its details (rows, options, schedules, materials).

**Response (200 OK):**
```json
{
  "template": {
    "id": "00000000-0000-0000-0000-000000000101",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "name": "Colique",
    "is_default": true,
    "created_at": "2024-02-01T00:00:00Z"
  },
  "rows": [
    {
      "row": {
        "id": "00000000-0000-0000-0000-000000000201",
        "clinic_id": "00000000-0000-0000-0000-000000000001",
        "template_id": "00000000-0000-0000-0000-000000000101",
        "row_kind": "NUMERIC",
        "label": "Température",
        "unit": "°C",
        "sort_order": 0,
        "medication_id": null,
        "warn_low": 37.5,
        "warn_high": 38.5,
        "crit_low": 37.0,
        "crit_high": 39.0
      },
      "options": []
    },
    {
      "row": {
        "id": "00000000-0000-0000-0000-000000000202",
        "clinic_id": "00000000-0000-0000-0000-000000000001",
        "template_id": "00000000-0000-0000-0000-000000000101",
        "row_kind": "NUMERIC",
        "label": "Fréquence cardiaque",
        "unit": "bpm",
        "sort_order": 1,
        "medication_id": null,
        "warn_low": 28,
        "warn_high": 44,
        "crit_low": 24,
        "crit_high": 60
      },
      "options": []
    },
    {
      "row": {
        "id": "00000000-0000-0000-0000-000000000204",
        "clinic_id": "00000000-0000-0000-0000-000000000001",
        "template_id": "00000000-0000-0000-0000-000000000101",
        "row_kind": "OPTION",
        "label": "Attitude",
        "unit": null,
        "sort_order": 3,
        "medication_id": null,
        "warn_low": null,
        "warn_high": null,
        "crit_low": null,
        "crit_high": null
      },
      "options": [
        {
          "id": "00000000-0000-0000-0000-000000000301",
          "clinic_id": "00000000-0000-0000-0000-000000000001",
          "template_row_id": "00000000-0000-0000-0000-000000000204",
          "value": "Alerte",
          "sort_order": 0
        },
        {
          "id": "00000000-0000-0000-0000-000000000302",
          "clinic_id": "00000000-0000-0000-0000-000000000001",
          "template_row_id": "00000000-0000-0000-0000-000000000204",
          "value": "Calme",
          "sort_order": 1
        },
        {
          "id": "00000000-0000-0000-0000-000000000303",
          "clinic_id": "00000000-0000-0000-0000-000000000001",
          "template_row_id": "00000000-0000-0000-0000-000000000204",
          "value": "Agité",
          "sort_order": 2
        },
        {
          "id": "00000000-0000-0000-0000-000000000304",
          "clinic_id": "00000000-0000-0000-0000-000000000001",
          "template_row_id": "00000000-0000-0000-0000-000000000204",
          "value": "Douloureux",
          "sort_order": 3
        },
        {
          "id": "00000000-0000-0000-0000-000000000305",
          "clinic_id": "00000000-0000-0000-0000-000000000001",
          "template_row_id": "00000000-0000-0000-0000-000000000204",
          "value": "Prostré",
          "sort_order": 4
        }
      ]
    },
    {
      "row": {
        "id": "00000000-0000-0000-0000-000000000205",
        "clinic_id": "00000000-0000-0000-0000-000000000001",
        "template_id": "00000000-0000-0000-0000-000000000101",
        "row_kind": "OPTION",
        "label": "Douleur",
        "unit": null,
        "sort_order": 4,
        "medication_id": null,
        "warn_low": null,
        "warn_high": null,
        "crit_low": null,
        "crit_high": null
      },
      "options": [
        {
          "id": "00000000-0000-0000-0000-000000000311",
          "value": "-",
          "sort_order": 0
        },
        {
          "id": "00000000-0000-0000-0000-000000000312",
          "value": "+",
          "sort_order": 1
        },
        {
          "id": "00000000-0000-0000-0000-000000000313",
          "value": "++",
          "sort_order": 2
        },
        {
          "id": "00000000-0000-0000-0000-000000000314",
          "value": "+++",
          "sort_order": 3
        }
      ]
    },
    {
      "row": {
        "id": "00000000-0000-0000-0000-000000000206",
        "clinic_id": "00000000-0000-0000-0000-000000000001",
        "template_id": "00000000-0000-0000-0000-000000000101",
        "row_kind": "CHECK",
        "label": "Perfusion",
        "unit": null,
        "sort_order": 5
      },
      "options": []
    },
    {
      "row": {
        "id": "00000000-0000-0000-0000-000000000207",
        "clinic_id": "00000000-0000-0000-0000-000000000001",
        "template_id": "00000000-0000-0000-0000-000000000101",
        "row_kind": "TEXT",
        "label": "Observations",
        "unit": null,
        "sort_order": 6
      },
      "options": []
    }
  ],
  "schedules": [
    {
      "id": "00000000-0000-0000-0000-000000000401",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "template_id": "00000000-0000-0000-0000-000000000101",
      "template_row_id": "00000000-0000-0000-0000-000000000201",
      "interval_minutes": 120,
      "start_offset_minutes": 0,
      "duration_days": 3,
      "default_text": null,
      "default_numeric": null,
      "default_unit": null
    },
    {
      "id": "00000000-0000-0000-0000-000000000402",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "template_id": "00000000-0000-0000-0000-000000000101",
      "template_row_id": "00000000-0000-0000-0000-000000000202",
      "interval_minutes": 120,
      "start_offset_minutes": 0,
      "duration_days": 3,
      "default_text": null,
      "default_numeric": null,
      "default_unit": null
    }
  ],
  "materials": [
    {
      "template_material": {
        "id": "00000000-0000-0000-0000-000000000701",
        "clinic_id": "00000000-0000-0000-0000-000000000001",
        "template_id": "00000000-0000-0000-0000-000000000101",
        "material_id": "00000000-0000-0000-0000-000000000601",
        "default_quantity": 1
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
      "template_material": {
        "id": "00000000-0000-0000-0000-000000000703",
        "clinic_id": "00000000-0000-0000-0000-000000000001",
        "template_id": "00000000-0000-0000-0000-000000000101",
        "material_id": "00000000-0000-0000-0000-000000000603",
        "default_quantity": 10
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
}
```

---

## POST /templates

Create a new template.

**Request:**
```json
{
  "name": "Post-opératoire",
  "is_default": false
}
```

**Response (201 Created):**
```json
{
  "id": "new-template-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "name": "Post-opératoire",
  "is_default": false,
  "created_at": "2024-02-05T14:00:00Z"
}
```

---

## PUT /templates/{templateID}

Update a template.

**Request:**
```json
{
  "name": "Post-opératoire (modifié)",
  "is_default": true
}
```

**Response (200 OK):**
```json
{
  "id": "template-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "name": "Post-opératoire (modifié)",
  "is_default": true,
  "created_at": "2024-02-05T14:00:00Z"
}
```

---

## DELETE /templates/{templateID}

Delete a template.

**Response (204 No Content)**

---

## POST /templates/{templateID}/rows

Add a row to a template.

**Request (NUMERIC with thresholds):**
```json
{
  "row_kind": "NUMERIC",
  "label": "Température",
  "unit": "°C",
  "sort_order": 0,
  "warn_low": 37.5,
  "warn_high": 38.5,
  "crit_low": 37.0,
  "crit_high": 39.0
}
```

**Request (OPTION with choices):**
```json
{
  "row_kind": "OPTION",
  "label": "Transit",
  "sort_order": 4,
  "options": ["Absent", "Diminué", "Normal", "Augmenté"]
}
```

**Request (MEDICATION):**
```json
{
  "row_kind": "MEDICATION",
  "label": "Flunixine (ml)",
  "unit": "ml",
  "sort_order": 6,
  "medication_id": "00000000-0000-0000-0000-000000000501"
}
```

**Response (201 Created):**
```json
{
  "id": "new-row-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "template_id": "template-uuid",
  "row_kind": "NUMERIC",
  "label": "Température",
  "unit": "°C",
  "sort_order": 0,
  "medication_id": null,
  "warn_low": 37.5,
  "warn_high": 38.5,
  "crit_low": 37.0,
  "crit_high": 39.0
}
```

---

## DELETE /templates/{templateID}/rows/{rowID}

Delete a row from a template.

**Response (204 No Content)**

---

## POST /templates/{templateID}/schedules

Add a schedule to a template (recurring task).

**Request:**
```json
{
  "template_row_id": "00000000-0000-0000-0000-000000000201",
  "interval_minutes": 120,
  "start_offset_minutes": 0,
  "duration_days": 3,
  "default_numeric": null,
  "default_text": null,
  "default_unit": null
}
```

**Request (with default medication value):**
```json
{
  "template_row_id": "medication-row-uuid",
  "interval_minutes": 720,
  "start_offset_minutes": 0,
  "duration_days": 5,
  "default_numeric": 10,
  "default_unit": "ml"
}
```

**Response (201 Created):**
```json
{
  "id": "new-schedule-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "template_id": "template-uuid",
  "template_row_id": "00000000-0000-0000-0000-000000000201",
  "interval_minutes": 120,
  "start_offset_minutes": 0,
  "duration_days": 3,
  "default_text": null,
  "default_numeric": null,
  "default_unit": null
}
```

---

## DELETE /templates/{templateID}/schedules/{scheduleID}

Delete a schedule from a template.

**Response (204 No Content)**

---

## POST /templates/{templateID}/materials

Add a material to a template.

**Request:**
```json
{
  "material_id": "00000000-0000-0000-0000-000000000601",
  "default_quantity": 1
}
```

**Response (201 Created):**
```json
{
  "id": "new-template-material-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "template_id": "template-uuid",
  "material_id": "00000000-0000-0000-0000-000000000601",
  "default_quantity": 1
}
```

---

## DELETE /templates/{templateID}/materials/{materialID}

Remove a material from a template.

**Response (204 No Content)**
