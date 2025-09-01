package ejb.local;

import model.Like;
import model.User;
import java.util.List;

public interface LikeServiceLocal {

    /** Toggle the like status for a user and target (like/unlike) */
    String toggleLike(Long userId, Long targetId, String targetType);

    /** Find an existing like for a user and target */
    Like findExistingLike(Long userId, Long targetId, String targetType);

    /** Get all active likes for a target */
    List<Like> getLikesByTargetId(Long targetId);

    /** Get all active likes for a target and type */
    List<Like> getLikesByTargetIdAndType(Long targetId, String targetType);

    /** Get all active likes by a user */
    List<Like> getLikesByUser(User user);

    /** Count active likes for a target and type */
    long countLikesByTargetIdAndType(Long targetId, String targetType);

    /** Create a new like (active by default) */
    Like createLike(Long userId, Long targetId, String targetType);

    /** Get a like by its ID */
    Like getLikeById(Long id);

    /** Get all likes (active and inactive, for admin/audit) */
    List<Like> getAllLikes();

    /** Soft delete a like by entity (set inactive) */
    void deleteLike(Like like);

    /** Soft delete a like by ID (set inactive) */
    void deleteLike(Long id);
}
