# Chart Endpoints (Patient File / Tableau de Soins)

All endpoints require `Authorization: Bearer <token>` header.

---

## GET /hospitalizations/{hospitalizationID}/chart

Get all chart data (rows, entries, schedules) for the hourly table.

**Response (200 OK):**
```json
{
  "rows": [
    {
      "id": "row-uuid-1",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "row_kind": "NUMERIC",
      "label": "Température",
      "unit": "°C",
      "sort_order": 0,
      "medication_id": null,
      "created_at": "2024-02-04T08:00:00Z"
    },
    {
      "id": "row-uuid-2",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "row_kind": "NUMERIC",
      "label": "Fréquence cardiaque",
      "unit": "bpm",
      "sort_order": 1,
      "medication_id": null,
      "created_at": "2024-02-04T08:00:00Z"
    },
    {
      "id": "row-uuid-3",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "row_kind": "OPTION",
      "label": "Douleur",
      "unit": null,
      "sort_order": 2,
      "medication_id": null,
      "created_at": "2024-02-04T08:00:00Z"
    },
    {
      "id": "row-uuid-4",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "row_kind": "CHECK",
      "label": "Perfusion",
      "unit": null,
      "sort_order": 3,
      "medication_id": null,
      "created_at": "2024-02-04T08:00:00Z"
    },
    {
      "id": "row-uuid-5",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "row_kind": "MEDICATION",
      "label": "Flunixine (ml)",
      "unit": "ml",
      "sort_order": 4,
      "medication_id": "00000000-0000-0000-0000-000000000501",
      "created_at": "2024-02-04T08:00:00Z"
    },
    {
      "id": "row-uuid-6",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "row_kind": "TEXT",
      "label": "Observations",
      "unit": null,
      "sort_order": 5,
      "medication_id": null,
      "created_at": "2024-02-04T08:00:00Z"
    }
  ],
  "entries": [
    {
      "id": "entry-uuid-1",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "chart_row_id": "row-uuid-1",
      "at_time": "2024-02-04T08:00:00Z",
      "entry_type": "NUMERIC",
      "numeric_value": 38.1,
      "option_id": null,
      "check_value": null,
      "text_value": null,
      "medication_amount": null,
      "medication_unit": null,
      "flagged": false,
      "author_user_id": "00000000-0000-0000-0000-000000000002",
      "created_at": "2024-02-04T08:05:00Z",
      "updated_at": "2024-02-04T08:05:00Z"
    },
    {
      "id": "entry-uuid-2",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "chart_row_id": "row-uuid-1",
      "at_time": "2024-02-04T10:00:00Z",
      "entry_type": "NUMERIC",
      "numeric_value": 39.2,
      "option_id": null,
      "check_value": null,
      "text_value": null,
      "medication_amount": null,
      "medication_unit": null,
      "flagged": true,
      "author_user_id": "00000000-0000-0000-0000-000000000002",
      "created_at": "2024-02-04T10:05:00Z",
      "updated_at": "2024-02-04T10:05:00Z"
    },
    {
      "id": "entry-uuid-3",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "chart_row_id": "row-uuid-3",
      "at_time": "2024-02-04T10:00:00Z",
      "entry_type": "OPTION",
      "numeric_value": null,
      "option_id": "+++",
      "check_value": null,
      "text_value": null,
      "medication_amount": null,
      "medication_unit": null,
      "flagged": false,
      "author_user_id": "00000000-0000-0000-0000-000000000002",
      "created_at": "2024-02-04T10:05:00Z",
      "updated_at": "2024-02-04T10:05:00Z"
    },
    {
      "id": "entry-uuid-4",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "chart_row_id": "row-uuid-5",
      "at_time": "2024-02-04T10:00:00Z",
      "entry_type": "MEDICATION",
      "numeric_value": null,
      "option_id": null,
      "check_value": null,
      "text_value": null,
      "medication_amount": 10,
      "medication_unit": "ml",
      "flagged": false,
      "author_user_id": "00000000-0000-0000-0000-000000000002",
      "created_at": "2024-02-04T10:10:00Z",
      "updated_at": "2024-02-04T10:10:00Z"
    }
  ],
  "schedules": [
    {
      "id": "schedule-uuid-1",
      "clinic_id": "00000000-0000-0000-0000-000000000001",
      "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "chart_row_id": "row-uuid-1",
      "start_at": "2024-02-04T08:00:00Z",
      "interval_minutes": 120,
      "end_at": "2024-02-07T08:00:00Z",
      "occurrences": null,
      "default_text": null,
      "default_numeric": null,
      "default_unit": null,
      "created_by_user_id": "00000000-0000-0000-0000-000000000002",
      "created_at": "2024-02-04T08:00:00Z"
    }
  ]
}
```

---

## POST /hospitalizations/{hospitalizationID}/chart/rows

Create a new chart row.

**Request (NUMERIC row):**
```json
{
  "row_kind": "NUMERIC",
  "label": "Fréquence respiratoire",
  "unit": "rpm",
  "sort_order": 2
}
```

**Request (MEDICATION row):**
```json
{
  "row_kind": "MEDICATION",
  "label": "Métamizole (ml)",
  "unit": "ml",
  "sort_order": 5,
  "medication_id": "00000000-0000-0000-0000-000000000503"
}
```

**Request (OPTION row):**
```json
{
  "row_kind": "OPTION",
  "label": "Attitude",
  "sort_order": 3
}
```

**Request (CHECK row):**
```json
{
  "row_kind": "CHECK",
  "label": "Perfusion",
  "sort_order": 4
}
```

**Request (TEXT row):**
```json
{
  "row_kind": "TEXT",
  "label": "Observations",
  "sort_order": 6
}
```

**Response (201 Created):**
```json
{
  "id": "new-row-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "row_kind": "NUMERIC",
  "label": "Fréquence respiratoire",
  "unit": "rpm",
  "sort_order": 2,
  "medication_id": null,
  "created_at": "2024-02-05T14:00:00Z"
}
```

---

## PUT /hospitalizations/{hospitalizationID}/chart/rows/{rowID}

Update a chart row.

**Request:**
```json
{
  "label": "FR (respirations/min)",
  "unit": "rpm",
  "sort_order": 2
}
```

**Response (200 OK):**
```json
{
  "id": "row-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "row_kind": "NUMERIC",
  "label": "FR (respirations/min)",
  "unit": "rpm",
  "sort_order": 2,
  "medication_id": null,
  "created_at": "2024-02-04T08:00:00Z"
}
```

---

## DELETE /hospitalizations/{hospitalizationID}/chart/rows/{rowID}

Delete a chart row (and all its entries).

**Response (204 No Content)**

---

## GET /hospitalizations/{hospitalizationID}/chart/rows/{rowID}/entries

Get all entries for a specific row (for graphs).

**Response (200 OK):**
```json
[
  {
    "id": "entry-uuid-1",
    "at_time": "2024-02-04T08:00:00Z",
    "numeric_value": 38.1,
    "flagged": false
  },
  {
    "id": "entry-uuid-2",
    "at_time": "2024-02-04T10:00:00Z",
    "numeric_value": 39.2,
    "flagged": true
  },
  {
    "id": "entry-uuid-3",
    "at_time": "2024-02-04T12:00:00Z",
    "numeric_value": 38.7,
    "flagged": false
  },
  {
    "id": "entry-uuid-4",
    "at_time": "2024-02-04T14:00:00Z",
    "numeric_value": 38.4,
    "flagged": false
  }
]
```

---

## POST /hospitalizations/{hospitalizationID}/chart/entries

Create a new chart entry (fill a cell).

**Request (NUMERIC):**
```json
{
  "chart_row_id": "row-uuid-1",
  "at_time": "2024-02-05T14:00:00Z",
  "entry_type": "NUMERIC",
  "numeric_value": 38.3,
  "flagged": false
}
```

**Request (OPTION):**
```json
{
  "chart_row_id": "row-uuid-3",
  "at_time": "2024-02-05T14:00:00Z",
  "entry_type": "OPTION",
  "option_id": "++",
  "flagged": false
}
```

**Request (CHECK):**
```json
{
  "chart_row_id": "row-uuid-4",
  "at_time": "2024-02-05T14:00:00Z",
  "entry_type": "CHECK",
  "check_value": true,
  "flagged": false
}
```

**Request (TEXT):**
```json
{
  "chart_row_id": "row-uuid-6",
  "at_time": "2024-02-05T14:00:00Z",
  "entry_type": "TEXT",
  "text_value": "Colique résolue, transit repris",
  "flagged": false
}
```

**Request (MEDICATION):**
```json
{
  "chart_row_id": "row-uuid-5",
  "at_time": "2024-02-05T14:00:00Z",
  "entry_type": "MEDICATION",
  "medication_amount": 10,
  "medication_unit": "ml",
  "flagged": false
}
```

**Response (201 Created):**
```json
{
  "id": "new-entry-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "chart_row_id": "row-uuid-1",
  "at_time": "2024-02-05T14:00:00Z",
  "entry_type": "NUMERIC",
  "numeric_value": 38.3,
  "option_id": null,
  "check_value": null,
  "text_value": null,
  "medication_amount": null,
  "medication_unit": null,
  "flagged": false,
  "author_user_id": "00000000-0000-0000-0000-000000000002",
  "created_at": "2024-02-05T14:05:00Z",
  "updated_at": "2024-02-05T14:05:00Z"
}
```

---

## PUT /hospitalizations/{hospitalizationID}/chart/entries/{entryID}

Update a chart entry.

**Request:**
```json
{
  "numeric_value": 38.5,
  "flagged": true
}
```

**Response (200 OK):**
```json
{
  "id": "entry-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "chart_row_id": "row-uuid-1",
  "at_time": "2024-02-05T14:00:00Z",
  "entry_type": "NUMERIC",
  "numeric_value": 38.5,
  "flagged": true,
  "updated_at": "2024-02-05T14:10:00Z"
}
```

---

## DELETE /hospitalizations/{hospitalizationID}/chart/entries/{entryID}

Delete a chart entry.

**Response (204 No Content)**

---

## POST /hospitalizations/{hospitalizationID}/schedules

Create a schedule for a chart row.

**Schedule Types:**
- **Recurring**: Set `interval_minutes > 0` (e.g., every 2 hours = 120)
- **Ad-hoc (one-time)**: Set `interval_minutes = 0` for a single occurrence at `start_at`

**Request (recurring - every 2 hours):**
```json
{
  "chart_row_id": "row-uuid-1",
  "start_at": "2024-02-05T08:00:00Z",
  "interval_minutes": 120,
  "end_at": "2024-02-08T08:00:00Z",
  "default_numeric": null,
  "default_text": null,
  "default_unit": null
}
```

**Request (ad-hoc - one-time check):**
```json
{
  "chart_row_id": "row-uuid-1",
  "start_at": "2024-02-05T15:00:00Z",
  "interval_minutes": 0
}
```

**Request (recurring with default value for medication):**
```json
{
  "chart_row_id": "row-uuid-5",
  "start_at": "2024-02-05T00:00:00Z",
  "interval_minutes": 720,
  "occurrences": 6,
  "default_numeric": 10,
  "default_unit": "ml"
}
```

**Response (201 Created):**
```json
{
  "id": "new-schedule-uuid",
  "clinic_id": "00000000-0000-0000-0000-000000000001",
  "hospitalization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "chart_row_id": "row-uuid-1",
  "start_at": "2024-02-05T08:00:00Z",
  "interval_minutes": 120,
  "end_at": "2024-02-08T08:00:00Z",
  "occurrences": null,
  "default_text": null,
  "default_numeric": null,
  "default_unit": null,
  "created_by_user_id": "00000000-0000-0000-0000-000000000002",
  "created_at": "2024-02-05T07:00:00Z"
}
```

---

## DELETE /hospitalizations/{hospitalizationID}/schedules/{scheduleID}

Delete a schedule.

**Response (204 No Content)**

---

## GET /hospitalizations/{hospitalizationID}/medications/summary

Get medication usage summary for the hospitalization.

**Response (200 OK):**
```json
[
  {
    "medication_id": "00000000-0000-0000-0000-000000000501",
    "name": "Flunixine (ml)",
    "total_amount": 60,
    "unit": "ml"
  },
  {
    "medication_id": "00000000-0000-0000-0000-000000000503",
    "name": "Métamizole (ml)",
    "total_amount": 120,
    "unit": "ml"
  }
]
```
