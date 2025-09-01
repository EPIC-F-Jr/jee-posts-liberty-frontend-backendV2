package dto;

import java.time.LocalDateTime;

public class LikeDTO {
    private Long id;
    private UserDTO user;
    private Long targetId;
    private String targetType;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
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

    public LikeDTO() {
    }

    public LikeDTO(Long id, UserDTO user, Long targetId, String targetType,
            boolean active, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.user = user;
        this.targetId = targetId;
        this.targetType = targetType;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Factory method from entity
    public static LikeDTO fromEntity(model.Like like) {
        return new LikeDTO(
                like.getId(),
                UserDTO.fromEntity(like.getUser()), // embed full UserDTO
                like.getTargetId(),
                like.getTargetType(),
                like.isActive(),
                like.getCreatedAt(),
                like.getUpdatedAt());
    }
}
