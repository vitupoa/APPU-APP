import { prisma } from '../../config/database.js';
import { io } from '../../shared/gateway/socket.js';
import crypto from 'crypto';

export class CommentsService {
  async getComments(
    contentType: string,
    content_id: string,
    sortBy: string = 'latest',
    cursor: string | null,
    limit: number = 20,
    user_id: string | null
  ) {
    const settings = await this.getCommentSettings(contentType, content_id);

    const where: any = {
      content_type: contentType,
      content_id,
      parent_id: null,
    };

    let orderBy: any = {};
    switch (sortBy) {
      case 'top':
        orderBy = { likes_count: 'desc' };
        break;
      case 'oldest':
        orderBy = { created_at: 'asc' };
        break;
      default:
        orderBy = { created_at: 'desc' };
    }

    if (cursor) {
      where.id = { lt: cursor };
    }

    const comments = await prisma.comments.findMany({
      where,
      orderBy: [{ is_pinned: 'desc' }, orderBy],
      take: limit,
      include: {
        User_comments_user_idToUser: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
          },
        },
        User_comments_reply_to_user_idToUser: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
          },
        },
      },
    });

    const contentOwner = await this.getContentOwner(contentType, content_id);

    const commentIds = comments.map((c: any) => c.id);
    const userLikes = user_id
      ? await prisma.comment_likes.findMany({
          where: { comment_id: { in: commentIds }, user_id },
          select: { comment_id: true },
        })
      : [];
    const likedCommentIds = new Set(userLikes.map((l: any) => l.comment_id));

    const mappedComments = comments.map((comment: any) => ({
      id: comment.id,
      content_id: comment.content_id,
      contentType: comment.content_type,
      author: {
        ...comment.User_comments_user_idToUser,
        isContentOwner: comment.User_comments_user_idToUser.id === contentOwner?.id,
      },
      text: comment.text,
      parent_id: comment.parent_id,
      replyToUser: comment.User_comments_reply_to_user_idToUser,
      likesCount: comment.likes_count,
      repliesCount: comment.replies_count,
      isLiked: likedCommentIds.has(comment.id),
      isPinned: comment.is_pinned,
      isEdited: comment.is_edited,
      canDelete: this.canDelete(comment, user_id, contentOwner?.id),
      canEdit: this.canEdit(comment, user_id),
      canPin: this.canPin(user_id, contentOwner?.id) && !comment.parent_id,
      canReply: settings.repliesEnabled,
      created_at: comment.created_at.toISOString(),
      editedAt: comment.edited_at?.toISOString() || null,
    }));

    const nextCursor = comments.length === limit ? comments[comments.length - 1].id : null;

    return {
      comments: mappedComments,
      settings,
      nextCursor,
    };
  }

  async getReplies(commentId: string, cursor: string | null, limit: number = 10, user_id: string | null) {
    const parentComment = await prisma.comments.findUnique({
      where: { id: commentId },
      select: { content_type: true, content_id: true },
    });

    if (!parentComment) {
      throw new Error('Comment not found');
    }

    const where: any = { parent_id: commentId };
    if (cursor) {
      where.id = { lt: cursor };
    }

    const replies = await prisma.comments.findMany({
      where,
      orderBy: { created_at: 'asc' },
      take: limit,
      include: {
        User_comments_user_idToUser: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
          },
        },
        User_comments_reply_to_user_idToUser: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
          },
        },
      },
    });

    const contentOwner = await this.getContentOwner(parentComment.content_type, parentComment.content_id);

    const replyIds = replies.map((r: any) => r.id);
    const userLikes = user_id
      ? await prisma.comment_likes.findMany({
          where: { comment_id: { in: replyIds }, user_id },
          select: { comment_id: true },
        })
      : [];
    const likedReplyIds = new Set(userLikes.map((l: any) => l.comment_id));

    const mappedReplies = replies.map((reply: any) => ({
      id: reply.id,
      content_id: reply.content_id,
      contentType: reply.content_type,
      author: {
        ...reply.User_comments_user_idToUser,
        isContentOwner: reply.User_comments_user_idToUser.id === contentOwner?.id,
      },
      text: reply.text,
      parent_id: reply.parent_id,
      replyToUser: reply.User_comments_reply_to_user_idToUser,
      likesCount: reply.likes_count,
      repliesCount: reply.replies_count,
      isLiked: likedReplyIds.has(reply.id),
      isPinned: reply.is_pinned,
      isEdited: reply.is_edited,
      canDelete: this.canDelete(reply, user_id, contentOwner?.id),
      canEdit: this.canEdit(reply, user_id),
      canPin: false,
      canReply: true,
      created_at: reply.created_at.toISOString(),
      editedAt: reply.edited_at?.toISOString() || null,
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
    content_id: string,
    text: string,
    parent_id: string | null,
    replyToUserId: string | null
  ) {
    if (text.length > 500) {
      throw new Error('Comment text must be 500 characters or less');
    }

    const settings = await this.getCommentSettings(contentType, content_id);
    if (!settings.commentsEnabled) {
      throw new Error('Comments are disabled for this content');
    }

    if (parent_id && !settings.repliesEnabled) {
      throw new Error('Replies are disabled for this content');
    }

    const [comment] = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comments.create({
        data: {
          user_id: userId,
          content_type: contentType,
          content_id,
          text,
          parent_id,
          reply_to_user_id: replyToUserId,
        },
        include: {
          User_comments_user_idToUser: {
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true,
              is_verified: true,
            },
          },
          User_comments_reply_to_user_idToUser: {
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true,
              is_verified: true,
            },
          },
        },
      });

      if (parent_id) {
        await tx.comments.update({
          where: { id: parent_id },
          data: { replies_count: { increment: 1 } },
        });
      }

      await this.incrementContentCommentCountTx(tx, contentType, content_id);

      return [newComment];
    });

    const contentOwner = await this.getContentOwner(contentType, content_id);

    io.to(`content:${content_id}`).emit('comment_update', {
      content_id,
      contentType,
      newCount: await this.getCommentCount(contentType, content_id),
    });

    return {
      success: true,
      comment: {
        id: comment.id,
        content_id: comment.content_id,
        contentType: comment.content_type,
        author: {
          ...comment.User_comments_user_idToUser,
          isContentOwner: comment.User_comments_user_idToUser.id === contentOwner?.id,
        },
        text: comment.text,
        parent_id: comment.parent_id,
        replyToUser: comment.User_comments_reply_to_user_idToUser,
        likesCount: comment.likes_count,
        repliesCount: comment.replies_count,
        isLiked: false,
        isPinned: comment.is_pinned,
        isEdited: comment.is_edited,
        canDelete: true,
        canEdit: true,
        canPin: false,
        canReply: true,
        created_at: comment.created_at.toISOString(),
        editedAt: null,
      },
    };
  }

  async updateComment(commentId: string, user_id: string, text: string) {
    if (text.length > 500) {
      throw new Error('Comment text must be 500 characters or less');
    }

    const comment = await prisma.comments.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (!this.canEdit(comment, user_id)) {
      throw new Error('Cannot edit this comment');
    }

    const updated = await prisma.comments.update({
      where: { id: commentId },
      data: {
        text,
        is_edited: true,
        edited_at: new Date(),
      },
      include: {
        User_comments_user_idToUser: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
          },
        },
        User_comments_reply_to_user_idToUser: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
          },
        },
      },
    });

    const contentOwner = await this.getContentOwner(updated.content_type, updated.content_id);

    return {
      success: true,
      comment: {
        id: updated.id,
        content_id: updated.content_id,
        contentType: updated.content_type,
        author: {
          ...updated.User_comments_user_idToUser,
          isContentOwner: updated.User_comments_user_idToUser.id === contentOwner?.id,
        },
        text: updated.text,
        parent_id: updated.parent_id,
        replyToUser: updated.User_comments_reply_to_user_idToUser,
        likesCount: updated.likes_count,
        repliesCount: updated.replies_count,
        isLiked: false,
        isPinned: updated.is_pinned,
        isEdited: updated.is_edited,
        canDelete: this.canDelete(updated, user_id, contentOwner?.id),
        canEdit: this.canEdit(updated, user_id),
        canPin: false,
        canReply: true,
        created_at: updated.created_at.toISOString(),
        editedAt: updated.edited_at?.toISOString() || null,
      },
    };
  }

  async deleteComment(commentId: string, user_id: string) {
    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
      include: { comments: true },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    const contentOwner = await this.getContentOwner(comment.content_type, comment.content_id);

    if (!this.canDelete(comment, user_id, contentOwner?.id)) {
      throw new Error('Cannot delete this comment');
    }

    await prisma.$transaction(async (tx) => {
      await tx.comments.delete({ where: { id: commentId } });

      if (comment.parent_id) {
        await tx.comments.update({
          where: { id: comment.parent_id },
          data: { replies_count: { decrement: 1 } },
        });
      }

      await this.decrementContentCommentCountTx(tx, comment.content_type, comment.content_id);
    });

    io.to(`content:${comment.content_id}`).emit('comment_update', {
      content_id: comment.content_id,
      contentType: comment.content_type,
      newCount: await this.getCommentCount(comment.content_type, comment.content_id),
    });

    return { success: true };
  }

  async likeComment(commentId: string, user_id: string) {
    const comment = await prisma.comments.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new Error('Comment not found');
    }

    const comment_id = commentId;
    const existing = await prisma.comment_likes.findUnique({
      where: {
        comment_id_user_id: { comment_id, user_id },
      },
    });

    if (existing) {
      throw new Error('Already liked');
    }

    await prisma.$transaction([
      prisma.comment_likes.create({
        data: { id: crypto.randomUUID(), comment_id, user_id}
      } as any),
      prisma.comments.update({
        where: { id: commentId },
        data: { likes_count: { increment: 1 } },
      }),
    ]);

    const updated = await this.getCommentById(commentId, user_id);
    return { success: true, comment: updated };
  }

  async unlikeComment(commentId: string, user_id: string) {
    const comment = await prisma.comments.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new Error('Comment not found');
    }

    const comment_id = commentId;
    await prisma.$transaction([
      prisma.comment_likes.delete({
        where: {
          comment_id_user_id: { comment_id, user_id },
        },
      }),
      prisma.comments.update({
        where: { id: commentId },
        data: { likes_count: { decrement: 1 } },
      }),
    ]);

    const updated = await this.getCommentById(commentId, user_id);
    return { success: true, comment: updated };
  }

  async pinComment(commentId: string, user_id: string) {
    const comment = await prisma.comments.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new Error('Comment not found');
    }

    const contentOwner = await this.getContentOwner(comment.content_type, comment.content_id);
    if (!this.canPin(user_id, contentOwner?.id) || comment.parent_id) {
      throw new Error('Cannot pin this comment');
    }

    await prisma.comments.update({
      where: { id: commentId },
      data: { is_pinned: true },
    });

    const updated = await this.getCommentById(commentId, user_id);
    return { success: true, comment: updated };
  }

  async unpinComment(commentId: string, user_id: string) {
    const comment = await prisma.comments.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new Error('Comment not found');
    }

    const contentOwner = await this.getContentOwner(comment.content_type, comment.content_id);
    if (!this.canPin(user_id, contentOwner?.id)) {
      throw new Error('Cannot unpin this comment');
    }

    await prisma.comments.update({
      where: { id: commentId },
      data: { is_pinned: false },
    });

    const updated = await this.getCommentById(commentId, user_id);
    return { success: true, comment: updated };
  }

  async reportComment(commentId: string, user_id: string, reason: string) {
    const comment = await prisma.comments.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new Error('Comment not found');
    }

    const comment_id = commentId;
    await prisma.comment_reports.create({
      data: {
        comment_id,
        reporter_id: user_id,
        reason,
      },
    });

    return { success: true };
  }

  async updateCommentSettings(
    userId: string,
    contentType: string,
    content_id: string,
    commentsEnabled: boolean,
    repliesEnabled: boolean
  ) {
    const contentOwner = await this.getContentOwner(contentType, content_id);
    if (contentOwner?.id !== userId) {
      throw new Error('Only content owner can update settings');
    }

    await prisma.comment_settings.upsert({
      where: {
        content_id_content_type: { content_id, content_type: contentType },
      },
      create: {
        content_id,
        content_type: contentType,
        comments_enabled: commentsEnabled,
        replies_enabled: repliesEnabled,
      },
      update: {
        comments_enabled: commentsEnabled,
        replies_enabled: repliesEnabled,
      },
    });

    return { success: true };
  }

  private async getCommentSettings(contentType: string, content_id: string) {
    const settings = await prisma.comment_settings.findUnique({
      where: {
        content_id_content_type: { content_id, content_type: contentType },
      },
    });

    const totalComments = await this.getCommentCount(contentType, content_id);

    return {
      commentsEnabled: settings?.comments_enabled ?? true,
      repliesEnabled: settings?.replies_enabled ?? true,
      totalComments,
    };
  }

  private async getContentOwner(contentType: string, content_id: string) {
    let owner = null;
    switch (contentType) {
      case 'post':
        owner = await prisma.post.findUnique({
          where: { id: content_id },
          select: { user_id: true },
        });
        return owner ? { id: owner.user_id } : null;
      case 'short':
        owner = await prisma.shorts.findUnique({
          where: { id: content_id },
          select: { user_id: true },
        });
        return owner ? { id: owner.user_id } : null;
      case 'contest_submission':
        owner = await prisma.contest_submission.findUnique({
          where: { id: content_id },
          select: { user_id: true },
        });
        return owner ? { id: owner.user_id } : null;
      default:
        return null;
    }
  }

  private async getCommentCount(contentType: string, content_id: string) {
    return await prisma.comments.count({
      where: { content_type: contentType, content_id },
    });
  }

  private canDelete(comment: any, user_id: string | null, contentOwnerId: string | undefined) {
    if (!user_id) return false;
    return (
      comment.user_id === user_id ||
      contentOwnerId === user_id ||
      (comment.parent_id && comment.comments?.user_id === user_id)
    );
  }

  private canEdit(comment: any, user_id: string | null) {
    if (!user_id || comment.user_id !== user_id) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(comment.created_at) > fiveMinutesAgo;
  }

  private canPin(user_id: string | null, contentOwnerId: string | undefined) {
    return user_id === contentOwnerId;
  }

  private incrementContentCommentCountTx(tx: any, contentType: string, content_id: string) {
    switch (contentType) {
      case 'post':
        return tx.post.update({
          where: { id: content_id },
          data: { comments_count: { increment: 1 } },
        });
      case 'short':
        return tx.shorts.update({
          where: { id: content_id },
          data: { comments_count: { increment: 1 } },
        });
      case 'contest_submission':
        return Promise.resolve();
      default:
        return Promise.resolve();
    }
  }

  private decrementContentCommentCountTx(tx: any, contentType: string, content_id: string) {
    switch (contentType) {
      case 'post':
        return tx.post.update({
          where: { id: content_id },
          data: { comments_count: { decrement: 1 } },
        });
      case 'short':
        return tx.shorts.update({
          where: { id: content_id },
          data: { comments_count: { decrement: 1 } },
        });
      case 'contest_submission':
        return Promise.resolve();
      default:
        return Promise.resolve();
    }
  }

  private async getCommentById(commentId: string, user_id: string | null) {
    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
      include: {
        User_comments_user_idToUser: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
          },
        },
        User_comments_reply_to_user_idToUser: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
          },
        },
      },
    });

    if (!comment) throw new Error('Comment not found');

    const contentOwner = await this.getContentOwner(comment.content_type, comment.content_id);
    const comment_id = commentId;
    const isLiked = user_id
      ? !!(await prisma.comment_likes.findUnique({
          where: { comment_id_user_id: { comment_id, user_id } },
        }))
      : false;

    return {
      id: comment.id,
      content_id: comment.content_id,
      contentType: comment.content_type,
      author: {
        ...comment.User_comments_user_idToUser,
        isContentOwner: comment.User_comments_user_idToUser.id === contentOwner?.id,
      },
      text: comment.text,
      parent_id: comment.parent_id,
      replyToUser: comment.User_comments_reply_to_user_idToUser,
      likesCount: comment.likes_count,
      repliesCount: comment.replies_count,
      isLiked,
      isPinned: comment.is_pinned,
      isEdited: comment.is_edited,
      canDelete: this.canDelete(comment, user_id, contentOwner?.id),
      canEdit: this.canEdit(comment, user_id),
      canPin: this.canPin(user_id, contentOwner?.id) && !comment.parent_id,
      canReply: true,
      created_at: comment.created_at.toISOString(),
      editedAt: comment.edited_at?.toISOString() || null,
    };
  }
}
