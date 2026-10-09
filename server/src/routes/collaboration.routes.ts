import { Router } from 'express';
import { createCollaboration, getPublicCollaborationByTrackingCode } from '../controllers/collaboration.controller.js';
import { uploadAudio } from '../middlewares/upload.js';

const router = Router();

// Création d'une nouvelle demande (avec audio optionnel ou texte)
router.post('/', uploadAudio.single('audio'), createCollaboration);

// Suivi public d'un dossier via son code unique (ex: SYL-749201)
router.get('/track/:trackingCode', getPublicCollaborationByTrackingCode);

export default router;
