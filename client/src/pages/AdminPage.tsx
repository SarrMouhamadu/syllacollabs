import { useState, useEffect, useCallback } from 'react';
import type { FC, FormEvent } from 'react';
import {
  Search,
  MessageCircle,
  Volume2,
  FileText,
  Clock,
  RotateCcw,
  CheckCircle,
  XCircle,
  Archive,
  Plus,
  Lock,
  ExternalLink,
  ChevronRight,
  X,
  Trash2,
} from 'lucide-react';
import type {
  AdminCollaboration,
  AdminStats,
  AdminUser,
  CollaborationStatus,
} from '../types';
import {
  adminLogin,
  getAdminMe,
  getAdminCollaborations,
  getAdminCollaborationDetail,
  updateCollaborationStatus,
  addInternalNote,
  deleteAdminCollaboration,
} from '../services/api';
import { AudioPlayer } from '../components/AudioPlayer';
import { AdminHeader } from '../components/AdminHeader';

interface AdminPageProps {
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (val: boolean) => void;
  onGoToPublic: () => void;
  onLogout: () => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  PUBLICITE: 'Publicité',
  PARTENARIAT: 'Partenariat',
  EVENEMENT: 'Événement',
  SPONSORING: 'Sponsoring',
  CREATION_CONTENU: 'Création Contenu',
  AUTRE: 'Autre',
};

const STATUS_LABELS: Record<CollaborationStatus, string> = {
  NOUVELLE: 'Nouvelle demande',
  EN_ETUDE: 'En cours d’étude',
  ACCEPTEE: 'Acceptée',
  REFUSEE: 'Refusée',
  ARCHIVEE: 'Archivée',
};

export const AdminPage: FC<AdminPageProps> = ({
  isAdminLoggedIn,
  setIsAdminLoggedIn,
  onGoToPublic,
  onLogout,
}) => {
  // Login State
  const [email, setEmail] = useState('admin@sylla.com');
  const [password, setPassword] = useState('admin_sylla_2026');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // Dashboard Data State
  const [collaborations, setCollaborations] = useState<AdminCollaboration[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  // Filters State
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ACTIVES');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Detail Modal
  const [selectedItem, setSelectedItem] = useState<AdminCollaboration | null>(null);

  // Status Update & Note State
  const [statusComment, setStatusComment] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Suppression State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Vérifier la session existante
  useEffect(() => {
    if (isAdminLoggedIn) {
      getAdminMe().then((res) => {
        if (res.success && res.admin) {
          setCurrentUser(res.admin);
        } else {
          setIsAdminLoggedIn(false);
        }
      });
    }
  }, [isAdminLoggedIn, setIsAdminLoggedIn]);

  // Charger la liste des demandes
  const loadCollaborations = useCallback(async () => {
    if (!isAdminLoggedIn) return;
    setLoadingList(true);
    const res = await getAdminCollaborations({
      status: selectedStatusFilter === 'ALL' ? undefined : selectedStatusFilter,
      category: selectedCategoryFilter || undefined,
      search: searchQuery || undefined,
    });
    setLoadingList(false);

    if (res.success && res.data) {
      setCollaborations(res.data);
      if (res.counts) setStats(res.counts);
    }
  }, [isAdminLoggedIn, selectedStatusFilter, selectedCategoryFilter, searchQuery]);

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadCollaborations();
    }
  }, [isAdminLoggedIn, loadCollaborations]);

  // Connexion Admin
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    const res = await adminLogin(email, password);
    setLoginLoading(false);

    if (res.success && res.admin) {
      setIsAdminLoggedIn(true);
      setCurrentUser(res.admin);
    } else {
      setLoginError(res.error || 'Identifiants administrateur incorrects.');
    }
  };

  // Voir les détails d'un dossier
  const handleOpenDetail = async (id: string) => {
    setShowDeleteConfirm(false);
    const res = await getAdminCollaborationDetail(id);
    if (res.success && res.data) {
      setSelectedItem(res.data);
      setStatusComment('');
      setNewNoteContent('');
    }
  };

  // Suppression définitive d'un dossier
  const handleDeleteCollaboration = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);

    const res = await deleteAdminCollaboration(selectedItem.id);
    setIsDeleting(false);

    if (res.success) {
      setSelectedItem(null);
      setShowDeleteConfirm(false);
      loadCollaborations();
    } else {
      alert(res.error || 'Erreur lors de la suppression du dossier.');
    }
  };

  // Mise à jour de statut
  const handleUpdateStatus = async (status: string, action?: string) => {
    if (!selectedItem) return;
    setStatusUpdating(true);

    const res = await updateCollaborationStatus(selectedItem.id, {
      status,
      publicComment: statusComment.trim() || undefined,
      action,
    });
    setStatusUpdating(false);

    if (res.success && res.data) {
      // Recharger le dossier courant et la liste
      setSelectedItem((prev) => (prev ? { ...prev, ...res.data } : null));
      setStatusComment('');
      loadCollaborations();
    }
  };

  // Ajout d'une note interne
  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !newNoteContent.trim()) return;

    setNoteSubmitting(true);
    const res = await addInternalNote(selectedItem.id, newNoteContent.trim());
    setNoteSubmitting(false);

    if (res.success && res.data) {
      setSelectedItem((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          internalNotes: [res.data, ...(prev.internalNotes || [])],
        };
      });
      setNewNoteContent('');
      loadCollaborations();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // 1. Vue Connexion si non authentifié
  if (!isAdminLoggedIn) {
    return (
      <div className="main-content">
        <div className="card-panel" style={{ maxWidth: 460, margin: '2rem auto', textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--sylla-blue-100)',
              color: 'var(--sylla-blue-800)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <Lock size={28} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--sylla-blue-900)', marginBottom: '0.4rem' }}>
            Accès Dashboard Direction
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--sylla-gray-500)', marginBottom: '1.5rem' }}>
            Espace confidentiel de gestion des partenariats et collaborations Sylla.
          </p>

          {loginError && (
            <div
              style={{
                background: 'var(--sylla-red-50)',
                color: 'var(--sylla-red-500)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                fontWeight: 600,
              }}
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={{ textAlign: 'left' }}>
            <div className="form-group">
              <label className="form-label">Email Professionnel</label>
              <input
                type="email"
                required
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                required
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loginLoading ? 'Connexion en cours...' : 'Se connecter au Dashboard'}
            </button>
          </form>

          <div
            style={{
              marginTop: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                padding: '0.75rem',
                background: 'var(--sylla-gray-50)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                color: 'var(--sylla-gray-500)',
              }}
            >
              Identifiants configurés : <code>admin@sylla.com</code>
            </div>

            <button
              type="button"
              onClick={onGoToPublic}
              className="btn btn-outline btn-sm"
              style={{ alignSelf: 'center' }}
            >
              Retour à l'interface publique
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Vue Dashboard Administrateur (Cockpit)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--sylla-gray-50)' }}>
      {/* Header Dédié Cockpit */}
      <AdminHeader
        currentUser={currentUser}
        onLogout={onLogout}
        onRefresh={loadCollaborations}
        loadingList={loadingList}
        onGoToPublic={onGoToPublic}
      />

      <div className="main-content" style={{ maxWidth: 1200, width: '100%', padding: '1.5rem 1.25rem 3rem' }}>
        {/* En-tête Cockpit */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--sylla-blue-900)' }}>
              Cockpit de Gestion des Partenariats
            </h1>
            <p style={{ color: 'var(--sylla-gray-500)', fontSize: '0.875rem' }}>
              Espace de pilotage stratégique de l'écosystème Sylla • Traitement des dossiers
            </p>
          </div>
        </div>

      {/* Cartes de Statistiques avec filtres rapides */}
      {stats && (
        <div className="admin-stats-grid">
          <div
            className={`admin-stat-card ${selectedStatusFilter === 'ACTIVES' ? 'active' : ''}`}
            onClick={() => setSelectedStatusFilter('ACTIVES')}
          >
            <div className="admin-stat-count">
              {stats.nouvelles + stats.enEtude + stats.acceptees + stats.refusees}
            </div>
            <div className="admin-stat-label">Dossiers Actifs</div>
          </div>

          <div
            className={`admin-stat-card ${selectedStatusFilter === 'NOUVELLE' ? 'active' : ''}`}
            onClick={() => setSelectedStatusFilter('NOUVELLE')}
          >
            <div className="admin-stat-count" style={{ color: 'var(--sylla-blue-600)' }}>
              {stats.nouvelles}
            </div>
            <div className="admin-stat-label">Nouvelles Demandes</div>
          </div>

          <div
            className={`admin-stat-card ${selectedStatusFilter === 'EN_ETUDE' ? 'active' : ''}`}
            onClick={() => setSelectedStatusFilter('EN_ETUDE')}
          >
            <div className="admin-stat-count" style={{ color: 'var(--sylla-amber-500)' }}>
              {stats.enEtude}
            </div>
            <div className="admin-stat-label">En cours d'étude</div>
          </div>

          <div
            className={`admin-stat-card ${selectedStatusFilter === 'ACCEPTEE' ? 'active' : ''}`}
            onClick={() => setSelectedStatusFilter('ACCEPTEE')}
          >
            <div className="admin-stat-count" style={{ color: 'var(--sylla-green-600)' }}>
              {stats.acceptees}
            </div>
            <div className="admin-stat-label">Acceptées</div>
          </div>

          <div
            className={`admin-stat-card ${selectedStatusFilter === 'REFUSEE' ? 'active' : ''}`}
            onClick={() => setSelectedStatusFilter('REFUSEE')}
          >
            <div className="admin-stat-count" style={{ color: 'var(--sylla-red-500)' }}>
              {stats.refusees}
            </div>
            <div className="admin-stat-label">Refusées</div>
          </div>

          <div
            className={`admin-stat-card ${selectedStatusFilter === 'ARCHIVEE' ? 'active' : ''}`}
            onClick={() => setSelectedStatusFilter('ARCHIVEE')}
          >
            <div className="admin-stat-count" style={{ color: 'var(--sylla-gray-400)' }}>
              {stats.archivees}
            </div>
            <div className="admin-stat-label">Archivées</div>
          </div>
        </div>
      )}

      {/* Barre d'Outils et Filtres */}
      <div
        className="card-panel"
        style={{
          padding: '1rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Rechercher par nom, téléphone, code SYL-..., entreprise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search
            size={18}
            color="var(--sylla-gray-400)"
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        <div style={{ flex: '0 0 auto' }}>
          <select
            className="form-select"
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            style={{ minWidth: 160 }}
          >
            <option value="">Toutes les catégories</option>
            {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 0 auto' }}>
          <select
            className="form-select"
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            style={{ minWidth: 150 }}
          >
            <option value="ACTIVES">Actifs uniquement</option>
            <option value="ALL">Tous les statuts</option>
            <option value="NOUVELLE">Nouvelles</option>
            <option value="EN_ETUDE">En étude</option>
            <option value="ACCEPTEE">Acceptées</option>
            <option value="REFUSEE">Refusées</option>
            <option value="ARCHIVEE">Archivées</option>
          </select>
        </div>
      </div>

      {/* Liste des Demandes (Tri chronologique descendant) */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date & Réf</th>
              <th>Demandeur</th>
              <th>Catégorie</th>
              <th>Message / Vocal</th>
              <th>Statut</th>
              <th>Notes</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {collaborations.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--sylla-gray-400)' }}>
                  {loadingList ? 'Chargement des dossiers...' : 'Aucune demande ne correspond aux critères sélectionnés.'}
                </td>
              </tr>
            ) : (
              collaborations.map((c) => (
                <tr key={c.id} onClick={() => handleOpenDetail(c.id)}>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--sylla-blue-900)', fontFamily: 'monospace' }}>
                      {c.trackingCode}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--sylla-gray-400)' }}>
                      {formatDate(c.createdAt)}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--sylla-gray-800)' }}>{c.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--sylla-gray-500)' }}>
                      {c.phone} {c.company ? `• ${c.company}` : ''}
                    </div>
                  </td>

                  <td>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'var(--sylla-gray-100)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--sylla-blue-900)',
                      }}
                    >
                      {CATEGORY_NAMES[c.category] || c.category}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {c.audioPath && (
                        <span
                          title="Message vocal joint"
                          style={{
                            background: 'var(--sylla-green-100)',
                            color: 'var(--sylla-green-700)',
                            padding: '0.2rem 0.4rem',
                            borderRadius: 'var(--radius-sm)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          <Volume2 size={13} />
                          <span>{c.audioDuration ? `${c.audioDuration}s` : 'Vocal'}</span>
                        </span>
                      )}
                      {c.description && (
                        <span
                          title={c.description}
                          style={{
                            color: 'var(--sylla-gray-600)',
                            fontSize: '0.8rem',
                            maxWidth: 160,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'inline-block',
                          }}
                        >
                          {c.description}
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <span className={`status-badge ${c.status}`}>
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--sylla-gray-500)', fontWeight: 600 }}>
                      {c._count?.internalNotes || 0} note(s)
                    </span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(c.id);
                      }}
                    >
                      <span>Traiter</span>
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Fiche Détaillée & Traitement */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Titre Modal */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--sylla-gray-200)',
                paddingBottom: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--sylla-gray-400)', textTransform: 'uppercase' }}>
                  Dossier Réf :
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sylla-blue-900)', fontFamily: 'monospace' }}>
                  {selectedItem.trackingCode}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`status-badge ${selectedItem.status}`}>
                  {STATUS_LABELS[selectedItem.status] || selectedItem.status}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--sylla-gray-400)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Informations Prospect & Contact WhatsApp */}
            <div
              style={{
                background: 'var(--sylla-gray-50)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--sylla-gray-900)' }}>
                  {selectedItem.fullName}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--sylla-gray-600)', marginTop: 2 }}>
                  <strong>Téléphone :</strong> {selectedItem.phone}
                  {selectedItem.company && (
                    <>
                      {' '}• <strong>Entreprise :</strong> {selectedItem.company}
                    </>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sylla-gray-400)', marginTop: 4 }}>
                  Catégorie : <strong>{CATEGORY_NAMES[selectedItem.category] || selectedItem.category}</strong> • Déposé le {formatDate(selectedItem.createdAt)}
                </div>
              </div>

              {/* Bouton WhatsApp direct standard wa.me */}
              {selectedItem.whatsappLink && (
                <a
                  href={selectedItem.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp btn-sm"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <MessageCircle size={16} />
                  <span>Contacter via WhatsApp</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>

            {/* Vocal Déposé */}
            {selectedItem.audioUrl && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--sylla-blue-900)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  <Volume2 size={16} color="var(--sylla-green-600)" />
                  <span>Message vocal du demandeur ({selectedItem.audioDuration ? `${selectedItem.audioDuration}s` : 'Vocal'})</span>
                </div>
                <AudioPlayer src={selectedItem.audioUrl} duration={selectedItem.audioDuration} />
              </div>
            )}

            {/* Description Écrite */}
            {selectedItem.description && (
              <div style={{ marginBottom: '1.5rem', background: 'var(--sylla-white)', border: '1px solid var(--sylla-gray-200)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--sylla-blue-900)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  <FileText size={16} color="var(--sylla-blue-600)" />
                  <span>Explication écrite</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--sylla-gray-700)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {selectedItem.description}
                </div>
              </div>
            )}

            {/* Panneau d'Actions de Changement de Statut */}
            <div style={{ borderTop: '1px solid var(--sylla-gray-200)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--sylla-blue-900)', marginBottom: '0.75rem' }}>
                Changer le statut du dossier
              </h3>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">
                  Commentaire public visible dans le suivi
                  <span className="form-label-optional">(laisser vide pour le message automatique)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex : Notre équipe commerciale va vous contacter pour finaliser le contrat..."
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={statusUpdating || selectedItem.status === 'EN_ETUDE'}
                  onClick={() => handleUpdateStatus('EN_ETUDE')}
                  className="btn btn-outline btn-sm"
                  style={{ color: '#b45309', borderColor: '#fde68a', background: '#fffbeb' }}
                >
                  <Clock size={15} />
                  <span>Mettre en étude</span>
                </button>

                <button
                  type="button"
                  disabled={statusUpdating || selectedItem.status === 'ACCEPTEE'}
                  onClick={() => handleUpdateStatus('ACCEPTEE')}
                  className="btn btn-outline btn-sm"
                  style={{ color: 'var(--sylla-green-700)', borderColor: '#a7f3d0', background: 'var(--sylla-green-50)' }}
                >
                  <CheckCircle size={15} />
                  <span>Accepter le dossier</span>
                </button>

                <button
                  type="button"
                  disabled={statusUpdating || selectedItem.status === 'REFUSEE'}
                  onClick={() => handleUpdateStatus('REFUSEE')}
                  className="btn btn-outline btn-sm"
                  style={{ color: 'var(--sylla-red-500)', borderColor: '#fecaca', background: 'var(--sylla-red-50)' }}
                >
                  <XCircle size={15} />
                  <span>Refuser</span>
                </button>

                {selectedItem.status !== 'ARCHIVEE' ? (
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus('ARCHIVEE')}
                    className="btn btn-outline btn-sm"
                    style={{ color: 'var(--sylla-gray-600)' }}
                  >
                    <Archive size={15} />
                    <span>Archiver</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus('', 'RESTAURER')}
                    className="btn btn-primary btn-sm"
                  >
                    <RotateCcw size={15} />
                    <span>Restaurer le dossier</span>
                  </button>
                )}

                {selectedItem.status !== 'NOUVELLE' && (
                  <button
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus('NOUVELLE')}
                    className="btn btn-outline btn-sm"
                    style={{ color: 'var(--sylla-blue-700)' }}
                  >
                    <span>Remettre en Nouvelle</span>
                  </button>
                )}

                {/* Bouton de Suppression Définitive */}
                {!showDeleteConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn btn-outline btn-sm"
                    style={{
                      color: 'var(--sylla-red-500)',
                      borderColor: '#fca5a5',
                      marginLeft: 'auto',
                    }}
                    title="Supprimer définitivement ce dossier"
                  >
                    <Trash2 size={15} />
                    <span>Supprimer le dossier</span>
                  </button>
                )}
              </div>

              {/* Encadré de Confirmation de Suppression */}
              {showDeleteConfirm && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'var(--sylla-red-50)',
                    border: '1.5px solid #fca5a5',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: 'var(--sylla-red-500)',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Confirmation de suppression définitive</span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--sylla-gray-700)' }}>
                    Êtes-vous certain de vouloir supprimer définitivement le dossier <strong>{selectedItem.trackingCode}</strong> ainsi que son message vocal et ses notes associées ? Cette action est irréversible.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: 4 }}>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDeleteCollaboration}
                      className="btn btn-danger btn-sm"
                    >
                      {isDeleting ? 'Suppression en cours...' : 'Oui, supprimer définitivement'}
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="btn btn-outline btn-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notes Internes Confidentielles */}
            <div style={{ borderTop: '1px solid var(--sylla-gray-200)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.75rem' }}>
                <Lock size={16} color="var(--sylla-blue-900)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--sylla-blue-900)' }}>
                  Notes Internes Confidentielles (Invisibles au public)
                </h3>
              </div>

              <form onSubmit={handleAddNote} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ajouter une remarque interne (ex : budget négocié, dispo, réunion fixée...)"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={noteSubmitting}
                    className="btn btn-primary btn-sm"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <Plus size={16} />
                    <span>Ajouter note</span>
                  </button>
                </div>
              </form>

              {selectedItem.internalNotes && selectedItem.internalNotes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {selectedItem.internalNotes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        background: 'var(--sylla-blue-50)',
                        borderLeft: '3px solid var(--sylla-blue-600)',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--sylla-gray-500)', fontSize: '0.75rem', marginBottom: 2 }}>
                        <span><strong>{note.author}</strong></span>
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                      <div style={{ color: 'var(--sylla-gray-800)' }}>{note.content}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.825rem', color: 'var(--sylla-gray-400)', fontStyle: 'italic' }}>
                  Aucune note interne pour ce dossier.
                </div>
              )}
            </div>

            {/* Historique Public des Statuts */}
            <div style={{ borderTop: '1px solid var(--sylla-gray-200)', paddingTop: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--sylla-blue-900)', marginBottom: '0.5rem' }}>
                Historique chronologique des changements de statut
              </h3>

              <div className="timeline-list">
                {selectedItem.statusHistory?.map((hist) => (
                  <div key={hist.id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-date">{formatDate(hist.createdAt)}</div>
                    <div className="timeline-status">{STATUS_LABELS[hist.status] || hist.status}</div>
                    {hist.publicComment && (
                      <div className="timeline-comment">{hist.publicComment}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
