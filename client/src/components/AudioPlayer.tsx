import { useState, useRef, useEffect } from 'react';
import type { FC, MouseEvent } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, AlertCircle } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  duration?: number | null;
}

export const AudioPlayer: FC<AudioPlayerProps> = ({ src, duration: initialDuration }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Synchroniser la durée si elle est fournie par le parent
  useEffect(() => {
    if (initialDuration && initialDuration > 0) {
      setDuration(initialDuration);
    }
  }, [initialDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    audio.muted = isMuted;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      // Si la durée n'était pas connue et devient finie
      if ((!duration || duration === 0) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(Math.round(audio.duration));
      }
    };

    const handleLoadedMetadata = () => {
      setPlaybackError(null);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      console.error('Erreur chargement audio :', audio.error);
      setPlaybackError('Impossible de lire ce flux audio. Vérifiez votre connexion.');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [src, duration, volume, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setPlaybackError(null);

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Déverrouiller le volume
      audio.volume = isMuted ? 0 : volume;
      audio.muted = isMuted;

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Erreur lecture audio :', err);
          setPlaybackError('Cliquez à nouveau ou vérifiez les autorisations audio de votre navigateur.');
          setIsPlaying(false);
        });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const effectiveDuration = duration > 0 ? duration : (audioRef.current.duration || 0);
    if (!effectiveDuration || !isFinite(effectiveDuration)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * effectiveDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const effectiveDuration = duration > 0 ? duration : 0;
  const progressPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  return (
    <div>
      <div className="audio-player-compact" style={{ position: 'relative' }}>
        <audio
          ref={audioRef}
          src={src}
          preload="auto"
          playsInline
        />

        {/* Bouton Play / Pause */}
        <button
          type="button"
          onClick={togglePlay}
          className="audio-play-btn"
          title={isPlaying ? 'Mettre en pause' : 'Écouter l’audio'}
          style={{
            background: isPlaying ? 'var(--sylla-green-600)' : 'var(--sylla-blue-800)',
            boxShadow: isPlaying ? '0 0 10px rgba(16, 185, 129, 0.5)' : undefined,
          }}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
        </button>

        {/* Recommencer */}
        <button
          type="button"
          onClick={handleRestart}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--sylla-gray-500)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
          title="Recommencer depuis le début"
        >
          <RotateCcw size={16} />
        </button>

        {/* Barre de progression cliquable */}
        <div
          className="audio-progress-bar"
          onClick={handleSeek}
          title="Avancer / Reculer"
        >
          <div
            className="audio-progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>

        {/* Temps écoulé / Durée totale */}
        <div className="audio-time-label">
          {formatSeconds(currentTime)} / {formatSeconds(effectiveDuration)}
        </div>

        {/* Contrôle Muet / Son et réglage volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            onClick={toggleMute}
            style={{
              background: 'none',
              border: 'none',
              color: isMuted ? 'var(--sylla-red-500)' : 'var(--sylla-green-700)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
            title={isMuted ? 'Rétablir le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              setIsMuted(val === 0);
            }}
            style={{ width: 52, accentColor: 'var(--sylla-green-600)', cursor: 'pointer' }}
            title={`Volume : ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
        </div>
      </div>

      {playbackError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.8rem',
            color: 'var(--sylla-red-500)',
            marginTop: 6,
          }}
        >
          <AlertCircle size={14} />
          <span>{playbackError}</span>
        </div>
      )}
    </div>
  );
};
