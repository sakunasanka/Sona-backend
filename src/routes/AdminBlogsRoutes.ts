import express from 'express';
import { getAllPostsHandler, updatePostStatusHandler } from '../controllers/AdminBlogsController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

router.get('/', authenticateToken, getAllPostsHandler);                         // GET all posts
router.patch('/:id/status', authenticateToken, updatePostStatusHandler);        // PATCH to update status

export default router;
