import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { generateUniqueTrackingCode } from '../utils/trackingCode.js';
import { CollaborationCategory, CollaborationStatus } from '@prisma/client';

export async function createCollaboration(req: Request, res: Response): Promise<void> {
  try {
    const { category, description, fullName, phone, company, audioDuration } = req.body;
    const file = req.file;

    // Validation des champs obligatoires
    if (!category || !fullName || !phone) {
      res.status(400).json({
        success: false,
        error: 'Veuillez renseigner votre nom, votre numéro de téléphone et la catégorie de collaboration.',
      });
      return;
    }

    // Validation de la catégorie
    const validCategories = Object.values(CollaborationCategory);
    if (!validCategories.includes(category as CollaborationCategory)) {
      res.status(400).json({
        success: false,
        error: `Catégorie invalide. Valeurs acceptées : ${validCategories.join(', ')}`,
      });
      return;
    }

    // Au moins un message vocal ou un texte explicatif doit être présent
    const trimmedDescription = typeof description === 'string' ? description.trim() : '';
    if (!trimmedDescription && !file) {
      res.status(400).json({
        success: false,
        error: 'Veuillez enregistrer un message vocal ou rédiger une description de votre projet (ou les deux).',
      });
      return;
    }

    // Génération du code de suivi unique
    const trackingCode = await generateUniqueTrackingCode();

    let finalAudioPath = file ? file.filename : null;
    let finalMimeType = file ? file.mimetype : null;
    let parsedDuration = audioDuration ? parseInt(audioDuration, 10) : null;

    // Conversion automatique en MP3 pour compatibilité universelle à 100% (Safari, Chrome, iOS, etc.)
    if (file) {
      try {
        const { convertToMp3 } = await import('../services/audioConverter.js');
        const conversionResult = await convertToMp3(file.filename);
        if (conversionResult) {
          finalAudioPath = conversionResult.outputFilename;
          finalMimeType = 'audio/mpeg';
          if (conversionResult.duration > 0) {
            parsedDuration = conversionResult.duration;
          }
        }
      } catch (convErr) {
        console.warn('Conversion MP3 non critique :', convErr);
      }
    }

    // Enregistrement dans PostgreSQL via Prisma
    const collaboration = await prisma.collaboration.create({
      data: {
        trackingCode,
        category: category as CollaborationCategory,
        description: trimmedDescription || null,
        audioPath: finalAudioPath,
        audioDuration: parsedDuration && !isNaN(parsedDuration) ? parsedDuration : null,
        audioMimeType: finalMimeType,
        fullName: fullName.trim(),
        phone: phone.trim(),
        company: company && typeof company === 'string' && company.trim() ? company.trim() : null,
        status: CollaborationStatus.NOUVELLE,
        statusHistory: {
          create: {
            status: CollaborationStatus.NOUVELLE,
            publicComment: 'Votre demande a été enregistrée avec succès. Notre équipe va l’examiner dans les plus brefs délais.',
          },
        },
      },
      include: {
        statusHistory: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        trackingCode: collaboration.trackingCode,
        status: collaboration.status,
        createdAt: collaboration.createdAt,
        category: collaboration.category,
        fullName: collaboration.fullName,
      },
      message: 'Demande de collaboration enregistrée avec succès.',
    });
  } catch (error) {
    console.error('Erreur lors de la création de la collaboration :', error);
    res.status(500).json({
      success: false,
      error: 'Une erreur interne est survenue lors de l’enregistrement de votre demande.',
    });
  }
}

export async function getPublicCollaborationByTrackingCode(req: Request, res: Response): Promise<void> {
  try {
    const rawCodeParam = req.params.trackingCode;
    const rawCode = Array.isArray(rawCodeParam) ? rawCodeParam[0] : rawCodeParam;

    if (!rawCode) {
      res.status(400).json({
        success: false,
        error: 'Code de suivi requis.',
      });
      return;
    }

    const trackingCode = rawCode.trim().toUpperCase();

    const collaboration = await prisma.collaboration.findUnique({
      where: { trackingCode },
      select: {
        id: true,
        trackingCode: true,
        category: true,
        description: true,
        audioPath: true,
        audioDuration: true,
        audioMimeType: true,
        fullName: true,
        company: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        statusHistory: {
          select: {
            id: true,
            status: true,
            publicComment: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!collaboration) {
      res.status(404).json({
        success: false,
        error: `Aucun dossier trouvé pour le code de suivi "${trackingCode}". Vérifiez le code saisi.`,
      });
      return;
    }

    // Masquage partiel du nom pour respect de la confidentialité publique
    const nameParts = collaboration.fullName.split(' ');
    const maskedName = nameParts
      .map((part) => (part.length > 2 ? `${part[0]}***` : part))
      .join(' ');

    res.json({
      success: true,
      data: {
        trackingCode: collaboration.trackingCode,
        category: collaboration.category,
        status: collaboration.status,
        description: collaboration.description,
        hasAudio: !!collaboration.audioPath,
        audioDuration: collaboration.audioDuration,
        audioUrl: collaboration.audioPath ? `/api/audio/${collaboration.audioPath}` : null,
        maskedName,
        company: collaboration.company,
        createdAt: collaboration.createdAt,
        updatedAt: collaboration.updatedAt,
        statusHistory: collaboration.statusHistory,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la consultation du dossier :', error);
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de la récupération du dossier.',
    });
  }
}
