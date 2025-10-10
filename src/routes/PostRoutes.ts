// routes/postRoutes.ts
import express from 'express';
import {
  createPost,
  getPosts,
  getPostsWithLikes,
  getMyPosts,
  toggleLikePost,
  likePost,
  dislikePost,
  incrementViews,
  updatePost,
  deletePost,
  getLikeStatus,
} from '../controllers/PostController';
import { isAuthenticated } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Public routes
router.get('/', asyncHandler(getPosts));
router.get('/likes', asyncHandler(getPostsWithLikes));

// Protected routes (require authentication)
router.get('/my-posts', isAuthenticated, asyncHandler(getMyPosts));
router.post('/', isAuthenticated, asyncHandler(createPost));
// New explicit like/dislike endpoints (idempotent)
router.post('/:postId/like', isAuthenticated, asyncHandler(likePost));
router.delete('/:postId/like', isAuthenticated, asyncHandler(dislikePost));

// Backward-compatible toggle endpoint
router.post('/:postId/like/toggle', isAuthenticated, asyncHandler(toggleLikePost));
// Check like status
router.get('/:postId/like/status', isAuthenticated, asyncHandler(getLikeStatus));
router.post('/:postId/view', asyncHandler(incrementViews));
router.put('/:postId', isAuthenticated, asyncHandler(updatePost)); 
router.delete('/:postId', isAuthenticated, asyncHandler(deletePost));

export default router;