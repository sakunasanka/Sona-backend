import Post from "../models/Post";
import User from '../models/User';

export const getAllPosts = async () => {
  return await Post.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'avatar', 'role'],
      },
      {
        model: User,
        as: 'actionUser',
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
};

// Function to update the status of a specific post
export const updatePostStatus = async (
  id: string, 
  newStatus: string, 
  actionBy: number, 
  rejectedReason?: string
): Promise<Post> => {
  const post = await Post.findByPk(id);

  if (!post) {
    throw new Error("Post not found");
  }

  post.status = newStatus;
  post.actionBy = actionBy;
  post.actionAt = new Date();
  
  if (newStatus === 'rejected' && rejectedReason) {
    post.rejectedReason = rejectedReason;
  } else if (newStatus !== 'rejected') {
    // Use undefined instead of null for TypeScript compatibility
    post.rejectedReason = undefined;
  }

  await post.save();
  return post;
};

// Function to revoke approval/rejection (reset to pending)
export const revokePostStatus = async (id: string): Promise<Post> => {
  const post = await Post.findByPk(id);

  if (!post) {
    throw new Error("Post not found");
  }

  post.status = 'pending';
  // Use undefined instead of null for TypeScript compatibility
  post.actionBy = undefined;
  post.actionAt = undefined;
  post.rejectedReason = undefined;

  await post.save();
  return post;
};