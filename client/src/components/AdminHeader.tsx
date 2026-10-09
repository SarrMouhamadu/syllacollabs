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
    <header
      style={{
        background: 'var(--sylla-blue-900)',
        color: 'var(--sylla-white)',
        borderBottom: '2px solid var(--sylla-green-500)',
        boxShadow: '0 4px 12px rgba(10, 31, 56, 0.25)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
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
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'var(--sylla-white)',
              borderRadius: 'var(--radius-md)',
              padding: '0.45rem 0.8rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.2s',
            }}
            title="Rafraîchir les dossiers"
          >
            <RefreshCw size={14} className={loadingList ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={onGoToPublic}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'var(--sylla-gray-300)',
              borderRadius: 'var(--radius-md)',
              padding: '0.45rem 0.8rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
            title="Aller sur l'interface publique"
          >
            <span>Site Public</span>
            <ExternalLink size={13} />
          </button>

          <button
            type="button"
            onClick={onLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              borderRadius: 'var(--radius-md)',
              padding: '0.45rem 0.8rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
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
