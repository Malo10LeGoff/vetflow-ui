'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { hospitalizationsApi, categoriesApi, assignmentsApi } from '@/lib/api';
import { Hospitalization, Category, AssignmentWithUser } from '@/types';
import CategoryManagementModal from '@/components/CategoryManagementModal';

type SortOption = 'duree' | 'prochain_acte';

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('prochain_acte');
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archiveModal, setArchiveModal] = useState<Hospitalization | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [assignmentsMap, setAssignmentsMap] = useState<Map<string, AssignmentWithUser[]>>(new Map());

  const getCategoryColor = useCallback((name: string): string => {
    const category = categories.find(c => c.name === name);
    return category?.color || '#6B7280';
  }, [categories]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await categoriesApi.getAll();
      // Handle both array and paginated response
      const items = Array.isArray(response) ? response : (response.items || []);
      setCategories(items);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async () => {
    try {
      const data = await hospitalizationsApi.getActive(debouncedSearch);
      const items = data.items || [];
      setHospitalizations(items);

      // Load assignments for all hospitalizations
      const assignmentPromises = items.map(h =>
        assignmentsApi.getAssignments(h.id).catch(() => [])
      );
      const allAssignments = await Promise.all(assignmentPromises);
      const map = new Map<string, AssignmentWithUser[]>();
      items.forEach((h, index) => {
        map.set(h.id, allAssignments[index]);
      });
      setAssignmentsMap(map);
    } catch (error) {
      console.error('Error loading hospitalizations:', error);
      setHospitalizations([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleArchive = async (hosp: Hospitalization) => {
    setArchivingId(hosp.id);
    setArchiveModal(null);
    try {
      await hospitalizationsApi.archive(hosp.id);
      setHospitalizations(prev => prev.filter(h => h.id !== hosp.id));
    } catch (error) {
      console.error('Error archiving:', error);
    } finally {
      setArchivingId(null);
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let data = [...(hospitalizations || [])];

    // Filter by category
    if (categoryFilter !== 'all') {
      data = data.filter(h => h.category === categoryFilter);
    }

    // Sort
    data.sort((a, b) => {
      switch (sortBy) {
        case 'duree':
          // Longest first
          const aDuration = a.duration_days * 24 + a.duration_hours;
          const bDuration = b.duration_days * 24 + b.duration_hours;
          return bDuration - aDuration;
        case 'prochain_acte':
          // Soonest first, null at the end
          if (!a.next_schedule?.at && !b.next_schedule?.at) return 0;
          if (!a.next_schedule?.at) return 1;
          if (!b.next_schedule?.at) return -1;
          return new Date(a.next_schedule.at).getTime() - new Date(b.next_schedule.at).getTime();
        default:
          return 0;
      }
    });

    return data;
  }, [hospitalizations, categoryFilter, sortBy]);

  const formatDuration = (days: number, hours: number) => {
    if (days === 0) return `${hours}h`;
    if (hours === 0) return `${days}j`;
    return `${days}j ${hours}h`;
  };

  const formatNextScheduled = (nextSchedule: { at: string; label: string } | null) => {
    if (!nextSchedule) return '-';
    const date = new Date(nextSchedule.at);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let timeText: React.ReactNode;
    if (diffMins < 0) {
      timeText = <span className="text-red-600">en retard</span>;
    } else if (diffMins < 60) {
      timeText = <span className="text-orange-600">dans {diffMins}min</span>;
    } else if (diffHours < 24) {
      timeText = <span>dans {diffHours}h</span>;
    } else {
      timeText = <span>dans {diffDays}j</span>;
    }

    return (
      <>
        <span className="font-medium">{nextSchedule.label}</span>
        <span className="text-gray-500 ml-1">({timeText})</span>
      </>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">
            {hospitalizations.length} cheval{hospitalizations.length > 1 ? 'aux' : ''} hospitalisé{hospitalizations.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/new" className="btn-primary">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouveau patient
          </span>
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
            <div className="relative w-full">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher un patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 py-1.5 text-sm w-full"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Catégorie:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input w-auto py-1.5 text-sm"
            >
              <option value="all">Toutes</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Gérer les catégories"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Trier par:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="input w-auto py-1.5 text-sm"
            >
              <option value="prochain_acte">Date de prochain suivi</option>
              <option value="duree">Durée d&apos;hospitalisation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hospitalizations list */}
      {filteredAndSortedData.length === 0 ? (
        <div className="card p-12 text-center">
          {hospitalizations.length === 0 ? (
            <>
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun patient hospitalisé</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Votre tableau de bord est vide. Commencez par admettre un nouveau cheval en hospitalisation.
              </p>
              <Link href="/dashboard/new" className="btn-primary inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter un patient
              </Link>
            </>
          ) : (
            <>
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun résultat</h3>
              <p className="text-gray-500 mb-4">Aucun patient ne correspond au filtre sélectionné</p>
              <button
                onClick={() => setCategoryFilter('all')}
                className="btn-secondary"
              >
                Réinitialiser le filtre
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedData.map((hosp) => (
            <div key={hosp.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{hosp.horse.name}</h3>
                    <span
                      className="px-2 py-0.5 text-xs font-medium rounded-full"
                      style={{ backgroundColor: `${getCategoryColor(hosp.category)}20`, color: getCategoryColor(hosp.category) }}
                    >
                      {hosp.category}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Propriétaire</span>
                      <p className="font-medium">{hosp.owner.full_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Âge</span>
                      <p className="font-medium">
                        {hosp.horse.age_years < 1
                          ? `${Math.round(hosp.horse.age_years * 12)} mois`
                          : `${hosp.horse.age_years} ans`}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Durée d&apos;hospitalisation</span>
                      <p className="font-medium">{formatDuration(hosp.duration_days, hosp.duration_hours)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Vétérinaire</span>
                      <p className="font-medium">
                        {(() => {
                          const assignments = assignmentsMap.get(hosp.id) || [];
                          if (assignments.length === 0) return <span className="text-gray-400">Non assigné</span>;
                          return assignments.map(a => `${a.user.first_name} ${a.user.last_name}`).join(', ');
                        })()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Prochain suivi</span>
                      <p className="font-medium">{formatNextScheduled(hosp.next_schedule)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    href={`/dashboard/patient/${hosp.id}`}
                    className="btn-primary py-2 px-4"
                  >
                    Voir fiche
                  </Link>
                  <button
                    onClick={() => setArchiveModal(hosp)}
                    disabled={archivingId === hosp.id}
                    className="btn-secondary py-2 px-3"
                    title="Archiver"
                  >
                    {archivingId === hosp.id ? (
                      <div className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {archiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Archiver le dossier</h3>
                <p className="text-sm text-gray-500">Cette action est réversible</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-medium text-gray-900">{archiveModal.horse.name}</span>
                <span
                  className="px-2 py-0.5 text-xs font-medium rounded-full"
                  style={{ backgroundColor: `${getCategoryColor(archiveModal.category)}20`, color: getCategoryColor(archiveModal.category) }}
                >
                  {archiveModal.category}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Propriétaire: {archiveModal.owner.full_name}</p>
                <p>Durée d&apos;hospitalisation: {formatDuration(archiveModal.duration_days, archiveModal.duration_hours)}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Le dossier sera déplacé dans les archives et ne sera plus visible sur le tableau de bord. Vous pourrez le retrouver dans la section Archives.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setArchiveModal(null)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={() => handleArchive(archiveModal)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Archiver
              </button>
            </div>
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
