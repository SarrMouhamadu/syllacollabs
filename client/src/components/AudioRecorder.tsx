import { useState, useRef, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { Mic, Square, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';

interface AudioRecorderProps {
  onAudioReady: (blob: Blob | null, durationSeconds: number) => void;
  maxSeconds?: number;
}

function getBestSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Safari / iOS privilégie audio/mp4 pour pouvoir réécouter nativement via <audio>
  const safariCandidates = [
    'audio/mp4',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/aac',
    'audio/webm;codecs=opus',
    'audio/webm',
  ];

  // Chrome, Firefox, Android
  const standardCandidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];

  const candidates = isSafari ? safariCandidates : standardCandidates;

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return '';
}

export const AudioRecorder: FC<AudioRecorderProps> = ({
  onAudioReady,
  maxSeconds = 120, // 2 minutes max
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [recordedUrl]);

  // Dessin de l'onde sonore animée
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(dataArray);

      // Adaptation dynamique de la taille du canvas à son affichage réel
      if (canvas.offsetWidth > 0) {
        const dpr = window.devicePixelRatio || 1;
        const targetWidth = Math.floor(canvas.offsetWidth * dpr);
        const targetHeight = Math.floor(50 * dpr);
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = Math.max(3 * (window.devicePixelRatio || 1), (dataArray[i] / 255) * canvas.height);

        // Dégradé Sylla (Bleu profond vers Vert émeraude)
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(1, '#0a2540');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
        if (x > canvas.width) break;
      }
    };

    renderFrame();
  }, []);

  // Démarrer l'enregistrement
  const startRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // AudioContext pour l'onde sonore
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Meilleur format selon le navigateur
      const mimeType = getBestSupportedAudioMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalType = recorder.mimeType || mimeType || 'audio/mp4';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
        const url = URL.createObjectURL(audioBlob);

        setRecordedBlob(audioBlob);
        setRecordedUrl(url);
        setDuration(recordingSeconds);
        onAudioReady(audioBlob, recordingSeconds);

        // Libération du micro
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      // Lancer le visualiseur d'onde sonore
      drawWaveform();

      // Minuteur avec limite stricte de 120s
      let elapsed = 0;
      timerIntervalRef.current = window.setInterval(() => {
        elapsed += 1;
        setRecordingSeconds(elapsed);
        if (elapsed >= maxSeconds) {
          stopRecording();
        }
      }, 1000);
    } catch (err: any) {
      console.error('Erreur accès micro :', err);
      setErrorMsg(
        'Impossible d’accéder à votre microphone. Veuillez vérifier les autorisations dans votre navigateur.'
      );
    }
  };

  // Arrêter l'enregistrement
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Supprimer et réenregistrer
  const resetRecording = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    setRecordingSeconds(0);
    onAudioReady(null, 0);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`audio-recorder-box ${isRecording ? 'recording' : ''} ${recordedBlob ? 'has-audio' : ''}`}>
      {errorMsg && (
        <div style={{ color: 'var(--sylla-red-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12, fontSize: '0.875rem' }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* État 1 : En attente d'enregistrement */}
      {!isRecording && !recordedBlob && (
        <div>
          <div className="record-btn-container">
            <div className="record-btn-glow" />
            <button
              type="button"
              onClick={startRecording}
              className="record-btn-main"
              title="Démarrer l'enregistrement vocal"
              aria-label="Démarrer l'enregistrement vocal"
            >
              <Mic size={32} />
            </button>
          </div>
          <p style={{ marginTop: '0.75rem', fontWeight: 700, color: 'var(--sylla-blue-900)' }}>
            Appuyez pour enregistrer votre message vocal
          </p>
          <p style={{ fontSize: '0.825rem', color: 'var(--sylla-gray-500)' }}>
            Durée maximale : 2 minutes (120 secondes). Expliquez votre projet à vive voix.
          </p>
        </div>
      )}

      {/* État 2 : Enregistrement en cours */}
      {isRecording && (
        <div>
          <div className="record-btn-container">
            <button
              type="button"
              onClick={stopRecording}
              className="record-btn-main recording"
              title="Arrêter et valider l'enregistrement"
              aria-label="Arrêter et valider l'enregistrement vocal"
            >
              <Square size={26} />
            </button>
          </div>

          <div className="recording-live-badge">
            <span className="live-dot" />
            <span>Enregistrement en cours</span>
          </div>

          <div className={`record-timer ${recordingSeconds > 100 ? 'urgent' : ''}`}>
            {formatTimer(recordingSeconds)} / {formatTimer(maxSeconds)}
          </div>

          <div className="record-progress-track">
            <div
              className="record-progress-fill"
              style={{ width: `${Math.min(100, (recordingSeconds / maxSeconds) * 100)}%` }}
            />
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--sylla-red-500)', fontWeight: 600, margin: '0.4rem 0 0.6rem' }}>
            Parlez distinctement dans votre microphone
          </p>

          <canvas ref={canvasRef} width={400} height={50} className="waveform-canvas" />

          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={stopRecording}
              className="btn btn-primary btn-sm"
            >
              Terminer l'enregistrement
            </button>
          </div>
        </div>
      )}

      {/* État 3 : Enregistrement prêt avec écoute avant envoi et suppression */}
      {recordedBlob && recordedUrl && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--sylla-green-700)', fontWeight: 700, marginBottom: '0.75rem' }}>
            <CheckCircle2 size={20} color="var(--sylla-green-600)" />
            <span>Message vocal prêt ({formatTimer(duration)})</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--sylla-gray-600)', marginBottom: '0.75rem' }}>
            Écoutez votre message pour vérifier le son avant de l'envoyer ou réenregistrez si nécessaire.
          </p>

          <div style={{ maxWidth: 440, margin: '0 auto' }}>
            <AudioPlayer src={recordedUrl} duration={duration} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={resetRecording}
              className="btn btn-outline btn-sm"
              style={{ color: 'var(--sylla-red-500)', borderColor: '#fca5a5' }}
            >
              <Trash2 size={15} />
              Supprimer et recommencer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
