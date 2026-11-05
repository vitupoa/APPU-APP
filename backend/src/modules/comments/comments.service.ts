import { prisma } from '../../config/database.js';
import { io } from '../../shared/gateway/socket.js';
import crypto from 'crypto';

export class CommentsService {
  private mapReplyToUser(user: any) {
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      isVerified: user.is_verified
    };
  }

  async getComments(
    contentType: string,
    contentId: string,
    sortBy: string = 'latest',
    cursor: string | null,
    limit: number = 20,
    user_id: string | null
  ) {
    const settings = await this.getCommentSettings(contentType, contentId);

    const where: any = {
      content_type: contentType,
      content_id: contentId,
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
        user_comments_user_idTouser: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
          },
        },
        user_comments_reply_to_user_idTouser: {
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

    const contentOwner = await this.getContentOwner(contentType, contentId);

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
        id: comment.user_comments_user_idTouser.id,
        username: comment.user_comments_user_idTouser.username,
        displayName: comment.user_comments_user_idTouser.display_name,
        avatarUrl: comment.user_comments_user_idTouser.avatar_url,
        isVerified: comment.user_comments_user_idTouser.is_verified,
        isContentOwner: comment.user_comments_user_idTouser.id === contentOwner?.id,
      },
      text: comment.text,
      parent_id: comment.parent_id,
      replyToUser: this.mapReplyToUser(comment.user_comments_reply_to_user_idTouser),
      likesCount: comment.likes_count,
      repliesCount: comment.replies_count,
      isLiked: likedCommentIds.has(comment.id),
      isPinned: comment.is_pinned,
      isEdited: comment.is_edited,
      canDelete: this.canDelete(comment, user_id, contentOwner?.id),
      canEdit: this.canEdit(comment, user_id),
      canPin: this.canPin(user_id, contentOwner?.id) && !comment.parent_id,
      canReply: settings.repliesEnabled,
      createdAt: comment.created_at.toISOString(),
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
        user_comments_user_idTouser: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
          },
        },
        user_comments_reply_to_user_idTouser: {
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
        id: reply.user_comments_user_idTouser.id,
        username: reply.user_comments_user_idTouser.username,
        displayName: reply.user_comments_user_idTouser.display_name,
        avatarUrl: reply.user_comments_user_idTouser.avatar_url,
        isVerified: reply.user_comments_user_idTouser.is_verified,
        isContentOwner: reply.user_comments_user_idTouser.id === contentOwner?.id,
      },
      text: reply.text,
      parent_id: reply.parent_id,
      replyToUser: this.mapReplyToUser(reply.user_comments_reply_to_user_idTouser),
      likesCount: reply.likes_count,
      repliesCount: reply.replies_count,
      isLiked: likedReplyIds.has(reply.id),
      isPinned: reply.is_pinned,
      isEdited: reply.is_edited,
      canDelete: this.canDelete(reply, user_id, contentOwner?.id),
      canEdit: this.canEdit(reply, user_id),
      canPin: false,
      canReply: true,
      createdAt: reply.created_at.toISOString(),
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
    contentId: string,
    text: string,
    parent_id: string | null,
    replyToUserId: string | null
  ) {
    try {
      if (text.length > 500) {
        throw new Error('Comment text must be 500 characters or less');
      }

      const settings = await this.getCommentSettings(contentType, contentId);
      if (!settings.commentsEnabled) {
        throw new Error('Comments are disabled for this content');
      }

      if (parent_id && !settings.repliesEnabled) {
        throw new Error('Replies are disabled for this content');
      }

      const [comment] = await prisma.$transaction(async (tx) => {
        const commentId = crypto.randomUUID();
        const newComment = await tx.comments.create({
          data: {
            id: commentId,
            user_id: userId,
            content_type: contentType,
            content_id: contentId,
            text,
            parent_id,
            reply_to_user_id: replyToUserId,
          },
          include: {
            user_comments_user_idTouser: {
              select: {
                id: true,
                username: true,
                display_name: true,
                avatar_url: true,
                is_verified: true,
              },
            },
            user_comments_reply_to_user_idTouser: {
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

        await this.incrementContentCommentCountTx(tx, contentType, contentId);

        return [newComment];
      });

      const contentOwner = await this.getContentOwner(contentType, contentId);

      io.to(`content:${contentId}`).emit('comment_update', {
        content_id: contentId,
        contentType,
        newCount: await this.getCommentCount(contentType, contentId),
      });

      return {
        success: true,
        comment: {
          id: comment.id,
          content_id: comment.content_id,
          contentType: comment.content_type,
          author: {
            id: comment.user_comments_user_idTouser.id,
            username: comment.user_comments_user_idTouser.username,
            displayName: comment.user_comments_user_idTouser.display_name,
            avatarUrl: comment.user_comments_user_idTouser.avatar_url,
            isVerified: comment.user_comments_user_idTouser.is_verified,
            isContentOwner: comment.user_comments_user_idTouser.id === contentOwner?.id,
          },
          text: comment.text,
          parent_id: comment.parent_id,
          replyToUser: this.mapReplyToUser(comment.user_comments_reply_to_user_idTouser),
          likesCount: comment.likes_count,
          repliesCount: comment.replies_count,
          isLiked: false,
          isPinned: comment.is_pinned,
          isEdited: comment.is_edited,
          canDelete: true,
          canEdit: true,
          canPin: false,
          canReply: true,
          createdAt: comment.created_at.toISOString(),
          editedAt: null,
        },
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
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
        user_comments_user_idTouser: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
          },
        },
        user_comments_reply_to_user_idTouser: {
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
          id: updated.user_comments_user_idTouser.id,
          username: updated.user_comments_user_idTouser.username,
          displayName: updated.user_comments_user_idTouser.display_name,
          avatarUrl: updated.user_comments_user_idTouser.avatar_url,
          isVerified: updated.user_comments_user_idTouser.is_verified,
          isContentOwner: updated.user_comments_user_idTouser.id === contentOwner?.id,
        },
        text: updated.text,
        parent_id: updated.parent_id,
        replyToUser: this.mapReplyToUser(updated.user_comments_reply_to_user_idTouser),
        likesCount: updated.likes_count,
        repliesCount: updated.replies_count,
        isLiked: false,
        isPinned: updated.is_pinned,
        isEdited: updated.is_edited,
        canDelete: this.canDelete(updated, user_id, contentOwner?.id),
        canEdit: this.canEdit(updated, user_id),
        canPin: false,
        canReply: true,
        createdAt: updated.created_at.toISOString(),
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
    contentId: string,
    commentsEnabled: boolean,
    repliesEnabled: boolean
  ) {
    const contentOwner = await this.getContentOwner(contentType, contentId);
    if (contentOwner?.id !== userId) {
      throw new Error('Only content owner can update settings');
    }

    await prisma.comment_settings.upsert({
      where: {
        content_id_content_type: { content_id: contentId, content_type: contentType },
      },
      create: {
        content_id: contentId,
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

  private async getCommentSettings(contentType: string, contentId: string) {
    const settings = await prisma.comment_settings.findUnique({
      where: {
        content_id_content_type: { content_id: contentId, content_type: contentType },
      },
    });

    const totalComments = await this.getCommentCount(contentType, contentId);

    return {
      commentsEnabled: settings?.comments_enabled ?? true,
      repliesEnabled: settings?.replies_enabled ?? true,
      totalComments,
    };
  }

  private async getContentOwner(contentType: string, contentId: string) {
    let owner = null;
    try {
      switch (contentType) {
        case 'post':
          owner = await prisma.post.findUnique({
            where: { id: contentId },
            select: { user_id: true },
          });
          if (!owner) {
            console.warn(`Post not found: ${contentId}`);
          }
          return owner ? { id: owner.user_id } : null;
        case 'short':
          owner = await prisma.shorts.findUnique({
            where: { id: contentId },
            select: { user_id: true },
          });
          if (!owner) {
            console.warn(`Short not found: ${contentId}`);
          }
          return owner ? { id: owner.user_id } : null;
        case 'contest_submission':
          owner = await prisma.contest_submission.findUnique({
            where: { id: contentId },
            select: { user_id: true },
          });
          if (!owner) {
            console.warn(`Contest submission not found: ${contentId}`);
          }
          return owner ? { id: owner.user_id } : null;
        default:
          console.warn(`Unknown content type: ${contentType}`);
          return null;
      }
    } catch (error) {
      console.error(`Error getting content owner for ${contentType}:${contentId}`, error);
      return null;
    }
  }

  private async getCommentCount(contentType: string, contentId: string) {
    return await prisma.comments.count({
      where: { content_type: contentType, content_id: contentId },
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

  private incrementContentCommentCountTx(tx: any, contentType: string, contentId: string) {
    switch (contentType) {
      case 'post':
        return tx.post.update({
          where: { id: contentId },
          data: { comments_count: { increment: 1 } },
        });
      case 'short':
        return tx.shorts.update({
          where: { id: contentId },
          data: { comments_count: { increment: 1 } },
        });
      case 'contest_submission':
        return Promise.resolve();
      default:
        return Promise.resolve();
    }
  }

  private decrementContentCommentCountTx(tx: any, contentType: string, contentId: string) {
    switch (contentType) {
      case 'post':
        return tx.post.update({
          where: { id: contentId },
          data: { comments_count: { decrement: 1 } },
        });
      case 'short':
        return tx.shorts.update({
          where: { id: contentId },
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
        user_comments_user_idTouser: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
          },
        },
        user_comments_reply_to_user_idTouser: {
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
        id: comment.user_comments_user_idTouser.id,
        username: comment.user_comments_user_idTouser.username,
        displayName: comment.user_comments_user_idTouser.display_name,
        avatarUrl: comment.user_comments_user_idTouser.avatar_url,
        isVerified: comment.user_comments_user_idTouser.is_verified,
        isContentOwner: comment.user_comments_user_idTouser.id === contentOwner?.id,
      },
      text: comment.text,
      parent_id: comment.parent_id,
      replyToUser: this.mapReplyToUser(comment.user_comments_reply_to_user_idTouser),
      likesCount: comment.likes_count,
      repliesCount: comment.replies_count,
      isLiked,
      isPinned: comment.is_pinned,
      isEdited: comment.is_edited,
      canDelete: this.canDelete(comment, user_id, contentOwner?.id),
      canEdit: this.canEdit(comment, user_id),
      canPin: this.canPin(user_id, contentOwner?.id) && !comment.parent_id,
      canReply: true,
      createdAt: comment.created_at.toISOString(),
      editedAt: comment.edited_at?.toISOString() || null,
    };
  }
}
