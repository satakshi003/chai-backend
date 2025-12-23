import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc",  userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    // Convert page & limit to numbers
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    // 1️⃣ Build match condition (filter)
    const matchStage = {
      isPublished: true
    };

    // Search by title or description
    if(query){
      matchStage.$or = [
        { title: { $regex: query, $options: "i"}},
        { description: { $regex: query, $options: "i"}}
      ];
      //The "i" stands for case-insensitive
    }

    // Filter by user/channel
    if(userId && isValidObjectId(userId)) {
      matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    // 2️⃣ Sorting logic
    const sortStage = {
      [sortBy]: sortType === "asc" ? 1 : -1
    };

     // 3️⃣ Aggregation pipeline
     const videos = await Video.aggregate([
      { $match: matchStage},
      {
        //JOIN USER DETAILS
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                fullName:1,
                username: 1,
                avatar: 1
              }
            }
          ]
        }
      },
       // Convert owner array → object
    {
      $addFields: {
        owner: { $first: "$owner" }
      }
    },
     // Sort
    { $sort: sortStage },

    // Pagination 
    { $skip: (pageNumber - 1) * limitNumber }, //SKIP OLD RESULTS
    { $limit: limitNumber } //TAKE ONLY REQUIRED
     ]);

  // 4️⃣ Total count (for pagination UI)
  const totalVideos = await Video.countDocuments(matchStage);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        page: pageNumber,
        limit: limitNumber,
        totalVideos,
        totalPages: Math.ceil(totalVideos / limitNumber)
      },
      "Videos fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}