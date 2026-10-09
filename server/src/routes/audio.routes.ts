import { Router } from 'express';
import { streamAudio } from '../controllers/audio.controller.js';

const router = Router();

// Streaming sécurisé du fichier audio
router.get('/:filename', streamAudio);

export default router;
