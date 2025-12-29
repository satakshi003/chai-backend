import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
    const {name, description} = req.body
    
    if(!name || name.trim().length === 0){
      throw new ApiError(400, "Playlist name is required");
    }

    const playlist = await Playlist.create({
      name,
      description,
      owner: req.user._id,
      videos: [] // newly created playlist starts empty
    });

    return res
    .status(201)
    .json(
      new ApiResponse(201, playlist, "Playlist created successfully")
    );
    
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!isValidObjectId(userId)){
      throw new ApiError(400, "Invalid userId")
    }

    const playlists = await Playlist.find({owner: userId}).populate("videos", "title thumbnail owner duration");

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlists,
        "User playlists fetched successfully"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
      throw new ApiError(400, "Invalid playlist Id");
    }

    const playlist = await Playlist.findById(playlistId).populate("videos", "title thumbnail owner duration");

    if(!playlist){
      throw new ApiError(404, "Playlist not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist fetched successfully")
        );
    
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
      throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId);
     if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if(playlist.videos.includes(videoId)){
      throw new ApiError(400, "Video already exists in this playlist");
    }

    playlist.videos.push(videoId);

    await playlist.save();

    return res
    .status(200)
    .json(
       new ApiResponse(
            200,
            playlist,
            "Video successfully added to playlist"
    )
  );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}