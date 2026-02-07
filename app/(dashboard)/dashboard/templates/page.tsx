'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { templatesApi } from '@/lib/api';
import { Template, TemplateDetails } from '@/types';

const PAGE_SIZE = 20;

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<TemplateDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
  });
  const [deleteModal, setDeleteModal] = useState<Template | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cloneModal, setCloneModal] = useState<Template | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);
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
    // Skip the initial render to avoid duplicate API call
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
      const response = await templatesApi.getAll(debouncedSearch, currentPage, PAGE_SIZE);
      if (mountedRef.current) {
        setTemplates(response.items);
        setTotalItems(response.total);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des templates');
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
    setFormData({ name: '' });
    setFormError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (template: Template) => {
    router.push(`/dashboard/templates/${template.id}`);
  };

  const handleToggleExpand = async (template: Template) => {
    if (expandedId === template.id) {
      // Collapse
      setExpandedId(null);
      setExpandedDetails(null);
      return;
    }

    // Expand and load details
    setExpandedId(template.id);
    setExpandedDetails(null);
    setIsLoadingDetails(true);

    try {
      const details = await templatesApi.getById(template.id);
      if (mountedRef.current) {
        setExpandedDetails(details);
      }
    } catch (err) {
      console.error('Error loading template details:', err);
    } finally {
      if (mountedRef.current) {
        setIsLoadingDetails(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setFormError('Le nom du template est requis');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await templatesApi.create({ name: formData.name.trim() });
      if (mountedRef.current) {
        loadData();
        setShowModal(false);
        resetForm();
      }
    } catch (err) {
      console.error('Error saving template:', err);
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
    const templateId = deleteModal.id;
    try {
      await templatesApi.delete(templateId);
      if (mountedRef.current) {
        // Use functional update to avoid stale closure
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        setDeleteModal(null);
      }
    } catch (err) {
      console.error('Error deleting template:', err);
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

  const handleOpenClone = (template: Template) => {
    setCloneModal(template);
    setCloneName(`${template.name} (copie)`);
    setCloneError(null);
  };

  const handleClone = async () => {
    if (!cloneModal || !cloneName.trim()) {
      setCloneError('Le nom est requis');
      return;
    }

    setIsCloning(true);
    setCloneError(null);

    try {
      // 1. Get the original template details
      const originalDetails = await templatesApi.getById(cloneModal.id);
      const originalRows = originalDetails.rows ?? [];
      const originalSchedules = originalDetails.schedules ?? [];
      const originalMaterials = originalDetails.materials ?? [];

      // 2. Create the new template
      const newTemplate = await templatesApi.create({ name: cloneName.trim() });

      // 3. Copy rows and build a map of old row ID -> new row ID for schedules
      const rowIdMap: Record<string, string> = {};
      for (const rowWithOptions of originalRows) {
        const row = rowWithOptions.row;
        const newRow = await templatesApi.addRow(newTemplate.id, {
          row_kind: row.row_kind,
          label: row.label || '',
          unit: row.unit || undefined,
          sort_order: row.sort_order,
          medication_id: row.medication_id || undefined,
          options: rowWithOptions.options?.map(o => o.value || '').filter(Boolean),
        });
        rowIdMap[row.id] = newRow.id;
      }

      // 4. Copy schedules (mapping row IDs)
      for (const schedule of originalSchedules) {
        const newRowId = rowIdMap[schedule.template_row_id];
        if (newRowId) {
          await templatesApi.addSchedule(newTemplate.id, {
            template_row_id: newRowId,
            interval_minutes: schedule.interval_minutes ?? 60,
            duration_days: schedule.duration_days ?? 1,
            start_offset_minutes: schedule.start_offset_minutes ?? 0,
          });
        }
      }

      // 5. Copy materials
      for (const mat of originalMaterials) {
        await templatesApi.addMaterial(newTemplate.id, {
          material_id: mat.material.id,
          default_quantity: mat.template_material.default_quantity ?? 1,
        });
      }

      if (mountedRef.current) {
        setCloneModal(null);
        setCloneName('');
        loadData();
      }
    } catch (err) {
      console.error('Error cloning template:', err);
      if (mountedRef.current) {
        setCloneError(err instanceof Error ? err.message : 'Erreur lors du clonage');
      }
    } finally {
      if (mountedRef.current) {
        setIsCloning(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-500 mt-1">Modèles de suivi hospitalier</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary">
          + Nouveau template
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
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

      {/* Templates list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {debouncedSearch ? 'Aucun résultat' : 'Aucun template'}
          </h3>
          <p className="text-gray-500 mb-4">
            {debouncedSearch
              ? 'Essayez avec un autre terme de recherche'
              : 'Commencez par créer un template de suivi'}
          </p>
          {!debouncedSearch && (
            <button onClick={handleOpenCreate} className="btn-primary">
              Nouveau template
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => {
            const isExpanded = expandedId === template.id;
            const details = isExpanded ? expandedDetails : null;
            const rows = details?.rows ?? [];
            const schedules = details?.schedules ?? [];
            const materials = details?.materials ?? [];

            return (
              <div key={template.id} className="card overflow-hidden">
                {/* Header row - clickable to expand */}
                <div
                  className="px-4 py-3 flex items-center cursor-pointer hover:bg-gray-50"
                  onClick={() => handleToggleExpand(template)}
                >
                  <svg
                    className={`w-4 h-4 text-gray-400 mr-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{template.name}</p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenClone(template)}
                      className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                      aria-label={`Cloner ${template.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(template)}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      aria-label={`Modifier ${template.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    {!template.is_default && (
                      <button
                        onClick={() => setDeleteModal(template)}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        aria-label={`Supprimer ${template.name}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
                    {isLoadingDetails ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : details ? (
                      <div className="grid grid-cols-3 gap-4">
                        {/* Rows */}
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                            Lignes ({rows.length})
                          </h4>
                          {rows.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Aucune</p>
                          ) : (
                            <div className="space-y-1">
                              {rows.slice(0, 5).map((row) => (
                                <div key={row.row.id} className="flex items-center gap-2">
                                  <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                                    row.row.row_kind === 'NUMERIC' ? 'bg-purple-100 text-purple-700' :
                                    row.row.row_kind === 'OPTION' ? 'bg-green-100 text-green-700' :
                                    row.row.row_kind === 'CHECK' ? 'bg-yellow-100 text-yellow-700' :
                                    row.row.row_kind === 'TEXT' ? 'bg-gray-100 text-gray-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {row.row.row_kind.slice(0, 3)}
                                  </span>
                                  <span className="text-sm text-gray-700 truncate">{row.row.label}</span>
                                </div>
                              ))}
                              {rows.length > 5 && (
                                <p className="text-xs text-gray-400">+{rows.length - 5} autres...</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Schedules */}
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                            Planifications ({schedules.length})
                          </h4>
                          {schedules.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Aucune</p>
                          ) : (
                            <div className="space-y-1">
                              {schedules.slice(0, 5).map((schedule) => {
                                const row = rows.find(r => r.row.id === schedule.template_row_id);
                                const intervalMinutes = schedule.interval_minutes ?? 0;
                                const durationDays = schedule.duration_days ?? 0;
                                const intervalHours = Math.floor(intervalMinutes / 60);
                                const intervalMins = intervalMinutes % 60;
                                return (
                                  <div key={schedule.id} className="text-sm text-gray-700">
                                    <span className="font-medium">{row ? row.row.label : '?'}</span>
                                    <span className="text-gray-500 text-xs ml-1">
                                      ({intervalHours > 0 ? `${intervalHours}h` : ''}{intervalMins > 0 ? `${intervalMins}m` : ''} / {durationDays}j)
                                    </span>
                                  </div>
                                );
                              })}
                              {schedules.length > 5 && (
                                <p className="text-xs text-gray-400">+{schedules.length - 5} autres...</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Materials */}
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                            Matériel ({materials.length})
                          </h4>
                          {materials.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Aucun</p>
                          ) : (
                            <div className="space-y-1">
                              {materials.slice(0, 5).map((mat) => (
                                <div key={mat.template_material.id} className="text-sm text-gray-700">
                                  <span>{mat.material.name}</span>
                                  <span className="text-gray-500 text-xs ml-1">
                                    ({mat.template_material.default_quantity ?? 0} {mat.material.unit})
                                  </span>
                                </div>
                              ))}
                              {materials.length > 5 && (
                                <p className="text-xs text-gray-400">+{materials.length - 5} autres...</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-sm text-gray-500">
                {totalItems} template{totalItems > 1 ? 's' : ''} au total
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

      {/* Create Modal */}
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
              Nouveau template
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="template-name" className="label">Nom du template *</label>
                <input
                  id="template-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`input ${formError ? 'border-red-500' : ''}`}
                  placeholder="Ex: Post-opératoire colique"
                  disabled={isSubmitting}
                />
                {formError && (
                  <p className="mt-1 text-sm text-red-600">{formError}</p>
                )}
              </div>
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
                    Création...
                  </span>
                ) : (
                  'Créer'
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
                <h3 id="delete-modal-title" className="text-lg font-semibold text-gray-900">Supprimer le template</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{deleteModal.name}</p>
                  <p className="text-sm text-gray-500">Template de suivi</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer ce template ? Toutes les lignes et le matériel associés seront également supprimés.
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

      {/* Clone Modal */}
      {cloneModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => !isCloning && handleBackdropClick(e, () => { setCloneModal(null); setCloneName(''); setCloneError(null); })}
          role="dialog"
          aria-modal="true"
          aria-labelledby="clone-modal-title"
        >
          <div className="card p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 id="clone-modal-title" className="text-lg font-semibold text-gray-900">Cloner le template</h3>
                <p className="text-sm text-gray-500">{cloneModal.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="clone-name" className="label">Nom du nouveau template *</label>
                <input
                  id="clone-name"
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  className={`input ${cloneError ? 'border-red-500' : ''}`}
                  placeholder="Ex: Post-opératoire colique (copie)"
                  disabled={isCloning}
                />
                {cloneError && (
                  <p className="mt-1 text-sm text-red-600">{cloneError}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setCloneModal(null); setCloneName(''); setCloneError(null); }}
                className="btn-secondary"
                disabled={isCloning}
              >
                Annuler
              </button>
              <button
                onClick={handleClone}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={isCloning}
              >
                {isCloning ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Clonage...
                  </span>
                ) : (
                  'Cloner'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
