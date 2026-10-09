import type { FC } from 'react';
import { ShieldCheck, LogOut, ExternalLink, RefreshCw } from 'lucide-react';
import type { AdminUser } from '../types';

interface AdminHeaderProps {
  currentUser: AdminUser | null;
  onLogout: () => void;
  onRefresh: () => void;
  loadingList: boolean;
  onGoToPublic: () => void;
}

export const AdminHeader: FC<AdminHeaderProps> = ({
  currentUser,
  onLogout,
  onRefresh,
  loadingList,
  onGoToPublic,
}) => {
  return (
    <header className="admin-header">
      <div className="admin-header-inner">
        {/* Titre et Badge Cockpit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'var(--sylla-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
            }}
          >
            S
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: -0.3 }}>
                COCKPIT DIRECTION
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: 'var(--sylla-green-400)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  letterSpacing: '0.5px',
                }}
              >
                Espace Restreint
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--sylla-gray-300)' }}>
              Écosystème Sylla • Gestion des Collaborations
            </div>
          </div>
        </div>

        {/* Profil & Actions de session */}
        <div className="admin-header-actions">
          {currentUser && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <ShieldCheck size={14} color="var(--sylla-green-400)" />
              <span>{currentUser.fullName}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onRefresh}
            className="admin-header-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'var(--sylla-white)',
            }}
            title="Rafraîchir les dossiers"
          >
            <RefreshCw size={14} className={loadingList ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={onGoToPublic}
            className="admin-header-btn"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'var(--sylla-gray-300)',
            }}
            title="Aller sur l'interface publique"
          >
            <span>Site Public</span>
            <ExternalLink size={13} />
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="admin-header-btn"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
            }}
            title="Déconnexion sécurisée"
          >
            <LogOut size={14} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
};
