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
  ArrowLeft,
  Mic,
  Send,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Shield,
  Zap,
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
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedCategory, setSelectedCategory] = useState<CollaborationCategory>('PUBLICITE');
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

  const handleGoToStep2 = () => {
    setErrorMessage(null);
    if (!audioBlob) {
      setErrorMessage(
        'Veuillez enregistrer votre message vocal présentant votre projet avant de continuer.'
      );
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStep1 = () => {
    setErrorMessage(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !phone.trim()) {
      setErrorMessage('Veuillez renseigner votre nom complet et votre numéro de téléphone/WhatsApp.');
      return;
    }

    if (!audioBlob) {
      setErrorMessage(
        'Veuillez enregistrer votre message vocal pour présenter votre projet.'
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
                setCurrentStep(1);
                setFullName('');
                setPhone('');
                setCompany('');
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
      {/* Stepper horizontal 2 étapes */}
      <div className="sylla-stepper-container">
        <div
          className={`sylla-stepper-step ${currentStep === 1 ? 'active' : 'completed'}`}
          onClick={() => currentStep === 2 && handleBackToStep1()}
          role="button"
          tabIndex={currentStep === 2 ? 0 : -1}
          title={currentStep === 2 ? 'Cliquer pour revenir à l’étape 1' : undefined}
          style={{ cursor: currentStep === 2 ? 'pointer' : 'default' }}
        >
          <div className="stepper-step-num">
            {currentStep === 2 ? <Check size={14} strokeWidth={3} /> : '1'}
          </div>
          <div className="stepper-step-info">
            <span className="stepper-step-tag">Étape 1</span>
            <span className="stepper-step-title">Votre projet</span>
          </div>
        </div>

        <div className={`sylla-stepper-line ${currentStep === 2 ? 'active' : ''}`} />

        <div className={`sylla-stepper-step ${currentStep === 2 ? 'active' : ''}`}>
          <div className="stepper-step-num">2</div>
          <div className="stepper-step-info">
            <span className="stepper-step-tag">Étape 2</span>
            <span className="stepper-step-title">Vos coordonnées</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="error-alert-banner">
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================
          ÉTAPE 1 : CHOIX DU TYPE DE PROJET & MESSAGE (VOCAL OU ÉCRIT)
          ======================================================== */}
      {currentStep === 1 && (
        <div className="sylla-grid-2col animate-fade-in">
          {/* Colonne gauche (~40%) : Hero + Présentation & Avantages */}
          <div className="sylla-col-left">
            <div className="sylla-hero-block">
              <div className="hero-pill">
                <Sparkles size={14} />
                <span>Écosystème Sylla • Collaborations Directes</span>
              </div>
              <h1 className="hero-title-main">
                Proposez votre projet de <span className="hero-title-highlight">collaboration</span>
              </h1>
              <p className="hero-desc-main">
                Étape 1 sur 2 : Choisissez votre type de partenariat puis enregistrez votre message vocal pour présenter votre proposition.
              </p>
            </div>

            {/* Carte de réassurance & avantages clés */}
            <div className="sylla-card sylla-hero-info-card">
              <div className="info-feature-item">
                <div className="info-feature-icon">
                  <Mic size={18} />
                </div>
                <div>
                  <h3 className="info-feature-title">100% Vocal & Direct</h3>
                  <p className="info-feature-desc">Présentez votre projet à vive voix en toute authenticité (2 minutes maximum).</p>
                </div>
              </div>

              <div className="info-feature-item">
                <div className="info-feature-icon">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="info-feature-title">Accès Direction Sylla</h3>
                  <p className="info-feature-desc">Votre proposition est transmise directement et analysée sans intermédiaire.</p>
                </div>
              </div>

              <div className="info-feature-item">
                <div className="info-feature-icon">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="info-feature-title">Suivi Instantané & Sécurisé</h3>
                  <p className="info-feature-desc">Un code confidentiel unique vous permet de suivre l'avancement en temps réel.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite (~60%) : 1. Type de collaboration et 2. Votre projet (SUPERPOSÉS) */}
          <div className="sylla-col-right">
            {/* 1. Type de collaboration */}
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

            {/* 2. Votre projet (Vocal immersif) - SUPERPOSÉ */}
            <div className="sylla-card sylla-card-step2">
              <div className="sylla-card-header">
                <span className="step-badge">2</span>
                <div>
                  <h2 className="step-title">Votre projet</h2>
                  <p className="step-subtitle">Enregistrement vocal immersif (2 minutes maximum)</p>
                </div>
              </div>

              {/* Enregistreur vocal immersif */}
              <AudioRecorder onAudioReady={handleAudioReady} maxSeconds={120} />
            </div>

            {/* Bouton pour aller à l'étape 2 */}
            <div className="submit-action-row">
              <button
                type="button"
                onClick={handleGoToStep2}
                className="btn btn-primary btn-submit-large"
              >
                <span>Continuer vers mes coordonnées</span>
                <ArrowRight size={20} />
              </button>
              <p className="submit-security-note">
                Étape 2 sur 2 : coordonnées de contact pour que la direction Sylla puisse vous joindre
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ÉTAPE 2 : RÉCAPITULATIF PROJET & COORDONNÉES DE CONTACT
          ======================================================== */}
      {currentStep === 2 && (
        <form onSubmit={handleSubmit} className="sylla-main-form animate-fade-in">
          <div className="sylla-grid-2col">
            {/* Colonne gauche (~40%) : Récapitulatif du projet validé à l'étape 1 */}
            <div className="sylla-col-left">
              <div className="sylla-hero-block">
                <div className="hero-pill">
                  <Sparkles size={14} />
                  <span>Dernière étape • Coordonnées</span>
                </div>
                <h1 className="hero-title-main">
                  Finalisez votre <span className="hero-title-highlight">demande</span>
                </h1>
                <p className="hero-desc-main">
                  Vérifiez le résumé de votre projet ci-dessous et complétez vos coordonnées pour envoyer votre proposition.
                </p>
              </div>

              {/* Carte récapitulative élégante */}
              <div className="sylla-card sylla-project-summary-card">
                <div className="sylla-card-header">
                  <span className="step-badge step-badge-check">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <h2 className="step-title">Projet enregistré</h2>
                    <p className="step-subtitle">Étape 1 validée avec succès</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    className="btn-edit-project"
                    title="Modifier mon projet"
                  >
                    <ArrowLeft size={13} />
                    <span>Modifier</span>
                  </button>
                </div>

                <div className="summary-category-pill">
                  <div className="summary-cat-icon">
                    {CATEGORIES.find((c) => c.key === selectedCategory)?.icon}
                  </div>
                  <div>
                    <div className="summary-cat-label-sub">Type de collaboration</div>
                    <div className="summary-cat-name">
                      {CATEGORIES.find((c) => c.key === selectedCategory)?.label}
                    </div>
                  </div>
                </div>

                {audioBlob && (
                  <div className="summary-audio-badge">
                    <Mic size={18} color="var(--sylla-green-600)" />
                    <div style={{ flex: 1 }}>
                      <div className="summary-audio-title">Message vocal prêt</div>
                      <div className="summary-audio-duration">
                        Durée : {Math.round(audioDuration)}s • Enregistrement optimisé
                      </div>
                    </div>
                    <span className="summary-ready-tag">Prêt</span>
                  </div>
                )}
              </div>
            </div>

            {/* Colonne droite (~60%) : Coordonnées et boutons de validation */}
            <div className="sylla-col-right">
              <div className="sylla-card sylla-card-step3">
                <div className="sylla-card-header">
                  <span className="step-badge">2</span>
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

              {/* Boutons d'action */}
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

                <button
                  type="button"
                  onClick={handleBackToStep1}
                  className="btn btn-outline"
                  style={{ width: '100%', minHeight: 44 }}
                >
                  <ArrowLeft size={16} />
                  <span>Retour : Modifier le projet (Étape 1)</span>
                </button>

                <p className="submit-security-note">
                  Code unique de suivi généré instantanément • Aucun compte ni mot de passe requis
                </p>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

