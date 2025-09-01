package ejb.local;

import model.User;
import java.util.List;

public interface UserServiceLocal {

    /** Get all active users */
    List<User> getAllUsers();

    /** Create a new user (set timestamps and active) */
    void createUser(User user);

    /** Get a user by its ID (active only) */
    User getUserById(Long id);

    /** Get a user by username (active only) */
    User getUserByUsername(String username);

    /** Update a user (update timestamp) */
    void updateUser(User user);

    /** Soft delete a user (set inactive and update timestamp) */
    void deleteUser(Long id);

    /** Get all users (active and inactive, for admin/audit) */
    List<User> getAllUsersAdmin();
}
