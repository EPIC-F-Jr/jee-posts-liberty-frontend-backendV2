package dto;

/**
 * DTO for updating post content.
 * Simplified DTO that only contains fields that can be updated.
 */
public class PostUpdateDTO {
    private String content;

    public PostUpdateDTO() {
    }

    public PostUpdateDTO(String content) {
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
