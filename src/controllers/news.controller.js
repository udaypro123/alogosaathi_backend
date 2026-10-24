import {
  AddNews,
  DeleteNews,
  GetNews,
  GetAdminNewsByCategory,
  GetAdminNewsCategories,
  GetNewsByCategory,
  GetNewsCategories,
  UpdateNews,
} from "../dbc/news.dbc.js";

// add post business logic here 
const addNews = async (req, res, next) => {
  try {

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

const getNewsCategories = async (req, res) => {
  try {
    const categories = await GetNewsCategories();
    const availableCategories = categories
      .filter((category) => typeof category === "string" && category.trim())
      .sort((first, second) => first.localeCompare(second));
    res.status(200).json({
      success: true,
      data: availableCategories,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getNewsByCategory = async (req, res) => {
  try {
    const requestedCategory = req.query.category?.trim().toLowerCase();
    if (!requestedCategory) {
      return res.status(400).json({
        success: false,
        message: "News category is required.",
      });
    }
    const category = requestedCategory === "all" ? null : requestedCategory;
    const search = typeof req.query.search === "string"
      ? req.query.search.trim().slice(0, 100)
      : "";

    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 30)
      : 9;
    const requestedSkip = Number.parseInt(req.query.skip, 10);
    const skip = Number.isFinite(requestedSkip)
      ? Math.max(requestedSkip, 0)
      : 0;

    const result = await GetNewsByCategory(category, skip, limit, search);
    res.status(200).json({
      success: true,
      data: result.items,
      hasMore: result.hasMore,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAdminNewsCategories = async (req, res) => {
  try {
    const categories = await GetAdminNewsCategories();
    const availableCategories = categories
      .filter((category) => typeof category === "string" && category.trim())
      .sort((first, second) => first.localeCompare(second));
    res.status(200).json({
      success: true,
      data: availableCategories,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAdminNewsByCategory = async (req, res) => {
  try {
    const requestedCategory = req.query.category?.trim().toLowerCase();
    const category = requestedCategory && requestedCategory !== "all"
      ? requestedCategory
      : null;
    const search = typeof req.query.search === "string"
      ? req.query.search.trim().slice(0, 100)
      : "";
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 30)
      : 9;
    const requestedSkip = Number.parseInt(req.query.skip, 10);
    const skip = Number.isFinite(requestedSkip)
      ? Math.max(requestedSkip, 0)
      : 0;

    const result = await GetAdminNewsByCategory(category, skip, limit, search);
    res.status(200).json({
      success: true,
      data: result.items,
      hasMore: result.hasMore,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


const deleteNews = async (req, res, next) => {
  try {
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
  getNewsCategories,
  getNewsByCategory,
  getAdminNewsCategories,
  getAdminNewsByCategory,
  deleteNews
};
