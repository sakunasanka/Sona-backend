import { Request, Response } from 'express';
import { getAllPosts, updatePostStatus, revokePostStatus } from '../services/AdminBlogsServices';

export const getAllPostsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await getAllPosts();
    
    // Filter author data for anonymous posts
    const processedPosts = posts.map(post => {
      const postData = post.toJSON();
      
      if (postData.isAnonymous) {
        // Remove user details for anonymous posts
        postData.user = {
          id: 0,
          name: 'Anonymous',
          email: '',
          avatar: '',
          role: 'Client'
        };
      }
      
      return postData;
    });
    
    res.status(200).json(processedPosts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePostStatusHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  if (status === 'rejected' && !reason) {
    res.status(400).json({ error: 'Rejection reason is required' });
    return;
  }

  try {
    const actionBy = req.user?.dbUser.id;
    if (!actionBy) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const updated = await updatePostStatus(id, status, actionBy, reason);
    res.status(200).json(updated);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};

export const revokePostStatusHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const revoked = await revokePostStatus(id);
    res.status(200).json(revoked);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};