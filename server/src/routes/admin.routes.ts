import { Router } from 'express';
import {
  adminLogin,
  getAdminMe,
  getCollaborations,
  getCollaborationById,
  updateCollaborationStatus,
  addInternalNote,
  deleteCollaboration,
} from '../controllers/admin.controller.js';
import { requireAdminAuth } from '../middlewares/auth.js';

const router = Router();

// Authentification
router.post('/login', adminLogin);
router.get('/me', requireAdminAuth, getAdminMe);

// Gestion des dossiers
router.get('/collaborations', requireAdminAuth, getCollaborations);
router.get('/collaborations/:id', requireAdminAuth, getCollaborationById);
router.patch('/collaborations/:id/status', requireAdminAuth, updateCollaborationStatus);
router.post('/collaborations/:id/notes', requireAdminAuth, addInternalNote);
router.delete('/collaborations/:id', requireAdminAuth, deleteCollaboration);

export default router;
