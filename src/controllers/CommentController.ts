// filepath: /Volumes/Third Year/3rd yr sem 1/Group Project/SonaBackend/src/controllers/CommentController.ts
import { Request, Response } from 'express';
import Comment from '../models/Comment';
import Post from '../models/Post';
import User from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { sequelize } from '../config/db';

/**
 * @desc    Get all comments for a post
 * @route   GET /api/posts/:postId/comments
 * @access  Public
 */
export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  
  // Get all top-level comments (no parentId)
  const comments = await Comment.findAll({
    where: { postId, parentId: null },
    include: [
      { model: User, as: 'user', attributes: ['id', 'name', 'avatar'] },
      { 
        model: Comment, 
        as: 'replies',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    count: comments.length,
    data: comments
  });
});

/**
 * @desc    Get a single comment with replies
 * @route   GET /api/comments/:id
 * @access  Public
 */
export const getComment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const comment = await Comment.findByPk(id, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'name', 'avatar'] },
      { 
        model: Comment, 
        as: 'replies',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }]
      }
    ]
  });
  
  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }

  res.json({
    success: true,
    data: comment
  });
});

/**
 * @desc    Create a comment
 * @route   POST /api/posts/:postId/comments
 * @access  Private
 */
export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { content, parentId } = req.body;
  const userId = (req.user as any).id;

  // Check if post exists
  const post = await Post.findByPk(postId);
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  // If parentId provided, check if parent comment exists
  if (parentId) {
    const parentComment = await Comment.findByPk(parentId);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Parent comment not found'
      });
    }
  }

  const transaction = await sequelize.transaction();

  try {
    // Create the comment
    const comment = await Comment.create({
      userId,
      postId,
      content,
      parentId: parentId || null,
      likes: 0
    }, { transaction });

    // Increment the post's comment count
    await Post.increment('comments', { by: 1, where: { id: postId }, transaction });

    await transaction.commit();

    // Fetch the newly created comment with the user info
    const newComment = await Comment.findByPk(comment.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }
      ]
    });

    res.status(201).json({
      success: true,
      data: newComment
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * @desc    Update a comment
 * @route   PUT /api/comments/:id
 * @access  Private
 */
export const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = (req.user as any).id;
  
  // Find the comment
  const comment = await Comment.findByPk(id);
  
  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }
  
  // Check if the comment belongs to the user
  if (comment.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this comment'
    });
  }
  
  // Update the comment
  comment.content = content;
  await comment.save();
  
  res.json({
    success: true,
    data: comment
  });
});

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:id
 * @access  Private
 */
export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req.user as any).id;
  
  const comment = await Comment.findByPk(id);
  
  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }
  
  // Check if the comment belongs to the user
  if (comment.userId !== userId) {
    // Check if the user is an admin
    const userRole = (req.user as any).role;
    if (userRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }
  }
  
  const transaction = await sequelize.transaction();
  
  try {
    // Get the post ID before deleting
    const { postId } = comment;
    
    // Delete the comment (Sequelize will handle cascading to replies)
    await comment.destroy({ transaction });
    
    // Count how many comments were deleted (including replies)
    const deletedCount = await Comment.decrement('comments', { 
      by: 1, 
      where: { id: postId }, 
      transaction 
    });
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * @desc    Like/unlike a comment
 * @route   PUT /api/comments/:id/like
 * @access  Private
 */
export const toggleLike = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body; // 'like' or 'unlike'
  
  // Find the comment
  const comment = await Comment.findByPk(id);
  
  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }
  
  // Update the likes count
  if (action === 'like') {
    comment.likes += 1;
  } else if (action === 'unlike' && comment.likes > 0) {
    comment.likes -= 1;
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid action. Use 'like' or 'unlike'"
    });
  }
  
  await comment.save();
  
  res.json({
    success: true,
    data: { likes: comment.likes }
  });
});