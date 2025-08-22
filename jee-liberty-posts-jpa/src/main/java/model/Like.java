package model;

import jakarta.persistence.*;

@Entity
@Table(name = "likes")
public class Like {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "target_id", nullable = false)
    private String targetId;
    
    @Column(name = "target_type", nullable = false)
    private String targetType;
    
    // Default constructor
    public Like() {
    }
    
    // Constructor with all fields
    public Like(Long id, User user, String targetId, String targetType) {
        this.id = id;
        this.user = user;
        this.targetId = targetId;
        this.targetType = targetType;
    }
    
    // Constructor without ID for creation (ID will be auto-generated)
    public Like(User user, String targetId, String targetType) {
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
    
    public String getTargetId() {
        return targetId;
    }
    
    public void setTargetId(String targetId) {
        this.targetId = targetId;
    }
    
    public String getTargetType() {
        return targetType;
    }
    
    public void setTargetType(String targetType) {
        this.targetType = targetType;
    }
}
