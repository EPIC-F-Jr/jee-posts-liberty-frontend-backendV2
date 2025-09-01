package dto;

import jakarta.validation.constraints.NotNull;

public class LikeInputDTO {

    @NotNull
    private Long userId;

    @NotNull
    private Long targetId;

    @NotNull
    private String targetType;

    // Constructors
    public LikeInputDTO() {
    }

    public LikeInputDTO(Long userId, Long targetId, String targetType) {
        this.userId = userId;
        this.targetId = targetId;
        this.targetType = targetType;
    }

    // Getters and setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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
}
