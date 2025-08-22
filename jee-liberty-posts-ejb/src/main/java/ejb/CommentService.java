package ejb;
import model.Comment;
import model.User;
import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import ejb.local.CommentServiceLocal;

import java.util.List;

@Stateless
public class CommentService implements CommentServiceLocal {

    @PersistenceContext(unitName = "MyPU")
    private EntityManager em;

    public List<Comment> getAllComments() {
        TypedQuery<Comment> query = em.createQuery("SELECT c FROM Comment c ORDER BY c.id", Comment.class);
        return query.getResultList();
    }
    
    public List<Comment> getCommentsByPostId(String postId) {
        TypedQuery<Comment> query = em.createQuery("SELECT c FROM Comment c WHERE c.postId = :postId ORDER BY c.id", Comment.class);
        query.setParameter("postId", postId);
        return query.getResultList();
    }
    
    public List<Comment> getCommentsByUser(User user) {
        TypedQuery<Comment> query = em.createQuery("SELECT c FROM Comment c WHERE c.user = :user ORDER BY c.id", Comment.class);
        query.setParameter("user", user);
        return query.getResultList();
    }

    public void createComment(Comment comment) {
        em.persist(comment);
    }

    public Comment getCommentById(String id) {
        return em.find(Comment.class, id);
    }
    
    public void updateComment(Comment comment) {
        em.merge(comment);
    }
    
    public void deleteComment(String id) {
        Comment comment = em.find(Comment.class, id);
        if (comment != null) {
            em.remove(comment);
        }
    }
}
