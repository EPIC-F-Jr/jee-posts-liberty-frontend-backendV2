package resource;

import model.Post;
import ejb.local.PostServiceLocal;
import jakarta.ejb.EJB;
import jakarta.enterprise.context.RequestScoped;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

import dto.PostDTO;
import dto.PostUpdateDTO;

/**
 * REST resource for Post entity.
 * Exposes CRUD operations: Create, Read, Update, Delete.
 */
@RequestScoped
@Path("/posts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PostResource {

    @EJB
    private PostServiceLocal postService;

    /**
     * GET /posts
     * Retrieve all active posts (wrapped as PostDTO with likes + comments).
     */
    @GET
    public Response getAllPosts() {
        try {
            List<Post> posts = postService.getAllPosts();

            // Transform to DTOs with likes & comments
            List<PostDTO> postDTOs = posts.stream()
                    .map(post -> new PostDTO(
                            post,
                            postService.getLikesByPost(post.getId()),
                            postService.getCommentsByPost(post.getId())))
                    .toList();

            return Response.ok(postDTOs).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\":\"" + e.getMessage() + "\"}")
                    .build();
        }
    }

    /**
     * POST /posts
     * Create a new post.
     */
    @POST
    public Response createPost(Post post) {
        try {
            postService.createPost(post);
            return Response.status(Response.Status.CREATED).entity(post).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\":\"" + e.getMessage() + "\"}")
                    .build();
        }
    }

    /**
     * GET /posts/{id}
     * Retrieve a single post by its ID.
     */
    @GET
    @Path("/{id}")
    public Response getPost(@PathParam("id") Long id) {
        Post post = postService.getPostById(id);
        if (post == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\":\"Post not found\"}")
                    .build();
        }
        return Response.ok(post).build();
    }

    /**
     * PUT /posts/{id}
     * Update an existing post.
     * Accepts a PostUpdateDTO and returns the updated PostDTO with likes and
     * comments.
     */
    @PUT
    @Path("/{id}")
    public Response updatePost(@PathParam("id") Long id, PostUpdateDTO updateDTO) {
        try {
            Post existing = postService.getPostById(id);
            if (existing == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("{\"error\":\"Post not found\"}")
                        .build();
            }

            // Validate input
            if (updateDTO.getContent() == null || updateDTO.getContent().trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\":\"Content cannot be empty\"}")
                        .build();
            }

            // Only update allowed fields (content in this case)
            existing.setContent(updateDTO.getContent().trim());

            // Update the post (service will handle timestamp and validation)
            postService.updatePost(existing);

            // Return updated PostDTO with likes and comments
            PostDTO updatedPostDTO = new PostDTO(
                    existing,
                    postService.getLikesByPost(existing.getId()),
                    postService.getCommentsByPost(existing.getId()));

            return Response.ok(updatedPostDTO).build();
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

    /**
     * DELETE /posts/{id}
     * Soft-delete a post (mark inactive).
     */
    @DELETE
    @Path("/{id}")
    public Response deletePost(@PathParam("id") Long id) {
        try {
            Post post = postService.getPostById(id);
            if (post == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("{\"error\":\"Post not found\"}")
                        .build();
            }

            postService.deletePost(id);
            return Response.noContent().build(); // 204
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\":\"" + e.getMessage() + "\"}")
                    .build();
        }
    }
}
