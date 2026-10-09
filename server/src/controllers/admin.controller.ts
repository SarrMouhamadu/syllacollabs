import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { prisma } from '../prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { CollaborationCategory, CollaborationStatus, Prisma } from '@prisma/client';

export async function adminLogin(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Veuillez renseigner votre email et votre mot de passe.',
      });
      return;
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        error: 'Identifiants administrateur incorrects.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Identifiants administrateur incorrects.',
      });
      return;
    }

    const secret = process.env.JWT_SECRET || 'sylla_collab_super_secret_jwt_key_2026_secure';
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
      message: 'Connexion administrateur réussie.',
    });
  } catch (error) {
    console.error('Erreur lors du login admin :', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la connexion.',
    });
  }
}

export async function getAdminMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.adminUser) {
      res.status(401).json({ success: false, error: 'Non authentifié' });
      return;
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: req.adminUser.id },
      select: { id: true, email: true, fullName: true, role: true },
    });

    if (!admin) {
      res.status(404).json({ success: false, error: 'Administrateur introuvable.' });
      return;
    }

    res.json({ success: true, admin });
  } catch (error) {
    console.error('Erreur getAdminMe :', error);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
}

export async function getCollaborations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { status, category, search } = req.query;

    const where: Prisma.CollaborationWhereInput = {};

    // Filtre statut
    if (status && typeof status === 'string') {
      if (status === 'ARCHIVEE') {
        where.status = CollaborationStatus.ARCHIVEE;
      } else if (status === 'ACTIVES') {
        where.status = { not: CollaborationStatus.ARCHIVEE };
      } else if (Object.values(CollaborationStatus).includes(status as CollaborationStatus)) {
        where.status = status as CollaborationStatus;
      }
    }

    // Filtre catégorie
    if (category && typeof category === 'string' && Object.values(CollaborationCategory).includes(category as CollaborationCategory)) {
      where.category = category as CollaborationCategory;
    }

    // Recherche texte
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { trackingCode: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Récupération triée par date décroissante
    const collaborations = await prisma.collaboration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            internalNotes: true,
            statusHistory: true,
          },
        },
      },
    });

    // Compteurs statistiques globaux pour le tableau de bord
    const [totalAll, totalNouvelles, totalEnEtude, totalAcceptees, totalRefusees, totalArchivees] = await Promise.all([
      prisma.collaboration.count(),
      prisma.collaboration.count({ where: { status: CollaborationStatus.NOUVELLE } }),
      prisma.collaboration.count({ where: { status: CollaborationStatus.EN_ETUDE } }),
      prisma.collaboration.count({ where: { status: CollaborationStatus.ACCEPTEE } }),
      prisma.collaboration.count({ where: { status: CollaborationStatus.REFUSEE } }),
      prisma.collaboration.count({ where: { status: CollaborationStatus.ARCHIVEE } }),
    ]);

    res.json({
      success: true,
      data: collaborations.map((c) => ({
        ...c,
        audioUrl: c.audioPath ? `/api/audio/${c.audioPath}` : null,
      })),
      counts: {
        total: totalAll,
        nouvelles: totalNouvelles,
        enEtude: totalEnEtude,
        acceptees: totalAcceptees,
        refusees: totalRefusees,
        archivees: totalArchivees,
      },
    });
  } catch (error) {
    console.error('Erreur getCollaborations :', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des dossiers.' });
  }
}

export async function getCollaborationById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;

    const collaboration = await prisma.collaboration.findUnique({
      where: { id },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        internalNotes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!collaboration) {
      res.status(404).json({ success: false, error: 'Dossier introuvable.' });
      return;
    }

    // Préparation d'un lien standard wa.me
    // Nettoyage du numéro de téléphone (enlever espaces, tirets, etc.)
    const cleanPhone = collaboration.phone.replace(/[^0-9+]/g, '').replace('+', '');
    const prefilledText = encodeURIComponent(
      `Bonjour ${collaboration.fullName}, je vous contacte au sujet de votre demande de collaboration Sylla (Réf: ${collaboration.trackingCode}).`
    );
    const whatsappLink = `https://wa.me/${cleanPhone}?text=${prefilledText}`;

    res.json({
      success: true,
      data: {
        ...collaboration,
        audioUrl: collaboration.audioPath ? `/api/audio/${collaboration.audioPath}` : null,
        whatsappLink,
      },
    });
  } catch (error) {
    console.error('Erreur getCollaborationById :', error);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
}

export async function updateCollaborationStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const { status, publicComment, action } = req.body;

    const existing = await prisma.collaboration.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Dossier introuvable.' });
      return;
    }

    let targetStatus: CollaborationStatus = existing.status;
    let previousStatus = existing.previousStatus;
    let archivedAt = existing.archivedAt;

    // Gestion de la restauration
    if (action === 'RESTAURER' || status === 'RESTAURER') {
      if (existing.status !== CollaborationStatus.ARCHIVEE) {
        res.status(400).json({ success: false, error: 'Ce dossier n’est pas archivé.' });
        return;
      }
      targetStatus = existing.previousStatus || CollaborationStatus.NOUVELLE;
      archivedAt = null;
    } else {
      if (!status || !Object.values(CollaborationStatus).includes(status as CollaborationStatus)) {
        res.status(400).json({ success: false, error: 'Statut demandé invalide.' });
        return;
      }
      targetStatus = status as CollaborationStatus;

      if (targetStatus === CollaborationStatus.ARCHIVEE) {
        previousStatus = existing.status;
        archivedAt = new Date();
      }
    }

    // Messages par défaut élégants si aucun commentaire personnalisé n'est fourni
    let defaultComment = publicComment;
    if (!defaultComment) {
      switch (targetStatus) {
        case CollaborationStatus.NOUVELLE:
          defaultComment = 'Le dossier a été réinitialisé en attente d’examen.';
          break;
        case CollaborationStatus.EN_ETUDE:
          defaultComment = 'Votre dossier est actuellement en cours d’étude approfondie par la direction Sylla.';
          break;
        case CollaborationStatus.ACCEPTEE:
          defaultComment = 'Félicitations ! Votre proposition de collaboration a été retenue. Notre équipe va prendre contact avec vous via WhatsApp / téléphone.';
          break;
        case CollaborationStatus.REFUSEE:
          defaultComment = 'Après étude de votre demande, nous ne sommes malheureusement pas en mesure de donner une suite favorable pour le moment.';
          break;
        case CollaborationStatus.ARCHIVEE:
          defaultComment = 'Le dossier a été classé / archivé.';
          break;
      }
    }

    const updated = await prisma.collaboration.update({
      where: { id },
      data: {
        status: targetStatus,
        previousStatus,
        archivedAt,
        statusHistory: {
          create: {
            status: targetStatus,
            publicComment: defaultComment,
          },
        },
      },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        internalNotes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json({
      success: true,
      message: `Statut du dossier mis à jour : ${targetStatus}`,
      data: {
        ...updated,
        audioUrl: updated.audioPath ? `/api/audio/${updated.audioPath}` : null,
      },
    });
  } catch (error) {
    console.error('Erreur updateCollaborationStatus :', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du statut.' });
  }
}

export async function addInternalNote(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ success: false, error: 'Le contenu de la note ne peut pas être vide.' });
      return;
    }

    const existing = await prisma.collaboration.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Dossier introuvable.' });
      return;
    }

    const author = req.adminUser?.fullName || 'Direction Sylla';

    const note = await prisma.internalNote.create({
      data: {
        collaborationId: id,
        author,
        content: content.trim(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Note interne enregistrée en toute confidentialité.',
      data: note,
    });
  } catch (error) {
    console.error('Erreur addInternalNote :', error);
    res.status(500).json({ success: false, error: 'Erreur lors de l’enregistrement de la note.' });
  }
}

export async function deleteCollaboration(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;

    const existing = await prisma.collaboration.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Dossier introuvable.' });
      return;
    }

    // Nettoyage sécurisé du fichier audio associé sur le disque s'il existe
    if (existing.audioPath) {
      try {
        const uploadsDir = path.resolve(process.cwd(), 'uploads/audio');
        const mainFilePath = path.join(uploadsDir, existing.audioPath);
        if (fs.existsSync(mainFilePath)) {
          fs.unlinkSync(mainFilePath);
        }

        // Supprimer également l'éventuelle version webm/mp3 dérivée
        const base = path.parse(existing.audioPath).name;
        const mp3Alt = path.join(uploadsDir, `${base}.mp3`);
        const webmAlt = path.join(uploadsDir, `${base}.webm`);
        if (fs.existsSync(mp3Alt)) fs.unlinkSync(mp3Alt);
        if (fs.existsSync(webmAlt)) fs.unlinkSync(webmAlt);
      } catch (fileErr) {
        console.warn('Erreur non bloquante lors de la suppression du fichier audio :', fileErr);
      }
    }

    // Suppression en base de données (les relations statusHistory et internalNotes sont supprimées en cascade)
    await prisma.collaboration.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: `Le dossier ${existing.trackingCode} a été définitivement supprimé.`,
    });
  } catch (error) {
    console.error('Erreur deleteCollaboration :', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression définitive du dossier.' });
  }
}
