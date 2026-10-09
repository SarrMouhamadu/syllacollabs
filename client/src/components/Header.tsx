import type { FC } from 'react';
import { Send, Search } from 'lucide-react';

interface HeaderProps {
  currentTab: 'submit' | 'track';
  setCurrentTab: (tab: 'submit' | 'track') => void;
}

export const Header: FC<HeaderProps> = ({ currentTab, setCurrentTab }) => {
  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Logo de Marque Sylla */}
        <div className="brand-wrapper" onClick={() => setCurrentTab('submit')}>
          <div className="brand-logo-icon">S</div>
          <div className="brand-info">
            <span className="brand-title">Sylla Collaborations</span>
            <span className="brand-subtitle">Écosystème Sylla</span>
          </div>
        </div>

        {/* Navigation publique exclusive */}
        <nav className="nav-tabs">
          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'submit' ? 'active' : ''}`}
            onClick={() => setCurrentTab('submit')}
          >
            <Send size={16} />
            <span>Proposer un projet</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'track' ? 'active' : ''}`}
            onClick={() => setCurrentTab('track')}
          >
            <Search size={16} />
            <span>Suivre mon dossier</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
