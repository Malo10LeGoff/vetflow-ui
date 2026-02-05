'use client';

import { useState, useEffect } from 'react';
import { medicationsApi } from '@/lib/api';
import { Medication } from '@/types';
import { safeString, safeNumber } from '@/lib/utils';

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    reference_unit: '',
    dose_min_per_kg: '',
    dose_max_per_kg: '',
    dose_unit: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await medicationsApi.getAll();
      setMedications(data);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      reference_unit: '',
      dose_min_per_kg: '',
      dose_max_per_kg: '',
      dose_unit: '',
      notes: '',
    });
    setEditingMedication(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (medication: Medication) => {
    setEditingMedication(medication);
    const doseMin = safeNumber(medication.dose_min_per_kg);
    const doseMax = safeNumber(medication.dose_max_per_kg);
    setFormData({
      name: medication.name,
      reference_unit: medication.reference_unit,
      dose_min_per_kg: doseMin !== null ? doseMin.toString() : '',
      dose_max_per_kg: doseMax !== null ? doseMax.toString() : '',
      dose_unit: safeString(medication.dose_unit) || '',
      notes: safeString(medication.notes) || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.reference_unit) return;

    const payload = {
      name: formData.name,
      reference_unit: formData.reference_unit,
      dose_min_per_kg: formData.dose_min_per_kg ? parseFloat(formData.dose_min_per_kg) : undefined,
      dose_max_per_kg: formData.dose_max_per_kg ? parseFloat(formData.dose_max_per_kg) : undefined,
      dose_unit: formData.dose_unit || undefined,
      notes: formData.notes || undefined,
    };

    try {
      if (editingMedication) {
        await medicationsApi.update(editingMedication.id, payload);
      } else {
        await medicationsApi.create(payload);
      }
      loadData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving medication:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce médicament ?')) return;
    try {
      await medicationsApi.delete(id);
      setMedications(medications.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting medication:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Médicaments</h1>
          <p className="text-gray-500 mt-1">Base de données des médicaments de la clinique</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary">
          + Ajouter un médicament
        </button>
      </div>

      {/* Medications list */}
      {medications.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun médicament</h3>
          <p className="text-gray-500 mb-4">Commencez par ajouter des médicaments à votre base de données</p>
          <button onClick={handleOpenCreate} className="btn-primary">
            Ajouter un médicament
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Unité</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Dosage</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Notes</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {medications.map((med) => (
                <tr key={med.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{med.name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{med.reference_unit}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {(() => {
                      const doseMin = safeNumber(med.dose_min_per_kg);
                      const doseMax = safeNumber(med.dose_max_per_kg);
                      const doseUnit = safeString(med.dose_unit);
                      if (doseMin !== null && doseMax !== null) {
                        return <>{doseMin} - {doseMax} {doseUnit}</>;
                      } else if (doseMin !== null) {
                        return <>{doseMin} {doseUnit}</>;
                      }
                      return '-';
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                    {safeString(med.notes) || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(med)}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(med.id)}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingMedication ? 'Modifier le médicament' : 'Ajouter un médicament'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Ex: Flunixine méglumine (Finadyne)"
                />
              </div>
              <div>
                <label className="label">Unité de référence *</label>
                <input
                  type="text"
                  value={formData.reference_unit}
                  onChange={(e) => setFormData({ ...formData, reference_unit: e.target.value })}
                  className="input"
                  placeholder="Ex: ml, g, seringue"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Dose min (par kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.dose_min_per_kg}
                    onChange={(e) => setFormData({ ...formData, dose_min_per_kg: e.target.value })}
                    className="input"
                    placeholder="0.5"
                  />
                </div>
                <div>
                  <label className="label">Dose max (par kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.dose_max_per_kg}
                    onChange={(e) => setFormData({ ...formData, dose_max_per_kg: e.target.value })}
                    className="input"
                    placeholder="1.1"
                  />
                </div>
                <div>
                  <label className="label">Unité dose</label>
                  <input
                    type="text"
                    value={formData.dose_unit}
                    onChange={(e) => setFormData({ ...formData, dose_unit: e.target.value })}
                    className="input"
                    placeholder="mg/kg"
                  />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Ex: AINS - Anti-douleur"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button onClick={handleSubmit} className="btn-primary">
                {editingMedication ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
