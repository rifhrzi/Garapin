import prisma from '../../config/database';
import { AppError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { chatFilterService } from './chat-filter.service';

interface SendMessageInput {
  conversationId: string;
  content: string;
  type?: 'TEXT' | 'FILE' | 'SYSTEM';
  fileUrl?: string;
}

export class ChatService {
  async getUserConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        project: {
          OR: [
            { clientId: userId },
            { selectedFreelancerId: userId },
          ],
        },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            clientId: true,
            selectedFreelancerId: true,
            client: {
              select: {
                id: true,
                clientProfile: { select: { displayName: true } },
              },
            },
            selectedFreelancer: {
              select: {
                id: true,
                freelancerProfile: { select: { displayName: true, avatarUrl: true } },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            type: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return conversations.map((conv) => ({
      id: conv.id,
      projectId: conv.projectId,
      escrowActive: conv.escrowActive,
      project: conv.project,
      lastMessage: conv.messages[0] || null,
      createdAt: conv.createdAt,
    }));
  }

  async getConversationById(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { project: true },
    });

    if (!conversation) throw new NotFoundError('Conversation');

    const { project } = conversation;
    if (project.clientId !== userId && project.selectedFreelancerId !== userId) {
      throw new ForbiddenError('No access to this conversation');
    }

    return conversation;
  }

  async getConversation(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError('Project');

    // Only client and assigned freelancer can access
    if (project.clientId !== userId && project.selectedFreelancerId !== userId) {
      throw new ForbiddenError('No access to this conversation');
    }

    const conversation = await prisma.conversation.findUnique({
      where: { projectId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            sender: {
              select: {
                id: true,
                role: true,
                freelancerProfile: { select: { displayName: true, avatarUrl: true } },
                clientProfile: { select: { displayName: true } },
              },
            },
          },
        },
      },
    });

    if (!conversation) throw new NotFoundError('Conversation');
    return {
      ...conversation,
      messages: conversation.messages.reverse(),
    };
  }

  async sendMessage(userId: string, input: SendMessageInput) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: input.conversationId },
      include: { project: true },
    });
    if (!conversation) throw new NotFoundError('Conversation');

    const { project } = conversation;
    if (project.clientId !== userId && project.selectedFreelancerId !== userId) {
      throw new ForbiddenError('No access to this conversation');
    }

    // File uploads only after escrow
    if (input.type === 'FILE' && !conversation.escrowActive) {
      throw new AppError('File sharing is only available after escrow payment', 400);
    }

    // Run content through filter pipeline
    const filterResult = chatFilterService.filter(
      input.content,
      conversation.escrowActive
    );

    if (filterResult.isBlocked) {
      // Store the blocked message for admin audit but don't deliver
      await prisma.message.create({
        data: {
          conversationId: input.conversationId,
          senderId: userId,
          content: '[Message blocked by filter]',
          originalContent: input.content,
          type: 'SYSTEM',
          wasFiltered: true,
          filterReason: filterResult.flags.map((f) => f.type).join(', '),
          flags: {
            create: filterResult.flags.map((f) => ({
              flagType: f.type,
              matchedPattern: f.pattern,
            })),
          },
        },
      });

      throw new AppError(
        'Your message was blocked. Sharing contact information outside escrow is not allowed.',
        400
      );
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: userId,
        content: filterResult.sanitizedContent,
        originalContent: filterResult.flags.length > 0 ? input.content : null,
        type: input.type || 'TEXT',
        fileUrl: input.fileUrl,
        wasFiltered: filterResult.flags.length > 0,
        filterReason:
          filterResult.flags.length > 0
            ? filterResult.flags.map((f) => f.type).join(', ')
            : null,
        ...(filterResult.flags.length > 0
          ? {
            flags: {
              create: filterResult.flags.map((f) => ({
                flagType: f.type,
                matchedPattern: f.pattern,
              })),
            },
          }
          : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            role: true,
            freelancerProfile: { select: { displayName: true, avatarUrl: true } },
            clientProfile: { select: { displayName: true } },
          },
        },
      },
    });

    return message;
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { project: true },
    });
    if (!conversation) throw new NotFoundError('Conversation');

    const { project } = conversation;
    if (project.clientId !== userId && project.selectedFreelancerId !== userId) {
      throw new ForbiddenError('No access');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: {
              id: true,
              role: true,
              freelancerProfile: { select: { displayName: true, avatarUrl: true } },
              clientProfile: { select: { displayName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    return { messages: messages.reverse(), total, page, limit };
  }
}

export const chatService = new ChatService();
