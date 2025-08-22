package ejb.local;

import model.Like;
import model.User;
import java.util.List;

public interface LikeServiceLocal {

    List<Like> getAllLikes();

    List<Like> getLikesByTargetId(String targetId);

    List<Like> getLikesByTargetIdAndType(String targetId, String targetType);

    List<Like> getLikesByUser(User user);

    Like findExistingLike(User user, String targetId, String targetType);

    long countLikesByTargetIdAndType(String targetId, String targetType);

    void createLike(Like like);

    Like getLikeById(Long id);

    void deleteLike(Long id);

    void deleteLike(Like like);
}
