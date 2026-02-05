'use client';

import { useState, useEffect } from 'react';
import { templatesApi, materialsApi, medicationsApi } from '@/lib/api';
import { safeString } from '@/lib/utils';
import { Template, TemplateDetails, Material, Medication, RowKind } from '@/types';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDetails | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newRow, setNewRow] = useState({
    row_kind: 'NUMERIC' as RowKind,
    label: '',
    unit: '',
    medication_id: '',
    options: '',
  });
  const [newMaterial, setNewMaterial] = useState({
    material_id: '',
    default_quantity: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tmplts, mats, meds] = await Promise.all([
        templatesApi.getAll(),
        materialsApi.getAll(),
        medicationsApi.getAll(),
      ]);
      setTemplates(tmplts);
      setMaterials(mats);
      setMedications(meds);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplateDetails = async (id: string) => {
    setIsLoadingDetails(true);
    try {
      const details = await templatesApi.getById(id);
      setSelectedTemplate(details);
    } catch (error) {
      console.error('Error loading template details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;
    try {
      const template = await templatesApi.create({ name: newTemplateName });
      setTemplates([...templates, template]);
      setNewTemplateName('');
      setShowCreateModal(false);
      loadTemplateDetails(template.id);
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Supprimer ce template ?')) return;
    try {
      await templatesApi.delete(id);
      setTemplates(templates.filter(t => t.id !== id));
      if (selectedTemplate?.template.id === id) {
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleAddRow = async () => {
    if (!selectedTemplate || !newRow.label) return;
    try {
      await templatesApi.addRow(selectedTemplate.template.id, {
        row_kind: newRow.row_kind,
        label: newRow.label,
        unit: newRow.unit || undefined,
        sort_order: (selectedTemplate.rows || []).length,
        medication_id: newRow.medication_id || undefined,
        options: newRow.row_kind === 'OPTION' && newRow.options
          ? newRow.options.split(',').map(o => o.trim())
          : undefined,
      });
      loadTemplateDetails(selectedTemplate.template.id);
      setNewRow({ row_kind: 'NUMERIC', label: '', unit: '', medication_id: '', options: '' });
      setShowAddRowModal(false);
    } catch (error) {
      console.error('Error adding row:', error);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!selectedTemplate || !confirm('Supprimer cette ligne ?')) return;
    try {
      await templatesApi.deleteRow(selectedTemplate.template.id, rowId);
      loadTemplateDetails(selectedTemplate.template.id);
    } catch (error) {
      console.error('Error deleting row:', error);
    }
  };

  const handleAddMaterial = async () => {
    if (!selectedTemplate || !newMaterial.material_id) return;
    try {
      await templatesApi.addMaterial(selectedTemplate.template.id, {
        material_id: newMaterial.material_id,
        default_quantity: newMaterial.default_quantity,
      });
      loadTemplateDetails(selectedTemplate.template.id);
      setNewMaterial({ material_id: '', default_quantity: 1 });
      setShowAddMaterialModal(false);
    } catch (error) {
      console.error('Error adding material:', error);
    }
  };

  const handleRemoveMaterial = async (materialId: string) => {
    if (!selectedTemplate) return;
    try {
      await templatesApi.removeMaterial(selectedTemplate.template.id, materialId);
      loadTemplateDetails(selectedTemplate.template.id);
    } catch (error) {
      console.error('Error removing material:', error);
    }
  };

  const rowKindLabels: Record<RowKind, string> = {
    NUMERIC: 'Numérique',
    OPTION: 'Options',
    CHECK: 'Checkbox',
    TEXT: 'Texte',
    MEDICATION: 'Médicament',
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
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-500 mt-1">Modèles de suivi hospitalier</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          + Nouveau template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Templates disponibles</h3>
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun template créé</p>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate?.template.id === template.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => loadTemplateDetails(template.id)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{safeString(template.name)}</p>
                      {template.is_default && (
                        <span className="text-xs text-gray-500">Par défaut</span>
                      )}
                    </div>
                    {!template.is_default && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Template Details */}
        <div className="lg:col-span-2">
          {isLoadingDetails ? (
            <div className="card p-8 flex items-center justify-center">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : selectedTemplate ? (
            <div className="space-y-4">
              {/* Template Info */}
              <div className="card p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{safeString(selectedTemplate.template.name)}</h3>
                <p className="text-sm text-gray-500">
                  {(selectedTemplate.rows || []).length} ligne{(selectedTemplate.rows || []).length > 1 ? 's' : ''} de suivi
                </p>
              </div>

              {/* Rows */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Lignes de suivi</h4>
                  <button
                    onClick={() => setShowAddRowModal(true)}
                    className="btn-secondary text-sm py-1.5"
                  >
                    + Ajouter
                  </button>
                </div>
                {!selectedTemplate.rows || selectedTemplate.rows.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune ligne définie</p>
                ) : (
                  <div className="space-y-2">
                    {selectedTemplate.rows.map((rowWithOptions) => (
                      <div
                        key={rowWithOptions.row.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {safeString(rowWithOptions.row.label)}
                            {safeString(rowWithOptions.row.unit) && (
                              <span className="text-gray-500 font-normal ml-1">({safeString(rowWithOptions.row.unit)})</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {rowKindLabels[rowWithOptions.row.row_kind]}
                            {rowWithOptions.options && rowWithOptions.options.length > 0 && (
                              <span className="ml-2">
                                Options: {rowWithOptions.options.map(o => safeString(o.value)).join(', ')}
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteRow(rowWithOptions.row.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Materials */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Matériel inclus</h4>
                  <button
                    onClick={() => setShowAddMaterialModal(true)}
                    className="btn-secondary text-sm py-1.5"
                  >
                    + Ajouter
                  </button>
                </div>
                {!selectedTemplate.materials || selectedTemplate.materials.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun matériel défini</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.materials.map((mat) => (
                      <div
                        key={mat.template_material.id}
                        className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-sm"
                      >
                        <span>{safeString(mat.material.name)}</span>
                        <span className="text-gray-500">x{mat.template_material.default_quantity}</span>
                        <button
                          onClick={() => handleRemoveMaterial(mat.template_material.material_id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Sélectionnez un template</h3>
              <p className="text-gray-500">Cliquez sur un template pour voir ses détails</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nouveau template</h3>
            <div>
              <label className="label">Nom du template</label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="input"
                placeholder="Ex: Post-opératoire"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                Annuler
              </button>
              <button onClick={handleCreateTemplate} className="btn-primary">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Row Modal */}
      {showAddRowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter une ligne</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Type</label>
                <select
                  value={newRow.row_kind}
                  onChange={(e) => setNewRow({ ...newRow, row_kind: e.target.value as RowKind })}
                  className="input"
                >
                  <option value="NUMERIC">Numérique</option>
                  <option value="OPTION">Options</option>
                  <option value="CHECK">Checkbox</option>
                  <option value="TEXT">Texte libre</option>
                  <option value="MEDICATION">Médicament</option>
                </select>
              </div>
              {newRow.row_kind === 'MEDICATION' ? (
                <div>
                  <label className="label">Médicament</label>
                  <select
                    value={newRow.medication_id}
                    onChange={(e) => {
                      const med = medications.find(m => m.id === e.target.value);
                      setNewRow({
                        ...newRow,
                        medication_id: e.target.value,
                        label: med ? med.name : '',
                        unit: med?.reference_unit || '',
                      });
                    }}
                    className="input"
                  >
                    <option value="">Sélectionner</option>
                    {medications.map(med => (
                      <option key={med.id} value={med.id}>{safeString(med.name)}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="label">Label</label>
                    <input
                      type="text"
                      value={newRow.label}
                      onChange={(e) => setNewRow({ ...newRow, label: e.target.value })}
                      className="input"
                      placeholder="Ex: Température"
                    />
                  </div>
                  {newRow.row_kind === 'NUMERIC' && (
                    <div>
                      <label className="label">Unité</label>
                      <input
                        type="text"
                        value={newRow.unit}
                        onChange={(e) => setNewRow({ ...newRow, unit: e.target.value })}
                        className="input"
                        placeholder="Ex: °C"
                      />
                    </div>
                  )}
                  {newRow.row_kind === 'OPTION' && (
                    <div>
                      <label className="label">Options (séparées par virgule)</label>
                      <input
                        type="text"
                        value={newRow.options}
                        onChange={(e) => setNewRow({ ...newRow, options: e.target.value })}
                        className="input"
                        placeholder="Ex: Absent, Diminué, Normal"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddRowModal(false)} className="btn-secondary">
                Annuler
              </button>
              <button onClick={handleAddRow} className="btn-primary">
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter du matériel</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Matériel</label>
                <select
                  value={newMaterial.material_id}
                  onChange={(e) => setNewMaterial({ ...newMaterial, material_id: e.target.value })}
                  className="input"
                >
                  <option value="">Sélectionner</option>
                  {materials.map(mat => (
                    <option key={mat.id} value={mat.id}>{safeString(mat.name)} ({safeString(mat.unit)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Quantité par défaut</label>
                <input
                  type="number"
                  min="1"
                  value={newMaterial.default_quantity}
                  onChange={(e) => setNewMaterial({ ...newMaterial, default_quantity: parseInt(e.target.value) || 1 })}
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddMaterialModal(false)} className="btn-secondary">
                Annuler
              </button>
              <button onClick={handleAddMaterial} className="btn-primary">
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
