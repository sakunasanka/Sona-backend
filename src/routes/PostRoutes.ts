import express from 'express';
import {
  getPosts,
  getPostsWithLikes,
  createPost,
  toggleLikePost,
  incrementViews,
} from '../controllers/PostController';
import { authenticateToken, optionalAuth } from '../middlewares/auth';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getPosts);
// router.post('/:postId/view', incrementViews);

// // Protected routes (authentication required)
// router.get('/with-likes', authenticateToken, getPostsWithLikes);
// router.post('/', authenticateToken, createPost);
// router.post('/:postId/like', authenticateToken, toggleLikePost);

export default router;