const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)). catch((err) => next(err))
  }
}
export {asyncHandler}

//asyncHandler is a utility that wraps async route handlers so you don’t have to write try...catch everywhere. Any error gets automatically passed to Express’ error-handling middleware.



//const asyncHandler = () => {}
//const asyncHandler = (func) =>() => {} 
//const asyncHandler = (func) => async() => {}

//wrapper function using try catch
/*const asyncHandler = (fn) => async (req, res, next) => {
  try {

  } catch (error){
    res.status(error.code || 500).json({
      succes: false,
      message: error.message
    })
  }
}*/