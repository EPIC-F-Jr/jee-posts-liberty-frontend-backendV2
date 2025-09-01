package ejb;

import model.Like;
import model.User;
import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import ejb.local.LikeServiceLocal;

import java.time.LocalDateTime;
import java.util.List;

@Stateless
public class LikeService implements LikeServiceLocal {

    @PersistenceContext(unitName = "MyPU")
    private EntityManager em;

    // -------------------------------
    // TOGGLE / CREATE
    // -------------------------------

    /**
     * Toggles a like for a user on a target.
     * - Creates a like if none exists.
     * - Unlikes if already active.
     * 
     * @return "liked" or "unliked"
     */
    @Override
    public String toggleLike(Long userId, Long targetId, String targetType) {
        User user = em.find(User.class, userId);
        if (user == null)
            throw new IllegalArgumentException("User not found");

        Like like = findExistingLike(userId, targetId, targetType);

        if (like != null) {
            like.setActive(!like.isActive());
            like.setUpdatedAt(LocalDateTime.now());
            em.merge(like);
            return like.isActive() ? "liked" : "unliked";
        } else {
            Like newLike = new Like();
            newLike.setUser(user);
            newLike.setTargetId(targetId);
            newLike.setTargetType(targetType);
            newLike.setActive(true);
            newLike.setCreatedAt(LocalDateTime.now());
            newLike.setUpdatedAt(LocalDateTime.now());
            em.persist(newLike);
            return "liked";
        }
    }

    /**
     * Finds an existing like by userId, targetId, and targetType.
     * Returns null if none found.
     */
    @Override
    public Like findExistingLike(Long userId, Long targetId, String targetType) {
        try {
            User user = em.find(User.class, userId);
            if (user == null)
                return null;

            return em.createQuery(
                    "SELECT l FROM Like l WHERE l.user = :user AND l.targetId = :targetId AND l.targetType = :targetType",
                    Like.class)
                    .setParameter("user", user)
                    .setParameter("targetId", targetId)
                    .setParameter("targetType", targetType)
                    .getSingleResult();
        } catch (Exception e) {
            return null;
        }
    }

    // -------------------------------
    // READ METHODS
    // -------------------------------

    @Override
    public List<Like> getLikesByTargetId(Long targetId) {
        return em.createQuery(
                "SELECT l FROM Like l WHERE l.targetId = :targetId AND l.isActive = true ORDER BY l.id",
                Like.class)
                .setParameter("targetId", targetId)
                .getResultList();
    }

    @Override
    public List<Like> getLikesByTargetIdAndType(Long targetId, String targetType) {
        return em.createQuery(
                "SELECT l FROM Like l WHERE l.targetId = :targetId AND l.targetType = :targetType AND l.isActive = true ORDER BY l.id",
                Like.class)
                .setParameter("targetId", targetId)
                .setParameter("targetType", targetType)
                .getResultList();
    }

    @Override
    public long countLikesByTargetIdAndType(Long targetId, String targetType) {
        return em.createQuery(
                "SELECT COUNT(l) FROM Like l WHERE l.targetId = :targetId AND l.targetType = :targetType AND l.isActive = true",
                Long.class)
                .setParameter("targetId", targetId)
                .setParameter("targetType", targetType)
                .getSingleResult();
    }

    @Override
    public Like getLikeById(Long id) {
        return em.find(Like.class, id);
    }

    @Override
    public List<Like> getAllLikes() {
        return em.createQuery("SELECT l FROM Like l ORDER BY l.id", Like.class).getResultList();
    }

    // -------------------------------
    // CREATE
    // -------------------------------

    @Override
    public Like createLike(Long userId, Long targetId, String targetType) {
        User user = em.find(User.class, userId);
        if (user == null)
            throw new IllegalArgumentException("User not found");

        Like like = new Like();
        like.setUser(user);
        like.setTargetId(targetId);
        like.setTargetType(targetType);
        like.setActive(true);
        like.setCreatedAt(LocalDateTime.now());
        like.setUpdatedAt(LocalDateTime.now());

        em.persist(like);
        return like;
    }

    // -------------------------------
    // DELETE / SOFT DELETE
    // -------------------------------

    @Override
    public void deleteLike(Long id) {
        Like like = em.find(Like.class, id);
        if (like != null) {
            like.setActive(false);
            like.setUpdatedAt(LocalDateTime.now());
            em.merge(like);
        }
    }

    @Override
    public List<Like> getLikesByUser(User user) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getLikesByUser'");
    }

    @Override
    public void deleteLike(Like like) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'deleteLike'");
    }
}
