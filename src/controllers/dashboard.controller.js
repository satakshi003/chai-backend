import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id;
    const totalVideos = await Video.countDocuments({owner: userId});

    const viewStats = await Video.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(userId)}},
      {
        $group: {
          _id: null,
          totalViews: {$sum: "$views"}
        }
      }
    ]);
    const totalViews = viewStats[0]?.totalViews || 0;

    const totalSubscribers = await Subscription.countDocuments({
      channel: userId
    });

    const likeStats = await Like.aggregate([
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "videoDetails"
        }
      },
      {$unwind: "$videoDetails"},
      {
        $match: {
           "videoDetails.owner": new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          totalLikes: {$sum: 1}
        }
      }
    ]);
    const totalLikes = likeStats[0]?.totalLikes || 0;

    const stats = {
      totalVideos,
      totalViews,
      totalSubscribers,
      totalLikes
    };

     return res
        .status(200)
        .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
    }