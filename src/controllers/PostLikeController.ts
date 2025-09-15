import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import Post from '../models/Post';
import PostLike from '../models/PostLike';

/**
 * @description Like a post
 * @route POST /api/posts/:postId/like
 * @access Private
 */
export const likePost = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id; // Assumes user ID is on the request from auth middleware
  const postId = parseInt(req.params.postId, 10);

  if (isNaN(postId)) {
    return res.status(400).json({ success: false, message: 'Invalid post ID.' });
  }

  // Check if the post exists
  const post = await Post.findByPk(postId);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found.' });
  }

  // Use findOrCreate to prevent race conditions and simplify code
  const [like, created] = await PostLike.findOrCreate({
    where: { userId, postId },
    defaults: { userId, postId }
  });

  if (!created) {
    return res.status(409).json({ success: false, message: 'Post already liked.' });
  }

  res.status(201).json({ success: true, message: 'Post liked successfully.', data: like });
});

/**
 * @description Unlike a post
 * @route DELETE /api/posts/:postId/like
 * @access Private
 */
export const unlikePost = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const postId = parseInt(req.params.postId, 10);

  if (isNaN(postId)) {
    return res.status(400).json({ success: false, message: 'Invalid post ID.' });
  }

  // Find the like
  const like = await PostLike.findOne({ where: { userId, postId } });

  if (!like) {
    return res.status(404).json({ success: false, message: 'You have not liked this post.' });
  }

  // Delete the like
  await like.destroy();

  res.status(200).json({ success: true, message: 'Post unliked successfully.' });
});
