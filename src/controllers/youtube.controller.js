import { addYoutubeItem, deleteYoutubePost, getYoutubeItem, updateYoutubeItem } from "../dbc/youtube.dbc.js";


// add post business logic here 
const AddYoutubeItem = async (req, res, next) => {
  try {

    logger.debug("post analyse item send from frontend is ok or not", req.body)
    // saving data into db
    const data = await addYoutubeItem(req.body);


    // sending response to the server
    res.status(200).json({
      success: true,
      message: "data post successfully",
      data: []
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};


const getALLYoutubePost = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const updatedUser = await getYoutubeItem();

    res.status(200).json({
      success: true,
      message: 'Data fetch successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


const DeleteYoutubePost = async (req, res, next) => {
  try {
    console.log("req.body  DeleteYoutubePost-------------->", req.body)
    const deletedUser = await deleteYoutubePost(req.body);

    res.status(200).json({
      success: true,
      message: 'Data delete successfully',
      data: deletedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const UpdateYoutubeItem = async (req, res, next) => {
  try {
    logger.debug("post analyse item send from frontend is ok or not", req.body)
    const updatedYoutubePost = await updateYoutubeItem(req.body);

    res.status(200).json({
      success: true,
      message: 'Video updated successfully',
      data: updatedYoutubePost
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};



export {
  UpdateYoutubeItem,
  AddYoutubeItem,
  getALLYoutubePost,
  DeleteYoutubePost
};
