import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SubmitPage } from './pages/SubmitPage';
import { TrackPage } from './pages/TrackPage';
import { AdminPage } from './pages/AdminPage';
import { getAdminToken, removeAdminToken } from './services/api';
import { ExternalLink, Shield, Lock } from 'lucide-react';

export function App() {
  // Détection de route : 'public' ou 'admin'
  const [route, setRoute] = useState<'public' | 'admin'>(() => {
    const p = window.location.pathname;
    return p.startsWith('/admin') || p.startsWith('/cockpit') ? 'admin' : 'public';
  });

  // Onglet dans l'interface publique : 'submit' ou 'track'
  const [publicTab, setPublicTab] = useState<'submit' | 'track'>('submit');
  const [trackCode, setTrackCode] = useState<string>('');

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return !!getAdminToken();
  });

  // Synchronisation avec l'historique de navigation (Back / Forward du navigateur)
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      if (p.startsWith('/admin') || p.startsWith('/cockpit')) {
        setRoute('admin');
      } else {
        setRoute('public');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setRoute('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPublic = (tab: 'submit' | 'track' = 'submit') => {
    window.history.pushState({}, '', '/');
    setRoute('public');
    setPublicTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToTrack = (code: string) => {
    setTrackCode(code);
    setPublicTab('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogout = () => {
    removeAdminToken();
    setIsAdminLoggedIn(false);
    navigateToPublic('submit');
  };

  // ========================================================
  // 1. UNIVERS COCKPIT ADMINISTRATEUR DÉDIÉ (Route /admin)
  // ========================================================
  if (route === 'admin') {
    return (
      <AdminPage
        isAdminLoggedIn={isAdminLoggedIn}
        setIsAdminLoggedIn={setIsAdminLoggedIn}
        onGoToPublic={() => navigateToPublic('submit')}
        onLogout={handleAdminLogout}
      />
    );
  }

  // ========================================================
  // 2. UNIVERS INTERFACE PUBLIQUE (Prospects / Demandeurs)
  // ========================================================
  return (
    <div className="app-container">
      {/* Orbes d'ambiance dynamiques et légers en arrière-plan */}
      <div className="ambient-glow-wrapper" aria-hidden="true">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
      </div>

      {/* Header 100% public : aucune option administrateur */}
      <Header
        currentTab={publicTab}
        setCurrentTab={setPublicTab}
      />

      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {publicTab === 'submit' && <SubmitPage onGoToTrack={handleGoToTrack} />}
        {publicTab === 'track' && <TrackPage initialCode={trackCode} />}
      </main>

      {/* Footer Institutionnel Sylla Compact */}
      <footer
        style={{
          background: 'var(--sylla-white)',
          borderTop: '1px solid var(--sylla-gray-200)',
          padding: '0.45rem 1rem',
          fontSize: '0.78rem',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 800, color: 'var(--sylla-blue-900)' }}>SYLLA COLLABORATIONS</span>
            <span style={{ color: 'var(--sylla-gray-400)' }}>•</span>
            <span style={{ color: 'var(--sylla-gray-500)' }}>Écosystème Sylla</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href="https://syllavoyage.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--sylla-blue-700)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              <span>Sylla Voyage</span>
              <ExternalLink size={11} />
            </a>

            <a
              href="https://www.syllaenglishacademy.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--sylla-blue-700)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              <span>Sylla English Academy</span>
              <ExternalLink size={11} />
            </a>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: '0.7rem',
                color: 'var(--sylla-green-700)',
                background: 'var(--sylla-green-50)',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
              }}
            >
              <Shield size={10} />
              <span>Dossiers Sécurisés</span>
            </span>

            <button
              type="button"
              onClick={navigateToAdmin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--sylla-gray-400)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '0.1rem 0.3rem',
              }}
              title="Accès réservé à la direction"
            >
              <Lock size={10} />
              <span>Portail Interne</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
