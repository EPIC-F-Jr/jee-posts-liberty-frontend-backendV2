package ejb;

import model.Post;
import model.User;
import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import ejb.local.UserServiceLocal;
import jakarta.persistence.NoResultException;
import java.util.List;
import java.time.LocalDateTime;

@Stateless
public class UserService implements UserServiceLocal {

    @PersistenceContext(unitName = "MyPU")
    private EntityManager em;

    // Get all active users
    public List<User> getAllUsers() {
        TypedQuery<User> query = em.createQuery("SELECT u FROM User u WHERE u.isActive = true ORDER BY u.username",
                User.class);
        return query.getResultList();
    }

    // Create a new user (set timestamps and active)
    public void createPost(Post post) {
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        post.setActive(true);

        // If frontend didn’t supply a user, fall back to test user with ID=1
        if (post.getUser() == null || post.getUser().getId() == null) {
            User userRef = em.getReference(User.class, 1L); // PK is Long
            post.setUser(userRef);
        }

        em.persist(post);
    }

    // Get a user by its ID (active only)
    public User getUserById(Long id) {
        User user = em.find(User.class, id);
        return (user != null && user.isActive()) ? user : null;
    }

    // Get a user by username (active only)
    public User getUserByUsername(String username) {
        try {
            TypedQuery<User> query = em
                    .createQuery("SELECT u FROM User u WHERE u.username = :username AND u.isActive = true", User.class);
            query.setParameter("username", username);
            return query.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    // Update a user (update timestamp)
    public void updateUser(User user) {
        user.setUpdatedAt(LocalDateTime.now());
        em.merge(user);
    }

    // Soft delete a user (set inactive and update timestamp)
    public void deleteUser(Long id) {
        User user = em.find(User.class, id);
        if (user != null && user.isActive()) {
            user.setActive(false);
            user.setUpdatedAt(LocalDateTime.now());
            em.merge(user);
        }
    }

    // Get all users (active and inactive, for admin/audit)
    public List<User> getAllUsersAdmin() {
        TypedQuery<User> query = em.createQuery("SELECT u FROM User u ORDER BY u.username", User.class);
        return query.getResultList();
    }

    @Override
    public void createUser(User user) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'createUser'");
    }
}
