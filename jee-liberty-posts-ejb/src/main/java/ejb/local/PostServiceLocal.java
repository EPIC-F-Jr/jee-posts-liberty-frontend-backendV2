package ejb.local;

import model.Post;
import model.Like;
import model.Comment;

import java.util.List;

public interface PostServiceLocal {

    /** Get all active posts */
    List<Post> getAllPosts();

    /** Create a new post (set timestamps and active) */
    void createPost(Post post);

    /** Get a post by its ID (active only) */
    Post getPostById(Long id);

    /** Update a post (update timestamp) */
    void updatePost(Post post);

    /** Soft delete a post (set inactive and update timestamp) */
    void deletePost(Long id);

    /** Get all posts (active and inactive, for admin/audit) */
    List<Post> getAllPostsAdmin();

    /** Get all likes for a post */
    List<Like> getLikesByPost(Long postId);

    /** Get all comments for a post */
    List<Comment> getCommentsByPost(Long postId);
}
