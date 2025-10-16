import { Request, Response } from 'express';
import postService from '../services/PostService';

// Get all posts with pagination and sorting
export const getPosts = async (req: Request, res: Response) => {
  try {
    const { sort = 'recent', limit, page } = req.query as any;

    // If client requests unlimited (no limit param), return all posts without pagination
    if (limit === undefined && page === undefined) {
      const posts = await postService.getAllPosts(sort as 'recent' | 'popular');
      return res.json({ success: true, data: { posts } });
    }

    // Otherwise, keep backward-compatible paginated behavior
    const result = await postService.getPosts({
      sort: sort as 'recent' | 'popular',
      page: Number(page ?? 1),
      limit: Number(limit ?? 10),
    });

    res.json({
      success: true,
      data: {
        posts: result.posts,
        totalPosts: result.totalPosts,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
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
    const userId = req.user?.dbUser.id; // Assuming you have auth middleware that sets req.user
    const { sort = 'recent', page = 1, limit = 10 } = req.query;
    
    const result = await postService.getPostsWithLikes(userId, {
      sort: sort as 'recent' | 'popular',
      page: Number(page),
      limit: Number(limit)
    });

    res.json({
      success: true,
      data: {
        posts: result.posts,
        totalPosts: result.totalPosts,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
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

// Get user's own posts (requires authentication)
export const getMyPosts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.dbUser.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { sort = 'recent', page = 1, limit = 10 } = req.query;
    
    const result = await postService.getMyPosts(userId, {
      sort: sort as 'recent' | 'popular',
      page: Number(page),
      limit: Number(limit)
    });

    res.json({
      success: true,
      data: {
        posts: result.posts,
        totalPosts: result.totalPosts,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user posts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Create a new post
export const createPost = async (req: Request, res: Response) => {
  try {
    const { content, hashtags, backgroundColor, image, isAnonymous } = req.body;
    const userId = req.user?.dbUser.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const post = await postService.createPost({
      userId,
      content,
      hashtags,
      backgroundColor,
      image,
      isAnonymous
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
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
    const { content, hashtags, backgroundColor, image, isAnonymous } = req.body;
    const userId = req.user?.dbUser.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const updatedPost = await postService.updatePost(postId, {
      content,
      hashtags,
      backgroundColor,
      image,
      isAnonymous
    }, userId);

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost
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
    const userId = req.user?.dbUser.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    await postService.deletePost(postId, userId);

    res.json({
      success: true,
      message: 'Post deleted successfully',
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
    const userId = req.user?.dbUser.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const result = await postService.toggleLikePost(postId, userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling like',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Like a post (idempotent)
export const likePost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.dbUser.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const result = await postService.likePost(postId, userId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ success: false, message: 'Error liking post', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Dislike (unlike) a post (idempotent)
export const dislikePost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.dbUser.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const result = await postService.dislikePost(postId, userId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error disliking post:', error);
    res.status(500).json({ success: false, message: 'Error disliking post', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Increment post views
export const incrementViews = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const result = await postService.incrementViews(postId);

    res.json({
      success: true,
      data: result
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

// Get like status for a post for the authenticated user
export const getLikeStatus = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.dbUser.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const result = await postService.getLikeStatus(postId, userId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting like status:', error);
    res.status(500).json({ success: false, message: 'Error getting like status', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};