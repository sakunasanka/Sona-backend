import express from 'express';
import { getAllPostsHandler, updatePostStatusHandler } from '../controllers/AdminBlogsController';

const router = express.Router();

router.get('/', getAllPostsHandler);                         // GET all posts
router.patch('/:id/status', updatePostStatusHandler);        // PATCH to update status

export default router;
