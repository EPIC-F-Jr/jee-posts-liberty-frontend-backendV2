package ejb;
import model.Like;
import model.User;
import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import ejb.local.LikeServiceLocal;
import jakarta.persistence.NoResultException;
import java.util.List;

@Stateless
public class LikeService implements LikeServiceLocal {

    @PersistenceContext(unitName = "MyPU")
    private EntityManager em;

    public List<Like> getAllLikes() {
        TypedQuery<Like> query = em.createQuery("SELECT l FROM Like l ORDER BY l.id", Like.class);
        return query.getResultList();
    }
    
    public List<Like> getLikesByTargetId(String targetId) {
        TypedQuery<Like> query = em.createQuery("SELECT l FROM Like l WHERE l.targetId = :targetId ORDER BY l.id", Like.class);
        query.setParameter("targetId", targetId);
        return query.getResultList();
    }
    
    public List<Like> getLikesByTargetIdAndType(String targetId, String targetType) {
        TypedQuery<Like> query = em.createQuery("SELECT l FROM Like l WHERE l.targetId = :targetId AND l.targetType = :targetType ORDER BY l.id", Like.class);
        query.setParameter("targetId", targetId);
        query.setParameter("targetType", targetType);
        return query.getResultList();
    }
    
    public List<Like> getLikesByUser(User user) {
        TypedQuery<Like> query = em.createQuery("SELECT l FROM Like l WHERE l.user = :user ORDER BY l.id", Like.class);
        query.setParameter("user", user);
        return query.getResultList();
    }
    
    public Like findExistingLike(User user, String targetId, String targetType) {
        try {
            TypedQuery<Like> query = em.createQuery("SELECT l FROM Like l WHERE l.user = :user AND l.targetId = :targetId AND l.targetType = :targetType", Like.class);
            query.setParameter("user", user);
            query.setParameter("targetId", targetId);
            query.setParameter("targetType", targetType);
            return query.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }
    
    public long countLikesByTargetIdAndType(String targetId, String targetType) {
        TypedQuery<Long> query = em.createQuery("SELECT COUNT(l) FROM Like l WHERE l.targetId = :targetId AND l.targetType = :targetType", Long.class);
        query.setParameter("targetId", targetId);
        query.setParameter("targetType", targetType);
        return query.getSingleResult();
    }

    public void createLike(Like like) {
        em.persist(like);
    }

    public Like getLikeById(Long id) {
        return em.find(Like.class, id);
    }
    
    public void deleteLike(Long id) {
        Like like = em.find(Like.class, id);
        if (like != null) {
            em.remove(like);
        }
    }
    
    public void deleteLike(Like like) {
        em.remove(like);
    }
}
