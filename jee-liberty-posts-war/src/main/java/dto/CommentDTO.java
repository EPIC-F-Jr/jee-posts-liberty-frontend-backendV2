package dto;

public class CommentDTO {
    private Long postId;
    private String content;
    private Long userId;

    public CommentDTO() {
    }

    public CommentDTO(Long postId, String content, Long userId) {
        this.postId = postId;
        this.content = content;
        this.userId = userId;
    }

    // Getters and setters
    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
