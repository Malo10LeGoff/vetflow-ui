'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { hospitalizationsApi, chartApi, materialsApi, medicationsApi, usersApi } from '@/lib/api';
import { safeString, safeNumber, safeBool } from '@/lib/utils';
import {
  Hospitalization,
  ChartData,
  ChartRow,
  ChartEntry,
  MaterialUsageWithMaterial,
  Material,
  Medication,
  RowKind,
  User,
} from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

// Pain and attitude options
const painOptions = ['-', '+', '++', '+++'];
const attitudeOptions = ['Alerte', 'Calme', 'Agité', 'Douloureux', 'Prostré'];

// Format hour for display
function formatHour(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Format date as YYYY-MM-DD in local timezone (for input[type="date"])
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Normalize time string for consistent comparison (removes milliseconds, handles various formats)
function normalizeTimeKey(time: string | Date): string {
  const date = typeof time === 'string' ? new Date(time) : time;
  // Round to the hour and return ISO string without milliseconds
  date.setMinutes(0, 0, 0);
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// Check if a date is the current hour
function isCurrentHour(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate() &&
    date.getHours() === now.getHours()
  );
}

// Cell component for editable cells
function ChartCell({
  row,
  entry,
  onSave,
  onDelete,
  isCurrentHour: currentHour,
  isDisabled,
  authorName,
}: {
  row: ChartRow;
  entry: ChartEntry | undefined;
  onSave: (value: string | number | boolean) => void;
  onDelete: () => void;
  isCurrentHour?: boolean;
  isDisabled?: boolean;
  authorName?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [value, setValue] = useState('');

  const displayValue = useMemo(() => {
    if (!entry) return '';
    switch (row.row_kind) {
      case 'NUMERIC':
        const numVal = safeNumber(entry.numeric_value);
        return numVal !== null ? numVal.toString() : '';
      case 'OPTION':
        return safeString(entry.option_id) || '';
      case 'CHECK':
        return safeBool(entry.check_value) ? '✓' : '';
      case 'TEXT':
        return safeString(entry.text_value) || '';
      case 'MEDICATION':
        const medVal = safeNumber(entry.medication_amount);
        return medVal !== null ? `${medVal}` : '';
      default:
        return '';
    }
  }, [entry, row.row_kind]);

  useEffect(() => {
    setValue(displayValue);
  }, [displayValue]);

  const handleDoubleClick = () => {
    if (isDisabled) return;
    if (row.row_kind === 'TEXT') {
      setShowObservationModal(true);
    } else {
      setIsEditing(true);
    }
  };

  const handleClick = () => {
    if (isDisabled) return;
    if (row.row_kind === 'TEXT' && displayValue) {
      setShowObservationModal(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== displayValue) {
      // Handle deletion when value is empty
      if (value.trim() === '') {
        if (entry) {
          onDelete();
        }
        return;
      }

      if (row.row_kind === 'NUMERIC' || row.row_kind === 'MEDICATION') {
        const num = parseFloat(value);
        if (!isNaN(num)) onSave(num);
      } else if (row.row_kind === 'CHECK') {
        onSave(value === '✓' || value === 'true' || value === '1');
      } else {
        onSave(value);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLElement).blur();
    }
    if (e.key === 'Escape') {
      setValue(displayValue);
      setIsEditing(false);
    }
  };

  const handleObservationSave = () => {
    if (value !== displayValue) {
      if (value.trim() === '' && entry) {
        onDelete();
      } else if (value.trim() !== '') {
        onSave(value);
      }
    }
    setShowObservationModal(false);
  };

  const isTextRow = row.row_kind === 'TEXT';
  const currentHourBg = currentHour ? 'bg-blue-50' : '';
  const disabledBg = isDisabled ? 'bg-gray-100 text-gray-400' : '';
  const cellClass = `
    px-2 py-1 text-center text-sm border-r border-gray-200 min-w-[120px] ${isTextRow ? 'h-[120px]' : 'h-10'}
    ${isDisabled ? disabledBg : entry?.flagged ? 'bg-red-100 text-red-700 font-medium' : currentHourBg}
    ${isDisabled ? 'cursor-not-allowed' : isEditing ? 'bg-blue-100' : 'hover:bg-gray-50 cursor-pointer'}
  `;

  // Generate tooltip with author and timestamp
  const tooltip = useMemo(() => {
    if (!entry) return undefined;
    const timestamp = new Date(entry.created_at).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const author = authorName || 'Utilisateur inconnu';
    return `Modifié par ${author}\nle ${timestamp}`;
  }, [entry, authorName]);

  if (row.row_kind === 'CHECK') {
    const checkVal = safeBool(entry?.check_value);
    return (
      <td
        className={cellClass}
        onClick={() => !isDisabled && onSave(!checkVal)}
        title={tooltip}
      >
        {checkVal ? '✓' : ''}
      </td>
    );
  }

  if (row.row_kind === 'OPTION') {
    const label = safeString(row.label) || '';
    const options = label.toLowerCase().includes('douleur') ? painOptions : attitudeOptions;
    return (
      <td className={cellClass} title={tooltip}>
        <select
          value={safeString(entry?.option_id) || ''}
          onChange={(e) => {
            if (isDisabled) return;
            if (e.target.value === '' && entry) {
              onDelete();
            } else if (e.target.value !== '') {
              onSave(e.target.value);
            }
          }}
          disabled={isDisabled}
          className={`w-full bg-transparent text-center text-sm focus:outline-none ${isDisabled ? 'cursor-not-allowed' : ''}`}
        >
          <option value="">-</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </td>
    );
  }

  // TEXT row - show truncated text and modal on click
  if (row.row_kind === 'TEXT') {
    return (
      <>
        <td
          className={`${cellClass} align-top`}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          title={tooltip}
        >
          <div className="w-full h-full overflow-hidden text-xs text-left whitespace-pre-wrap line-clamp-5">
            {displayValue}
          </div>
        </td>
        {showObservationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="card p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Observation</h3>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="input w-full h-48 resize-none"
                placeholder="Saisir une observation..."
                autoFocus
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setValue(displayValue);
                    setShowObservationModal(false);
                  }}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button onClick={handleObservationSave} className="btn-primary">
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (isEditing) {
    return (
      <td className={cellClass}>
        <input
          type={row.row_kind === 'NUMERIC' || row.row_kind === 'MEDICATION' ? 'number' : 'text'}
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full bg-transparent text-center text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </td>
    );
  }

  return (
    <td className={cellClass} onDoubleClick={handleDoubleClick} title={tooltip}>
      {displayValue}
      {row.row_kind === 'MEDICATION' && safeNumber(entry?.medication_amount) && (
        <span className="text-gray-400 text-xs ml-0.5">{safeString(row.unit)}</span>
      )}
    </td>
  );
}

export default function PatientFilePage() {
  const params = useParams();
  const router = useRouter();
  const hospitalizationId = params.id as string;

  const [hospitalization, setHospitalization] = useState<Hospitalization | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [materialUsage, setMaterialUsage] = useState<MaterialUsageWithMaterial[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [deleteRowModal, setDeleteRowModal] = useState<ChartRow | null>(null);
  const [chartModalRow, setChartModalRow] = useState<ChartRow | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Date navigation - default to today
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // New row form
  const [newRow, setNewRow] = useState({
    row_kind: 'NUMERIC' as RowKind,
    label: '',
    unit: '',
    medication_id: '',
  });

  // New material form
  const [newMaterialUsage, setNewMaterialUsage] = useState({
    material_id: '',
    quantity: 1,
  });

  const loadData = useCallback(async () => {
    try {
      const [hosp, chart, matUsage, matsResponse, medsResponse, usrs] = await Promise.all([
        hospitalizationsApi.getById(hospitalizationId),
        chartApi.getChart(hospitalizationId),
        materialsApi.getUsage(hospitalizationId),
        materialsApi.getAll('', 1, 100),
        medicationsApi.getAll('', 1, 100),
        usersApi.getAll(),
      ]);
      setHospitalization(hosp);
      setChartData(chart);
      setMaterialUsage(matUsage);
      setMaterials(matsResponse.items);
      setMedications(medsResponse.items);
      setUsers(usrs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [hospitalizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate date boundaries
  const dateBounds = useMemo(() => {
    if (!hospitalization) return { min: new Date(), max: new Date() };
    const admission = new Date(hospitalization.admission_at);
    admission.setHours(0, 0, 0, 0);
    const maxDate = new Date(admission);
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return { min: admission, max: maxDate };
  }, [hospitalization]);

  // Generate 24 hours for the selected date
  const hours = useMemo(() => {
    const hours: Date[] = [];
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);

    for (let h = 0; h < 24; h++) {
      const date = new Date(start);
      date.setHours(h);
      hours.push(date);
    }
    return hours;
  }, [selectedDate]);

  // Navigation functions
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    if (newDate >= dateBounds.min) {
      setSelectedDate(newDate);
      // Scroll to end of day (rightmost position)
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
      }, 0);
    }
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    if (newDate <= dateBounds.max) {
      setSelectedDate(newDate);
      // Scroll to start of day (leftmost position)
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = 0;
        }
      }, 0);
    }
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today >= dateBounds.min && today <= dateBounds.max) {
      setSelectedDate(today);
      // Scroll to current hour
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const currentHour = new Date().getHours();
          const cellWidth = 120; // min-w-[120px]
          const labelColumnWidth = 200; // approximate width of the label column
          scrollContainerRef.current.scrollLeft = Math.max(0, (currentHour * cellWidth) - (scrollContainerRef.current.clientWidth / 2) + labelColumnWidth);
        }
      }, 0);
    }
  };

  const isToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate.getTime() === today.getTime();
  }, [selectedDate]);

  const canGoPrevious = selectedDate > dateBounds.min;
  const canGoNext = selectedDate < dateBounds.max;

  // Group entries by row and time for quick lookup
  const entriesMap = useMemo(() => {
    const map = new Map<string, ChartEntry>();
    if (chartData?.entries) {
      chartData.entries.forEach(entry => {
        const timeKey = normalizeTimeKey(entry.at_time);
        const key = `${entry.chart_row_id}-${timeKey}`;
        map.set(key, entry);
      });
    }
    return map;
  }, [chartData]);

  // Users map for quick lookup
  const usersMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(user => map.set(user.id, user));
    return map;
  }, [users]);

  const getEntry = useCallback((rowId: string, hour: Date): ChartEntry | undefined => {
    const timeKey = normalizeTimeKey(hour);
    return entriesMap.get(`${rowId}-${timeKey}`);
  }, [entriesMap]);

  const handleCellSave = async (row: ChartRow, hour: Date, value: string | number | boolean) => {
    const existingEntry = getEntry(row.id, hour);

    const entryData = {
      chart_row_id: row.id,
      at_time: normalizeTimeKey(hour),
      entry_type: row.row_kind,
      ...(row.row_kind === 'NUMERIC' && { numeric_value: value as number }),
      ...(row.row_kind === 'OPTION' && { option_id: value as string }),
      ...(row.row_kind === 'CHECK' && { check_value: value as boolean }),
      ...(row.row_kind === 'TEXT' && { text_value: value as string }),
      ...(row.row_kind === 'MEDICATION' && {
        medication_amount: value as number,
        medication_unit: safeString(row.unit) || 'ml',
      }),
    };

    try {
      if (existingEntry) {
        await chartApi.updateEntry(hospitalizationId, existingEntry.id, entryData);
      } else {
        await chartApi.createEntry(hospitalizationId, entryData);
      }
      // Reload chart data
      const chart = await chartApi.getChart(hospitalizationId);
      setChartData(chart);
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const handleCellDelete = async (row: ChartRow, hour: Date) => {
    const existingEntry = getEntry(row.id, hour);
    if (!existingEntry) return;

    try {
      await chartApi.deleteEntry(hospitalizationId, existingEntry.id);
      // Reload chart data
      const chart = await chartApi.getChart(hospitalizationId);
      setChartData(chart);
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const handleAddRow = async () => {
    if (!newRow.label) return;

    try {
      const sortOrder = (chartData?.rows?.length || 0);
      await chartApi.createRow(hospitalizationId, {
        row_kind: newRow.row_kind,
        label: newRow.label,
        unit: newRow.unit || undefined,
        sort_order: sortOrder,
        medication_id: newRow.medication_id || undefined,
      });
      const chart = await chartApi.getChart(hospitalizationId);
      setChartData(chart);
      setNewRow({ row_kind: 'NUMERIC', label: '', unit: '', medication_id: '' });
      setShowAddRow(false);
    } catch (error) {
      console.error('Error adding row:', error);
    }
  };

  const handleDeleteRow = async (row: ChartRow) => {
    setDeleteRowModal(null);
    try {
      await chartApi.deleteRow(hospitalizationId, row.id);
      const chart = await chartApi.getChart(hospitalizationId);
      setChartData(chart);
    } catch (error) {
      console.error('Error deleting row:', error);
    }
  };

  const handleAddMaterialUsage = async () => {
    if (!newMaterialUsage.material_id) return;

    try {
      await materialsApi.addUsage(hospitalizationId, {
        material_id: newMaterialUsage.material_id,
        quantity: newMaterialUsage.quantity,
        at_time: new Date().toISOString(),
      });
      const usage = await materialsApi.getUsage(hospitalizationId);
      setMaterialUsage(usage);
      setNewMaterialUsage({ material_id: '', quantity: 1 });
      setShowAddMaterial(false);
    } catch (error) {
      console.error('Error adding material:', error);
    }
  };

  const handleDeleteMaterialUsage = async (usageId: string) => {
    try {
      await materialsApi.deleteUsage(hospitalizationId, usageId);
      const usage = await materialsApi.getUsage(hospitalizationId);
      setMaterialUsage(usage);
    } catch (error) {
      console.error('Error deleting material usage:', error);
    }
  };

  const formatDuration = (days: number, hours: number) => {
    if (days === 0) return `${hours}h`;
    if (hours === 0) return `${days}j`;
    return `${days}j ${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hospitalization || !chartData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900">Patient non trouvé</h2>
        <button onClick={() => router.push('/dashboard')} className="btn-primary mt-4">
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{hospitalization.horse.name}</h1>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>Poids: <strong>{hospitalization.horse.weight_kg} kg</strong></span>
              <span>|</span>
              <span>Admis le: <strong>{new Date(hospitalization.admission_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong></span>
              <span>|</span>
              <span>Durée: <strong>{formatDuration(hospitalization.duration_days, hospitalization.duration_hours)}</strong></span>
              <span>|</span>
              <span>Propriétaire: <strong>{hospitalization.owner.full_name}</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSummary(true)}
              className="btn-secondary"
            >
              Résumé
            </button>
          </div>
        </div>
      </div>

      {/* Date Navigation Controls */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            {!isToday && (
              <button
                onClick={goToToday}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors text-left"
              >
                Aujourd&apos;hui
              </button>
            )}
            {isToday && (
              <span className="text-sm text-gray-500">Aujourd&apos;hui</span>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousDay}
                disabled={!canGoPrevious}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <input
                type="date"
                value={formatDateForInput(selectedDate)}
                min={formatDateForInput(dateBounds.min)}
                max={formatDateForInput(dateBounds.max)}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  newDate.setHours(0, 0, 0, 0);
                  setSelectedDate(newDate);
                }}
                className="input py-1.5 text-sm"
              />
              <button
                onClick={goToNextDay}
                disabled={!canGoNext}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddRow(true)}
              className="btn-secondary text-sm py-1.5"
            >
              + Ajouter une ligne
            </button>
          </div>
        </div>
      </div>

      {/* Chart Table */}
      <div className="card overflow-hidden">
        <div ref={scrollContainerRef} className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-r border-gray-200 min-w-[150px]">
                  Paramètre
                </th>
                {hours.map((hour) => {
                  const isCurrent = isCurrentHour(hour);
                  return (
                    <th
                      key={hour.toISOString()}
                      className={`px-2 py-2 text-center text-xs font-medium border-b border-r border-gray-200 min-w-[120px] ${
                        isCurrent ? 'bg-blue-100 text-blue-800' : 'text-gray-600'
                      }`}
                    >
                      <div>{formatHour(hour)}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {(chartData.rows || []).sort((a, b) => a.sort_order - b.sort_order).map((row) => (
                <tr key={row.id} className="group border-b border-gray-200 hover:bg-gray-50/50">
                  <td className="sticky left-0 z-10 bg-white px-4 py-2 border-r border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{safeString(row.label)}</div>
                        {safeString(row.unit) && <div className="text-xs text-gray-500">{safeString(row.unit)}</div>}
                      </div>
                      <div className="flex items-center gap-1">
                        {row.row_kind === 'NUMERIC' && (
                          <button
                            onClick={() => setChartModalRow(row)}
                            className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Voir le graphique"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteRowModal(row)}
                          className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </td>
                  {hours.map((hour) => {
                    const entry = getEntry(row.id, hour);
                    const author = entry ? usersMap.get(entry.author_user_id) : undefined;
                    return (
                      <ChartCell
                        key={`${row.id}-${hour.toISOString()}`}
                        row={row}
                        entry={entry}
                        onSave={(value) => handleCellSave(row, hour, value)}
                        onDelete={() => handleCellDelete(row, hour)}
                        isCurrentHour={isCurrentHour(hour)}
                        isDisabled={hour < new Date(hospitalization.admission_at)}
                        authorName={author ? `${author.first_name} ${author.last_name}` : undefined}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!chartData.rows || chartData.rows.length === 0) && (
          <div className="p-8 text-center text-gray-500">
            Aucune ligne définie. Cliquez sur &quot;Ajouter une ligne&quot; pour commencer.
          </div>
        )}
      </div>

      {/* Materials Used */}
      <div className="card mt-6 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Matériel utilisé</h3>
          <button
            onClick={() => setShowAddMaterial(true)}
            className="btn-secondary text-sm py-1.5"
          >
            + Ajouter
          </button>
        </div>
        {materialUsage.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun matériel enregistré</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {materialUsage.map((item) => (
              <div
                key={item.usage.id}
                className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-sm"
              >
                <span>{item.material.name}</span>
                <span className="text-gray-500">x{item.usage.quantity}</span>
                <button
                  onClick={() => handleDeleteMaterialUsage(item.usage.id)}
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

      {/* Add Row Modal */}
      {showAddRow && (
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
                  <option value="NUMERIC">Numérique (température, FC...)</option>
                  <option value="OPTION">Options (douleur, attitude...)</option>
                  <option value="CHECK">Checkbox (perfusion...)</option>
                  <option value="TEXT">Texte libre (observations...)</option>
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
                    <option value="">Sélectionner un médicament</option>
                    {medications.map(med => (
                      <option key={med.id} value={med.id}>{med.name} ({med.reference_unit})</option>
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
                        placeholder="Ex: °C, bpm, rpm"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddRow(false)} className="btn-secondary">
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
      {showAddMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter du matériel</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Matériel</label>
                <select
                  value={newMaterialUsage.material_id}
                  onChange={(e) => setNewMaterialUsage({ ...newMaterialUsage, material_id: e.target.value })}
                  className="input"
                >
                  <option value="">Sélectionner un matériel</option>
                  {materials.map(mat => (
                    <option key={mat.id} value={mat.id}>{mat.name} ({mat.unit})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Quantité</label>
                <input
                  type="number"
                  min="1"
                  value={newMaterialUsage.quantity}
                  onChange={(e) => setNewMaterialUsage({ ...newMaterialUsage, quantity: parseInt(e.target.value) || 1 })}
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddMaterial(false)} className="btn-secondary">
                Annuler
              </button>
              <button onClick={handleAddMaterialUsage} className="btn-primary">
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Row Confirmation Modal */}
      {deleteRowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supprimer la ligne</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="font-medium text-gray-900">{safeString(deleteRowModal.label)}</p>
              {safeString(deleteRowModal.unit) && (
                <p className="text-sm text-gray-500">Unité: {safeString(deleteRowModal.unit)}</p>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Toutes les données enregistrées pour cette ligne seront définitivement supprimées.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteRowModal(null)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteRow(deleteRowModal)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Numeric Chart Modal */}
      {chartModalRow && (
        <NumericChartModal
          row={chartModalRow}
          entries={chartData.entries?.filter(e => e.chart_row_id === chartModalRow.id) || []}
          admissionDate={hospitalization.admission_at}
          onClose={() => setChartModalRow(null)}
        />
      )}

      {/* Summary Modal */}
      {showSummary && (
        <SummaryModal
          hospitalizationId={hospitalizationId}
          hospitalization={hospitalization}
          chartData={chartData}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}

// Summary Modal Component
function SummaryModal({
  hospitalizationId,
  hospitalization,
  chartData,
  onClose,
}: {
  hospitalizationId: string;
  hospitalization: Hospitalization;
  chartData: ChartData | null;
  onClose: () => void;
}) {
  const [summary, setSummary] = useState<{
    medication_summary: { name: string; total_amount: number; unit: string }[];
    material_summary: { material_name: string; total_quantity: number; unit: string }[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [notes, setNotes] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      chartApi.getMedicationSummary(hospitalizationId),
      materialsApi.getUsageSummary(hospitalizationId),
    ]).then(([meds, mats]) => {
      setSummary({ medication_summary: meds, material_summary: mats });
      setIsLoading(false);
    });
  }, [hospitalizationId]);

  const formatDuration = (days: number, hours: number) => {
    if (days === 0) return `${hours}h`;
    if (hours === 0) return `${days} jour${days > 1 ? 's' : ''}`;
    return `${days} jour${days > 1 ? 's' : ''} ${hours}h`;
  };

  // Generate hours for tableau horaire
  const tableauHours = useMemo(() => {
    const hours: Date[] = [];
    const start = new Date(hospitalization.admission_at);
    start.setMinutes(0, 0, 0);
    const now = new Date();
    now.setMinutes(0, 0, 0);

    const current = new Date(start);
    while (current <= now) {
      hours.push(new Date(current));
      current.setHours(current.getHours() + 1);
    }
    return hours;
  }, [hospitalization.admission_at]);

  // Create entries map for quick lookup
  const entriesMap = useMemo(() => {
    const map = new Map<string, ChartEntry>();
    if (chartData?.entries) {
      chartData.entries.forEach(entry => {
        const date = new Date(entry.at_time);
        date.setMinutes(0, 0, 0);
        const key = `${entry.chart_row_id}-${date.getTime()}`;
        map.set(key, entry);
      });
    }
    return map;
  }, [chartData]);

  // Get numeric rows for charts
  const numericRows = useMemo(() => {
    if (!chartData?.rows) return [];
    return chartData.rows.filter(row => row.row_kind === 'NUMERIC').sort((a, b) => a.sort_order - b.sort_order);
  }, [chartData]);

  // Generate chart data for a numeric row
  const getChartDataForRow = useCallback((row: ChartRow) => {
    const rowEntries = chartData?.entries?.filter(e => e.chart_row_id === row.id) || [];
    if (rowEntries.length === 0) return { data: [], hasData: false };

    // Find the time range for this row's entries
    let minTime = new Date(rowEntries[0].at_time);
    let maxTime = new Date(rowEntries[0].at_time);
    rowEntries.forEach(entry => {
      const time = new Date(entry.at_time);
      if (time < minTime) minTime = time;
      if (time > maxTime) maxTime = time;
    });

    // Start from admission
    const start = new Date(hospitalization.admission_at);
    start.setMinutes(0, 0, 0);
    maxTime.setMinutes(0, 0, 0);

    // Create entries map
    const rowEntriesMap = new Map<number, ChartEntry>();
    rowEntries.forEach(entry => {
      const date = new Date(entry.at_time);
      date.setMinutes(0, 0, 0);
      rowEntriesMap.set(date.getTime(), entry);
    });

    // Generate hours from admission to last entry
    const hours: Date[] = [];
    const current = new Date(start);
    while (current <= maxTime) {
      hours.push(new Date(current));
      current.setHours(current.getHours() + 1);
    }

    const data = hours.map(hour => {
      const entry = rowEntriesMap.get(hour.getTime());
      const numericValue = entry ? safeNumber(entry.numeric_value) : null;
      return {
        time: hour.toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        value: numericValue,
        flagged: entry ? safeBool(entry.flagged) ?? false : false,
      };
    });

    return { data, hasData: data.some(d => d.value !== null) };
  }, [chartData, hospitalization.admission_at]);

  // Get display value for an entry
  const getEntryDisplay = (row: ChartRow, entry: ChartEntry | undefined): string => {
    if (!entry) return '';
    switch (row.row_kind) {
      case 'NUMERIC':
        const numVal = safeNumber(entry.numeric_value);
        return numVal !== null ? numVal.toString() : '';
      case 'OPTION':
        return safeString(entry.option_id) || '';
      case 'CHECK':
        return safeBool(entry.check_value) ? '✓' : '';
      case 'TEXT':
        return safeString(entry.text_value) || '';
      case 'MEDICATION':
        const medVal = safeNumber(entry.medication_amount);
        return medVal !== null ? `${medVal}` : '';
      default:
        return '';
    }
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 5,
        filename: `resume-${hospitalization.horse.name}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
      };
      await html2pdf().set(opt).from(contentRef.current).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Résumé du séjour</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div ref={contentRef}>
        {/* Patient Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Cheval</span>
              <p className="font-medium">{hospitalization.horse.name}</p>
            </div>
            <div>
              <span className="text-gray-500">Poids</span>
              <p className="font-medium">{hospitalization.horse.weight_kg} kg</p>
            </div>
            <div>
              <span className="text-gray-500">Propriétaire</span>
              <p className="font-medium">{hospitalization.owner.full_name}</p>
            </div>
            <div>
              <span className="text-gray-500">Durée</span>
              <p className="font-medium">{formatDuration(hospitalization.duration_days, hospitalization.duration_hours)}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : summary && (
          <>
            {/* Medications */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Médicaments utilisés</h4>
              {summary.medication_summary.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun médicament enregistré</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2">Médicament</th>
                      <th className="text-right py-2">Quantité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.medication_summary.map((med, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2">{med.name}</td>
                        <td className="text-right py-2">{med.total_amount} {med.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Materials */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Matériel utilisé</h4>
              {summary.material_summary.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun matériel enregistré</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2">Matériel</th>
                      <th className="text-right py-2">Quantité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.material_summary.map((mat, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2">{mat.material_name}</td>
                        <td className="text-right py-2">{mat.total_quantity} {mat.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Notes */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ajoutez des notes ou observations à inclure dans le PDF..."
            className="input w-full min-h-[100px] resize-y"
            rows={4}
          />
        </div>

        {/* Numeric Charts */}
        {numericRows.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4">Graphiques des valeurs numériques</h4>
            <div className="space-y-6">
              {numericRows.map(row => {
                const { data, hasData } = getChartDataForRow(row);
                if (!hasData) return null;

                const values = data.map(d => d.value).filter((v): v is number => v !== null);
                const min = Math.min(...values);
                const max = Math.max(...values);
                const padding = (max - min) * 0.1 || 5;
                const yDomain = [Math.floor(min - padding), Math.ceil(max + padding)];
                const unit = safeString(row.unit) || '';
                const flaggedPoints = data.filter(d => d.flagged && d.value !== null);

                return (
                  <div key={row.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-2">
                      <h5 className="font-medium text-gray-800">{safeString(row.label)}</h5>
                      {unit && <p className="text-xs text-gray-500">Unité: {unit}</p>}
                    </div>
                    <div style={{ width: '100%', height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="time"
                            tick={{ fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            domain={yDomain}
                            tick={{ fontSize: 10 }}
                            tickFormatter={(val) => `${val}${unit ? ` ${unit}` : ''}`}
                          />
                          <Tooltip
                            formatter={(value) => [`${value} ${unit}`, safeString(row.label)]}
                            labelStyle={{ fontWeight: 'bold' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={{ fill: '#2563eb', r: 3 }}
                            activeDot={{ r: 5 }}
                            connectNulls
                          />
                          {flaggedPoints.map((point, idx) => (
                            <ReferenceDot
                              key={idx}
                              x={point.time}
                              y={point.value!}
                              r={6}
                              fill="#dc2626"
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tableau horaire */}
        {chartData && chartData.rows && chartData.rows.length > 0 && tableauHours.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Tableau horaire</h4>
            <p className="text-xs text-gray-500 mb-3">
              Du {new Date(hospitalization.admission_at).toLocaleDateString('fr-FR')} au {new Date().toLocaleDateString('fr-FR')}
            </p>
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse" style={{ fontSize: '8px' }}>
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-1 bg-gray-100 text-left sticky left-0 min-w-[100px]">
                      Paramètre
                    </th>
                    {tableauHours.map((hour, idx) => (
                      <th key={idx} className="border border-gray-300 p-1 bg-gray-100 text-center whitespace-nowrap">
                        {hour.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        <br />
                        {hour.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.rows.sort((a, b) => a.sort_order - b.sort_order).map((row) => (
                    <tr key={row.id}>
                      <td className="border border-gray-300 p-1 bg-gray-50 font-medium sticky left-0">
                        {safeString(row.label)}
                        {safeString(row.unit) && <span className="text-gray-400 ml-1">({safeString(row.unit)})</span>}
                      </td>
                      {tableauHours.map((hour, idx) => {
                        const entry = entriesMap.get(`${row.id}-${hour.getTime()}`);
                        const displayValue = getEntryDisplay(row, entry);
                        const isFlagged = entry && safeBool(entry.flagged);
                        return (
                          <td
                            key={idx}
                            className={`border border-gray-300 p-1 text-center ${isFlagged ? 'bg-red-100 text-red-700 font-bold' : ''}`}
                          >
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button onClick={onClose} className="btn-secondary">
            Fermer
          </button>
          <button
            onClick={() => window.print()}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimer
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="btn-primary flex items-center gap-2"
          >
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            Télécharger PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// Numeric Chart Modal Component
function NumericChartModal({
  row,
  entries,
  admissionDate,
  onClose,
}: {
  row: ChartRow;
  entries: ChartEntry[];
  admissionDate: string;
  onClose: () => void;
}) {
  // Find the last entry time
  const lastEntryTime = useMemo(() => {
    if (entries.length === 0) return null;
    let maxTime = new Date(entries[0].at_time);
    entries.forEach(entry => {
      const entryTime = new Date(entry.at_time);
      if (entryTime > maxTime) {
        maxTime = entryTime;
      }
    });
    maxTime.setMinutes(0, 0, 0);
    return maxTime;
  }, [entries]);

  // Generate all hours from admission to the last entry (or now if no entries)
  const allHours = useMemo(() => {
    const hours: Date[] = [];
    const start = new Date(admissionDate);
    start.setMinutes(0, 0, 0);

    // Use the last entry time, or now if there are no entries
    const end = lastEntryTime || new Date();
    end.setMinutes(0, 0, 0);

    const current = new Date(start);
    while (current <= end) {
      hours.push(new Date(current));
      current.setHours(current.getHours() + 1);
    }
    return hours;
  }, [admissionDate, lastEntryTime]);

  // Create a map of entries by hour (using getTime() for reliable comparison)
  const entriesMap = useMemo(() => {
    const map = new Map<number, ChartEntry>();
    entries.forEach(entry => {
      const date = new Date(entry.at_time);
      date.setMinutes(0, 0, 0);
      map.set(date.getTime(), entry);
    });
    return map;
  }, [entries]);

  // Prepare chart data with all hours
  const chartData = useMemo(() => {
    return allHours.map(hour => {
      const entry = entriesMap.get(hour.getTime());
      const numericValue = entry ? safeNumber(entry.numeric_value) : null;

      return {
        time: hour.toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        value: numericValue,
        flagged: entry ? safeBool(entry.flagged) ?? false : false,
      };
    });
  }, [allHours, entriesMap]);

  // Get flagged points for highlighting (only those with values)
  const flaggedPoints = useMemo(() => {
    return chartData.filter(d => d.flagged && d.value !== null);
  }, [chartData]);

  // Check if there's any data
  const hasData = useMemo(() => {
    return chartData.some(d => d.value !== null);
  }, [chartData]);

  // Calculate min/max for Y axis
  const yDomain = useMemo(() => {
    const values = chartData.map(d => d.value).filter((v): v is number => v !== null);
    if (values.length === 0) return [0, 100];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 5;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

  const unit = safeString(row.unit) || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="card p-6 w-full max-w-3xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{safeString(row.label)}</h3>
            {unit && <p className="text-sm text-gray-500">Unité: {unit}</p>}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!hasData ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <p>Aucune donnée disponible pour ce paramètre</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => `${value}${unit ? ` ${unit}` : ''}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value) => [`${value ?? ''} ${unit}`, safeString(row.label)]}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#1d4ed8' }}
                  connectNulls={true}
                />
                {/* Highlight flagged points in red */}
                {flaggedPoints.map((point, idx) => (
                  <ReferenceDot
                    key={idx}
                    x={point.time}
                    y={point.value ?? 0}
                    r={6}
                    fill="#dc2626"
                    stroke="#dc2626"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span>
              Valeur normale
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-600"></span>
              Valeur signalée
            </span>
          </div>
          <button onClick={onClose} className="btn-secondary">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
