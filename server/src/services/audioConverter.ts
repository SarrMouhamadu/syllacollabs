import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import util from 'util';

const execAsync = util.promisify(exec);

export async function convertToMp3(
  inputFilename: string
): Promise<{ outputFilename: string; duration: number } | null> {
  const uploadsDir = path.resolve(process.cwd(), 'uploads/audio');
  const inputPath = path.join(uploadsDir, inputFilename);

  if (!fs.existsSync(inputPath)) {
    return null;
  }

  // Si c'est déjà un mp3
  if (inputFilename.endsWith('.mp3')) {
    return { outputFilename: inputFilename, duration: 0 };
  }

  const baseName = path.parse(inputFilename).name;
  const outputFilename = `${baseName}.mp3`;
  const outputPath = path.join(uploadsDir, outputFilename);

  try {
    // Conversion avec ffmpeg vers MP3 (mono, 96k, optimisé pour la voix humaine et 100% compatible tous navigateurs)
    await execAsync(
      `ffmpeg -y -i "${inputPath}" -c:a libmp3lame -b:a 96k -ac 1 "${outputPath}"`
    );

    // Extraction de la durée exacte avec ffprobe
    let duration = 0;
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`
      );
      const parsed = parseFloat(stdout.trim());
      if (!isNaN(parsed)) {
        duration = Math.round(parsed);
      }
    } catch {
      // Ignorer si ffprobe échoue, la durée sera celle envoyée par le client
    }

    return { outputFilename, duration };
  } catch (err) {
    console.error('Erreur conversion audio ffmpeg vers MP3 :', err);
    // En cas d'erreur de conversion, on conserve le fichier original
    return { outputFilename: inputFilename, duration: 0 };
  }
}
