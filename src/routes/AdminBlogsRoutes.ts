import express from 'express';
import { 
  getAllPostsHandler, 
  updatePostStatusHandler, 
  revokePostStatusHandler 
} from '../controllers/AdminBlogsController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

router.get('/', authenticateToken, getAllPostsHandler);                         // GET all posts
router.patch('/:id/status', authenticateToken, updatePostStatusHandler);        // PATCH to update status
router.patch('/:id/revoke', authenticateToken, revokePostStatusHandler);        // PATCH to revoke status

export default router;