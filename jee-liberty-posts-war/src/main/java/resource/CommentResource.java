package resource;

import model.Comment;
import ejb.local.CommentServiceLocal;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ejb.EJB;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

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
    public Response getCommentsByPostId(@PathParam("postId") String postId) {
        List<Comment> comments = commentService.getCommentsByPostId(postId);
        return Response.ok(comments).build();
    }

    @POST
    public Response createComment(Comment comment) {
        commentService.createComment(comment);
        return Response.status(Response.Status.CREATED).build();
    }

    @GET
    @Path("/{id}")
    public Response getComment(@PathParam("id") String id) {
        Comment comment = commentService.getCommentById(id);
        if (comment == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(comment).build();
    }

    @PUT
    @Path("/{id}")
    public Response updateComment(@PathParam("id") String id, Comment comment) {
        Comment existingComment = commentService.getCommentById(id);
        if (existingComment == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        comment.setId(id);
        commentService.updateComment(comment);
        return Response.ok().build();
    }

    @DELETE
    @Path("/{id}")
    public Response deleteComment(@PathParam("id") String id) {
        Comment comment = commentService.getCommentById(id);
        if (comment == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        commentService.deleteComment(id);
        return Response.noContent().build();
    }
}
