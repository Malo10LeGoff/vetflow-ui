'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { materialsApi } from '@/lib/api';
import { safeString } from '@/lib/utils';
import { Material } from '@/types';

const PAGE_SIZE = 20;

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
  });
  const [deleteModal, setDeleteModal] = useState<Material | null>(null);
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
      const response = await materialsApi.getAll(debouncedSearch, currentPage, PAGE_SIZE);
      if (mountedRef.current) {
        setMaterials(response.items);
        setTotalItems(response.total);
      }
    } catch (err) {
      console.error('Error loading materials:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement du matériel');
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
    setFormData({ name: '', unit: '' });
    setEditingMaterial(null);
    setFormError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      name: safeString(material.name) || '',
      unit: safeString(material.unit) || '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const trimmedName = formData.name.trim();
    const trimmedUnit = formData.unit.trim();

    if (!trimmedName || !trimmedUnit) {
      setFormError('Le nom et l\'unité sont requis');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const payload = { name: trimmedName, unit: trimmedUnit };
      if (editingMaterial) {
        await materialsApi.update(editingMaterial.id, payload);
      } else {
        await materialsApi.create(payload);
      }
      if (mountedRef.current) {
        loadData();
        setShowModal(false);
        resetForm();
      }
    } catch (err) {
      console.error('Error saving material:', err);
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
    const materialId = deleteModal.id;
    try {
      await materialsApi.delete(materialId);
      if (mountedRef.current) {
        setMaterials(prev => prev.filter(m => m.id !== materialId));
        setDeleteModal(null);
      }
    } catch (err) {
      console.error('Error deleting material:', err);
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
          <h1 className="text-2xl font-bold text-gray-900">Matériel</h1>
          <p className="text-gray-500 mt-1">Base de données du matériel médical</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary">
          + Ajouter du matériel
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
            placeholder="Rechercher par nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Materials list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : materials.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {debouncedSearch ? 'Aucun résultat' : 'Aucun matériel'}
          </h3>
          <p className="text-gray-500 mb-4">
            {debouncedSearch
              ? 'Essayez avec un autre terme de recherche'
              : 'Commencez par ajouter du matériel à votre base de données'}
          </p>
          {!debouncedSearch && (
            <button onClick={handleOpenCreate} className="btn-primary">
              Ajouter du matériel
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
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((mat) => (
                <tr key={mat.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{safeString(mat.name)}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{safeString(mat.unit)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(mat)}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        aria-label={`Modifier ${safeString(mat.name)}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteModal(mat)}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        aria-label={`Supprimer ${safeString(mat.name)}`}
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
                {totalItems} matériel{totalItems > 1 ? 's' : ''} au total
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
          <div ref={modalRef} className="card p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 id="modal-title" className="text-lg font-semibold text-gray-900 mb-4">
              {editingMaterial ? 'Modifier le matériel' : 'Ajouter du matériel'}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="material-name" className="label">Nom *</label>
                <input
                  id="material-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`input ${formError ? 'border-red-500' : ''}`}
                  placeholder="Ex: Cathéter IV 14G"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="material-unit" className="label">Unité *</label>
                <input
                  id="material-unit"
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={`input ${formError ? 'border-red-500' : ''}`}
                  placeholder="Ex: unité, L, ml"
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
                    {editingMaterial ? 'Enregistrement...' : 'Ajout...'}
                  </span>
                ) : (
                  editingMaterial ? 'Enregistrer' : 'Ajouter'
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
                <h3 id="delete-modal-title" className="text-lg font-semibold text-gray-900">Supprimer le matériel</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{safeString(deleteModal.name)}</p>
                  <p className="text-sm text-gray-500">{safeString(deleteModal.unit)}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer ce matériel ? Il ne sera plus disponible pour les hospitalisations.
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
