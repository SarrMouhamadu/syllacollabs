import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const uploadsDir = path.resolve(process.cwd(), 'uploads/audio');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    let ext = path.extname(file.originalname);
    if (!ext) {
      if (file.mimetype.includes('webm')) ext = '.webm';
      else if (file.mimetype.includes('ogg')) ext = '.ogg';
      else if (file.mimetype.includes('wav')) ext = '.wav';
      else if (file.mimetype.includes('mp4') || file.mimetype.includes('m4a')) ext = '.m4a';
      else ext = '.audio';
    }
    cb(null, `voice_${timestamp}_${randomHex}${ext}`);
  },
});

export const uploadAudio = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max
  },
  fileFilter: (_req, file, cb) => {
    // Accepter les mimetypes audio
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm' || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Veuillez envoyer un enregistrement audio.'));
    }
  },
});
