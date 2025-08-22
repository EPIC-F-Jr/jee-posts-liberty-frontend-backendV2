package ejb;
import model.Post;
import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import ejb.local.PostServiceLocal;
import jakarta.ejb.Local;

import java.util.List;

@Stateless
@Local(PostServiceLocal.class)
public class PostService implements PostServiceLocal {

    @PersistenceContext(unitName = "MyPU")
    private EntityManager em;

    public List<Post> getAllPosts() {
        System.out.println("EntityManager injection status: " + (em != null ? "READY" : "NULL"));
        TypedQuery<Post> query = em.createQuery("SELECT p FROM Post p ORDER BY p.createdAt DESC", Post.class);
        return query.getResultList();
    }

    public void createPost(Post post) {
        em.persist(post);
    }

    public Post getPostById(String id) {
        return em.find(Post.class, id);
    }
    
    public void updatePost(Post post) {
        em.merge(post);
    }
    
    public void deletePost(String id) {
        Post post = em.find(Post.class, id);
        if (post != null) {
            em.remove(post);
        }
    }
}
