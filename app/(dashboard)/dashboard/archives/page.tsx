'use client';

import { useState, useEffect, useCallback } from 'react';
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

const PAGE_SIZE = 10;

export default function ArchivesPage() {
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unarchivingId, setUnarchivingId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await hospitalizationsApi.getArchived(page, PAGE_SIZE, debouncedSearch);
      setHospitalizations(response.hospitalizations);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading archives:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUnarchive = async (id: string) => {
    if (!confirm('Voulez-vous réactiver ce dossier ?')) return;
    setUnarchivingId(id);
    try {
      await hospitalizationsApi.unarchive(id);
      loadData();
    } catch (error) {
      console.error('Error unarchiving:', error);
    } finally {
      setUnarchivingId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDuration = (days: number, hours: number) => {
    if (days === 0) return `${hours}h`;
    if (hours === 0) return `${days} jour${days > 1 ? 's' : ''}`;
    return `${days}j ${hours}h`;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Archives</h1>
        <p className="text-gray-500 mt-1">Dossiers des patients déjà traités</p>
      </div>

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
            placeholder="Rechercher par nom du cheval..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : hospitalizations.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {debouncedSearch ? 'Aucun résultat' : 'Aucune archive'}
          </h3>
          <p className="text-gray-500">
            {debouncedSearch
              ? 'Essayez avec un autre terme de recherche'
              : 'Les dossiers archivés apparaîtront ici'}
          </p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cheval</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Propriétaire</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Catégorie</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Admission</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Durée</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hospitalizations.map((hosp) => (
                  <tr key={hosp.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{hosp.horse.name}</div>
                      <div className="text-sm text-gray-500">
                        {(() => {
                          const ageYears = safeNumber(hosp.horse.age_years) ?? 0;
                          const weightKg = safeNumber(hosp.horse.weight_kg);
                          return (
                            <>
                              {ageYears < 1
                                ? `${Math.round(ageYears * 12)} mois`
                                : `${ageYears} ans`}{weightKg !== null ? ` - ${weightKg} kg` : ''}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{hosp.owner.full_name}</td>
                    <td className="px-4 py-3">
                      <span className="badge-gray">{categoryLabels[hosp.category]}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(hosp.admission_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDuration(hosp.duration_days, hosp.duration_hours)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/patient/${hosp.id}`}
                          className="btn-secondary py-1.5 px-3 text-sm"
                        >
                          Voir
                        </Link>
                        <button
                          onClick={() => handleUnarchive(hosp.id)}
                          disabled={unarchivingId === hosp.id}
                          className="btn-secondary py-1.5 px-3 text-sm"
                          title="Réactiver"
                        >
                          {unarchivingId === hosp.id ? (
                            <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            'Réactiver'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Affichage de {(page - 1) * PAGE_SIZE + 1} à {Math.min(page * PAGE_SIZE, total)} sur {total} résultats
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-50"
                >
                  Précédent
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
