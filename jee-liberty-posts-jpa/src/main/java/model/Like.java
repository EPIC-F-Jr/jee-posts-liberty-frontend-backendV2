
// Like entity represents a user's like on a post, comment, or other target.
package model;

import java.time.LocalDateTime;

import jakarta.persistence.*;

/**
 * Like entity represents a user's like on a post, comment, or other target.
 */
@Entity
@Table(name = "likes")
public class Like {

    /** Primary key (auto-generated) */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The user who performed the like */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** The ID of the target (post, comment, etc.) */
    @Column(name = "target_id", nullable = false)
    private Long targetId;

    /** The type of the target (e.g., "post", "comment") */
    @Column(name = "target_type", nullable = false)
    private String targetType;

    /** Whether the like is active (not deleted/soft deleted) */
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    /** Timestamp when the like was created */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Timestamp when the like was last updated */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Default constructor
    public Like() {
    }

    // Constructor with all fields
    public Like(Long id, User user, Long targetId, String targetType, boolean isActive, LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this.id = id;
        this.user = user;
        this.targetId = targetId;
        this.targetType = targetType;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Constructor without ID for creation (ID will be auto-generated)
    public Like(User user, Long targetId, String targetType) {
        this.user = user;
        this.targetId = targetId;
        this.targetType = targetType;
    }

    // Constructor for backward compatibility (deprecated - to be removed)
    @Deprecated
    public Like(User user) {
        this.user = user;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Long getTargetId() {
        return targetId;
    }

    public void setTargetId(Long targetId) {
        this.targetId = targetId;
    }

    public String getTargetType() {
        return targetType;
    }

    public void setTargetType(String targetType) {
        this.targetType = targetType;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean isActive) {
        this.isActive = isActive;
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
}
