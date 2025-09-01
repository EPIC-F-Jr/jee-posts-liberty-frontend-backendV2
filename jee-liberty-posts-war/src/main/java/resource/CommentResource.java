package resource;

import model.Comment;
import ejb.local.CommentServiceLocal;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ejb.EJB;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

import dto.CommentDTO;
import dto.CommentUpdateDTO;

@ApplicationScoped
@Path("/comments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CommentResource {

    @EJB
    private CommentServiceLocal commentService;

    @GET
    public Response getAllComments() {
        List<Comment> comments = commentService.getAllComments();
        return Response.ok(comments).build();
    }

    @GET
    @Path("/post/{postId}")
    public Response getCommentsByPostId(@PathParam("postId") Long postId) {
        List<Comment> comments = commentService.getCommentsByPostId(postId);
        return Response.ok(comments).build();
    }

    @POST
    public Response createComment(CommentDTO commentDTO) {
        // Map DTO to entity
        Comment comment = new Comment();
        comment.setContent(commentDTO.getContent());
        comment.setPostId(commentDTO.getPostId());

        // Pass the entity to the service layer
        Comment savedComment = commentService.createComment(comment, commentDTO.getUserId());

        return Response.status(Response.Status.CREATED)
                .entity(savedComment)
                .build();
    }

    @GET
    @Path("/{id}")
    public Response getComment(@PathParam("id") Long id) {
        Comment comment = commentService.getCommentById(id);
        if (comment == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(comment).build();
    }

    @PUT
    @Path("/{id}")
    public Response updateComment(@PathParam("id") Long id, CommentUpdateDTO updateDTO) {
        try {
            Comment existingComment = commentService.getCommentById(id);
            if (existingComment == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("{\"error\":\"Comment not found\"}")
                        .build();
            }

            // Validate input
            if (updateDTO.getContent() == null || updateDTO.getContent().trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\":\"Content cannot be empty\"}")
                        .build();
            }

            // Only update allowed fields (content in this case)
            existingComment.setContent(updateDTO.getContent().trim());

            // Update the comment (service will handle timestamp and validation)
            commentService.updateComment(existingComment);

            // Return the updated comment
            return Response.ok(existingComment).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\":\"" + e.getMessage() + "\"}")
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\":\"" + e.getMessage() + "\"}")
                    .build();
        }
    }

    @DELETE
    @Path("/{id}")
    public Response deleteComment(@PathParam("id") Long id) {
        Comment comment = commentService.getCommentById(id);
        if (comment == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        commentService.deleteComment(id);
        return Response.noContent().build();
    }
}
