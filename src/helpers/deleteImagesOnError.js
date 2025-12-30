import fs from "fs";

function deleteImagesOnError(req){
  const avatarLocalPath = req.files?.avatar
      ? req.files.avatar[0]?.path
      : null;
    const coverImageLocalPath = req.files?.coverImage
      ? req.files.coverImage[0]?.path
      : null;
    if(avatarLocalPath) fs.unlinkSync(avatarLocalPath);
    if(coverImageLocalPath) fs.unlinkSync(coverImageLocalPath);
}

export default deleteImagesOnError;