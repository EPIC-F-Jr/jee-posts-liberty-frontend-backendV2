package dto;

import java.time.LocalDateTime;

public class UserDTO {
    private Long id;
    private String username;

    // Optional: include only if you really need them on the frontend
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String role;

    public UserDTO() {
    }

    public UserDTO(Long id, String username) {
        this.id = id;
        this.username = username;
    }

    public UserDTO(Long id, String username, boolean active, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.username = username;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        // this.role = role;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // public String getRole() {
    // return role;
    // }

    public void setRole(String role) {
        this.role = role;
    }

    // Factory method from entity
    public static UserDTO fromEntity(model.User user) {
        if (user == null)
            return null;
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.isActive(),
                user.getCreatedAt(),
                user.getUpdatedAt());
        // user.getRole());
    }
}
