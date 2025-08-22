package ejb.local;

import model.User;
import java.util.List;

public interface UserServiceLocal {

    List<User> getAllUsers();

    void createUser(User user);

    User getUserById(String id);

    User getUserByUsername(String username);

    void updateUser(User user);

    void deleteUser(String id);
}
