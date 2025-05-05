import { Response } from 'express';
import { Logger } from './Logger';

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
  }

  static handleError(error: unknown, res: Response): void {
    Logger.error(error);
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(500).json('unknow error');
    }
  }
}

export class NotFound extends HttpError {
  constructor(data: string) {
    super(`${data} introuvable`, 404);
  }
}

export class InvalidData extends HttpError {
  constructor() {
    super(`Donnée invalide`, 403);
  }
}

export class InvalidToken extends HttpError {
  constructor() {
    super('Token invalide', 498);
  }
}

export class PermissionError extends HttpError {
  constructor() {
    super("Vous ne disposez pas des permissions nécésssaire pour accomplir cette action", 403);
  }
}
