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
  ChevronLeft,
  ChevronRight,
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
    icon: <Megaphone size={19} />,
  },
  {
    key: 'PARTENARIAT',
    label: 'Partenariat',
    icon: <Handshake size={19} />,
  },
  {
    key: 'EVENEMENT',
    label: 'Événement',
    icon: <Calendar size={19} />,
  },
  {
    key: 'SPONSORING',
    label: 'Sponsoring',
    icon: <Award size={19} />,
  },
  {
    key: 'CREATION_CONTENU',
    label: 'Contenu',
    icon: <Video size={19} />,
  },
  {
    key: 'AUTRE',
    label: 'Autre',
    icon: <Sparkles size={19} />,
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

  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);

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
      setMobileStep(3);
      return;
    }

    if (!description.trim() && !audioBlob) {
      setErrorMessage(
        'Veuillez expliquer votre projet soit par un message vocal (recommandé), soit par écrit.'
      );
      setMobileStep(2);
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
      <div className="single-page-wrapper">
        <div className="success-card" style={{ margin: '1rem auto', padding: '1.5rem', maxWidth: 580 }}>
          <div className="success-icon-bubble" style={{ width: 60, height: 60, margin: '0 auto 0.75rem' }}>
            <Check size={32} />
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--sylla-blue-900)', marginBottom: '0.35rem' }}>
            Demande enregistrée avec succès !
          </h2>

          <p style={{ color: 'var(--sylla-gray-600)', fontSize: '0.875rem', maxWidth: 480, margin: '0 auto 1rem' }}>
            Merci {submittedData.fullName}. Votre dossier a bien été transmis à la direction Sylla.
          </p>

          <div className="tracking-code-banner" style={{ padding: '0.85rem 1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--sylla-gray-300)', letterSpacing: 1 }}>
                Code de suivi unique
              </div>
              <div className="tracking-code-value" style={{ fontSize: '1.5rem' }}>{submittedData.trackingCode}</div>
            </div>

            <button
              type="button"
              onClick={copyToClipboard}
              className="btn btn-whatsapp btn-sm"
              style={{ padding: '0.5rem 0.85rem' }}
            >
              {copied ? (
                <>
                  <Check size={15} />
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <Copy size={15} />
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>

          <div
            style={{
              background: 'var(--sylla-blue-50)',
              border: '1px solid var(--sylla-blue-100)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              maxWidth: 480,
              margin: '1rem auto',
              fontSize: '0.8rem',
              color: 'var(--sylla-blue-900)',
              textAlign: 'left',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <HelpCircle size={18} color="var(--sylla-blue-600)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Conservez ce code :</strong> il vous permet de suivre l'avancement de votre dossier à tout moment sans mot de passe.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onGoToTrack(submittedData.trackingCode)}
              className="btn btn-primary btn-sm"
              style={{ padding: '0.65rem 1.25rem' }}
            >
              <span>Suivre mon dossier</span>
              <ArrowRight size={15} />
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
                setMobileStep(1);
              }}
              className="btn btn-outline btn-sm"
            >
              Autre proposition
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="single-page-wrapper">
      {/* Mini-Hero Banner ultra compact */}
      <div className="submit-hero-compact">
        <div className="hero-pill-compact">
          <Sparkles size={13} />
          <span>Écosystème Sylla • Collaborations Directes</span>
        </div>
        <h1 className="submit-title-compact">
          Proposez votre <span className="hero-title-highlight">collaboration</span>
        </h1>
        <p className="submit-desc-compact">
          Partenariat, sponsoring ou média : soumettez votre demande en direct par message vocal ou écrit.
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            background: 'var(--sylla-red-50)',
            border: '1px solid #fecaca',
            color: 'var(--sylla-red-500)',
            padding: '0.5rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '0.6rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.825rem',
            fontWeight: 600,
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Stepper tactile pour petits écrans / mobile (< 860px) */}
      <div className="mobile-stepper" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mobileStep === 1}
          className={`stepper-pill ${mobileStep === 1 ? 'active' : ''}`}
          onClick={() => setMobileStep(1)}
        >
          <span className="step-num">1</span>
          <span>Catégorie</span>
        </button>
        <div className="stepper-arrow" />
        <button
          type="button"
          role="tab"
          aria-selected={mobileStep === 2}
          className={`stepper-pill ${mobileStep === 2 ? 'active' : ''} ${audioBlob || description.trim() ? 'done' : ''}`}
          onClick={() => setMobileStep(2)}
        >
          <span className="step-num">2</span>
          <span>Vocal & Note</span>
        </button>
        <div className="stepper-arrow" />
        <button
          type="button"
          role="tab"
          aria-selected={mobileStep === 3}
          className={`stepper-pill ${mobileStep === 3 ? 'active' : ''} ${fullName && phone ? 'done' : ''}`}
          onClick={() => setMobileStep(3)}
        >
          <span className="step-num">3</span>
          <span>Coordonnées</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="proposal-form-master">
        <div className="proposal-grid-master">
          {/* ========================================================
              COLONNE 1 : Catégorie + Coordonnées (Visible sur desktop ou steps 1/3 mobile)
              ======================================================== */}
          <div className="proposal-col proposal-col-left">
            {/* Étape 1 : Choix de catégorie */}
            <div className={`proposal-card-compact ${mobileStep !== 1 ? 'mobile-hidden-step' : ''}`}>
              <div className="card-title-compact">
                <span className="step-tag">1</span>
                <strong>Type de collaboration</strong>
              </div>

              <div className="category-grid-compact" role="radiogroup" aria-label="Type de collaboration">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.key;
                  return (
                    <div
                      key={cat.key}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      className={`category-card-compact ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedCategory(cat.key)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedCategory(cat.key);
                        }
                      }}
                    >
                      {isSelected && (
                        <div className="category-badge-check-compact" aria-hidden="true">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                      <div className="category-icon-compact">{cat.icon}</div>
                      <div className="category-label-compact">{cat.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Bouton Suivant pour Mobile (Step 1 -> Step 2) */}
              <div className="mobile-step-nav">
                <button
                  type="button"
                  onClick={() => setMobileStep(2)}
                  className="btn btn-primary btn-sm btn-block"
                  style={{ marginTop: '0.65rem' }}
                >
                  <span>Continuer : Expliquer mon projet</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Étape 3 : Coordonnées essentielles */}
            <div className={`proposal-card-compact ${mobileStep !== 3 ? 'mobile-hidden-step' : ''}`}>
              <div className="card-title-compact">
                <span className="step-tag">3</span>
                <strong>Vos coordonnées de contact</strong>
              </div>

              <div className="contact-grid-compact">
                <div className="form-group-compact">
                  <label className="form-label-compact">Nom complet *</label>
                  <input
                    type="text"
                    required
                    className="form-input form-input-compact"
                    placeholder="Ex : Mariam Touré"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group-compact">
                  <label className="form-label-compact">Téléphone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    className="form-input form-input-compact"
                    placeholder="Ex : +221 77 000 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group-compact">
                  <label className="form-label-compact">
                    Entreprise / Marque <span style={{ color: 'var(--sylla-gray-400)', fontWeight: 400 }}>(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    className="form-input form-input-compact"
                    placeholder="Ex : Agence Digitale / Indépendant"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>

              {/* Mobile : Bouton retour vers step 2 */}
              <div className="mobile-step-nav mobile-step-nav-split">
                <button
                  type="button"
                  onClick={() => setMobileStep(2)}
                  className="btn btn-outline btn-sm"
                >
                  <ChevronLeft size={15} />
                  <span>Modifier le vocal</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-sm"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Envoi...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Envoyer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================
              COLONNE 2 : Message vocal + texte + validation (Visible sur desktop ou step 2 mobile)
              ======================================================== */}
          <div className={`proposal-col proposal-col-right ${mobileStep !== 2 ? 'mobile-hidden-step' : ''}`}>
            {/* Étape 2 : Explication du projet (Vocal + Texte) */}
            <div className="proposal-card-compact">
              <div className="card-title-compact">
                <span className="step-tag">2</span>
                <strong>Votre projet (Vocal recommandé ou écrit)</strong>
              </div>

              {/* Enregistreur vocal */}
              <AudioRecorder onAudioReady={handleAudioReady} maxSeconds={120} />

              {/* Zone de texte facultative */}
              <div className="form-group-compact" style={{ marginTop: '0.5rem' }}>
                <label className="form-label-compact">
                  Précisions écrites <span style={{ color: 'var(--sylla-gray-400)', fontWeight: 400 }}>(facultatif si vocal)</span>
                </label>
                <textarea
                  className="form-textarea-compact"
                  rows={2}
                  placeholder="Objectifs, budget estimé, date souhaitée ou précisions utiles..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Mobile : Boutons de navigation (Retour step 1 ou Continuer step 3) */}
              <div className="mobile-step-nav mobile-step-nav-split">
                <button
                  type="button"
                  onClick={() => setMobileStep(1)}
                  className="btn btn-outline btn-sm"
                >
                  <ChevronLeft size={15} />
                  <span>Catégories</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStep(3)}
                  className="btn btn-primary btn-sm"
                >
                  <span>Mes coordonnées</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Bouton d'action principal sur Desktop */}
            <div className="desktop-submit-box">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-submit-master"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Enregistrement sécurisé du dossier...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Envoyer ma proposition</span>
                  </>
                )}
              </button>
              <div className="submit-footnote">
                Code de suivi unique généré instantanément • Aucun mot de passe requis
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

