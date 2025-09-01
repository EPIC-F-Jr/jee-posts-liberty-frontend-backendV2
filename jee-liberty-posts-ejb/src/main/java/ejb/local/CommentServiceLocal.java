package ejb.local;

import model.Comment;
import model.User;
import java.util.List;

public interface CommentServiceLocal {

    /** Get all active comments */
    List<Comment> getAllComments();

    /** Get all active comments for a post */
    List<Comment> getCommentsByPostId(Long postId);

    /** Get all active comments by a user */
    List<Comment> getCommentsByUser(User user);

    /** Create a new comment (set timestamps and active) */
    Comment createComment(Comment comment, Long userId);

    /** Get a comment by its ID (active only) */
    Comment getCommentById(Long id);

    /** Update a comment (update timestamp) */
    void updateComment(Comment comment);

    /** Soft delete a comment (set inactive and update timestamp) */
    void deleteComment(Long id);

    /** Get all comments (active and inactive, for admin/audit) */
    List<Comment> getAllCommentsAdmin();
}
