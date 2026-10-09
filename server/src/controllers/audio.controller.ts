import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

export function streamAudio(req: Request, res: Response): void {
  try {
    const rawFilename = req.params.filename;
    const filename = Array.isArray(rawFilename) ? rawFilename[0] : rawFilename;

    if (!filename) {
      res.status(400).json({ success: false, error: 'Nom de fichier audio requis.' });
      return;
    }

    // Protection contre Path Traversal
    const safeFilename = path.basename(filename);
    const uploadsDir = path.resolve(process.cwd(), 'uploads/audio');
    let targetFilename = safeFilename;
    let filePath = path.join(uploadsDir, targetFilename);

    // Si le fichier demandé est un webm mais qu'une version mp3 existe, servir le mp3
    if (safeFilename.endsWith('.webm') && !fs.existsSync(filePath)) {
      const mp3Filename = `${path.parse(safeFilename).name}.mp3`;
      const mp3Path = path.join(uploadsDir, mp3Filename);
      if (fs.existsSync(mp3Path)) {
        targetFilename = mp3Filename;
        filePath = mp3Path;
      }
    } else if (safeFilename.endsWith('.webm')) {
      // Si le mp3 existe à côté du webm, privilégier le mp3 pour compatibilité macOS/Safari
      const mp3Filename = `${path.parse(safeFilename).name}.mp3`;
      const mp3Path = path.join(uploadsDir, mp3Filename);
      if (fs.existsSync(mp3Path)) {
        targetFilename = mp3Filename;
        filePath = mp3Path;
      }
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'Enregistrement audio introuvable.' });
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Détection de Content-Type selon l'extension
    let contentType = 'audio/mpeg';
    if (targetFilename.endsWith('.wav')) contentType = 'audio/wav';
    else if (targetFilename.endsWith('.mp3')) contentType = 'audio/mpeg';
    else if (targetFilename.endsWith('.ogg')) contentType = 'audio/ogg';
    else if (targetFilename.endsWith('.m4a') || targetFilename.endsWith('.mp4')) contentType = 'audio/mp4';
    else if (targetFilename.endsWith('.webm')) contentType = 'audio/webm';

    if (range) {
      // Support HTTP Range pour le streaming audio fluide
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });

      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Erreur lecture audio :', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la lecture du fichier audio.' });
  }
}
