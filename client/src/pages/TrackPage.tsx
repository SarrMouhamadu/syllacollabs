import { useState, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import { Search, Clock, FileText, CheckCircle2, AlertCircle, RefreshCw, Volume2 } from 'lucide-react';
import type { PublicCollaboration, CollaborationStatus } from '../types';
import { getPublicCollaboration } from '../services/api';
import { AudioPlayer } from '../components/AudioPlayer';

interface TrackPageProps {
  initialCode?: string;
}

const STATUS_LABELS: Record<CollaborationStatus, { label: string; desc: string }> = {
  NOUVELLE: {
    label: 'Nouvelle demande',
    desc: 'Votre proposition a bien été reçue et est en attente d’attribution.',
  },
  EN_ETUDE: {
    label: 'En cours d’étude',
    desc: 'Votre dossier est actuellement analysé en détail par l’équipe de direction Sylla.',
  },
  ACCEPTEE: {
    label: 'Proposition Acceptée',
    desc: 'Excellente nouvelle ! Votre projet a été validé. Nous prendrons contact avec vous très rapidement.',
  },
  REFUSEE: {
    label: 'Proposition Déclinée',
    desc: 'Votre demande n’a pas pu être retenue pour le moment.',
  },
  ARCHIVEE: {
    label: 'Dossier Archivé',
    desc: 'Ce dossier a été clôturé ou archivé.',
  },
};

const CATEGORY_NAMES: Record<string, string> = {
  PUBLICITE: 'Publicité',
  PARTENARIAT: 'Partenariat de marque',
  EVENEMENT: 'Événement & Gala',
  SPONSORING: 'Sponsoring & Mécénat',
  CREATION_CONTENU: 'Création de Contenu',
  AUTRE: 'Autre Projet',
};

export const TrackPage: FC<TrackPageProps> = ({ initialCode = '' }) => {
  const [code, setCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collaboration, setCollaboration] = useState<PublicCollaboration | null>(null);

  const fetchStatus = async (trackingCodeToSearch: string) => {
    if (!trackingCodeToSearch.trim()) {
      setError('Veuillez saisir votre code de suivi (ex : SYL-ABC123).');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await getPublicCollaboration(trackingCodeToSearch.trim());
    setIsLoading(false);

    if (result.success && result.data) {
      setCollaboration(result.data);
    } else {
      setCollaboration(null);
      setError(result.error || 'Dossier introuvable pour ce code.');
    }
  };

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      fetchStatus(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    fetchStatus(code);
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="single-page-wrapper">
      <div style={{ textAlign: 'center', marginBottom: '0.65rem' }}>
        <h1 className="submit-title-compact">
          Suivi de votre <span className="hero-title-highlight">dossier</span>
        </h1>
        <p className="submit-desc-compact">
          Consultez l'avancement de votre proposition en direct sans compte utilisateur.
        </p>
      </div>

      {/* Barre de recherche du code de suivi */}
      <div className="proposal-card-compact" style={{ maxWidth: 500, margin: '0 auto 0.75rem', padding: '0.65rem 0.85rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group-compact" style={{ marginBottom: '0.35rem' }}>
            <label className="form-label-compact">Votre Code de Suivi Unique</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input form-input-compact"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
                placeholder="Ex : SYL-7K8P9X"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-sm"
                style={{ padding: '0 1rem' }}
              >
                {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--sylla-gray-500)' }}>
            Ce code vous a été remis lors de la validation de votre demande.
          </div>
        </form>
      </div>

      {error && (
        <div
          style={{
            maxWidth: 500,
            margin: '0 auto 0.75rem',
            background: 'var(--sylla-red-50)',
            border: '1px solid #fecaca',
            color: 'var(--sylla-red-500)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Détails du dossier trouvé */}
      {collaboration && (
        <div className="proposal-card-compact" style={{ maxWidth: 660, margin: '0 auto', padding: '1rem' }}>
          {/* En-tête du dossier */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--sylla-gray-200)',
              paddingBottom: '1rem',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--sylla-gray-400)', textTransform: 'uppercase' }}>
                Référence dossier
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--sylla-blue-900)', fontFamily: 'monospace' }}>
                {collaboration.trackingCode}
              </div>
            </div>

            <div className={`status-badge ${collaboration.status}`}>
              <CheckCircle2 size={14} />
              <span>{STATUS_LABELS[collaboration.status]?.label || collaboration.status}</span>
            </div>
          </div>

          {/* Description du statut */}
          <div
            style={{
              background: 'var(--sylla-blue-50)',
              border: '1px solid var(--sylla-blue-100)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--sylla-blue-900)', marginBottom: '0.25rem' }}>
              État actuel de votre demande :
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--sylla-blue-700)' }}>
              {STATUS_LABELS[collaboration.status]?.desc}
            </div>
          </div>

          {/* Informations récapitulatives */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--sylla-gray-400)', textTransform: 'uppercase' }}>
                Catégorie
              </div>
              <div style={{ fontWeight: 700, color: 'var(--sylla-gray-800)' }}>
                {CATEGORY_NAMES[collaboration.category] || collaboration.category}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--sylla-gray-400)', textTransform: 'uppercase' }}>
                Demandeur
              </div>
              <div style={{ fontWeight: 700, color: 'var(--sylla-gray-800)' }}>
                {collaboration.maskedName} {collaboration.company ? `(${collaboration.company})` : ''}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--sylla-gray-400)', textTransform: 'uppercase' }}>
                Date de dépôt
              </div>
              <div style={{ fontWeight: 700, color: 'var(--sylla-gray-800)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={14} color="var(--sylla-gray-400)" />
                <span>{formatDate(collaboration.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Message vocal déposé */}
          {collaboration.hasAudio && collaboration.audioUrl && (
            <div style={{ marginBottom: '1.5rem', background: 'var(--sylla-gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--sylla-blue-900)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <Volume2 size={16} color="var(--sylla-green-600)" />
                <span>Votre message vocal</span>
              </div>
              <AudioPlayer src={collaboration.audioUrl} duration={collaboration.audioDuration} />
            </div>
          )}

          {/* Description écrite */}
          {collaboration.description && (
            <div style={{ marginBottom: '1.5rem', background: 'var(--sylla-gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--sylla-blue-900)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <FileText size={16} color="var(--sylla-blue-600)" />
                <span>Description de votre projet</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--sylla-gray-700)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {collaboration.description}
              </div>
            </div>
          )}

          {/* Historique chronologique daté */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--sylla-blue-900)', marginBottom: '0.75rem' }}>
              Historique des étapes de traitement
            </h3>

            <div className="timeline-list">
              {collaboration.statusHistory.map((item) => (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-date">{formatDate(item.createdAt)}</div>
                  <div className="timeline-status">
                    {STATUS_LABELS[item.status]?.label || item.status}
                  </div>
                  {item.publicComment && (
                    <div className="timeline-comment">{item.publicComment}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
