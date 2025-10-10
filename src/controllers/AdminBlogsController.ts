import { Request, Response } from 'express';
import { getAllPosts, updatePostStatus } from '../services/AdminBlogsServices';

export const getAllPostsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await getAllPosts();
    res.status(200).json(posts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePostStatusHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  try {
    const updated = await updatePostStatus(id, status);
    res.status(200).json(updated);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};
