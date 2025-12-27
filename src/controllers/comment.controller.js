import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(isValidObjectId(videoId)){
      throw new ApiError(400, "Invalid video ID");
    }

    const skip = (page - 1)* parseInt(limit);

    const comments = await Comment.find({video: videoId})
    .populate("owner", "username fullName avatar")
    .sort({createdAt: -1})
    .skip(skip)
    .limit(parseInt(limit));

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        comments,
        "Video comments fetched successfully"
      )
    );

});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
  const {videoId} = req.params;
  const {content} = req.body;
  
  if(!isValidObjectId(videoId)){
     throw new ApiError(400, "Invalid video ID");
  }
  if (!content || content.trim().length === 0) {
        throw new ApiError(400, "Comment cannot be empty");
    }

  const video = await  Video.findById(videoId);
  if(!video){
     throw new ApiError(404, "Video not found");
  }

  const comment = await Comment.create({
    content,
    owner: req.user._id,
    video: videoId
  });

  return res 
  .status(201)
  .json(
    new ApiResponse(201, comment, "Comment added successfully")
  );

});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }