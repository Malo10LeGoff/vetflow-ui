'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { hospitalizationsApi, templatesApi, categoriesApi, usersApi, assignmentsApi } from '@/lib/api';
import { Template, Category, User } from '@/types';
import CategoryManagementModal from '@/components/CategoryManagementModal';

export default function NewPatientPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [vets, setVets] = useState<User[]>([]);
  const [selectedVetId, setSelectedVetId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [formData, setFormData] = useState({
    horse_name: '',
    owner_name: '',
    owner_phone: '',
    owner_email: '',
    age_value: '',
    age_unit: 'years' as 'years' | 'months',
    weight_kg: '',
    category: '',
    admission_at: new Date().toISOString().slice(0, 16),
    admission_note: '',
    template_id: '',
  });

  const loadCategories = useCallback(async () => {
    try {
      const response = await categoriesApi.getAll();
      // Handle both array and paginated response
      const items = Array.isArray(response) ? response : (response.items || []);
      setCategories(items);
      // Use functional update to avoid stale closure
      if (items.length > 0) {
        setFormData(prev => prev.category ? prev : { ...prev, category: items[0].name });
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    templatesApi.getAll('', 1, 100).then(response => setTemplates(response.items || []));
    usersApi.getAll().then(response => {
      // Filter to only show VET and ASV roles
      const staffUsers = (response.items || []).filter(u => u.role === 'VET' || u.role === 'ASV');
      setVets(staffUsers);
    });
  }, [loadCategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    const weight = parseFloat(formData.weight_kg);
    const age = parseFloat(formData.age_value);

    if (isNaN(weight) || weight <= 0) {
      setError('Le poids doit être supérieur à 0');
      return;
    }

    if (isNaN(age) || age <= 0) {
      setError('L\'âge doit être supérieur à 0');
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const payload = {
        horse_name: formData.horse_name.toUpperCase(),
        owner_name: formData.owner_name,
        owner_phone: formData.owner_phone,
        owner_email: formData.owner_email || undefined,
        ...(formData.age_unit === 'years'
          ? { age_years: age }
          : { age_months: age }),
        weight_kg: weight,
        category: formData.category,
        admission_at: new Date(formData.admission_at).toISOString(),
        admission_note: formData.admission_note.trim() || undefined,
        template_id: formData.template_id || undefined,
      };

      const hospitalization = await hospitalizationsApi.create(payload);

      // Assign vet if selected
      if (selectedVetId) {
        await assignmentsApi.assign(hospitalization.id, selectedVetId);
      }

      // Ensure minimum 3 seconds of loading time
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 3000 - elapsed);

      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }

      router.push(`/dashboard/patient/${hospitalization.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du patient');
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nouveau patient</h1>
        <p className="text-gray-500 mt-1">Enregistrer un nouveau cheval en hospitalisation</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Horse info */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du cheval</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="horse_name">Nom du cheval *</label>
              <input
                type="text"
                id="horse_name"
                name="horse_name"
                required
                value={formData.horse_name}
                onChange={handleChange}
                className="input uppercase"
                placeholder="Ex: VULCAIN"
              />
            </div>
            <div>
              <label className="label" htmlFor="weight_kg">Poids (kg) *</label>
              <input
                type="number"
                id="weight_kg"
                name="weight_kg"
                required
                min="1"
                step="0.1"
                value={formData.weight_kg}
                onChange={handleChange}
                className="input"
                placeholder="Ex: 520"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Âge *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="age_value"
                  required
                  min="0.1"
                  step="0.1"
                  value={formData.age_value}
                  onChange={handleChange}
                  className="input flex-1"
                  placeholder="Ex: 8"
                />
                <select
                  name="age_unit"
                  value={formData.age_unit}
                  onChange={handleChange}
                  className="input w-32"
                >
                  <option value="years">Années</option>
                  <option value="months">Mois</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Owner info */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du propriétaire</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="owner_name">Nom du propriétaire *</label>
              <input
                type="text"
                id="owner_name"
                name="owner_name"
                required
                value={formData.owner_name}
                onChange={handleChange}
                className="input"
                placeholder="Ex: Marie Martin"
              />
            </div>
            <div>
              <label className="label" htmlFor="owner_phone">Téléphone *</label>
              <input
                type="tel"
                id="owner_phone"
                name="owner_phone"
                required
                value={formData.owner_phone}
                onChange={handleChange}
                className="input"
                placeholder="Ex: +33612345678"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label" htmlFor="owner_email">Email (optionnel)</label>
              <input
                type="email"
                id="owner_email"
                name="owner_email"
                value={formData.owner_email}
                onChange={handleChange}
                className="input"
                placeholder="Ex: marie.martin@email.com"
              />
            </div>
          </div>
        </div>

        {/* Hospitalization info */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hospitalisation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <label className="label" htmlFor="category">Catégorie clinique *</label>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Gérer les catégories"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="input"
              >
                {categories.length === 0 ? (
                  <option value="">Chargement...</option>
                ) : (
                  categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="template_id">Template (optionnel)</label>
              <select
                id="template_id"
                name="template_id"
                value={formData.template_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">Aucun template</option>
                {templates.map(tmpl => (
                  <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="assigned_vet">Vétérinaire assigné (optionnel)</label>
              <select
                id="assigned_vet"
                value={selectedVetId}
                onChange={(e) => setSelectedVetId(e.target.value)}
                className="input"
              >
                <option value="">Aucun</option>
                {vets.map(vet => (
                  <option key={vet.id} value={vet.id}>
                    {vet.first_name} {vet.last_name} ({vet.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label" htmlFor="admission_at">Date d&apos;admission *</label>
              <input
                type="datetime-local"
                id="admission_at"
                name="admission_at"
                required
                value={formData.admission_at}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label" htmlFor="admission_note">Note d&apos;arrivée (optionnel)</label>
              <textarea
                id="admission_note"
                name="admission_note"
                value={formData.admission_note}
                onChange={handleChange}
                className="input min-h-[100px]"
                placeholder="Ex: Colique depuis 4h, douleur intense. Distension abdominale, absence de bruits intestinaux."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Création...
              </span>
            ) : (
              'Créer le patient'
            )}
          </button>
        </div>
      </form>

      {/* Loading Modal */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-8 w-full max-w-sm mx-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Création en cours</h3>
            <p className="text-sm text-gray-500">
              Le patient est en cours de création...
            </p>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategoriesChange={loadCategories}
      />
    </div>
  );
}
