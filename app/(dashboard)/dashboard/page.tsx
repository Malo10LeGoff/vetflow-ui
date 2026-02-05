'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { hospitalizationsApi } from '@/lib/api';
import { Hospitalization, HospitalizationCategory } from '@/types';
import { safeNumber } from '@/lib/utils';

const categoryLabels: Record<HospitalizationCategory, string> = {
  colique: 'Colique',
  chirurgie: 'Chirurgie',
  soins_intensifs: 'Soins intensifs',
  poulain: 'Poulain',
  castration: 'Castration',
  autre: 'Autre',
};

const categoryColors: Record<HospitalizationCategory, string> = {
  colique: 'badge-yellow',
  chirurgie: 'badge-blue',
  soins_intensifs: 'badge-red',
  poulain: 'badge-green',
  castration: 'badge-gray',
  autre: 'badge-gray',
};

type SortOption = 'urgence' | 'duree' | 'prochain_acte';

export default function DashboardPage() {
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<HospitalizationCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('prochain_acte');
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archiveModal, setArchiveModal] = useState<Hospitalization | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await hospitalizationsApi.getActive();
      setHospitalizations(data);
    } catch (error) {
      console.error('Error loading hospitalizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    let data = [...hospitalizations];

    // Filter by category
    if (categoryFilter !== 'all') {
      data = data.filter(h => h.category === categoryFilter);
    }

    // Sort
    data.sort((a, b) => {
      switch (sortBy) {
        case 'urgence':
          // Soins intensifs first, then colique, etc.
          const urgencyOrder: HospitalizationCategory[] = ['soins_intensifs', 'colique', 'chirurgie', 'poulain', 'castration', 'autre'];
          return urgencyOrder.indexOf(a.category) - urgencyOrder.indexOf(b.category);
        case 'duree':
          // Longest first
          const aDuration = a.duration_days * 24 + a.duration_hours;
          const bDuration = b.duration_days * 24 + b.duration_hours;
          return bDuration - aDuration;
        case 'prochain_acte':
          // Soonest first, null at the end
          if (!a.next_scheduled_at && !b.next_scheduled_at) return 0;
          if (!a.next_scheduled_at) return 1;
          if (!b.next_scheduled_at) return -1;
          return new Date(a.next_scheduled_at).getTime() - new Date(b.next_scheduled_at).getTime();
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

  const formatNextScheduled = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffHours < 0) {
      return <span className="text-red-600 font-medium">En retard</span>;
    }
    if (diffHours < 1) {
      return <span className="text-orange-600 font-medium">Imminent</span>;
    }
    if (diffHours < 24) {
      return `Dans ${diffHours}h`;
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
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
        <Link href="/dashboard/nouveau" className="btn-primary">
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
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Catégorie:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as HospitalizationCategory | 'all')}
              className="input w-auto py-1.5 text-sm"
            >
              <option value="all">Toutes</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Trier par:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="input w-auto py-1.5 text-sm"
            >
              <option value="prochain_acte">Prochain acte</option>
              <option value="urgence">Urgence</option>
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
              <Link href="/dashboard/nouveau" className="btn-primary inline-flex items-center gap-2">
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
                    <span className={categoryColors[hosp.category]}>
                      {categoryLabels[hosp.category]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Propriétaire</span>
                      <p className="font-medium">{hosp.owner.full_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Âge</span>
                      <p className="font-medium">
                        {(() => {
                          const ageYears = safeNumber(hosp.horse.age_years) ?? 0;
                          return ageYears < 1
                            ? `${Math.round(ageYears * 12)} mois`
                            : `${ageYears} ans`;
                        })()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Durée d&apos;hospitalisation</span>
                      <p className="font-medium">{formatDuration(hosp.duration_days, hosp.duration_hours)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Prochain acte</span>
                      <p className="font-medium">{formatNextScheduled(hosp.next_scheduled_at)}</p>
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
                <span className={categoryColors[archiveModal.category]}>
                  {categoryLabels[archiveModal.category]}
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
    </div>
  );
}
