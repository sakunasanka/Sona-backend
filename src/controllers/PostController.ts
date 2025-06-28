import { Request, Response } from 'express';
import Post from '../models/Post';
import User from '../models/User';
import Like from '../models/Like';
import { Op } from 'sequelize';

// Get all posts with pagination and sorting
export const getPosts = async (req: Request, res: Response) => {
  try {
    const { sort = 'recent', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let orderBy: any = [['createdAt', 'DESC']]; // Default: recent posts

    if (sort === 'popular') {
      orderBy = [['likes', 'DESC'], ['createdAt', 'DESC']];
    }

    const posts = await Post.findAndCountAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar', 'role'],
        },
      ],
      order: orderBy,
      limit: Number(limit),
      offset: offset,
    });

    const postsWithUserData = posts.rows.map((post) => ({
      id: post.id,
      author: {
        name: post.user?.name || 'Unknown User',
        avatar: post.user?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        role: post.user?.role || 'Client',
      },
      timeAgo: getTimeAgo(post.createdAt),
      content: post.content,
      hashtags: post.hashtags,
      stats: {
        views: post.views,
        likes: post.likes,
        comments: post.comments,
      },
      backgroundColor: post.backgroundColor,
      liked: false, // Will be updated based on user authentication
    }));

    res.json({
      success: true,
      data: {
        posts: postsWithUserData,
        totalPosts: posts.count,
        currentPage: Number(page),
        totalPages: Math.ceil(posts.count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get posts with user's like status (requires authentication)
export const getPostsWithLikes = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // Assuming you have auth middleware that sets req.user
    const { sort = 'recent', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let orderBy: any = [['createdAt', 'DESC']];

    if (sort === 'popular') {
      orderBy = [['likes', 'DESC'], ['createdAt', 'DESC']];
    }

    const posts = await Post.findAndCountAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar', 'role'],
        },
      ],
      order: orderBy,
      limit: Number(limit),
      offset: offset,
    });

    // Get user's liked posts if authenticated
    let userLikes: string[] = [];
    if (userId) {
      const likes = await Like.findAll({
        where: { userId },
        attributes: ['postId'],
      });
      userLikes = likes.map((like) => like.postId);
    }

    const postsWithUserData = posts.rows.map((post) => ({
      id: post.id,
      author: {
        name: post.user?.name || 'Unknown User',
        avatar: post.user?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        role: post.user?.role || 'Client',
      },
      timeAgo: getTimeAgo(post.createdAt),
      content: post.content,
      hashtags: post.hashtags,
      stats: {
        views: post.views,
        likes: post.likes,
        comments: post.comments,
      },
      backgroundColor: post.backgroundColor,
      liked: userLikes.includes(post.id),
    }));

    res.json({
      success: true,
      data: {
        posts: postsWithUserData,
        totalPosts: posts.count,
        currentPage: Number(page),
        totalPages: Math.ceil(posts.count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching posts with likes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Create a new post
export const createPost = async (req: Request, res: Response) => {
  try {
    const { content, hashtags, backgroundColor } = req.body;

    const post = await Post.create({
      userId: req.user?.id || 1,
      content: content.trim(),
      hashtags: hashtags || [],
      backgroundColor: backgroundColor || '#FFFFFF',
    });

    const postWithUser = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar', 'role'],
        },
      ],
    });

    if (!postWithUser) {
      return res.status(404).json({
        success: false,
        message: 'Post not found after creation',
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: postWithUser.id,
        author: {
          name: postWithUser.user?.name || 'Unknown User',
          avatar:
            postWithUser.user?.avatar ||
            'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
          role: postWithUser.user?.role || 'Client',
        },
        timeAgo: getTimeAgo(postWithUser.createdAt),
        content: postWithUser.content,
        hashtags: postWithUser.hashtags,
        stats: {
          views: postWithUser.views,
          likes: postWithUser.likes,
          comments: postWithUser.comments,
        },
        backgroundColor: postWithUser.backgroundColor,
        liked: false,
      },
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update a post
export const updatePost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { content, hashtags, backgroundColor, image } = req.body;
    // const userId = req.user?.id;

    // if (!userId) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Authentication required',
    //   });
    // }

    // Find the post
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // // Verify the user owns the post
    // if (post.userId !== userId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You can only update your own posts',
    //   });
    // }

    // Update the post
    await post.update({
      content: content?.trim() || post.content,
      hashtags: hashtags || post.hashtags,
      backgroundColor: backgroundColor || post.backgroundColor,
      // image: image || post.image,
    });

    // Fetch the updated post with user data
    const updatedPost = await Post.findByPk(postId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar', 'role'],
        },
      ],
    });

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found after update',
      });
    }

    res.json({
      success: true,
      data: {
        id: updatedPost.id,
        author: {
          name: updatedPost.user?.name || 'Unknown User',
          avatar: updatedPost.user?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
          role: updatedPost.user?.role || 'Client',
        },
        timeAgo: getTimeAgo(updatedPost.createdAt),
        content: updatedPost.content,
        hashtags: updatedPost.hashtags,
        stats: {
          views: updatedPost.views,
          likes: updatedPost.likes,
          comments: updatedPost.comments,
        },
        backgroundColor: updatedPost.backgroundColor,
        liked: false, // You might want to check if the current user liked this post
      },
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete a post
export const deletePost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    // const userId = req.user?.id;

    // if (!userId) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Authentication required',
    //   });
    // }

    // Find the post
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // // Verify the user owns the post
    // if (post.userId !== userId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You can only delete your own posts',
    //   });
    // }

    // Delete associated likes first
    await Like.destroy({
      where: { postId },
    });

    // Then delete the post
    await post.destroy();

    res.json({
      success: true,
      data: {
        message: 'Post deleted successfully',
      },
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Like/Unlike a post
export const toggleLikePost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const existingLike = await Like.findOne({
      where: { userId, postId },
    });

    if (existingLike) {
      // Unlike the post
      await existingLike.destroy();
      await post.decrement('likes');
      
      res.json({
        success: true,
        data: {
          liked: false,
          likes: post.likes - 1,
        },
      });
    } else {
      // Like the post
      await Like.create({ userId, postId });
      await post.increment('likes');
      
      res.json({
        success: true,
        data: {
          liked: true,
          likes: post.likes + 1,
        },
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling like',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Increment post views
export const incrementViews = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    await post.increment('views');

    res.json({
      success: true,
      data: {
        views: post.views + 1,
      },
    });
  } catch (error) {
    console.error('Error incrementing views:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating views',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}