import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  adminUser?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export function requireAdminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentification requise pour accéder au dashboard administrateur',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'sylla_collab_super_secret_jwt_key_2026_secure';

  try {
    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      fullName: string;
      role: string;
    };

    req.adminUser = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Session expirée ou jeton administrateur invalide',
    });
  }
}
