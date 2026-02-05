'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hospitalizationsApi, templatesApi } from '@/lib/api';
import { Template, HospitalizationCategory } from '@/types';

const categories: { value: HospitalizationCategory; label: string }[] = [
  { value: 'colique', label: 'Colique' },
  { value: 'chirurgie', label: 'Chirurgie' },
  { value: 'soins_intensifs', label: 'Soins intensifs' },
  { value: 'poulain', label: 'Poulain' },
  { value: 'castration', label: 'Castration' },
  { value: 'autre', label: 'Autre' },
];

export default function NewPatientPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    horse_name: '',
    owner_name: '',
    owner_phone: '',
    owner_email: '',
    age_value: '',
    age_unit: 'years' as 'years' | 'months',
    weight_kg: '',
    category: 'colique' as HospitalizationCategory,
    admission_at: new Date().toISOString().slice(0, 16),
    template_id: '',
  });

  useEffect(() => {
    templatesApi.getAll().then(setTemplates);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation
    const weight = parseFloat(formData.weight_kg);
    const age = parseFloat(formData.age_value);

    if (isNaN(weight) || weight <= 0) {
      setError('Le poids doit être supérieur à 0');
      setIsLoading(false);
      return;
    }

    if (isNaN(age) || age <= 0) {
      setError('L\'âge doit être supérieur à 0');
      setIsLoading(false);
      return;
    }

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
        template_id: formData.template_id || undefined,
      };

      const hospitalization = await hospitalizationsApi.create(payload);
      router.push(`/dashboard/patient/${hospitalization.id}`);
    } catch (err) {
      setError('Une erreur est survenue lors de la création du patient');
      console.error(err);
    } finally {
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
              <label className="label" htmlFor="category">Catégorie clinique *</label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="input"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
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
    </div>
  );
}
