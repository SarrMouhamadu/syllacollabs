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
  icon: React.ReactNode;
}[] = [
  {
    key: 'PUBLICITE',
    label: 'Publicité',
    icon: <Megaphone size={22} />,
  },
  {
    key: 'PARTENARIAT',
    label: 'Partenariat',
    icon: <Handshake size={22} />,
  },
  {
    key: 'EVENEMENT',
    label: 'Événement',
    icon: <Calendar size={22} />,
  },
  {
    key: 'SPONSORING',
    label: 'Sponsoring',
    icon: <Award size={22} />,
  },
  {
    key: 'CREATION_CONTENU',
    label: 'Création Contenu',
    icon: <Video size={22} />,
  },
  {
    key: 'AUTRE',
    label: 'Autre Projet',
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
      <div className="sylla-layout-container">
        <div className="success-card-master">
          <div className="success-icon-bubble">
            <Check size={36} />
          </div>

          <h2 className="success-title">
            Demande enregistrée avec succès !
          </h2>

          <p className="success-desc">
            Merci <strong>{submittedData.fullName}</strong>. Votre dossier a bien été transmis à la direction Sylla.
            Voici votre code de suivi unique :
          </p>

          <div className="tracking-code-banner">
            <div>
              <div className="tracking-code-label">Code de suivi unique</div>
              <div className="tracking-code-value">{submittedData.trackingCode}</div>
            </div>

            <button
              type="button"
              onClick={copyToClipboard}
              className="btn btn-whatsapp"
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

          <div className="success-info-box">
            <HelpCircle size={20} color="var(--sylla-blue-600)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Aucun mot de passe nécessaire :</strong> conservez ce code. Il vous permettra de consulter l'évolution de votre dossier à tout moment sur la page de suivi.
            </div>
          </div>

          <div className="success-actions-row">
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
    <div className="sylla-layout-container">
      {errorMessage && (
        <div className="error-alert-banner">
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="sylla-main-form">
        <div className="sylla-grid-2col">
          {/* ========================================================
              COLONNE GAUCHE (environ 40%) :
              - Badge de présentation
              - Titre principal
              - Description courte
              - Étape 1 : Type de collaboration (grille 3 cols x 2 lignes)
              ======================================================== */}
          <div className="sylla-col-left">
            {/* Hero / Intro */}
            <div className="sylla-hero-block">
              <div className="hero-pill">
                <Sparkles size={14} />
                <span>Écosystème Sylla • Collaborations Directes</span>
              </div>
              <h1 className="hero-title-main">
                Proposez votre projet de <span className="hero-title-highlight">collaboration</span>
              </h1>
              <p className="hero-desc-main">
                Publicité, partenariat de marque, sponsoring ou événement : soumettez votre demande en quelques secondes par message vocal ou écrit.
              </p>
            </div>

            {/* Étape 1 : Type de collaboration */}
            <div className="sylla-card sylla-card-step1">
              <div className="sylla-card-header">
                <span className="step-badge">1</span>
                <div>
                  <h2 className="step-title">Type de collaboration</h2>
                  <p className="step-subtitle">Sélectionnez la catégorie qui correspond le mieux à votre proposition</p>
                </div>
              </div>

              <div className="category-grid-desktop" role="radiogroup" aria-label="Type de collaboration">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.key;
                  return (
                    <div
                      key={cat.key}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      className={`category-card-desktop ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedCategory(cat.key)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedCategory(cat.key);
                        }
                      }}
                    >
                      {isSelected && (
                        <div className="category-check-badge" aria-hidden="true">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                      <div className="category-icon-desktop">{cat.icon}</div>
                      <div className="category-label-desktop">{cat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ========================================================
              COLONNE DROITE (environ 60%) :
              - Étape 2 : Votre projet (Vocal + Texte)
              - Étape 3 : Vos coordonnées
              - Bouton d'action principal
              ======================================================== */}
          <div className="sylla-col-right">
            {/* Étape 2 : Votre projet */}
            <div className="sylla-card sylla-card-step2">
              <div className="sylla-card-header">
                <span className="step-badge">2</span>
                <div>
                  <h2 className="step-title">Votre projet</h2>
                  <p className="step-subtitle">Enregistrement vocal immersif (recommandé et rapide) ou précisions écrites</p>
                </div>
              </div>

              {/* Enregistreur vocal immersif */}
              <AudioRecorder onAudioReady={handleAudioReady} maxSeconds={120} />

              {/* Champ texte pour précisions écrites */}
              <div className="form-group-note">
                <label className="field-label">
                  Précisions écrites <span className="field-optional">(facultatif si vous avez envoyé un vocal)</span>
                </label>
                <textarea
                  className="field-textarea"
                  rows={2}
                  placeholder="Décrivez votre idée, vos objectifs, le budget envisagé ou toute information utile pour notre équipe..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Étape 3 : Vos coordonnées */}
            <div className="sylla-card sylla-card-step3">
              <div className="sylla-card-header">
                <span className="step-badge">3</span>
                <div>
                  <h2 className="step-title">Vos coordonnées de contact</h2>
                  <p className="step-subtitle">Ces informations permettront à la direction Sylla de vous recontacter directement</p>
                </div>
              </div>

              <div className="contact-grid-desktop">
                <div className="field-group">
                  <label className="field-label">Nom et Prénom *</label>
                  <input
                    type="text"
                    required
                    className="field-input"
                    placeholder="Ex : Mariam Touré"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Numéro Téléphone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    className="field-input"
                    placeholder="Ex : +221 77 000 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    Entreprise / Marque <span className="field-optional">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Ex : Agence, Marque, Indépendant..."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Bouton d'action principal */}
            <div className="submit-action-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-submit-large"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    <span>Enregistrement sécurisé du dossier...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Envoyer ma proposition</span>
                  </>
                )}
              </button>
              <p className="submit-security-note">
                Code unique de suivi généré instantanément • Aucun compte ni mot de passe requis
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

