package ejb.local;

import model.Post;
import java.util.List;

public interface PostServiceLocal {

    List<Post> getAllPosts();

    void createPost(Post post);

    Post getPostById(String id);

    void updatePost(Post post);

    void deletePost(String id);
}
