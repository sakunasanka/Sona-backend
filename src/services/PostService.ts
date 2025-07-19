import Post from '../models/Post';
import User from '../models/User';
import Like from '../models/Like';
import { Op } from 'sequelize';

export interface PostData {
  id: string;
  author: {
    name: string;
    avatar: string;
    role?: string;
  };
  timeAgo: string;
  content: string;
  hashtags: string[];
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
  backgroundColor: string;
  liked: boolean;
}

export interface PostFilters {
  sort?: 'recent' | 'popular';
  page?: number;
  limit?: number;
}

export interface CreatePostData {
  userId: number;
  content: string;
  hashtags?: string[];
  backgroundColor?: string;
}

export interface UpdatePostData {
  content?: string;
  hashtags?: string[];
  backgroundColor?: string;
}

class PostService {
  /**
   * Get all posts with pagination and sorting
   */
  async getPosts(filters: PostFilters = {}): Promise<{
    posts: PostData[];
    totalPosts: number;
    currentPage: number;
    totalPages: number;
  }> {
    const { sort = 'recent', page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

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
        role: post.user?.role || 'User',
      },
      timeAgo: this.getTimeAgo(post.createdAt),
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

    return {
      posts: postsWithUserData,
      totalPosts: posts.count,
      currentPage: Number(page),
      totalPages: Math.ceil(posts.count / Number(limit)),
    };
  }

  /**
   * Get posts with user's like status
   */
  async getPostsWithLikes(userId: number | undefined, filters: PostFilters = {}): Promise<{
    posts: PostData[];
    totalPosts: number;
    currentPage: number;
    totalPages: number;
  }> {
    const { sort = 'recent', page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

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
        role: post.user?.role || 'User',
      },
      timeAgo: this.getTimeAgo(post.createdAt),
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

    return {
      posts: postsWithUserData,
      totalPosts: posts.count,
      currentPage: Number(page),
      totalPages: Math.ceil(posts.count / Number(limit)),
    };
  }

  /**
   * Create a new post
   */
  async createPost(data: CreatePostData): Promise<PostData> {
    const { userId, content, hashtags = [], backgroundColor = '#FFFFFF' } = data;

    const post = await Post.create({
      userId,
      content: content.trim(),
      hashtags,
      backgroundColor,
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
      throw new Error('Post not found after creation');
    }

    return {
      id: postWithUser.id,
      author: {
        name: postWithUser.user?.name || 'Unknown User',
        avatar:
          postWithUser.user?.avatar ||
          'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        role: postWithUser.user?.role || 'User',
      },
      timeAgo: this.getTimeAgo(postWithUser.createdAt),
      content: postWithUser.content,
      hashtags: postWithUser.hashtags,
      stats: {
        views: postWithUser.views,
        likes: postWithUser.likes,
        comments: postWithUser.comments,
      },
      backgroundColor: postWithUser.backgroundColor,
      liked: false,
    };
  }

  /**
   * Update an existing post
   */
  async updatePost(postId: string, data: UpdatePostData): Promise<PostData> {
    // Find the post
    const post = await Post.findByPk(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Update the post
    await post.update({
      content: data.content?.trim() || post.content,
      hashtags: data.hashtags || post.hashtags,
      backgroundColor: data.backgroundColor || post.backgroundColor,
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
      throw new Error('Post not found after update');
    }

    return {
      id: updatedPost.id,
      author: {
        name: updatedPost.user?.name || 'Unknown User',
        avatar: updatedPost.user?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        role: updatedPost.user?.role || 'User',
      },
      timeAgo: this.getTimeAgo(updatedPost.createdAt),
      content: updatedPost.content,
      hashtags: updatedPost.hashtags,
      stats: {
        views: updatedPost.views,
        likes: updatedPost.likes,
        comments: updatedPost.comments,
      },
      backgroundColor: updatedPost.backgroundColor,
      liked: false,
    };
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<void> {
    // Find the post
    const post = await Post.findByPk(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Delete associated likes first
    await Like.destroy({
      where: { postId },
    });

    // Then delete the post
    await post.destroy();
  }

  /**
   * Toggle like/unlike a post
   */
  async toggleLikePost(postId: string, userId: number): Promise<{ liked: boolean; likes: number }> {
    const post = await Post.findByPk(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const existingLike = await Like.findOne({
      where: { userId, postId },
    });

    if (existingLike) {
      // Unlike the post
      await existingLike.destroy();
      await post.decrement('likes');
      
      return {
        liked: false,
        likes: post.likes - 1,
      };
    } else {
      // Like the post
      await Like.create({ userId, postId });
      await post.increment('likes');
      
      return {
        liked: true,
        likes: post.likes + 1,
      };
    }
  }

  /**
   * Increment post views
   */
  async incrementViews(postId: string): Promise<{ views: number }> {
    const post = await Post.findByPk(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    await post.increment('views');

    return {
      views: post.views + 1,
    };
  }

  /**
   * Helper function to calculate time ago
   */
  private getTimeAgo(date: Date): string {
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
}

export default new PostService();
