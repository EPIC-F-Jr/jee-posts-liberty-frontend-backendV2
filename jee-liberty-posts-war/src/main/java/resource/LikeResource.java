package resource;

import model.Like;
import ejb.local.LikeServiceLocal;
import jakarta.ejb.EJB;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

import dto.LikeDTO;
import dto.LikeInputDTO;

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
    public Response getLikesByTargetId(@PathParam("targetId") Long targetId) {
        List<Like> likes = likeService.getLikesByTargetId(targetId);
        return Response.ok(likes).build();
    }

    @GET
    @Path("/target/{targetId}/type/{targetType}")
    public Response getLikesByTargetIdAndType(@PathParam("targetId") Long targetId,
            @PathParam("targetType") String targetType) {
        List<Like> likes = likeService.getLikesByTargetIdAndType(targetId, targetType);
        return Response.ok(likes).build();
    }

    @GET
    @Path("/target/{targetId}/type/{targetType}/count")
    public Response getLikesCount(@PathParam("targetId") Long targetId,
            @PathParam("targetType") String targetType) {
        long count = likeService.countLikesByTargetIdAndType(targetId, targetType);
        return Response.ok("{\"count\":" + count + "}").build();
    }

    @POST
    @Path("/create")
    public Response createLike(LikeInputDTO input) {
        if (input == null || input.getUserId() == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"message\":\"Invalid input\"}")
                    .build();
        }

        // Delegate everything to the service layer
        Like newLike = likeService.createLike(input.getUserId(), input.getTargetId(), input.getTargetType());
        if (newLike == null) {
            return Response.status(Response.Status.CONFLICT)
                    .entity("{\"message\":\"Like already exists\"}")
                    .build();
        }

        return Response.status(Response.Status.CREATED)
                .entity(LikeDTO.fromEntity(newLike))
                .build();
    }

    @POST
    @Path("/toggle")
    public Response toggleLike(LikeInputDTO input) {
        if (input == null || input.getUserId() == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"message\":\"Invalid input\"}")
                    .build();
        }

        String action = likeService.toggleLike(input.getUserId(), input.getTargetId(), input.getTargetType());
        return Response.ok("{\"action\":\"" + action + "\"}").build();
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
