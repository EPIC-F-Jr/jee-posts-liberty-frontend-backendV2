package ejb;

import model.Comment;
import model.Like;
import model.Post;
import model.User;

import jakarta.ejb.Stateless;
import jakarta.ejb.Local;
import jakarta.ejb.EJB;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import ejb.local.PostServiceLocal;
import ejb.local.LikeServiceLocal;
import ejb.local.CommentServiceLocal;

import java.time.LocalDateTime;
import java.util.List;

/**
 * PostService EJB
 * 
 * Provides business logic for Post entities.
 * Handles CRUD operations and integrates with LikeService and CommentService.
 */
@Stateless
@Local(PostServiceLocal.class)
public class PostService implements PostServiceLocal {

    @PersistenceContext(unitName = "MyPU")
    private EntityManager em;

    @EJB
    private LikeServiceLocal likeService;

    @EJB
    private CommentServiceLocal commentService;

    /**
     * Retrieve all active posts (for normal users).
     * 
     * @return list of active posts, ordered by creation time (newest first)
     */
    public List<Post> getAllPosts() {
        return em.createQuery(
                "SELECT p FROM Post p WHERE p.isActive = true ORDER BY p.createdAt DESC",
                Post.class).getResultList();
    }

    /**
     * Create a new post.
     * Automatically sets timestamps, marks post as active,
     * and attaches a test user for now.
     * 
     * @param post new Post entity
     */
    public void createPost(Post post) {
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        post.setActive(true);

        // TODO: replace with real authenticated user once available
        User testUser = em.find(User.class, 1L);
        post.setUser(testUser);

        em.persist(post);
    }

    /**
     * Retrieve a single active post by ID.
     * 
     * @param id post ID
     * @return Post if found and active, otherwise null
     */
    public Post getPostById(Long id) {
        Post post = em.find(Post.class, id);
        return (post != null && post.isActive()) ? post : null;
    }

    /**
     * Update an existing post.
     * Automatically refreshes the updatedAt timestamp.
     * Validates that content is not empty or null.
     * 
     * @param post post entity to update
     */
    public void updatePost(Post post) {
        // Validate content
        if (post.getContent() == null || post.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Post content cannot be empty");
        }

        // Validate content length (assuming max 1000 characters)
        if (post.getContent().length() > 1000) {
            throw new IllegalArgumentException("Post content cannot exceed 1000 characters");
        }

        post.setUpdatedAt(LocalDateTime.now());
        em.merge(post);
    }

    /**
     * Soft-delete a post.
     * Instead of removing from DB, mark as inactive.
     * 
     * @param id ID of post to delete
     */
    public void deletePost(Long id) {
        Post post = em.find(Post.class, id);
        if (post != null && post.isActive()) {
            post.setActive(false);
            post.setUpdatedAt(LocalDateTime.now());
            em.merge(post);
        }
    }

    /**
     * Retrieve all posts (active + inactive).
     * For admin/audit purposes.
     * 
     * @return list of all posts
     */
    public List<Post> getAllPostsAdmin() {
        return em.createQuery(
                "SELECT p FROM Post p ORDER BY p.createdAt DESC",
                Post.class).getResultList();
    }

    /**
     * Get all likes for a given post.
     * 
     * @param postId target post ID
     * @return list of likes for the post
     */
    @Override
    public List<Like> getLikesByPost(Long postId) {
        return likeService.getLikesByTargetIdAndType(postId, "post");
    }

    /**
     * Get all comments for a given post.
     * 
     * @param postId target post ID
     * @return list of comments for the post
     */
    @Override
    public List<Comment> getCommentsByPost(Long postId) {
        return commentService.getCommentsByPostId(postId);
    }
}
