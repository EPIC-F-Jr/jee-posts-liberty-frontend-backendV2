package ejb;

import model.Comment;
import model.User;
import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import ejb.local.CommentServiceLocal;

import java.util.List;
import java.time.LocalDateTime;

@Stateless
public class CommentService implements CommentServiceLocal {

    @PersistenceContext(unitName = "MyPU")
    private EntityManager em;

    // Get all active comments
    public List<Comment> getAllComments() {
        TypedQuery<Comment> query = em.createQuery(
                "SELECT c FROM Comment c WHERE c.isActive = true ORDER BY c.createdAt DESC", Comment.class);
        return query.getResultList();
    }

    // Get all active comments for a post
    public List<Comment> getCommentsByPostId(Long postId) {
        TypedQuery<Comment> query = em.createQuery(
                "SELECT c FROM Comment c WHERE c.postId = :postId AND c.isActive = true ORDER BY c.createdAt DESC",
                Comment.class);
        query.setParameter("postId", postId);
        return query.getResultList();
    }

    // Get all active comments by a user
    public List<Comment> getCommentsByUser(User user) {
        TypedQuery<Comment> query = em.createQuery(
                "SELECT c FROM Comment c WHERE c.user = :user AND c.isActive = true ORDER BY c.createdAt DESC",
                Comment.class);
        query.setParameter("user", user);
        return query.getResultList();
    }

    // Create a new comment (set timestamps and active)
    public Comment createComment(Comment comment, Long userId) {
        // Lookup the user entity
        User user = em.find(User.class, userId);
        comment.setUser(user);

        // Set timestamps and active flag
        comment.setActive(true);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());

        // Persist
        em.persist(comment);

        return comment;
    }

    // Get a comment by its ID (active only)
    public Comment getCommentById(Long id) {
        Comment comment = em.find(Comment.class, id);
        return (comment != null && comment.isActive()) ? comment : null;
    }

    // Update a comment (update timestamp)
    public void updateComment(Comment comment) {
        // Validate content
        if (comment.getContent() == null || comment.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Comment content cannot be empty");
        }

        // Validate content length (assuming max 500 characters)
        if (comment.getContent().length() > 500) {
            throw new IllegalArgumentException("Comment content cannot exceed 500 characters");
        }

        comment.setUpdatedAt(LocalDateTime.now());
        em.merge(comment);
    }

    // Soft delete a comment (set inactive and update timestamp)
    public void deleteComment(Long id) {
        Comment comment = em.find(Comment.class, id);
        if (comment != null && comment.isActive()) {
            comment.setActive(false);
            comment.setUpdatedAt(LocalDateTime.now());
            em.merge(comment);
        }
    }

    // Get all comments (active and inactive, for admin/audit)
    public List<Comment> getAllCommentsAdmin() {
        TypedQuery<Comment> query = em.createQuery("SELECT c FROM Comment c ORDER BY c.createdAt DESC", Comment.class);
        return query.getResultList();
    }
}
