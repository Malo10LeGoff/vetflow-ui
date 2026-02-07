'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { templatesApi, materialsApi, medicationsApi } from '@/lib/api';
import {
  TemplateDetails,
  Material,
  Medication,
  RowKind,
  CreateTemplateRowRequest,
  CreateTemplateScheduleRequest,
  CreateTemplateMaterialRequest,
} from '@/types';

type AddModalType = 'row' | 'schedule' | 'material' | null;

export default function TemplateEditPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [templateDetails, setTemplateDetails] = useState<TemplateDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Template name editing
  const [templateName, setTemplateName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Add modal state
  const [addModal, setAddModal] = useState<AddModalType>(null);

  // Materials and medications for dropdowns
  const [materials, setMaterials] = useState<Material[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);

  // Row form
  const [rowForm, setRowForm] = useState({
    row_kind: 'NUMERIC' as RowKind,
    label: '',
    unit: '',
    options: '',
    medication_id: '',
  });

  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    template_row_id: '',
    interval_hours: '',
    interval_minutes: '',
    duration_days: '',
  });

  // Material form
  const [materialForm, setMaterialForm] = useState({
    material_id: '',
    default_quantity: '',
  });

  const mountedRef = useRef(true);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadTemplateDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const details = await templatesApi.getById(templateId);
      if (mountedRef.current) {
        setTemplateDetails(details);
        setTemplateName(details.template.name || '');
      }
    } catch (err) {
      console.error('Error loading template:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement du template');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [templateId]);

  const loadMaterialsAndMedications = useCallback(async () => {
    try {
      const [materialsRes, medicationsRes] = await Promise.all([
        materialsApi.getAll('', 1, 100),
        medicationsApi.getAll('', 1, 100),
      ]);
      if (mountedRef.current) {
        setMaterials(materialsRes.items);
        setMedications(medicationsRes.items);
      }
    } catch (err) {
      console.error('Error loading materials/medications:', err);
    }
  }, []);

  useEffect(() => {
    loadTemplateDetails();
    loadMaterialsAndMedications();
  }, [loadTemplateDetails, loadMaterialsAndMedications]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && addModal && !isSubmitting) {
        closeAddModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [addModal, isSubmitting]);

  const closeAddModal = () => {
    setAddModal(null);
    setFormError(null);
    setRowForm({ row_kind: 'NUMERIC', label: '', unit: '', options: '', medication_id: '' });
    setScheduleForm({ template_row_id: '', interval_hours: '', interval_minutes: '', duration_days: '' });
    setMaterialForm({ material_id: '', default_quantity: '' });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      closeAddModal();
    }
  };

  // Save template name
  const handleSaveName = async () => {
    if (!templateName.trim()) {
      setFormError('Le nom est requis');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await templatesApi.update(templateId, { name: templateName.trim() });
      if (mountedRef.current) {
        setIsEditingName(false);
        loadTemplateDetails();
      }
    } catch (err) {
      console.error('Error updating template name:', err);
      if (mountedRef.current) {
        setFormError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  // Add row
  const handleAddRow = async () => {
    if (!rowForm.label.trim()) {
      setFormError('Le libellé est requis');
      return;
    }
    if (rowForm.row_kind === 'OPTION' && !rowForm.options.trim()) {
      setFormError('Les options sont requises pour ce type');
      return;
    }
    if (rowForm.row_kind === 'MEDICATION' && !rowForm.medication_id) {
      setFormError('Veuillez sélectionner un médicament');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const data: CreateTemplateRowRequest = {
        row_kind: rowForm.row_kind,
        label: rowForm.label.trim(),
        sort_order: templateDetails?.rows.length || 0,
      };
      if (rowForm.unit.trim()) data.unit = rowForm.unit.trim();
      if (rowForm.row_kind === 'OPTION') {
        data.options = rowForm.options.split(',').map(o => o.trim()).filter(Boolean);
      }
      if (rowForm.row_kind === 'MEDICATION' && rowForm.medication_id) {
        data.medication_id = rowForm.medication_id;
      }

      await templatesApi.addRow(templateId, data);
      if (mountedRef.current) {
        closeAddModal();
        loadTemplateDetails();
      }
    } catch (err) {
      console.error('Error adding row:', err);
      if (mountedRef.current) {
        setFormError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout');
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  // Delete row
  const handleDeleteRow = async (rowId: string) => {
    try {
      await templatesApi.deleteRow(templateId, rowId);
      if (mountedRef.current) {
        loadTemplateDetails();
      }
    } catch (err) {
      console.error('Error deleting row:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      }
    }
  };

  // Add schedule
  const handleAddSchedule = async () => {
    if (!scheduleForm.template_row_id) {
      setFormError('Veuillez sélectionner une ligne');
      return;
    }
    const hours = parseInt(scheduleForm.interval_hours) || 0;
    const mins = parseInt(scheduleForm.interval_minutes) || 0;
    const intervalMinutes = hours * 60 + mins;
    if (intervalMinutes <= 0) {
      setFormError('L\'intervalle doit être supérieur à 0');
      return;
    }
    const durationDays = parseInt(scheduleForm.duration_days);
    if (!durationDays || durationDays <= 0) {
      setFormError('La durée doit être supérieure à 0');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const data: CreateTemplateScheduleRequest = {
        template_row_id: scheduleForm.template_row_id,
        interval_minutes: intervalMinutes,
        duration_days: durationDays,
      };

      await templatesApi.addSchedule(templateId, data);
      if (mountedRef.current) {
        closeAddModal();
        loadTemplateDetails();
      }
    } catch (err) {
      console.error('Error adding schedule:', err);
      if (mountedRef.current) {
        setFormError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout');
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  // Delete schedule
  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await templatesApi.deleteSchedule(templateId, scheduleId);
      if (mountedRef.current) {
        loadTemplateDetails();
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      }
    }
  };

  // Add material
  const handleAddMaterial = async () => {
    if (!materialForm.material_id) {
      setFormError('Veuillez sélectionner un matériel');
      return;
    }
    const quantity = parseFloat(materialForm.default_quantity);
    if (!quantity || quantity <= 0) {
      setFormError('La quantité doit être supérieure à 0');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const data: CreateTemplateMaterialRequest = {
        material_id: materialForm.material_id,
        default_quantity: quantity,
      };

      await templatesApi.addMaterial(templateId, data);
      if (mountedRef.current) {
        closeAddModal();
        loadTemplateDetails();
      }
    } catch (err) {
      console.error('Error adding material:', err);
      if (mountedRef.current) {
        setFormError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout');
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  // Delete material
  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await templatesApi.removeMaterial(templateId, materialId);
      if (mountedRef.current) {
        loadTemplateDetails();
      }
    } catch (err) {
      console.error('Error deleting material:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !templateDetails) {
    return (
      <div className="card p-12 text-center">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Erreur</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={() => router.push('/dashboard/templates')} className="btn-primary">
          Retour aux templates
        </button>
      </div>
    );
  }

  if (!templateDetails) return null;

  // Ensure arrays are never null
  const templateRows = templateDetails.rows ?? [];
  const templateSchedules = templateDetails.schedules ?? [];
  const templateMaterials = templateDetails.materials ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/dashboard/templates')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="input text-2xl font-bold"
                autoFocus
              />
              <button onClick={handleSaveName} disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                onClick={() => {
                  setIsEditingName(false);
                  setTemplateName(templateDetails.template.name || '');
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {templateDetails.template.name}
              </h1>
              <button
                onClick={() => setIsEditingName(true)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
        </div>
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

      <div className="grid gap-6">
        {/* Rows Section */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Lignes ({templateRows.length})
            </h2>
            <button
              onClick={() => setAddModal('row')}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter
            </button>
          </div>
          {templateRows.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Aucune ligne configurée</p>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              {templateRows.map((rowWithOptions) => (
                <div key={rowWithOptions.row.id} className="p-3 flex items-center justify-between group hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                      rowWithOptions.row.row_kind === 'NUMERIC' ? 'bg-purple-100 text-purple-800' :
                      rowWithOptions.row.row_kind === 'OPTION' ? 'bg-green-100 text-green-800' :
                      rowWithOptions.row.row_kind === 'CHECK' ? 'bg-yellow-100 text-yellow-800' :
                      rowWithOptions.row.row_kind === 'TEXT' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {rowWithOptions.row.row_kind}
                    </span>
                    <span className="text-sm text-gray-900">{rowWithOptions.row.label}</span>
                    {rowWithOptions.row.unit && (
                      <span className="text-xs text-gray-500">({rowWithOptions.row.unit})</span>
                    )}
                    {(rowWithOptions.options?.length ?? 0) > 0 && (
                      <span className="text-xs text-gray-400">
                        [{rowWithOptions.options.map((o: { value: string }) => o.value).join(', ')}]
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteRow(rowWithOptions.row.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedules Section */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Planifications ({templateSchedules.length})
            </h2>
            <button
              onClick={() => setAddModal('schedule')}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              disabled={templateRows.length === 0}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter
            </button>
          </div>
          {templateSchedules.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Aucune planification configurée</p>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              {templateSchedules.map((schedule) => {
                const row = templateRows.find(r => r.row.id === schedule.template_row_id);
                const intervalMinutes = schedule.interval_minutes ?? 0;
                const durationDays = schedule.duration_days ?? 0;
                const intervalHours = Math.floor(intervalMinutes / 60);
                const intervalMins = intervalMinutes % 60;
                return (
                  <div key={schedule.id} className="p-3 flex items-center justify-between group hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-900">
                        {row ? row.row.label : 'Ligne inconnue'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Toutes les {intervalHours > 0 ? `${intervalHours}h` : ''}{intervalMins > 0 ? `${intervalMins}min` : ''} pendant {durationDays}j
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Supprimer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Materials Section */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Matériel ({templateMaterials.length})
            </h2>
            <button
              onClick={() => setAddModal('material')}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter
            </button>
          </div>
          {templateMaterials.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Aucun matériel configuré</p>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              {templateMaterials.map((mat) => (
                <div key={mat.template_material.id} className="p-3 flex items-center justify-between group hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-900">{mat.material.name}</span>
                    <span className="text-xs text-gray-500">
                      {mat.template_material.default_quantity ?? 0} {mat.material.unit}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteMaterial(mat.material.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Row Modal */}
      {addModal === 'row' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleBackdropClick}
        >
          <div ref={modalRef} className="card p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter une ligne</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Type *</label>
                <select
                  value={rowForm.row_kind}
                  onChange={(e) => setRowForm({ ...rowForm, row_kind: e.target.value as RowKind })}
                  className="input"
                >
                  <option value="NUMERIC">Numérique</option>
                  <option value="OPTION">Options</option>
                  <option value="CHECK">Case à cocher</option>
                  <option value="TEXT">Texte</option>
                  <option value="MEDICATION">Médicament</option>
                </select>
              </div>
              <div>
                <label className="label">Libellé *</label>
                <input
                  type="text"
                  value={rowForm.label}
                  onChange={(e) => setRowForm({ ...rowForm, label: e.target.value })}
                  className="input"
                  placeholder="Ex: Température"
                />
              </div>
              {(rowForm.row_kind === 'NUMERIC' || rowForm.row_kind === 'MEDICATION') && (
                <div>
                  <label className="label">Unité</label>
                  <input
                    type="text"
                    value={rowForm.unit}
                    onChange={(e) => setRowForm({ ...rowForm, unit: e.target.value })}
                    className="input"
                    placeholder="Ex: °C, bpm, ml"
                  />
                </div>
              )}
              {rowForm.row_kind === 'OPTION' && (
                <div>
                  <label className="label">Options (séparées par des virgules) *</label>
                  <input
                    type="text"
                    value={rowForm.options}
                    onChange={(e) => setRowForm({ ...rowForm, options: e.target.value })}
                    className="input"
                    placeholder="Ex: Absent, Diminué, Normal, Augmenté"
                  />
                </div>
              )}
              {rowForm.row_kind === 'MEDICATION' && (
                <div>
                  <label className="label">Médicament *</label>
                  <select
                    value={rowForm.medication_id}
                    onChange={(e) => setRowForm({ ...rowForm, medication_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Sélectionner...</option>
                    {medications.map((med) => (
                      <option key={med.id} value={med.id}>
                        {med.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {formError && <p className="text-sm text-red-600">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeAddModal} className="btn-secondary" disabled={isSubmitting}>
                Annuler
              </button>
              <button onClick={handleAddRow} className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {addModal === 'schedule' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleBackdropClick}
        >
          <div ref={modalRef} className="card p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter une planification</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Ligne *</label>
                <select
                  value={scheduleForm.template_row_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, template_row_id: e.target.value })}
                  className="input"
                >
                  <option value="">Sélectionner...</option>
                  {templateRows.map((row) => (
                    <option key={row.row.id} value={row.row.id}>
                      {row.row.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Intervalle *</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={scheduleForm.interval_hours}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, interval_hours: e.target.value })}
                      className="input"
                      placeholder="0"
                      min="0"
                    />
                    <span className="text-xs text-gray-500">heures</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={scheduleForm.interval_minutes}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, interval_minutes: e.target.value })}
                      className="input"
                      placeholder="0"
                      min="0"
                      max="59"
                    />
                    <span className="text-xs text-gray-500">minutes</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Durée (jours) *</label>
                <input
                  type="number"
                  value={scheduleForm.duration_days}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, duration_days: e.target.value })}
                  className="input"
                  placeholder="Ex: 3"
                  min="1"
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeAddModal} className="btn-secondary" disabled={isSubmitting}>
                Annuler
              </button>
              <button onClick={handleAddSchedule} className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {addModal === 'material' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleBackdropClick}
        >
          <div ref={modalRef} className="card p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter du matériel</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Matériel *</label>
                <select
                  value={materialForm.material_id}
                  onChange={(e) => setMaterialForm({ ...materialForm, material_id: e.target.value })}
                  className="input"
                >
                  <option value="">Sélectionner...</option>
                  {materials.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} ({mat.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Quantité par défaut *</label>
                <input
                  type="number"
                  value={materialForm.default_quantity}
                  onChange={(e) => setMaterialForm({ ...materialForm, default_quantity: e.target.value })}
                  className="input"
                  placeholder="Ex: 1"
                  min="0"
                  step="0.1"
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeAddModal} className="btn-secondary" disabled={isSubmitting}>
                Annuler
              </button>
              <button onClick={handleAddMaterial} className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
