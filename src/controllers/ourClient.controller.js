import { AddClient, DeleteClient, GetallClient, UpdateClient } from "../dbc/ourClient.dbc.js";


// add post business logic here 
const addClient = async (req, res, next) => {
  try {

    logger.debug("post analyse item send from frontend is ok or not", req.body)
    // saving data into db
    const data = await AddClient(req.body);


    // sending response to the server
    res.status(200).json({
      success: true,
      message: "client Add successfully",
      data: []
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};


const getallClient = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const updatedUser = await GetallClient();

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


const deleteClient = async (req, res, next) => {
  try {
    console.log("req.body  deleteClient-------------->", req.body)
    const deletedUser = await DeleteClient(req.body);

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

const updateClient = async (req, res, next) => {
  try {
    logger.debug("post analyse item send from frontend is ok or not", req.body)
    const updatedClient = await UpdateClient(req.body);

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
  updateClient,
  addClient,
  getallClient,
  deleteClient
};
