// User & Auth
export interface User {
  id: string;
  clinic_id: string;
  email: string;
  role: 'VET' | 'ASV' | 'ADMIN';
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  activation_code: string;
  email: string;
  password: string;
  role: 'VET' | 'ASV' | 'ADMIN';
  first_name: string;
  last_name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface UpdateUserRequest {
  email: string;
  role: 'VET' | 'ASV' | 'ADMIN';
  first_name: string;
  last_name: string;
}

// Horse & Owner
export interface Horse {
  id: string;
  clinic_id: string;
  owner_id: string;
  name: string;
  age_years: number;
  weight_kg: number;
  created_at: string;
}

export interface Owner {
  id: string;
  clinic_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  created_at: string;
}

// Hospitalization
export type HospitalizationStatus = 'ACTIVE' | 'ARCHIVED';
export type HospitalizationCategory = 'colique' | 'chirurgie' | 'soins_intensifs' | 'poulain' | 'castration' | 'autre';

export interface Hospitalization {
  id: string;
  horse: Horse;
  owner: Owner;
  category: HospitalizationCategory;
  admission_at: string;
  status: HospitalizationStatus;
  archived_at: string | null;
  duration_days: number;
  duration_hours: number;
  next_scheduled_at: string | null;
}

export interface CreateHospitalizationRequest {
  horse_name: string;
  owner_name: string;
  owner_phone: string;
  owner_email?: string | null;
  age_years?: number;
  age_months?: number;
  weight_kg: number;
  category: HospitalizationCategory;
  admission_at: string;
  template_id?: string;
}

export interface ArchivedHospitalizationsResponse {
  hospitalizations: Hospitalization[];
  total: number;
  page: number;
  page_size: number;
}

// Chart Row Types
export type RowKind = 'NUMERIC' | 'OPTION' | 'CHECK' | 'TEXT' | 'MEDICATION';

export interface ChartRow {
  id: string;
  clinic_id: string;
  hospitalization_id: string;
  row_kind: RowKind;
  label: string;
  unit: string | null;
  sort_order: number;
  medication_id: string | null;
  created_at: string;
}

export interface ChartEntry {
  id: string;
  clinic_id: string;
  hospitalization_id: string;
  chart_row_id: string;
  at_time: string;
  entry_type: RowKind;
  numeric_value: number | null;
  option_id: string | null;
  check_value: boolean | null;
  text_value: string | null;
  medication_amount: number | null;
  medication_unit: string | null;
  flagged: boolean;
  author_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  clinic_id: string;
  hospitalization_id: string;
  chart_row_id: string;
  start_at: string;
  interval_minutes: number;
  end_at: string | null;
  occurrences: number | null;
  default_text: string | null;
  default_numeric: number | null;
  default_unit: string | null;
  created_by_user_id: string;
  created_at: string;
}

export interface ChartData {
  rows: ChartRow[];
  entries: ChartEntry[];
  schedules: Schedule[];
}

export interface CreateChartRowRequest {
  row_kind: RowKind;
  label: string;
  unit?: string;
  sort_order: number;
  medication_id?: string;
}

export interface CreateChartEntryRequest {
  chart_row_id: string;
  at_time: string;
  entry_type: RowKind;
  numeric_value?: number;
  option_id?: string;
  check_value?: boolean;
  text_value?: string;
  medication_amount?: number;
  medication_unit?: string;
  flagged?: boolean;
}

export interface CreateScheduleRequest {
  chart_row_id: string;
  start_at: string;
  interval_minutes: number;
  end_at?: string;
  occurrences?: number;
  default_text?: string;
  default_numeric?: number;
  default_unit?: string;
}

// Medication
export interface Medication {
  id: string;
  clinic_id: string;
  name: string;
  reference_unit: string;
  dose_min_per_kg: number | null;
  dose_max_per_kg: number | null;
  dose_unit: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateMedicationRequest {
  name: string;
  reference_unit: string;
  dose_min_per_kg?: number;
  dose_max_per_kg?: number;
  dose_unit?: string;
  notes?: string;
}

export interface MedicationSummary {
  medication_id: string;
  name: string;
  total_amount: number;
  unit: string;
}

// Material
export interface Material {
  id: string;
  clinic_id: string;
  name: string;
  unit: string;
  created_at: string;
}

export interface CreateMaterialRequest {
  name: string;
  unit: string;
}

export interface MaterialUsage {
  id: string;
  clinic_id: string;
  hospitalization_id: string;
  material_id: string;
  quantity: number;
  at_time: string;
  author_user_id: string;
  created_at: string;
}

export interface MaterialUsageWithMaterial {
  usage: MaterialUsage;
  material: Material;
}

export interface CreateMaterialUsageRequest {
  material_id: string;
  quantity: number;
  at_time: string;
}

export interface MaterialSummary {
  material_id: string;
  material_name: string;
  unit: string;
  total_quantity: number;
}

// Template
export interface Template {
  id: string;
  clinic_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export interface TemplateRowOption {
  id: string;
  clinic_id?: string;
  template_row_id: string;
  value: string;
  sort_order: number;
}

export interface TemplateRow {
  id: string;
  clinic_id: string;
  template_id: string;
  row_kind: RowKind;
  label: string;
  unit: string | null;
  sort_order: number;
  medication_id: string | null;
  warn_low: number | null;
  warn_high: number | null;
  crit_low: number | null;
  crit_high: number | null;
}

export interface TemplateRowWithOptions {
  row: TemplateRow;
  options: TemplateRowOption[];
}

export interface TemplateSchedule {
  id: string;
  clinic_id: string;
  template_id: string;
  template_row_id: string;
  interval_minutes: number;
  start_offset_minutes: number;
  duration_days: number;
  default_text: string | null;
  default_numeric: number | null;
  default_unit: string | null;
}

export interface TemplateMaterial {
  id: string;
  clinic_id: string;
  template_id: string;
  material_id: string;
  default_quantity: number;
}

export interface TemplateMaterialWithMaterial {
  template_material: TemplateMaterial;
  material: Material;
}

export interface TemplateDetails {
  template: Template;
  rows: TemplateRowWithOptions[];
  schedules: TemplateSchedule[];
  materials: TemplateMaterialWithMaterial[];
}

export interface CreateTemplateRequest {
  name: string;
  is_default?: boolean;
}

export interface CreateTemplateRowRequest {
  row_kind: RowKind;
  label: string;
  unit?: string;
  sort_order: number;
  medication_id?: string;
  options?: string[];
  warn_low?: number;
  warn_high?: number;
  crit_low?: number;
  crit_high?: number;
}

export interface CreateTemplateScheduleRequest {
  template_row_id: string;
  interval_minutes: number;
  start_offset_minutes?: number;
  duration_days: number;
  default_text?: string;
  default_numeric?: number;
  default_unit?: string;
}

export interface CreateTemplateMaterialRequest {
  material_id: string;
  default_quantity: number;
}

// Summary for PDF
export interface HospitalizationSummary {
  hospitalization: {
    id: string;
    horse: { name: string; weight_kg: number };
    owner: { full_name: string };
    category: HospitalizationCategory;
    admission_at: string;
    duration_days: number;
    duration_hours: number;
  };
  medication_summary: MedicationSummary[];
  material_summary: MaterialSummary[];
}

// Row entries for graph
export interface RowEntry {
  id: string;
  at_time: string;
  numeric_value: number | null;
  flagged: boolean;
}
