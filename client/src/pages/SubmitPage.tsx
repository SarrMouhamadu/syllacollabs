import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import {
  Megaphone,
  Handshake,
  Calendar,
  Award,
  Video,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Send,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import type { CollaborationCategory } from '../types';
import { AudioRecorder } from '../components/AudioRecorder';
import { submitCollaboration } from '../services/api';

interface SubmitPageProps {
  onGoToTrack: (trackingCode: string) => void;
}

const CATEGORIES: {
  key: CollaborationCategory;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    key: 'PUBLICITE',
    label: 'Publicité',
    desc: 'Campagne de promotion, affichage ou média',
    icon: <Megaphone size={22} />,
  },
  {
    key: 'PARTENARIAT',
    label: 'Partenariat',
    desc: 'Synergie de marque, offre croisée ou alliance',
    icon: <Handshake size={22} />,
  },
  {
    key: 'EVENEMENT',
    label: 'Événement',
    desc: 'Conférence, gala, animation ou salon',
    icon: <Calendar size={22} />,
  },
  {
    key: 'SPONSORING',
    label: 'Sponsoring',
    desc: 'Mécénat ou soutien d’un projet',
    icon: <Award size={22} />,
  },
  {
    key: 'CREATION_CONTENU',
    label: 'Création de Contenu',
    desc: 'Vidéo dédiée, shooting, reportage',
    icon: <Video size={22} />,
  },
  {
    key: 'AUTRE',
    label: 'Autre Projet',
    desc: 'Autre opportunité ou demande spéciale',
    icon: <Sparkles size={22} />,
  },
];

export const SubmitPage: FC<SubmitPageProps> = ({ onGoToTrack }) => {
  const [selectedCategory, setSelectedCategory] = useState<CollaborationCategory>('PUBLICITE');
  const [description, setDescription] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Écran de succès
  const [submittedData, setSubmittedData] = useState<{
    trackingCode: string;
    fullName: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAudioReady = (blob: Blob | null, duration: number) => {
    setAudioBlob(blob);
    setAudioDuration(duration);
    if (blob) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !phone.trim()) {
      setErrorMessage('Veuillez renseigner votre nom complet et votre numéro de téléphone/WhatsApp.');
      return;
    }

    if (!description.trim() && !audioBlob) {
      setErrorMessage(
        'Veuillez expliquer votre projet soit par un message vocal (recommandé), soit par écrit (ou les deux).'
      );
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('category', selectedCategory);
    formData.append('fullName', fullName.trim());
    formData.append('phone', phone.trim());
    if (company.trim()) {
      formData.append('company', company.trim());
    }
    if (description.trim()) {
      formData.append('description', description.trim());
    }
    if (audioBlob) {
      const ext = audioBlob.type.includes('mp4') || audioBlob.type.includes('m4a') || audioBlob.type.includes('aac')
        ? 'recording.m4a'
        : 'recording.webm';
      formData.append('audio', audioBlob, ext);
      formData.append('audioDuration', audioDuration.toString());
    }

    const response = await submitCollaboration(formData);
    setIsSubmitting(false);

    if (response.success && response.data) {
      setSubmittedData({
        trackingCode: response.data.trackingCode,
        fullName: response.data.fullName,
      });
    } else {
      setErrorMessage(response.error || 'Une erreur est survenue lors de l’envoi de votre demande.');
    }
  };

  const copyToClipboard = () => {
    if (!submittedData) return;
    navigator.clipboard.writeText(submittedData.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Vue de confirmation
  if (submittedData) {
    return (
      <div className="main-content">
        <div className="success-card">
          <div className="success-icon-bubble">
            <Check size={38} />
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--sylla-blue-900)', marginBottom: '0.5rem' }}>
            Demande enregistrée avec succès !
          </h2>

          <p style={{ color: 'var(--sylla-gray-600)', maxWidth: 520, margin: '0 auto 1.5rem' }}>
            Merci {submittedData.fullName}. Votre dossier a bien été transmis à la direction de l'écosystème Sylla.
            Voici votre code de suivi unique :
          </p>

          <div className="tracking-code-banner">
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--sylla-gray-300)', letterSpacing: 1 }}>
                Code de suivi unique
              </div>
              <div className="tracking-code-value">{submittedData.trackingCode}</div>
            </div>

            <button
              type="button"
              onClick={copyToClipboard}
              className="btn btn-whatsapp btn-sm"
              style={{ padding: '0.6rem 1rem' }}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>

          <div
            style={{
              background: 'var(--sylla-blue-50)',
              border: '1px solid var(--sylla-blue-100)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              maxWidth: 480,
              margin: '1.5rem auto',
              fontSize: '0.875rem',
              color: 'var(--sylla-blue-900)',
              textAlign: 'left',
              display: 'flex',
              gap: '0.75rem',
            }}
          >
            <HelpCircle size={20} color="var(--sylla-blue-600)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Aucun mot de passe nécessaire :</strong> conservez ce code. Il vous permettra de consulter l'évolution de votre dossier à tout moment sur la page de suivi.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onGoToTrack(submittedData.trackingCode)}
              className="btn btn-primary"
            >
              <span>Suivre mon dossier dès maintenant</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => {
                setSubmittedData(null);
                setFullName('');
                setPhone('');
                setCompany('');
                setDescription('');
                setAudioBlob(null);
                setAudioDuration(0);
              }}
              className="btn btn-outline"
            >
              Déposer une autre demande
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Bannière de présentation */}
      <section className="hero-banner">
        <div className="hero-pill">
          <Sparkles size={14} />
          <span>Écosystème Sylla • Collaborations Directes</span>
        </div>
        <h1 className="hero-title">
          Proposez votre projet de <span className="hero-title-highlight">collaboration</span>
        </h1>
        <p className="hero-description">
          Publicité, partenariat de marque, sponsoring ou événement : soumettez votre demande en quelques secondes par message vocal ou écrit.
        </p>
      </section>

      {errorMessage && (
        <div
          style={{
            background: 'var(--sylla-red-50)',
            border: '1px solid #fecaca',
            color: 'var(--sylla-red-500)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 600,
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Étape 1 : Choix de catégorie */}
        <div className="card-panel">
          <div className="card-title-row">
            <div className="step-indicator">1</div>
            <h2 className="card-title">Choisissez le type de collaboration</h2>
          </div>
          <p className="card-helper">Sélectionnez la catégorie qui correspond le mieux à votre proposition.</p>

          <div className="category-grid" role="radiogroup" aria-label="Type de collaboration">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <div
                  key={cat.key}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  className={`category-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCategory(cat.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedCategory(cat.key);
                    }
                  }}
                >
                  {isSelected && (
                    <div className="category-badge-check" aria-hidden="true">
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                  <div className="category-icon">{cat.icon}</div>
                  <div className="category-label">{cat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Étape 2 : Explication du projet (Vocal + Texte) */}
        <div className="card-panel">
          <div className="card-title-row">
            <div className="step-indicator">2</div>
            <h2 className="card-title">Expliquez votre projet</h2>
          </div>
          <p className="card-helper">
            Vous pouvez enregistrer un message vocal (recommandé et rapide), rédiger un texte, ou combiner les deux.
          </p>

          {/* Enregistreur vocal */}
          <AudioRecorder onAudioReady={handleAudioReady} maxSeconds={120} />

          {/* Zone de texte facultative */}
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label className="form-label">
              Précisions écrites
              <span className="form-label-optional">(facultatif si vous avez envoyé un vocal)</span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="Décrivez votre idée, vos objectifs, le budget envisagé ou toute information utile pour notre équipe..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Étape 3 : Coordonnées essentielles */}
        <div className="card-panel">
          <div className="card-title-row">
            <div className="step-indicator">3</div>
            <h2 className="card-title">Vos coordonnées de contact</h2>
          </div>
          <p className="card-helper">
            Ces informations permettront à la direction Sylla de vous recontacter directement.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nom et Prénom *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Ex : Mariam Touré"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Numéro de téléphone / WhatsApp *</label>
              <input
                type="tel"
                required
                className="form-input"
                placeholder="Ex : +221 77 000 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Entreprise ou Organisme
              <span className="form-label-optional">(optionnel)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex : Agence Digitale Dakar / Indépendant"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
        </div>

        {/* Bouton d'envoi */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ minWidth: 260, fontSize: '1.05rem', padding: '0.9rem 2rem' }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Enregistrement du dossier...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Envoyer ma proposition</span>
              </>
            )}
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--sylla-gray-500)', marginTop: '0.6rem' }}>
            Aucun compte requis. Vous recevrez instantanément un code de suivi unique.
          </p>
        </div>
      </form>
    </div>
  );
};
