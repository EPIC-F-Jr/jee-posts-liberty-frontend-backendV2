package dto;

import java.util.List;

import model.Comment;
import model.Like;
import model.Post;

public class PostDTO {
    private Post post;
    private List<Like> likes;
    private List<Comment> comments;

    public List<Like> getLikes() {
        return likes;
    }

    public void setLikes(List<Like> likes) {
        this.likes = likes;
    }

    public List<Comment> getComments() {
        return comments;
    }

    public void setComments(List<Comment> comments) {
        this.comments = comments;
    }

    public Post getPost() {
        return post;

    }

    public PostDTO(Post post, List<Like> likes, List<Comment> comments) {
        this.post = post;
        this.likes = likes;
        this.comments = comments;
    }
}