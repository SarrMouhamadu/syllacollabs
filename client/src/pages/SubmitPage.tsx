import { useState, useRef, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import type { CollaborationCategory } from '../types';
import { submitCollaboration } from '../services/api';

interface SubmitPageProps {
  onGoToTrack: (trackingCode: string) => void;
}

interface CategoryItem {
  key: CollaborationCategory;
  emoji: string;
  title: string;
  desc: string;
}

const CATEGORIES: CategoryItem[] = [
  { key: 'PUBLICITE', emoji: '📣', title: 'Publicité', desc: 'Votre marque, nos audiences' },
  { key: 'PARTENARIAT', emoji: '🤝', title: 'Partenariat', desc: 'Construire ensemble' },
  { key: 'EVENEMENT', emoji: '📅', title: 'Événement', desc: 'Co-organiser ou intervenir' },
  { key: 'SPONSORING', emoji: '🏅', title: 'Sponsoring', desc: 'Soutenir un projet' },
  { key: 'CREATION_CONTENU', emoji: '🎬', title: 'Création de contenu', desc: 'Vidéo, photo, podcast' },
  { key: 'AUTRE', emoji: '✨', title: 'Autre projet', desc: 'Une idée hors cadre' },
];

const MAX_RECORD_SECONDS = 120;

export const SubmitPage: FC<SubmitPageProps> = ({ onGoToTrack }) => {
  // Navigation en 3 écrans dans la même carte
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Étape 1 : Catégorie & Enregistrement vocal
  const [selectedCategory, setSelectedCategory] = useState<CollaborationCategory | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // État de l'enregistreur audio
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // État du lecteur de réécoute
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);

  // Étape 2 : Coordonnées
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Étape 3 : Confirmation
  const [trackingCode, setTrackingCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Références techniques audio et canvas
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const isRecordingRef = useRef(false);

  // Garde la référence isRecording synchronisée
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Dessin de la forme d'onde au repos
  const drawIdleWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const numBars = 42;
    const barWidth = 4;
    const totalBarsWidth = numBars * barWidth;
    const barGap = (canvas.width - totalBarsWidth) / (numBars - 1);

    ctx.fillStyle = '#3fb98a';
    for (let i = 0; i < numBars; i++) {
      // Courbe douce d'attente
      const wave = Math.sin((i / numBars) * Math.PI) * 12 + 6;
      const x = i * (barWidth + barGap);
      const y = (canvas.height - wave) / 2;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, barWidth, wave, barWidth / 2);
      } else {
        ctx.rect(x, y, barWidth, wave);
      }
      ctx.fill();
    }
  };

  useEffect(() => {
    if (!isRecording && currentStep === 1) {
      drawIdleWaveform();
    }
  }, [isRecording, currentStep]);

  // Boucle de rendu de la forme d'onde en direct
  const renderLiveWaveform = () => {
    if (!canvasRef.current || !analyserRef.current || !isRecordingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const numBars = 42;
    const barWidth = 4;
    const totalBarsWidth = numBars * barWidth;
    const barGap = (canvas.width - totalBarsWidth) / (numBars - 1);

    ctx.fillStyle = '#1f7a5c';

    for (let i = 0; i < numBars; i++) {
      // Échantillonnage étalé sur les fréquences vocales (indices 3 à 70)
      const binIndex = Math.min(Math.floor(3 + (i / numBars) * 65), bufferLength - 1);
      const val = dataArray[binIndex] || 0;
      const percent = val / 255;
      const minH = 5;
      const maxH = canvas.height - 4;
      const barHeight = Math.max(minH, percent * maxH);
      const x = i * (barWidth + barGap);
      const y = (canvas.height - barHeight) / 2;

      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
      } else {
        ctx.rect(x, y, barWidth, barHeight);
      }
      ctx.fill();
    }

    if (isRecordingRef.current) {
      animationFrameRef.current = requestAnimationFrame(renderLiveWaveform);
    }
  };

  // Libération des ressources audio
  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  // Démarrer l'enregistrement vocal
  const startRecording = async () => {
    setRecordingError(null);

    // Vérification de la compatibilité MediaRecorder
    if (typeof window === 'undefined' || !navigator.mediaDevices || !window.MediaRecorder) {
      setRecordingError('Votre navigateur ne permet pas l\'enregistrement. Essayez Chrome ou Safari à jour.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // AudioContext et AnalyserNode pour la forme d'onde live
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      // Format audio supporté
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      recorder.start(100);
      setIsRecording(true);
      setElapsedSeconds(0);

      // Chronomètre avec arrêt automatique à 120 secondes
      const startTime = Date.now();
      timerIntervalRef.current = window.setInterval(() => {
        const currentSeconds = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(currentSeconds);
        setAudioDuration(currentSeconds);

        if (currentSeconds >= MAX_RECORD_SECONDS) {
          stopRecording();
        }
      }, 200);

      // Lancement du dessin de waveform
      animationFrameRef.current = requestAnimationFrame(renderLiveWaveform);
    } catch (err: any) {
      console.error('Erreur accès micro :', err);
      setRecordingError('Accès au micro refusé. Autorisez le micro dans les réglages du navigateur, puis réessayez.');
      stopRecordingCleanup();
      setIsRecording(false);
    }
  };

  // Arrêter l'enregistrement
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Erreur arrêt enregistrement :', err);
      }
    }
    setIsRecording(false);
    stopRecordingCleanup();
  };

  // Recommencer l'enregistrement (remise à zéro)
  const restartRecording = () => {
    if (isPlaying && audioElementRef.current) {
      audioElementRef.current.pause();
    }
    stopRecordingCleanup();
    setIsRecording(false);
    setAudioBlob(null);
    setAudioDuration(0);
    setElapsedSeconds(0);
    setPlayProgress(0);
    setIsPlaying(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingError(null);
    setTimeout(drawIdleWaveform, 50);
  };

  // Lecture / Pause du message vocal enregistré
  const togglePlayAudio = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  // Formatage du chrono MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Passage à l'Étape 2
  const handleGoToStep2 = () => {
    if (!selectedCategory || !audioBlob) return;
    setFormError(null);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Soumission finale vers le serveur (Étape 2 -> Étape 3)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation des coordonnées : Nom complet et Téléphone (min 8 chiffres)
    const digitsOnly = phone.replace(/\D/g, '');
    if (!fullName.trim() || digitsOnly.length < 8) {
      setFormError('Indiquez votre nom et un numéro de téléphone valide.');
      return;
    }

    if (!selectedCategory || !audioBlob) {
      setCurrentStep(1);
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
    if (email.trim()) {
      formData.append('email', email.trim());
    }

    const fileExt = audioBlob.type.includes('mp4') ? 'recording.m4a' : 'recording.webm';
    formData.append('audio', audioBlob, fileExt);
    formData.append('audioDuration', audioDuration.toString());

    const result = await submitCollaboration(formData);
    setIsSubmitting(false);

    if (result.success && result.data?.trackingCode) {
      setTrackingCode(result.data.trackingCode);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFormError(result.error || 'Une erreur est survenue lors de l\'envoi de votre proposition.');
    }
  };

  // Copier le code de suivi
  const handleCopyCode = async () => {
    if (!trackingCode) return;
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  // Phrase dynamique sous le bouton Étape 1
  const getStep1ButtonHelpText = () => {
    if (!selectedCategory && !audioBlob) {
      return 'Choisissez un type et enregistrez votre message pour continuer.';
    }
    if (!selectedCategory && audioBlob) {
      return 'Il manque le type de collaboration.';
    }
    if (selectedCategory && !audioBlob) {
      return 'Il manque votre message vocal.';
    }
    return 'Étape suivante : vos coordonnées, pour que la direction puisse vous répondre.';
  };

  const selectedCategoryObj = CATEGORIES.find((c) => c.key === selectedCategory);

  return (
    <div className="sylla-single-card-page">
      <div className="sylla-single-card">
        {/* Barre de progression : 2 segments fins et arrondis */}
        <div className="stepper-bars" aria-label="Progression du dépôt">
          <div className="stepper-segment active" />
          <div className={`stepper-segment ${currentStep >= 2 ? 'active' : ''}`} />
        </div>

        {/* ========================================================
            ÉTAPE 1 : QUEL TYPE DE COLLABORATION ? + VOCAL
            ======================================================== */}
        {currentStep === 1 && (
          <div className="step-content">
            {/* Titre et mention à droite */}
            <div className="category-heading-row">
              <h1 className="category-main-title">Quel type de collaboration ?</h1>
              <span className="category-hint">Choisissez-en une</span>
            </div>

            {/* Grille de 6 cartes cliquables */}
            <div className="category-grid-redesign" role="radiogroup" aria-label="Type de collaboration">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                return (
                  <div
                    key={cat.key}
                    role="radio"
                    aria-checked={isSelected}
                    aria-pressed={isSelected}
                    tabIndex={0}
                    className={`category-item-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(cat.key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedCategory(cat.key);
                      }
                    }}
                  >
                    <span className="category-emoji">{cat.emoji}</span>
                    <span className="category-title">{cat.title}</span>
                    <span className="category-desc">{cat.desc}</span>
                  </div>
                );
              })}
            </div>

            {/* Zone d'enregistrement vocal immersif */}
            <div className="recording-box">
              <div className="mic-wrapper">
                {/* Cercle de progression SVG */}
                <svg className="mic-progress-svg" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" className="mic-circle-bg" />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    className="mic-circle-progress"
                    style={{
                      strokeDasharray: 439.82,
                      strokeDashoffset: 439.82 - (elapsedSeconds / MAX_RECORD_SECONDS) * 439.82,
                    }}
                  />
                </svg>

                {/* 3 anneaux jaunes pulsatiles en décalé pendant l'enregistrement */}
                {isRecording && (
                  <>
                    <div className="mic-pulse-ring" />
                    <div className="mic-pulse-ring" />
                    <div className="mic-pulse-ring" />
                  </>
                )}

                {/* Bouton micro rond de 132 px */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`mic-btn ${isRecording ? 'recording' : ''}`}
                  aria-label={isRecording ? 'Arrêter l\'enregistrement' : 'Enregistrer mon message vocal'}
                  title={isRecording ? 'Arrêter l\'enregistrement' : 'Enregistrer mon message vocal'}
                >
                  {isRecording ? (
                    <span className="mic-stop-icon" />
                  ) : (
                    <svg
                      className="mic-icon-svg"
                      viewBox="0 0 24 24"
                      width="50"
                      height="50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Canvas de waveform (42 barres arrondies alimentées en direct) */}
              <canvas
                ref={canvasRef}
                width={280}
                height={42}
                className="waveform-canvas"
              />

              {/* Chronomètre grand format chiffres tabulaires */}
              <div className="chrono-display">
                <span>{formatTime(elapsedSeconds)}</span>
                <span className="chrono-total"> / 2:00</span>
              </div>

              {/* Texte d'aide contextuel */}
              <p className="recording-help-text">
                {!audioBlob && !isRecording && 'Appuyez sur le micro et présentez votre projet.'}
                {isRecording && 'Enregistrement en cours… appuyez pour terminer.'}
                {audioBlob && !isRecording && 'Réécoutez votre message avant de continuer.'}
              </p>

              {/* Erreur micro éventuelle */}
              {recordingError && (
                <div className="recording-error" role="alert">
                  {recordingError}
                </div>
              )}

              {/* Lecteur de réécoute et lien de réinitialisation après enregistrement */}
              {audioBlob && audioUrl && (
                <div className="audio-preview-row">
                  <audio
                    ref={audioElementRef}
                    src={audioUrl}
                    onTimeUpdate={() => {
                      if (audioElementRef.current && audioElementRef.current.duration) {
                        setPlayProgress(
                          (audioElementRef.current.currentTime / audioElementRef.current.duration) * 100
                        );
                      }
                    }}
                    onEnded={() => {
                      setIsPlaying(false);
                      setPlayProgress(0);
                    }}
                  />

                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className="btn-play-preview"
                    aria-label={isPlaying ? 'Mettre en pause' : 'Écouter l\'enregistrement'}
                  >
                    {isPlaying ? (
                      <span className="pause-icon" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="6 3 20 12 6 21 6 3" />
                      </svg>
                    )}
                    <span>{isPlaying ? 'Pause' : 'Écouter'}</span>
                  </button>

                  <div
                    style={{
                      width: 120,
                      height: 5,
                      background: 'var(--border)',
                      borderRadius: 9999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${playProgress}%`,
                        background: 'var(--green-main)',
                        borderRadius: 9999,
                        transition: 'width 0.1s linear',
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={restartRecording}
                    className="btn-restart-record"
                  >
                    ↺ Recommencer l'enregistrement
                  </button>
                </div>
              )}
            </div>

            {/* Bouton Continuer vers mes coordonnées */}
            <button
              type="button"
              onClick={handleGoToStep2}
              disabled={!selectedCategory || !audioBlob}
              className="btn-primary-action"
            >
              <span>Continuer vers mes coordonnées</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            {/* Phrase d'aide dynamique sous le bouton */}
            <p className="step-bottom-hint">
              {getStep1ButtonHelpText()}
            </p>
          </div>
        )}

        {/* ========================================================
            ÉTAPE 2 : COMMENT VOUS JOINDRE ?
            ======================================================== */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmit} className="step-content">
            {/* Titre et indicateur d'étape */}
            <div className="step2-header">
              <h2 className="step2-title">Comment vous joindre ?</h2>
              <span className="step2-subtitle">Étape 2 sur 2</span>
            </div>

            {/* Petit récapitulatif catégorie + durée vocale */}
            <div className="step2-recap-banner">
              <span>
                🎙️ {selectedCategoryObj?.title || 'Collaboration'} · message vocal de {formatTime(audioDuration)}
              </span>
            </div>

            {/* Message d'erreur de validation si champs incomplets */}
            {formError && (
              <div className="recording-error" role="alert" style={{ marginBottom: 12 }}>
                {formError}
              </div>
            )}

            {/* Champ : Nom complet (obligatoire) */}
            <div className="input-field-group">
              <label className="input-field-label" htmlFor="fullName">
                Nom complet *
              </label>
              <input
                id="fullName"
                type="text"
                required
                autoComplete="name"
                className="input-field-text"
                placeholder="Ex : Mariam Touré"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Téléphone / WhatsApp et E-mail sur la même ligne sur desktop */}
            <div className="form-row-2col">
              <div className="input-field-group">
                <label className="input-field-label" htmlFor="phone">
                  Téléphone / WhatsApp *
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  className="input-field-text"
                  placeholder="+221 77 000 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="input-field-group">
                <label className="input-field-label" htmlFor="email">
                  <span>E-mail</span>
                  <span className="input-field-opt">(facultatif)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input-field-text"
                  placeholder="contact@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Organisation / Marque (facultatif) */}
            <div className="input-field-group">
              <label className="input-field-label" htmlFor="company">
                <span>Organisation / Marque</span>
                <span className="input-field-opt">(facultatif)</span>
              </label>
              <input
                id="company"
                type="text"
                className="input-field-text"
                placeholder="Entreprise, marque, indépendant..."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            {/* Boutons d'action */}
            <div className="step2-actions">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary-action"
              >
                {isSubmitting ? (
                  <span>Envoi en cours...</span>
                ) : (
                  <span>Envoyer ma proposition</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn-back-step1"
              >
                ← Modifier mon projet
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            ÉTAPE 3 : CONFIRMATION D'ENVOI & CODE DE SUIVI
            ======================================================== */}
        {currentStep === 3 && (
          <div className="confirmation-box">
            <div className="confirmation-check-badge">
              ✓
            </div>

            <h2 className="confirmation-title">Proposition envoyée</h2>
            <p className="confirmation-desc">
              Gardez ce code : il vous permet de suivre votre dossier.
            </p>

            <div className="tracking-code-frame" title="Cliquez pour sélectionner">
              {trackingCode}
            </div>

            <div className="confirmation-actions">
              <button
                type="button"
                onClick={handleCopyCode}
                className="btn-primary-action"
                style={{ width: '100%' }}
              >
                {copied ? '✓ Code copié' : 'Copier le code'}
              </button>

              <button
                type="button"
                onClick={() => onGoToTrack(trackingCode)}
                className="btn-primary-action"
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  color: 'var(--green-dark)',
                  boxShadow: 'none',
                }}
              >
                Suivre mon dossier dès maintenant →
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  setSelectedCategory(null);
                  setAudioBlob(null);
                  setAudioDuration(0);
                  setAudioUrl(null);
                  setFullName('');
                  setPhone('');
                  setEmail('');
                  setCompany('');
                  setFormError(null);
                }}
                className="btn-back-step1"
                style={{ marginTop: 8 }}
              >
                Déposer un autre projet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
