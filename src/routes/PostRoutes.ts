// routes/postRoutes.ts
import express from 'express';
import {
  createPost,
  getPosts,
  getPostsWithLikes,
  toggleLikePost,
  incrementViews,
} from '../controllers/PostController';
import { authenticateToken } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

router.get('/', asyncHandler(getPosts));
router.get('/likes', asyncHandler(getPostsWithLikes));
router.post('/', asyncHandler(createPost));
router.post('/:postId/like', asyncHandler(toggleLikePost));
router.post('/:postId/view', asyncHandler(incrementViews));

export default router;