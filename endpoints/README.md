# VetFlow API Endpoints

Base URL: `http://localhost:8080`

## Authentication

All protected endpoints require the `Authorization` header:
```
Authorization: Bearer <token>
```

## Endpoint Documentation

| File | Description |
|------|-------------|
| [auth.md](./auth.md) | Login, Register, Get current user |
| [hospitalizations.md](./hospitalizations.md) | CRUD hospitalizations, archive/unarchive, summary |
| [chart.md](./chart.md) | Chart rows, entries, schedules (patient file) |
| [templates.md](./templates.md) | CRUD templates with rows, schedules, materials |
| [medications.md](./medications.md) | CRUD medications database |
| [materials.md](./materials.md) | CRUD materials + usage per hospitalization |

## Quick Reference

### Public Endpoints (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/register` | Register new user |

### Protected Endpoints

#### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/me` | Get current user |

#### Hospitalizations (Dashboard)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hospitalizations` | List active hospitalizations |
| GET | `/hospitalizations/archived` | List archived (paginated) |
| POST | `/hospitalizations` | Create new hospitalization |
| GET | `/hospitalizations/{id}` | Get hospitalization details |
| POST | `/hospitalizations/{id}/archive` | Archive |
| POST | `/hospitalizations/{id}/unarchive` | Unarchive |
| PUT | `/hospitalizations/{id}/weight` | Update horse weight |
| GET | `/hospitalizations/{id}/summary` | Get summary for PDF |

#### Chart (Patient File)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hospitalizations/{id}/chart` | Get all chart data |
| POST | `/hospitalizations/{id}/chart/rows` | Create row |
| PUT | `/hospitalizations/{id}/chart/rows/{rowID}` | Update row |
| DELETE | `/hospitalizations/{id}/chart/rows/{rowID}` | Delete row |
| GET | `/hospitalizations/{id}/chart/rows/{rowID}/entries` | Get row entries (for graph) |
| POST | `/hospitalizations/{id}/chart/entries` | Create entry |
| PUT | `/hospitalizations/{id}/chart/entries/{entryID}` | Update entry |
| DELETE | `/hospitalizations/{id}/chart/entries/{entryID}` | Delete entry |
| POST | `/hospitalizations/{id}/schedules` | Create schedule |
| DELETE | `/hospitalizations/{id}/schedules/{scheduleID}` | Delete schedule |
| GET | `/hospitalizations/{id}/medications/summary` | Get medication totals |

#### Material Usage (per hospitalization)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hospitalizations/{id}/materials` | List material usage |
| POST | `/hospitalizations/{id}/materials` | Add material usage |
| PUT | `/hospitalizations/{id}/materials/{usageID}` | Update quantity |
| DELETE | `/hospitalizations/{id}/materials/{usageID}` | Delete usage |
| GET | `/hospitalizations/{id}/materials/summary` | Get material totals |

#### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/templates` | List templates |
| POST | `/templates` | Create template |
| GET | `/templates/{id}` | Get template with details |
| PUT | `/templates/{id}` | Update template |
| DELETE | `/templates/{id}` | Delete template |
| POST | `/templates/{id}/rows` | Add row |
| DELETE | `/templates/{id}/rows/{rowID}` | Delete row |
| POST | `/templates/{id}/schedules` | Add schedule |
| DELETE | `/templates/{id}/schedules/{scheduleID}` | Delete schedule |
| POST | `/templates/{id}/materials` | Add material |
| DELETE | `/templates/{id}/materials/{materialID}` | Remove material |

#### Medications Database
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/medications` | List medications |
| POST | `/medications` | Create medication |
| GET | `/medications/{id}` | Get medication |
| PUT | `/medications/{id}` | Update medication |
| DELETE | `/medications/{id}` | Delete medication |

#### Materials Database
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/materials` | List materials |
| POST | `/materials` | Create material |
| PUT | `/materials/{id}` | Update material |
| DELETE | `/materials/{id}` | Delete material |

## Row Types

Chart and template rows can be one of these types:

| Type | Description | Value Field |
|------|-------------|-------------|
| `NUMERIC` | Numeric value (temperature, heart rate) | `numeric_value` |
| `OPTION` | Dropdown selection (attitude, pain level) | `option_id` |
| `CHECK` | Checkbox (perfusion on/off) | `check_value` |
| `TEXT` | Free text (observations) | `text_value` |
| `MEDICATION` | Medication dosage | `medication_amount`, `medication_unit` |

## Default Credentials

- Email: `malolegoff@gmail.com`
- Password: `malo1997`
