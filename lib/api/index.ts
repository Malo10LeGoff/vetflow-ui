/**
 * API Abstraction Layer
 */

import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdateUserRequest,
  AssignmentWithUser,
  Hospitalization,
  CreateHospitalizationRequest,
  ArchivedHospitalizationsResponse,
  ChartData,
  ChartRow,
  ChartEntry,
  Schedule,
  CreateChartRowRequest,
  CreateChartEntryRequest,
  CreateScheduleRequest,
  Medication,
  CreateMedicationRequest,
  MedicationSummary,
  Material,
  CreateMaterialRequest,
  MaterialUsageWithMaterial,
  CreateMaterialUsageRequest,
  MaterialSummary,
  Template,
  TemplateDetails,
  CreateTemplateRequest,
  CreateTemplateRowRequest,
  CreateTemplateScheduleRequest,
  CreateTemplateMaterialRequest,
  HospitalizationSummary,
  RowEntry,
  TemplateRow,
  PaginatedMaterials,
  PaginatedMedications,
  PaginatedTemplates,
  PaginatedUsers,
  PaginatedHospitalizations,
  Category,
  CreateCategoryRequest,
  PaginatedCategories,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const REQUEST_TIMEOUT_MS = 15000;

// Helper to get auth token
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

// Helper for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.error || errorBody.message || errorBody.detail || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La requête a expiré. Veuillez réessayer.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================
// AUTH API
// ============================================

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    return apiCall<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async register(data: RegisterRequest): Promise<LoginResponse> {
    return apiCall<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<User> {
    return apiCall<User>('/auth/me');
  },
};

// ============================================
// USERS API
// ============================================

export const usersApi = {
  async getAll(search = '', page = 1, pageSize = 100): Promise<PaginatedUsers> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.set('search', search);
    return apiCall<PaginatedUsers>(`/users?${params}`);
  },

  async getById(id: string): Promise<User> {
    return apiCall<User>(`/users/${id}`);
  },

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    return apiCall<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/users/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// HOSPITALIZATIONS API
// ============================================

export const hospitalizationsApi = {
  async getActive(search = '', page = 1, pageSize = 100): Promise<PaginatedHospitalizations> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.set('search', search);
    return apiCall<PaginatedHospitalizations>(`/hospitalizations?${params}`);
  },

  async getArchived(page = 1, pageSize = 10, search = '', category = ''): Promise<ArchivedHospitalizationsResponse> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    return apiCall<ArchivedHospitalizationsResponse>(`/hospitalizations/archived?${params}`);
  },

  async getById(id: string): Promise<Hospitalization> {
    return apiCall<Hospitalization>(`/hospitalizations/${id}`);
  },

  async create(data: CreateHospitalizationRequest): Promise<Hospitalization> {
    return apiCall<Hospitalization>('/hospitalizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async archive(id: string): Promise<void> {
    return apiCall<void>(`/hospitalizations/${id}/archive`, { method: 'POST' });
  },

  async unarchive(id: string): Promise<void> {
    return apiCall<void>(`/hospitalizations/${id}/unarchive`, { method: 'POST' });
  },

  async updateWeight(id: string, weight_kg: number): Promise<void> {
    return apiCall<void>(`/hospitalizations/${id}/weight`, {
      method: 'PUT',
      body: JSON.stringify({ weight_kg }),
    });
  },

  async getSummary(id: string): Promise<HospitalizationSummary> {
    return apiCall<HospitalizationSummary>(`/hospitalizations/${id}/summary`);
  },
};

// ============================================
// ASSIGNMENTS API
// ============================================

export const assignmentsApi = {
  async getAssignments(hospitalizationId: string): Promise<AssignmentWithUser[]> {
    return apiCall<AssignmentWithUser[]>(`/hospitalizations/${hospitalizationId}/assignments`);
  },

  async assign(hospitalizationId: string, userId: string): Promise<AssignmentWithUser> {
    return apiCall<AssignmentWithUser>(`/hospitalizations/${hospitalizationId}/assignments`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  async unassign(hospitalizationId: string, userId: string): Promise<void> {
    return apiCall<void>(`/hospitalizations/${hospitalizationId}/assignments/${userId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// CHART API
// ============================================

export const chartApi = {
  async getChart(hospitalizationId: string): Promise<ChartData> {
    return apiCall<ChartData>(`/hospitalizations/${hospitalizationId}/chart`);
  },

  async createRow(hospitalizationId: string, data: CreateChartRowRequest): Promise<ChartRow> {
    return apiCall<ChartRow>(`/hospitalizations/${hospitalizationId}/chart/rows`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRow(hospitalizationId: string, rowId: string, data: Partial<CreateChartRowRequest>): Promise<ChartRow> {
    return apiCall<ChartRow>(`/hospitalizations/${hospitalizationId}/chart/rows/${rowId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteRow(hospitalizationId: string, rowId: string): Promise<void> {
    return apiCall<void>(`/hospitalizations/${hospitalizationId}/chart/rows/${rowId}`, { method: 'DELETE' });
  },

  async getRowEntries(hospitalizationId: string, rowId: string): Promise<RowEntry[]> {
    return apiCall<RowEntry[]>(`/hospitalizations/${hospitalizationId}/chart/rows/${rowId}/entries`);
  },

  async createEntry(hospitalizationId: string, data: CreateChartEntryRequest): Promise<ChartEntry> {
    return apiCall<ChartEntry>(`/hospitalizations/${hospitalizationId}/chart/entries`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEntry(hospitalizationId: string, entryId: string, data: Partial<CreateChartEntryRequest>): Promise<ChartEntry> {
    return apiCall<ChartEntry>(`/hospitalizations/${hospitalizationId}/chart/entries/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteEntry(hospitalizationId: string, entryId: string): Promise<void> {
    return apiCall<void>(`/hospitalizations/${hospitalizationId}/chart/entries/${entryId}`, { method: 'DELETE' });
  },

  async createSchedule(hospitalizationId: string, data: CreateScheduleRequest): Promise<Schedule> {
    return apiCall<Schedule>(`/hospitalizations/${hospitalizationId}/schedules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteSchedule(hospitalizationId: string, scheduleId: string): Promise<void> {
    return apiCall<void>(`/hospitalizations/${hospitalizationId}/schedules/${scheduleId}`, { method: 'DELETE' });
  },

  async getMedicationSummary(hospitalizationId: string): Promise<MedicationSummary[]> {
    return apiCall<MedicationSummary[]>(`/hospitalizations/${hospitalizationId}/medications/summary`);
  },
};

// ============================================
// MATERIALS API
// ============================================

export const materialsApi = {
  async getAll(search = '', page = 1, pageSize = 20): Promise<PaginatedMaterials> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.set('search', search);
    return apiCall<PaginatedMaterials>(`/materials?${params}`);
  },

  async create(data: CreateMaterialRequest): Promise<Material> {
    return apiCall<Material>('/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: CreateMaterialRequest): Promise<Material> {
    return apiCall<Material>(`/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/materials/${id}`, { method: 'DELETE' });
  },

  async getUsage(hospitalizationId: string): Promise<MaterialUsageWithMaterial[]> {
    return apiCall<MaterialUsageWithMaterial[]>(`/hospitalizations/${hospitalizationId}/materials`);
  },

  async addUsage(hospitalizationId: string, data: CreateMaterialUsageRequest): Promise<MaterialUsageWithMaterial> {
    return apiCall<MaterialUsageWithMaterial>(`/hospitalizations/${hospitalizationId}/materials`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateUsage(hospitalizationId: string, usageId: string, quantity: number): Promise<void> {
    return apiCall<void>(`/hospitalizations/${hospitalizationId}/materials/${usageId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  async deleteUsage(hospitalizationId: string, usageId: string): Promise<void> {
    return apiCall<void>(`/hospitalizations/${hospitalizationId}/materials/${usageId}`, { method: 'DELETE' });
  },

  async getUsageSummary(hospitalizationId: string): Promise<MaterialSummary[]> {
    return apiCall<MaterialSummary[]>(`/hospitalizations/${hospitalizationId}/materials/summary`);
  },
};

// ============================================
// MEDICATIONS API
// ============================================

export const medicationsApi = {
  async getAll(search = '', page = 1, pageSize = 20): Promise<PaginatedMedications> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.set('search', search);
    return apiCall<PaginatedMedications>(`/medications?${params}`);
  },

  async getById(id: string): Promise<Medication> {
    return apiCall<Medication>(`/medications/${id}`);
  },

  async create(data: CreateMedicationRequest): Promise<Medication> {
    return apiCall<Medication>('/medications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: CreateMedicationRequest): Promise<Medication> {
    return apiCall<Medication>(`/medications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/medications/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// TEMPLATES API
// ============================================

export const templatesApi = {
  async getAll(search = '', page = 1, pageSize = 20): Promise<PaginatedTemplates> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.set('search', search);
    return apiCall<PaginatedTemplates>(`/templates?${params}`);
  },

  async getById(id: string): Promise<TemplateDetails> {
    return apiCall<TemplateDetails>(`/templates/${id}`);
  },

  async create(data: CreateTemplateRequest): Promise<Template> {
    return apiCall<Template>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: CreateTemplateRequest): Promise<Template> {
    return apiCall<Template>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/templates/${id}`, { method: 'DELETE' });
  },

  async addRow(templateId: string, data: CreateTemplateRowRequest): Promise<TemplateRow> {
    return apiCall<TemplateRow>(`/templates/${templateId}/rows`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteRow(templateId: string, rowId: string): Promise<void> {
    return apiCall<void>(`/templates/${templateId}/rows/${rowId}`, { method: 'DELETE' });
  },

  async addSchedule(templateId: string, data: CreateTemplateScheduleRequest): Promise<void> {
    await apiCall(`/templates/${templateId}/schedules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteSchedule(templateId: string, scheduleId: string): Promise<void> {
    return apiCall<void>(`/templates/${templateId}/schedules/${scheduleId}`, { method: 'DELETE' });
  },

  async addMaterial(templateId: string, data: CreateTemplateMaterialRequest): Promise<void> {
    await apiCall(`/templates/${templateId}/materials`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async removeMaterial(templateId: string, materialId: string): Promise<void> {
    return apiCall<void>(`/templates/${templateId}/materials/${materialId}`, { method: 'DELETE' });
  },
};

// ============================================
// CATEGORIES API
// ============================================

export const categoriesApi = {
  async getAll(): Promise<PaginatedCategories> {
    return apiCall<PaginatedCategories>('/categories');
  },

  async create(data: CreateCategoryRequest): Promise<Category> {
    return apiCall<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: CreateCategoryRequest): Promise<Category> {
    return apiCall<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/categories/${id}`, { method: 'DELETE' });
  },
};
