package resource;

import model.Like;
import ejb.local.LikeServiceLocal;
import jakarta.ejb.EJB;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@ApplicationScoped
@Path("/likes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LikeResource {

    @EJB
    private LikeServiceLocal likeService;
    

    @GET
    public Response getAllLikes() {
        List<Like> likes = likeService.getAllLikes();
        return Response.ok(likes).build();
    }
    
    @GET
    @Path("/target/{targetId}")
    public Response getLikesByTargetId(@PathParam("targetId") String targetId) {
        List<Like> likes = likeService.getLikesByTargetId(targetId);
        return Response.ok(likes).build();
    }
    
    @GET
    @Path("/target/{targetId}/type/{targetType}")
    public Response getLikesByTargetIdAndType(@PathParam("targetId") String targetId, 
                                            @PathParam("targetType") String targetType) {
        List<Like> likes = likeService.getLikesByTargetIdAndType(targetId, targetType);
        return Response.ok(likes).build();
    }
    
    @GET
    @Path("/target/{targetId}/type/{targetType}/count")
    public Response getLikesCount(@PathParam("targetId") String targetId, 
                                @PathParam("targetType") String targetType) {
        long count = likeService.countLikesByTargetIdAndType(targetId, targetType);
        return Response.ok("{\"count\":" + count + "}").build();
    }

    @POST
    public Response createLike(Like like) {
        // Check if like already exists
        Like existingLike = likeService.findExistingLike(like.getUser(), like.getTargetId(), like.getTargetType());
        if (existingLike != null) {
            return Response.status(Response.Status.CONFLICT)
                         .entity("{\"message\":\"Like already exists\"}")
                         .build();
        }
        
        likeService.createLike(like);
        return Response.status(Response.Status.CREATED).build();
    }
    
    @POST
    @Path("/toggle")
    public Response toggleLike(Like like) {
        Like existingLike = likeService.findExistingLike(like.getUser(), like.getTargetId(), like.getTargetType());
        
        if (existingLike != null) {
            // Unlike - remove the existing like
            likeService.deleteLike(existingLike);
            return Response.ok("{\"action\":\"unliked\"}").build();
        } else {
            // Like - create new like
            likeService.createLike(like);
            return Response.ok("{\"action\":\"liked\"}").build();
        }
    }

    @GET
    @Path("/{id}")
    public Response getLike(@PathParam("id") Long id) {
        Like like = likeService.getLikeById(id);
        if (like == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(like).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deleteLike(@PathParam("id") Long id) {
        Like like = likeService.getLikeById(id);
        if (like == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        likeService.deleteLike(id);
        return Response.noContent().build();
    }
}
