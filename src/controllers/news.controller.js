import { AddNews, DeleteNews, GetNews, UpdateNews } from "../dbc/news.dbc.js";

// add post business logic here 
const addNews = async (req, res, next) => {
  try {

    logger.debug("post analyse item send from frontend is ok or not", req.body)
    // saving data into db
    const data = await AddNews(req.body);


    // sending response to the server
    res.status(200).json({
      success: true,
      message: "News Added successfully",
      data: []
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};


const getNews = async (req, res, next) => {
  try {
    console.log("controller is calling .............")
    const updatedUser = await GetNews();

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


const deleteNews = async (req, res, next) => {
  try {
    console.log("req.body  deleteNews-------------->", req.body)
    const deletedUser = await DeleteNews(req.body);

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

const updateNews = async (req, res, next) => {
  try {
    logger.debug("post analyse item send from frontend is ok or not", req.body)
    const updatedClient = await UpdateNews(req.body);

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: updatedClient
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};



export {
  updateNews,
  addNews,
  getNews,
  deleteNews
};
