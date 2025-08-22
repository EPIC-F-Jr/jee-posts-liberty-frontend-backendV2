package ejb.local;

import model.Comment;
import model.User;
import java.util.List;

public interface CommentServiceLocal {

    List<Comment> getAllComments();

    List<Comment> getCommentsByPostId(String postId);

    List<Comment> getCommentsByUser(User user);

    void createComment(Comment comment);

    Comment getCommentById(String id);

    void updateComment(Comment comment);

    void deleteComment(String id);
}
