package ejb;
import model.User;
import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import ejb.local.UserServiceLocal;
import jakarta.persistence.NoResultException;
import java.util.List;

@Stateless
public class UserService implements UserServiceLocal {

    @PersistenceContext(unitName = "MyPU")
    private EntityManager em;

    public List<User> getAllUsers() {
        TypedQuery<User> query = em.createQuery("SELECT u FROM User u ORDER BY u.username", User.class);
        return query.getResultList();
    }

    public void createUser(User user) {
        em.persist(user);
    }

    public User getUserById(String id) {
        return em.find(User.class, id);
    }
    
    public User getUserByUsername(String username) {
        try {
            TypedQuery<User> query = em.createQuery("SELECT u FROM User u WHERE u.username = :username", User.class);
            query.setParameter("username", username);
            return query.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }
    
    public void updateUser(User user) {
        em.merge(user);
    }
    
    public void deleteUser(String id) {
        User user = em.find(User.class, id);
        if (user != null) {
            em.remove(user);
        }
    }
}
