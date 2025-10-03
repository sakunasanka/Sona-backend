// routes/postRoutes.ts
import express from 'express';
import {
  createPost,
  getPosts,
  getPostsWithLikes,
  getMyPosts,
  toggleLikePost,
  incrementViews,
  updatePost,
  deletePost,
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
router.post('/:postId/like', isAuthenticated, asyncHandler(toggleLikePost));
router.post('/:postId/view', asyncHandler(incrementViews));
router.put('/:postId', isAuthenticated, asyncHandler(updatePost)); 
router.delete('/:postId', isAuthenticated, asyncHandler(deletePost));

export default router;