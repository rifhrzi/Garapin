import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth';
import { chatService } from './chat.service';
import { uploadChatFile } from '../../utils/storage';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AppError } from '../../utils/errors';

export class ChatController {
  async getUserConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const conversations = await chatService.getUserConversations(user.userId);
      sendSuccess(res, conversations);
    } catch (error) {
      next(error);
    }
  }

  async getConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const conversation = await chatService.getConversation(
        req.params.projectId as string,
        user.userId
      );
      sendSuccess(res, conversation);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const message = await chatService.sendMessage(user.userId, req.body);
      sendSuccess(res, message, 'Message sent', 201);
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await chatService.getMessages(
        req.params.conversationId as string,
        user.userId,
        page,
        limit
      );
      sendPaginated(res, result.messages, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req as AuthenticatedRequest;

      if (!req.file) {
        throw new AppError('No file provided', 400);
      }

      const { conversationId } = req.body;
      if (!conversationId) {
        throw new AppError('conversationId is required', 400);
      }

      // Verify user has access to conversation and escrow is active
      const conv = await chatService.getConversationById(conversationId, user.userId);

      if (!conv.escrowActive) {
        throw new AppError('File sharing is only available after escrow payment', 400);
      }

      const fileUrl = await uploadChatFile(req.file, conversationId);

      // Send as a FILE message
      const message = await chatService.sendMessage(user.userId, {
        conversationId,
        content: req.file.originalname,
        type: 'FILE',
        fileUrl,
      });

      sendSuccess(res, { fileUrl, message }, 'File uploaded', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
