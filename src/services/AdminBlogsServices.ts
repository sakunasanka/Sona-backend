import Post from "../models/Post";
import User from '../models/User';

export const getAllPosts = async () => {
  return await Post.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'], // Select only necessary fields
      },
    ],
  });
};

// Function to update the status of a specific post
export const updatePostStatus = async (id: string | number, newStatus: string): Promise<Post> => {
  const post = await Post.findByPk(id);

  if (!post) {
    throw new Error("Post not found");
  }

  post.status = newStatus;

  await post.save();
  return post;
};
