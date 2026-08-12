import { addYoutubeItem, updateYoutubeItem } from "../dbc/youtube.dbc.js";

const AddYoutubeItem = async (req, res, next) => {
  try {

   logger.debug("post analyse item send from frontend is ok or not", req.body )
   const data = await addYoutubeItem(req.body);
   logger.debug("post data----------->", data )

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

const UpdateYoutubeItem = async (req, res, next) => {
  try {
    const updatedUser = await updateYoutubeItem(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
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
};
