import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SubmitPage } from './pages/SubmitPage';
import { TrackPage } from './pages/TrackPage';
import { AdminPage } from './pages/AdminPage';
import { getAdminToken, removeAdminToken } from './services/api';
import { Lock } from 'lucide-react';

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

      {/* Pied de page institutionnel Sylla */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="footer-brand">Sylla Collaborations</span>
            <span className="footer-dot">·</span>
            <span className="footer-sub">Écosystème Sylla</span>
          </div>

          <div className="footer-right">
            <a
              href="https://syllavoyage.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Sylla Voyage
            </a>
            <span className="footer-dot">·</span>
            <a
              href="https://www.syllaenglishacademy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Sylla English Academy
            </a>
            <span className="footer-dot">·</span>
            <span className="footer-tag">
              Dossiers sécurisés
            </span>

            <button
              type="button"
              onClick={navigateToAdmin}
              className="footer-admin-link"
              title="Portail de direction"
            >
              <Lock size={11} />
              <span>Cockpit</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
