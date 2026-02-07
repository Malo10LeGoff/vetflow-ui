'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Category } from '@/types';
import { categoriesApi } from '@/lib/api';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChange?: () => void;
}

const PRESET_COLORS = [
  { name: 'Rouge', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Jaune', value: '#EAB308' },
  { name: 'Vert', value: '#22C55E' },
  { name: 'Bleu', value: '#3B82F6' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Rose', value: '#EC4899' },
  { name: 'Gris', value: '#6B7280' },
];

export default function CategoryManagementModal({ isOpen, onClose, onCategoriesChange }: CategoryManagementModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await categoriesApi.getAll();
      // Handle both array and paginated response
      const items = Array.isArray(response) ? response : (response.items || []);
      setCategories(items);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load categories when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, loadCategories]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsAdding(false);
      setEditingCategory(null);
      setFormData({ name: '', color: '#3B82F6' });
      setError(null);
      setDeleteConfirm(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        if (deleteConfirm) {
          setDeleteConfirm(null);
        } else if (isAdding || editingCategory) {
          setIsAdding(false);
          setEditingCategory(null);
          setFormData({ name: '', color: '#3B82F6' });
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, deleteConfirm, isAdding, editingCategory, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, color: category.color || '#6B7280' });
    setIsAdding(false);
    setError(null);
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingCategory(null);
    setFormData({ name: '', color: '#3B82F6' });
    setError(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingCategory(null);
    setFormData({ name: '', color: '#3B82F6' });
    setError(null);
  };

  const handleSubmit = async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError('Le nom est requis');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, { name: trimmedName, color: formData.color });
      } else {
        await categoriesApi.create({ name: trimmedName, color: formData.color });
      }
      await loadCategories();
      onCategoriesChange?.();
      handleCancel();
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setIsSubmitting(true);
    try {
      await categoriesApi.delete(deleteConfirm.id);
      await loadCategories();
      onCategoriesChange?.();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="card p-6 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Gérer les catégories</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            disabled={isSubmitting}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Add/Edit Form */}
        {(isAdding || editingCategory) && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="label">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Ex: Urgence"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Couleur</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-colors ${
                        formData.color === color.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color.value }} />
                      <span className="text-sm">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleCancel}
                  className="btn-secondary text-sm py-1.5"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn-primary text-sm py-1.5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {editingCategory ? 'Enregistrement...' : 'Ajout...'}
                    </span>
                  ) : (
                    editingCategory ? 'Enregistrer' : 'Ajouter'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune catégorie</p>
              <p className="text-sm mt-1">Créez votre première catégorie</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => {
                const colorValue = category.color || '#6B7280';
                return (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colorValue }}
                    />
                    <span className="font-medium text-gray-900">{category.name}</span>
                    <span
                      className="px-2 py-0.5 text-xs font-medium rounded-full"
                      style={{ backgroundColor: `${colorValue}20`, color: colorValue }}
                    >
                      Code Couleur
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(category)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      disabled={isSubmitting || isAdding || editingCategory !== null}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(category)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      disabled={isSubmitting || isAdding || editingCategory !== null}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>

        {/* Add Button */}
        {!isAdding && !editingCategory && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleStartAdd}
              className="w-full btn-secondary flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Ajouter une catégorie
            </button>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
            <div className="card p-6 w-full max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Supprimer la catégorie</h3>
              <p className="text-sm text-gray-600 mb-4">
                Êtes-vous sûr de vouloir supprimer la catégorie <strong>{deleteConfirm.name}</strong> ?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
