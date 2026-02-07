'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { medicationsApi } from '@/lib/api';
import { Medication } from '@/types';

const PAGE_SIZE = 20;

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    reference_unit: '',
    dose_min_per_kg: '',
    dose_max_per_kg: '',
    dose_unit: '',
    concentration: '',
    concentration_unit: '',
    notes: '',
  });
  const [dosageDisplayMode, setDosageDisplayMode] = useState<'mg' | 'ml'>('mg');
  const [deleteModal, setDeleteModal] = useState<Medication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const mountedRef = useRef(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Debounce search and reset page
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        setDebouncedSearch(search);
        setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await medicationsApi.getAll(debouncedSearch, currentPage, PAGE_SIZE);
      if (mountedRef.current) {
        setMedications(response.items);
        setTotalItems(response.total);
      }
    } catch (err) {
      console.error('Error loading medications:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des médicaments');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [debouncedSearch, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Escape key for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteModal && !isDeleting) {
          setDeleteModal(null);
        } else if (showModal && !isSubmitting) {
          setShowModal(false);
          resetForm();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deleteModal, showModal, isDeleting, isSubmitting]);

  // Focus trap for create/edit modal
  useEffect(() => {
    if (showModal && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      firstElement?.focus();

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    }
  }, [showModal]);

  // Focus trap for delete modal
  useEffect(() => {
    if (deleteModal && deleteModalRef.current) {
      const focusableElements = deleteModalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      firstElement?.focus();

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    }
  }, [deleteModal]);

  const resetForm = () => {
    setFormData({
      name: '',
      reference_unit: '',
      dose_min_per_kg: '',
      dose_max_per_kg: '',
      dose_unit: '',
      concentration: '',
      concentration_unit: '',
      notes: '',
    });
    setEditingMedication(null);
    setFormError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (medication: Medication) => {
    setEditingMedication(medication);
    const doseMin = medication.dose_min_per_kg;
    const doseMax = medication.dose_max_per_kg;
    const concentration = medication.concentration;
    setFormData({
      name: medication.name || '',
      reference_unit: medication.reference_unit || '',
      dose_min_per_kg: doseMin !== null ? doseMin.toString() : '',
      dose_max_per_kg: doseMax !== null ? doseMax.toString() : '',
      dose_unit: medication.dose_unit || '',
      concentration: concentration !== null ? concentration.toString() : '',
      concentration_unit: medication.concentration_unit || '',
      notes: medication.notes || '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const parseOptionalNumber = (value: string): number | undefined => {
    if (!value.trim()) return undefined;
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return undefined;
    return parsed;
  };

  const handleSubmit = async () => {
    const trimmedName = formData.name.trim();
    const trimmedUnit = formData.reference_unit.trim();

    if (!trimmedName || !trimmedUnit) {
      setFormError('Le nom et l\'unité de référence sont requis');
      return;
    }

    // Validate numeric fields
    const doseMin = parseOptionalNumber(formData.dose_min_per_kg);
    const doseMax = parseOptionalNumber(formData.dose_max_per_kg);
    const concentration = parseOptionalNumber(formData.concentration);

    if (formData.dose_min_per_kg.trim() && doseMin === undefined) {
      setFormError('La dose minimum doit être un nombre valide');
      return;
    }

    if (formData.dose_max_per_kg.trim() && doseMax === undefined) {
      setFormError('La dose maximum doit être un nombre valide');
      return;
    }

    if (formData.concentration.trim() && concentration === undefined) {
      setFormError('La concentration doit être un nombre valide');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      name: trimmedName,
      reference_unit: trimmedUnit,
      dose_min_per_kg: doseMin,
      dose_max_per_kg: doseMax,
      dose_unit: formData.dose_unit.trim() || undefined,
      concentration: concentration,
      concentration_unit: formData.concentration_unit.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    try {
      if (editingMedication) {
        await medicationsApi.update(editingMedication.id, payload);
      } else {
        await medicationsApi.create(payload);
      }
      if (mountedRef.current) {
        loadData();
        setShowModal(false);
        resetForm();
      }
    } catch (err) {
      console.error('Error saving medication:', err);
      if (mountedRef.current) {
        setFormError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    setError(null);
    const medicationId = deleteModal.id;
    try {
      await medicationsApi.delete(medicationId);
      if (mountedRef.current) {
        setMedications(prev => prev.filter(m => m.id !== medicationId));
        setDeleteModal(null);
      }
    } catch (err) {
      console.error('Error deleting medication:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
        setDeleteModal(null);
      }
    } finally {
      if (mountedRef.current) {
        setIsDeleting(false);
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent, onClose: () => void) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800" aria-label="Fermer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher par nom ou notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Medications list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : medications.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {debouncedSearch ? 'Aucun résultat' : 'Aucun médicament'}
          </h3>
          <p className="text-gray-500 mb-4">
            {debouncedSearch
              ? 'Essayez avec un autre terme de recherche'
              : 'Commencez par ajouter des médicaments à votre base de données'}
          </p>
          {!debouncedSearch && (
            <button onClick={handleOpenCreate} className="btn-primary">
              Ajouter un médicament
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Unité</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Concentration</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-2">
                    <span>Dosage</span>
                    <button
                      onClick={() => setDosageDisplayMode(prev => prev === 'mg' ? 'ml' : 'mg')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
                      title={`Afficher en ${dosageDisplayMode === 'mg' ? 'ml' : 'mg'}`}
                    >
                      {dosageDisplayMode === 'mg' ? (
                        <>
                          <span>mg</span>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>ml</span>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </th>
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
                    {med.concentration !== null ? `${med.concentration} ${med.concentration_unit || 'mg/ml'}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {(() => {
                      const doseMin = med.dose_min_per_kg;
                      const doseMax = med.dose_max_per_kg;
                      const doseUnit = med.dose_unit || 'mg';
                      const concentration = med.concentration;

                      // Convert to ml if display mode is ml and concentration is available
                      // Formula: volume (ml) = dose (mg/kg) × weight (kg) ÷ concentration (mg/ml)
                      // Per kg: ml/kg = (mg/kg) / (mg/ml)
                      const convertToMl = dosageDisplayMode === 'ml' && concentration !== null && concentration > 0;
                      const displayMin = convertToMl && doseMin !== null ? (doseMin / concentration).toFixed(3) : doseMin;
                      const displayMax = convertToMl && doseMax !== null ? (doseMax / concentration).toFixed(3) : doseMax;
                      const displayUnit = convertToMl ? 'ml/kg' : `${doseUnit}/kg`;

                      if (doseMin !== null && doseMax !== null) {
                        return <>{displayMin} - {displayMax} {displayUnit}</>;
                      } else if (doseMin !== null) {
                        return <>{displayMin} {displayUnit}</>;
                      }
                      return '-';
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                    {med.notes || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(med)}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        aria-label={`Modifier ${med.name}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteModal(med)}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        aria-label={`Supprimer ${med.name}`}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {totalItems} médicament{totalItems > 1 ? 's' : ''} au total
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => !isSubmitting && handleBackdropClick(e, () => { setShowModal(false); resetForm(); })}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div ref={modalRef} className="card p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 id="modal-title" className="text-lg font-semibold text-gray-900 mb-4">
              {editingMedication ? 'Modifier le médicament' : 'Ajouter un médicament'}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="med-name" className="label">Nom *</label>
                <input
                  id="med-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Ex: Flunixine méglumine (Finadyne)"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="med-unit" className="label">Unité de référence *</label>
                <input
                  id="med-unit"
                  type="text"
                  value={formData.reference_unit}
                  onChange={(e) => setFormData({ ...formData, reference_unit: e.target.value })}
                  className="input"
                  placeholder="Ex: ml, g, seringue"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Les doses sont calculées par kg de poids du cheval</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="med-dose-min" className="label">Dose min</label>
                    <div className="relative">
                      <input
                        id="med-dose-min"
                        type="number"
                        step="0.01"
                        value={formData.dose_min_per_kg}
                        onChange={(e) => setFormData({ ...formData, dose_min_per_kg: e.target.value })}
                        className="input pr-16"
                        placeholder="0.5"
                        disabled={isSubmitting}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        {formData.dose_unit ? `${formData.dose_unit}/kg` : '/kg'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="med-dose-max" className="label">Dose max</label>
                    <div className="relative">
                      <input
                        id="med-dose-max"
                        type="number"
                        step="0.01"
                        value={formData.dose_max_per_kg}
                        onChange={(e) => setFormData({ ...formData, dose_max_per_kg: e.target.value })}
                        className="input pr-16"
                        placeholder="1.1"
                        disabled={isSubmitting}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        {formData.dose_unit ? `${formData.dose_unit}/kg` : '/kg'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="med-dose-unit" className="label">Unité</label>
                    <input
                      id="med-dose-unit"
                      type="text"
                      value={formData.dose_unit}
                      onChange={(e) => setFormData({ ...formData, dose_unit: e.target.value.replace(/\//g, '') })}
                      className="input"
                      placeholder="mg"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Concentration</label>
                <p className="text-xs text-gray-500 mb-2">Permet le calcul automatique : volume (ml) = dose (mg/kg) × poids (kg) ÷ concentration</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      id="med-concentration"
                      type="number"
                      step="0.01"
                      value={formData.concentration}
                      onChange={(e) => setFormData({ ...formData, concentration: e.target.value })}
                      className="input"
                      placeholder="Ex: 50"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <input
                      id="med-concentration-unit"
                      type="text"
                      value={formData.concentration_unit}
                      onChange={(e) => setFormData({ ...formData, concentration_unit: e.target.value })}
                      className="input"
                      placeholder="mg/ml"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="med-notes" className="label">Notes</label>
                <textarea
                  id="med-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Ex: AINS - Anti-douleur"
                  disabled={isSubmitting}
                />
              </div>
              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button onClick={handleSubmit} className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingMedication ? 'Enregistrement...' : 'Ajout...'}
                  </span>
                ) : (
                  editingMedication ? 'Enregistrer' : 'Ajouter'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => !isDeleting && handleBackdropClick(e, () => setDeleteModal(null))}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div ref={deleteModalRef} className="card p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 id="delete-modal-title" className="text-lg font-semibold text-gray-900">Supprimer le médicament</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{deleteModal.name}</p>
                  <p className="text-sm text-gray-500">{deleteModal.reference_unit}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer ce médicament ? Il ne sera plus disponible pour les prescriptions.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="btn-secondary"
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={isDeleting}
                aria-label="Confirmer la suppression"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Suppression...
                  </span>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
