package resource;

import model.Post;
import ejb.local.PostServiceLocal;
import jakarta.ejb.EJB;
import jakarta.enterprise.context.RequestScoped;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@RequestScoped
@Path("/posts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PostResource {

    @EJB
    private PostServiceLocal postService;

    @GET
    public Response getAllPosts() {
        System.out.println("PostResource.getAllPosts() called");
        System.out.println("PostService injection status: " + (postService != null ? "SUCCESS" : "FAILED - NULL"));
        
        if (postService == null) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                          .entity("{\"error\":\"PostService injection failed\"}")
                          .build();
        }
        
        try {
            List<Post> posts = postService.getAllPosts();
            System.out.println("Retrieved " + posts.size() + " posts");
            return Response.ok(posts).build();
        } catch (Exception e) {
            System.err.println("Error in getAllPosts: " + e.getMessage());
            e.printStackTrace();
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                          .entity("{\"error\":\"" + e.getMessage() + "\"}")
                          .build();
        }
    }

    @POST
    public Response createPost(Post post) {
        postService.createPost(post);
        return Response.status(Response.Status.CREATED).build();
    }

    @GET
    @Path("/{id}")
    public Response getPost(@PathParam("id") String id) {
        Post post = postService.getPostById(id);
        if (post == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(post).build();
    }
}
