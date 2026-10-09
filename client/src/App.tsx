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
      {/* Header 100% public : aucune option administrateur */}
      <Header
        currentTab={publicTab}
        setCurrentTab={setPublicTab}
      />

      <main style={{ flex: 1 }}>
        {publicTab === 'submit' && <SubmitPage onGoToTrack={handleGoToTrack} />}
        {publicTab === 'track' && <TrackPage initialCode={trackCode} />}
      </main>

      {/* Footer Institutionnel Sylla */}
      <footer
        style={{
          background: 'var(--sylla-white)',
          borderTop: '1px solid var(--sylla-gray-200)',
          padding: '2rem 1.25rem',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: 1040,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: 'var(--sylla-blue-900)',
                  color: 'var(--sylla-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                }}
              >
                S
              </div>
              <strong style={{ color: 'var(--sylla-blue-900)', fontSize: '0.95rem' }}>
                SYLLA COLLABORATIONS
              </strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--sylla-gray-500)' }}>
              Plateforme officielle de réception et gestion des partenariats • Écosystème Sylla
            </p>
          </div>

          {/* Liens de Référence officiels et accès cockpit discret */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <a
              href="https://syllavoyage.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.85rem',
                color: 'var(--sylla-blue-700)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <span>Sylla Voyage</span>
              <ExternalLink size={13} />
            </a>

            <a
              href="https://www.syllaenglishacademy.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.85rem',
                color: 'var(--sylla-blue-700)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <span>Sylla English Academy</span>
              <ExternalLink size={13} />
            </a>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.75rem',
                color: 'var(--sylla-green-700)',
                background: 'var(--sylla-green-50)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
              }}
            >
              <Shield size={12} />
              <span>Dossiers Sécurisés</span>
            </span>

            {/* Accès discret au Cockpit Interne pour l'équipe */}
            <button
              type="button"
              onClick={navigateToAdmin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--sylla-gray-400)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '0.2rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                transition: 'color 0.2s',
              }}
              title="Accès réservé à la direction"
            >
              <Lock size={11} />
              <span>Portail Interne</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
