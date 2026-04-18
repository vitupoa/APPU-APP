import { prisma } from '../../config/database.js';
import { io } from '../../shared/gateway/socket.js';

export class CommentsService {
  async getComments(
    contentType: string,
    contentId: string,
    sortBy: string = 'latest',
    cursor: string | null,
    limit: number = 20,
    userId: string | null
  ) {
    const settings = await this.getCommentSettings(contentType, contentId);

    const where: any = {
      contentType,
      contentId,
      parentId: null,
    };

    let orderBy: any = {};
    switch (sortBy) {
      case 'top':
        orderBy = { likesCount: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    if (cursor) {
      where.id = { lt: cursor };
    }

    const comments = await prisma.comment.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, orderBy],
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        replyToUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    const contentOwner = await this.getContentOwner(contentType, contentId);

    const commentIds = comments.map((c) => c.id);
    const userLikes = userId
      ? await prisma.commentLike.findMany({
          where: { commentId: { in: commentIds }, userId },
          select: { commentId: true },
        })
      : [];
    const likedCommentIds = new Set(userLikes.map((l) => l.commentId));

    const mappedComments = comments.map((comment) => ({
      id: comment.id,
      contentId: comment.contentId,
      contentType: comment.contentType,
      author: {
        ...comment.author,
        isContentOwner: comment.author.id === contentOwner?.id,
      },
      text: comment.text,
      parentId: comment.parentId,
      replyToUser: comment.replyToUser,
      likesCount: comment.likesCount,
      repliesCount: comment.repliesCount,
      isLiked: likedCommentIds.has(comment.id),
      isPinned: comment.isPinned,
      isEdited: comment.isEdited,
      canDelete: this.canDelete(comment, userId, contentOwner?.id),
      canEdit: this.canEdit(comment, userId),
      canPin: this.canPin(userId, contentOwner?.id) && !comment.parentId,
      canReply: settings.repliesEnabled,
      createdAt: comment.createdAt.toISOString(),
      editedAt: comment.editedAt?.toISOString() || null,
    }));

    const nextCursor = comments.length === limit ? comments[comments.length - 1].id : null;

    return {
      comments: mappedComments,
      settings,
      nextCursor,
    };
  }

  async getReplies(commentId: string, cursor: string | null, limit: number = 10, userId: string | null) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { contentType: true, contentId: true },
    });

    if (!parentComment) {
      throw new Error('Comment not found');
    }

    const where: any = { parentId: commentId };
    if (cursor) {
      where.id = { lt: cursor };
    }

    const replies = await prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        replyToUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    const contentOwner = await this.getContentOwner(parentComment.contentType, parentComment.contentId);

    const replyIds = replies.map((r) => r.id);
    const userLikes = userId
      ? await prisma.commentLike.findMany({
          where: { commentId: { in: replyIds }, userId },
          select: { commentId: true },
        })
      : [];
    const likedReplyIds = new Set(userLikes.map((l) => l.commentId));

    const mappedReplies = replies.map((reply) => ({
      id: reply.id,
      contentId: reply.contentId,
      contentType: reply.contentType,
      author: {
        ...reply.author,
        isContentOwner: reply.author.id === contentOwner?.id,
      },
      text: reply.text,
      parentId: reply.parentId,
      replyToUser: reply.replyToUser,
      likesCount: reply.likesCount,
      repliesCount: reply.repliesCount,
      isLiked: likedReplyIds.has(reply.id),
      isPinned: reply.isPinned,
      isEdited: reply.isEdited,
      canDelete: this.canDelete(reply, userId, contentOwner?.id),
      canEdit: this.canEdit(reply, userId),
      canPin: false,
      canReply: true,
      createdAt: reply.createdAt.toISOString(),
      editedAt: reply.editedAt?.toISOString() || null,
    }));

    const nextCursor = replies.length === limit ? replies[replies.length - 1].id : null;

    return {
      comments: mappedReplies,
      settings: { commentsEnabled: true, repliesEnabled: true, totalComments: 0 },
      nextCursor,
    };
  }

  async createComment(
    userId: string,
    contentType: string,
    contentId: string,
    text: string,
    parentId: string | null,
    replyToUserId: string | null
  ) {
    if (text.length > 500) {
      throw new Error('Comment text must be 500 characters or less');
    }

    const settings = await this.getCommentSettings(contentType, contentId);
    if (!settings.commentsEnabled) {
      throw new Error('Comments are disabled for this content');
    }

    if (parentId && !settings.repliesEnabled) {
      throw new Error('Replies are disabled for this content');
    }

    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          userId,
          contentType,
          contentId,
          text,
          parentId,
          replyToUserId,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
          replyToUser: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
      }),
      ...(parentId
        ? [
            prisma.comment.update({
              where: { id: parentId },
              data: { repliesCount: { increment: 1 } },
            }),
          ]
        : []),
      this.incrementContentCommentCount(contentType, contentId),
    ]);

    const contentOwner = await this.getContentOwner(contentType, contentId);

    io.to(`content:${contentId}`).emit('comment_update', {
      contentId,
      contentType,
      newCount: await this.getCommentCount(contentType, contentId),
    });

    return {
      success: true,
      comment: {
        id: comment.id,
        contentId: comment.contentId,
        contentType: comment.contentType,
        author: {
          ...comment.author,
          isContentOwner: comment.author.id === contentOwner?.id,
        },
        text: comment.text,
        parentId: comment.parentId,
        replyToUser: comment.replyToUser,
        likesCount: comment.likesCount,
        repliesCount: comment.repliesCount,
        isLiked: false,
        isPinned: comment.isPinned,
        isEdited: comment.isEdited,
        canDelete: true,
        canEdit: true,
        canPin: false,
        canReply: true,
        createdAt: comment.createdAt.toISOString(),
        editedAt: null,
      },
    };
  }

  async updateComment(commentId: string, userId: string, text: string) {
    if (text.length > 500) {
      throw new Error('Comment text must be 500 characters or less');
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (!this.canEdit(comment, userId)) {
      throw new Error('Cannot edit this comment');
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        text,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        replyToUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    const contentOwner = await this.getContentOwner(updated.contentType, updated.contentId);

    return {
      success: true,
      comment: {
        id: updated.id,
        contentId: updated.contentId,
        contentType: updated.contentType,
        author: {
          ...updated.author,
          isContentOwner: updated.author.id === contentOwner?.id,
        },
        text: updated.text,
        parentId: updated.parentId,
        replyToUser: updated.replyToUser,
        likesCount: updated.likesCount,
        repliesCount: updated.repliesCount,
        isLiked: false,
        isPinned: updated.isPinned,
        isEdited: updated.isEdited,
        canDelete: this.canDelete(updated, userId, contentOwner?.id),
        canEdit: this.canEdit(updated, userId),
        canPin: false,
        canReply: true,
        createdAt: updated.createdAt.toISOString(),
        editedAt: updated.editedAt?.toISOString() || null,
      },
    };
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { parent: true },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    const contentOwner = await this.getContentOwner(comment.contentType, comment.contentId);

    if (!this.canDelete(comment, userId, contentOwner?.id)) {
      throw new Error('Cannot delete this comment');
    }

    await prisma.$transaction([
      prisma.comment.delete({ where: { id: commentId } }),
      ...(comment.parentId
        ? [
            prisma.comment.update({
              where: { id: comment.parentId },
              data: { repliesCount: { decrement: 1 } },
            }),
          ]
        : []),
      this.decrementContentCommentCount(comment.contentType, comment.contentId),
    ]);

    io.to(`content:${comment.contentId}`).emit('comment_update', {
      contentId: comment.contentId,
      contentType: comment.contentType,
      newCount: await this.getCommentCount(comment.contentType, comment.contentId),
    });

    return { success: true };
  }

  async likeComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new Error('Comment not found');
    }

    const existing = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: { commentId, userId },
      },
    });

    if (existing) {
      throw new Error('Already liked');
    }

    await prisma.$transaction([
      prisma.commentLike.create({ data: { commentId, userId } }),
      prisma.comment.update({
        where: { id: commentId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    const updated = await this.getCommentById(commentId, userId);
    return { success: true, comment: updated };
  }

  async unlikeComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new Error('Comment not found');
    }

    await prisma.$transaction([
      prisma.commentLike.delete({
        where: {
          commentId_userId: { commentId, userId },
        },
      }),
      prisma.comment.update({
        where: { id: commentId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);

    const updated = await this.getCommentById(commentId, userId);
    return { success: true, comment: updated };
  }

  async pinComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new Error('Comment not found');
    }

    const contentOwner = await this.getContentOwner(comment.contentType, comment.contentId);
    if (!this.canPin(userId, contentOwner?.id) || comment.parentId) {
      throw new Error('Cannot pin this comment');
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { isPinned: true },
    });

    const updated = await this.getCommentById(commentId, userId);
    return { success: true, comment: updated };
  }

  async unpinComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new Error('Comment not found');
    }

    const contentOwner = await this.getContentOwner(comment.contentType, comment.contentId);
    if (!this.canPin(userId, contentOwner?.id)) {
      throw new Error('Cannot unpin this comment');
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { isPinned: false },
    });

    const updated = await this.getCommentById(commentId, userId);
    return { success: true, comment: updated };
  }

  async reportComment(commentId: string, userId: string, reason: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new Error('Comment not found');
    }

    await prisma.commentReport.create({
      data: {
        commentId,
        reporterId: userId,
        reason,
      },
    });

    return { success: true };
  }

  async updateCommentSettings(
    userId: string,
    contentType: string,
    contentId: string,
    commentsEnabled: boolean,
    repliesEnabled: boolean
  ) {
    const contentOwner = await this.getContentOwner(contentType, contentId);
    if (contentOwner?.id !== userId) {
      throw new Error('Only content owner can update settings');
    }

    await prisma.commentSettings.upsert({
      where: {
        contentId_contentType: { contentId, contentType },
      },
      create: {
        contentId,
        contentType,
        commentsEnabled,
        repliesEnabled,
      },
      update: {
        commentsEnabled,
        repliesEnabled,
      },
    });

    return { success: true };
  }

  private async getCommentSettings(contentType: string, contentId: string) {
    const settings = await prisma.commentSettings.findUnique({
      where: {
        contentId_contentType: { contentId, contentType },
      },
    });

    const totalComments = await this.getCommentCount(contentType, contentId);

    return {
      commentsEnabled: settings?.commentsEnabled ?? true,
      repliesEnabled: settings?.repliesEnabled ?? true,
      totalComments,
    };
  }

  private async getContentOwner(contentType: string, contentId: string) {
    let owner = null;
    switch (contentType) {
      case 'post':
        owner = await prisma.post.findUnique({
          where: { id: contentId },
          select: { userId: true },
        });
        return owner ? { id: owner.userId } : null;
      case 'short':
        owner = await prisma.short.findUnique({
          where: { id: contentId },
          select: { userId: true },
        });
        return owner ? { id: owner.userId } : null;
      case 'contest_submission':
        owner = await prisma.contestSubmission.findUnique({
          where: { id: contentId },
          select: { userId: true },
        });
        return owner ? { id: owner.userId } : null;
      default:
        return null;
    }
  }

  private async getCommentCount(contentType: string, contentId: string) {
    return await prisma.comment.count({
      where: { contentType, contentId },
    });
  }

  private canDelete(comment: any, userId: string | null, contentOwnerId: string | undefined) {
    if (!userId) return false;
    return (
      comment.userId === userId ||
      contentOwnerId === userId ||
      (comment.parentId && comment.parent?.userId === userId)
    );
  }

  private canEdit(comment: any, userId: string | null) {
    if (!userId || comment.userId !== userId) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(comment.createdAt) > fiveMinutesAgo;
  }

  private canPin(userId: string | null, contentOwnerId: string | undefined) {
    return userId === contentOwnerId;
  }

  private incrementContentCommentCount(contentType: string, contentId: string) {
    switch (contentType) {
      case 'post':
        return prisma.post.update({
          where: { id: contentId },
          data: { commentsCount: { increment: 1 } },
        });
      case 'short':
        return prisma.short.update({
          where: { id: contentId },
          data: { commentsCount: { increment: 1 } },
        });
      case 'contest_submission':
        return prisma.contestSubmission.update({
          where: { id: contentId },
          data: { commentsCount: { increment: 1 } },
        });
      default:
        return Promise.resolve();
    }
  }

  private decrementContentCommentCount(contentType: string, contentId: string) {
    switch (contentType) {
      case 'post':
        return prisma.post.update({
          where: { id: contentId },
          data: { commentsCount: { decrement: 1 } },
        });
      case 'short':
        return prisma.short.update({
          where: { id: contentId },
          data: { commentsCount: { decrement: 1 } },
        });
      case 'contest_submission':
        return prisma.contestSubmission.update({
          where: { id: contentId },
          data: { commentsCount: { decrement: 1 } },
        });
      default:
        return Promise.resolve();
    }
  }

  private async getCommentById(commentId: string, userId: string | null) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        replyToUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    if (!comment) throw new Error('Comment not found');

    const contentOwner = await this.getContentOwner(comment.contentType, comment.contentId);
    const isLiked = userId
      ? !!(await prisma.commentLike.findUnique({
          where: { commentId_userId: { commentId, userId } },
        }))
      : false;

    return {
      id: comment.id,
      contentId: comment.contentId,
      contentType: comment.contentType,
      author: {
        ...comment.author,
        isContentOwner: comment.author.id === contentOwner?.id,
      },
      text: comment.text,
      parentId: comment.parentId,
      replyToUser: comment.replyToUser,
      likesCount: comment.likesCount,
      repliesCount: comment.repliesCount,
      isLiked,
      isPinned: comment.isPinned,
      isEdited: comment.isEdited,
      canDelete: this.canDelete(comment, userId, contentOwner?.id),
      canEdit: this.canEdit(comment, userId),
      canPin: this.canPin(userId, contentOwner?.id) && !comment.parentId,
      canReply: true,
      createdAt: comment.createdAt.toISOString(),
      editedAt: comment.editedAt?.toISOString() || null,
    };
  }
}
