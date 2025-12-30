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

const uploadAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title || !description){
      throw new ApiError(400, "Title and description are required" );
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;


    if(!videoLocalPath || !thumbnailLocalPath){
      throw new ApiError(400, "Video file and thumbnail are required");
    }

    const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!uploadedVideo || !uploadedThumbnail) {
      throw new ApiError(500, "Error uploading files to Cloudinary" );
    }

    const video = await Video.create({
      title,
      description,
      videoFile: uploadedVideo.url,
      thumbnail: uploadedThumbnail.url,
      duration: uploadedVideo.duration,
      owner: req.user._id
    });

     return res.status(201).json(
        new ApiResponse(201, video, "Video uploaded successfully")
    );
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
  if(!videoId){
    throw new ApiError(400,"Video ID is required" );
  }

  if(!isValidObjectId(videoId)){
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await  Video.findById(videoId);

  if(!video){
    throw new ApiError(404, "Video not found");
  }

  return res 
  .status(200)
  .json(new ApiResponse(200, video, "Video fetched successfully"));


});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description} = req.body;

    if(!isValidObjectId(videoId)){
      throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.findById(videoId);
    if(!video){
      throw new ApiError(404, "Video not found");
    }
    if(video.owner.toString() !== req.user._id.toString()){
      throw new ApiError(403, "You cannot update this video");
    }

    let newThumbnailUrl = video.thumbnail;

    let uploadedThumbnail;
    if(req.file?.path){
       uploadedThumbnail = await uploadOnCloudinary(req.file.path);
    };
    if(!uploadedThumbnail){
       throw new ApiError(500, "Thumbnail upload failed");
    }
    newThumbnailUrl = uploadedThumbnail.url;
  
  video.title=title|| video.title;
  video.description= description|| video.description;
  video.thumbnail= newThumbnailUrl;

  await video.save();

  return res
  .status(200)
  .json(new ApiResponse(200, video, "Video Updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)){
      throw new ApiError(400, "Invalid Video ID")
    }
    const video = await Video.findById(videoId);
    if(!video){
      throw new ApiError(400, "Video Not Found")
    }

    if(video.owner.toString() !== req.user._id.toString()){
      throw new ApiError(403, "You cannot update this video");
    }
    // 4. Optional: remove video & thumbnail from Cloudinary (if needed)
    // await deleteFromCloudinary(video.videoFile);
    // await deleteFromCloudinary(video.thumbnail);

    await Video.findByIdAndDelete(videoId);

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted Successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
      throw new ApiError(400, "Invalid Video Id")
    }
    const video = await Video.findById(videoId);
    if(!video){
      throw new ApiError(404, "video not found")
    }

    if(video.owner.toString() !== req.user._id.toString()){
      throw new ApiError(403, "You cannot update this video");
    }

    video.isPublished = !video.isPublished

    await video.save();

    return res
    .status(200)
    .json(new ApiResponse(
      200,
      video,
      `Video is now ${video.isPublished ? "Published" : "Unpublished"}`
     ));
});

export {
    getAllVideos,
    uploadAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}