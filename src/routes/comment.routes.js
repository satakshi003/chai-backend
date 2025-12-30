import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// 1️⃣ Get/Add comments to a video
router
    .route("/video/:videoId")
    .get(getVideoComments)
    .post(addComment);

// 2️⃣ Update/Delete a specific comment
router
    .route("/:commentId")
    .patch(updateComment)
    .delete(deleteComment);
export default router