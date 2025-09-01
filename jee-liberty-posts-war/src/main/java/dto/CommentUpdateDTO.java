package dto;

/**
 * DTO for updating comment content.
 * Simplified DTO that only contains fields that can be updated.
 */
public class CommentUpdateDTO {
    private String content;

    public CommentUpdateDTO() {
    }

    public CommentUpdateDTO(String content) {
        this.content = content;
    }

    // Getters and setters
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
