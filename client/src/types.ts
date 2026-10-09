export type CollaborationCategory =
  | 'PUBLICITE'
  | 'PARTENARIAT'
  | 'EVENEMENT'
  | 'SPONSORING'
  | 'CREATION_CONTENU'
  | 'AUTRE';

export type CollaborationStatus =
  | 'NOUVELLE'
  | 'EN_ETUDE'
  | 'ACCEPTEE'
  | 'REFUSEE'
  | 'ARCHIVEE';

export interface StatusHistoryItem {
  id: string;
  status: CollaborationStatus;
  publicComment: string | null;
  createdAt: string;
}

export interface InternalNoteItem {
  id: string;
  collaborationId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface PublicCollaboration {
  trackingCode: string;
  category: CollaborationCategory;
  status: CollaborationStatus;
  description: string | null;
  hasAudio: boolean;
  audioDuration: number | null;
  audioUrl: string | null;
  maskedName: string;
  company: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryItem[];
}

export interface AdminCollaboration {
  id: string;
  trackingCode: string;
  category: CollaborationCategory;
  description: string | null;
  audioPath: string | null;
  audioDuration: number | null;
  audioMimeType: string | null;
  audioUrl: string | null;
  fullName: string;
  phone: string;
  company: string | null;
  status: CollaborationStatus;
  previousStatus: CollaborationStatus | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  whatsappLink?: string;
  statusHistory?: StatusHistoryItem[];
  internalNotes?: InternalNoteItem[];
  _count?: {
    internalNotes: number;
    statusHistory: number;
  };
}

export interface AdminStats {
  total: number;
  nouvelles: number;
  enEtude: number;
  acceptees: number;
  refusees: number;
  archivees: number;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}
