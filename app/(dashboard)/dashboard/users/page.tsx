'use client';

import { useState, useEffect } from 'react';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';

const roleLabels: Record<string, string> = {
  VET: 'Vétérinaire',
  ASV: 'ASV',
  ADMIN: 'Administrateur',
};

const roleColors: Record<string, string> = {
  VET: 'bg-blue-100 text-blue-800',
  ASV: 'bg-green-100 text-green-800',
  ADMIN: 'bg-purple-100 text-purple-800',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'VET' as 'VET' | 'ASV' | 'ADMIN',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await usersApi.getAll();
      setUsers(response.items);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canModifyUser = (userId: string): boolean => {
    return currentUser?.id === userId;
  };

  const handleOpenEdit = (user: User) => {
    if (!canModifyUser(user.id)) return;
    setEditingUser(user);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    });
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      role: 'VET',
    });
  };

  const handleSubmit = async () => {
    if (!editingUser || !formData.email || !formData.first_name || !formData.last_name) return;

    setIsSubmitting(true);
    try {
      const updatedUser = await usersApi.update(editingUser.id, formData);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      handleCloseEdit();
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <p className="text-gray-500 mt-1">
          {users.length} utilisateur{users.length > 1 ? 's' : ''} dans la clinique
        </p>
      </div>

      {/* Users list */}
      {users.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun utilisateur</h3>
          <p className="text-gray-500">Les utilisateurs de la clinique apparaîtront ici</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Utilisateur</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rôle</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Membre depuis</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-white">
                          {user.first_name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        {currentUser?.id === user.id && (
                          <span className="text-xs text-blue-600">(vous)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    {canModifyUser(user.id) ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Modifier mon profil</h3>
                <p className="text-sm text-gray-500">Mettez à jour vos informations</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Prénom</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Nom</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'VET' | 'ASV' | 'ADMIN' })}
                  className="input"
                >
                  <option value="VET">Vétérinaire</option>
                  <option value="ASV">ASV</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseEdit}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </span>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
