import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import validateEmail from "../helpers/validateEmail.js";
import deleteImagesOnError from "../helpers/deleteImagesOnError.js";
import generateAccessAndRefreshTokens from "../helpers/generateAccessAndRefreshTokens.js";
import jwt from "jsonwebtoken";


const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation - not empty
  //check if user already exists: username, email
  //check images, check for avatar
  //upload them to cloudinary, avatar
  //create user object - create entry in db
  //remove password and refresh token field from response
  //check for user creation
  //send success response

  try {
    const { fullName, username, email, password, confirmPassword } = req.body;


    if (
      !fullName?.trim() ||
      !username?.trim() ||
      !email?.trim() ||
      !password?.trim() ||
      !confirmPassword?.trim()

    ) {
      throw new ApiError(400, "All fields are required");
    }

    if(!validateEmail(email)){
      throw new ApiError(400, "Invalid Email")
    }

    
    if(confirmPassword !== password){
      throw new ApiError(400, "Confirm Password and Password is not matching");
    }


    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existedUser) {
      throw new ApiError(
        409,
        "User with given username or email already exists"
      );
    }

    const avatarLocalPath = req.files?.avatar
      ? req.files.avatar[0]?.path
      : null;
    const coverImageLocalPath = req.files?.coverImage
      ? req.files.coverImage[0]?.path
      : null;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
      throw new ApiError(500, "Could not upload avatar. Please try again");
    }

    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email,
      password,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
    });
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(500, "Could not create user. Please try again");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User registered successfully"));
  } catch (error) {
    console.error("Error in user registration:", error);
    deleteImagesOnError(req);
    throw error;

  }

});

const loginUser = asyncHandler(async (req, res) => {
  //req body -> data from frontend
  //username or email
  //find the user
  //password check
  //generate access token and refresh token
  //send cookies
  //send success response
  const { email, username, password } = req.body;
  
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

 const logoutUser = asyncHandler (
  async (req, res) => {
    //get refresh token from cookies
    //if not present, throw error
    //find the user with refresh token
    //if not found, throw error
    //remove refresh token from db
    //clear cookies
    //send success response
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: { 
          refreshToken: undefined
        }
      },
      {
        new: true
      }
    ) 
    const options = {
      httpOnly: true,
      secure: true,
    }
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, null, "User logged out successfully"));

  }
);

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken 

  if(!incomingRefreshToken){
    throw new ApiError(401, "unauthorized request")
  }

 try {
   const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
   )
 
   const user = await User.findById(decodedToken?._id)
 
   if(!user){
     throw new ApiError(401, "Invalid Refresh token")
   }
 
   if(incomingRefreshToken !== user?.refreshToken){
     throw new ApiError(401, "Refresh token is expired or used")
   }
 
   const options = {
     httpOnly: true,
     secure: true
   }
 
   const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", newRefreshToken, options)
   .json(
     new ApiResponse(
       200,
       {accessToken, refreshToken:newRefreshToken},
       "Access token refreshed"
     )
   )
 } catch (error) {
    throw new ApiError(401, error?.message ||
      "Invalid refresh token"
    )
 }
}
)

const changeCurrentPassword = asyncHandler(async(req, res) => {
  const {oldPassword, newPassword} = req.body

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
  return res
  .status(200)
  .json(200, req.user, "Current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req, res) => {
  const {fullName, email} = req.body

  if(!fullName || !email){
    throw new ApiError(400, "All fields are required")
  }

  //update user record in mongoDB
  const user = await User.findByIdAndUpdate(
  req.user?._id,
  {
      $set: {
        fullName,
        email: email
      }
  },
  {new: true}
).select("-password")


  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
/*The update avatar endpoint:
Gets the uploaded file
Uploads to Cloudinary
Gets Cloudinary URL
Saves URL in database
Returns updated user
Frontend automatically shows new DP*/
 const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
      throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
      throw new ApiError(400, "Error while uploading an avatar")
    }

    //update avatar URL in Database
  const user =   await User.findByIdAndUpdate(
      req.user?._id, //This is ID of logged-in user provided by your JWT middleware.
      {
          $set:{
            avatar: avatar.url
          }
      },
      {new: true}
    ).select("-password")

     return res
    .status(200)
    .json(
      new ApiResponse(200, user," Avatar updated successfuly")
    )
    //Frontend will now show the new picture.
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
      throw new ApiError(400, "Cover image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
      throw new ApiError(400, "Error while uploading an coverImage")
    }

  const user =   await User.findByIdAndUpdate(
      req.user?._id,
      {
          $set:{
           coverImage: coverImage.url
          }
      },
      {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
      new ApiResponse(200, user,"Cover image updated successfuly")
    )
})

export {
   registerUser, 
   loginUser, 
   logoutUser, 
   refreshAccessToken, changeCurrentPassword, getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage
  };