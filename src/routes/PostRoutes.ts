// routes/postRoutes.ts
import express from 'express';
import {
  createPost,
  getPosts,
  getPostsWithLikes,
  toggleLikePost,
  incrementViews,
  updatePost,
  deletePost,
} from '../controllers/PostController';
import { authenticateToken } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

router.get('/', asyncHandler(getPosts));
router.get('/likes', asyncHandler(getPostsWithLikes));
router.post('/', asyncHandler(createPost));
router.post('/:postId/like', asyncHandler(toggleLikePost));
router.post('/:postId/view', asyncHandler(incrementViews));
router.put('/:postId', asyncHandler(updatePost)); 
router.delete('/:postId', asyncHandler(deletePost));

export default router;