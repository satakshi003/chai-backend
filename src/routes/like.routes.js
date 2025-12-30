import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

//1️⃣ Toggle video like
router.route("/video/:videoId").patch(toggleVideoLike);

// 2️⃣ Toggle comment like
router.route("/comment/:commentId").patch(toggleCommentLike);

// 3️⃣ Toggle tweet like
router.route("/tweet/:tweetId").patch(toggleTweetLike);

// 4️⃣ Get all videos liked by logged-in user
router.route("/videos").get(getLikedVideos);

export default router