import {
  addTemplate,
  getAllTemplates,
  deleteTemplate,
  updateTemplate,
} from '../dbc/templates.dbc.js';

const AddTemplate = async (req, res, next) => {
  try {
    const templateData = await addTemplate(req.body);

    res.status(201).json({
      success: true,
      message: 'Template added successfully',
      data: templateData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Template could not be added',
    });
  }
};

const getAllTemplate = async (req, res, next) => {
  try {
    const templates = await getAllTemplates();

    res.status(200).json({
      success: true,
      message: 'Templates fetched successfully',
      data: templates,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Templates could not be fetched',
    });
  }
};

const DeleteTemplate = async (req, res, next) => {
  try {
    const templateId = req.params.id || req.body.id || req.body._id || req.query.id;
    const deletedTemplate = await deleteTemplate({ id: templateId, _id: templateId });

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
      data: deletedTemplate,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Template could not be deleted',
    });
  }
};

const UpdateTemplate = async (req, res, next) => {
  try {
    const templateId = req.params.id || req.body.id || req.body._id || req.query.id;
    const updatedTemplate = await updateTemplate({
      ...req.body,
      id: templateId || req.body.id || req.body._id,
    });

    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: updatedTemplate,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Template could not be updated',
    });
  }
};

export { AddTemplate, getAllTemplate, DeleteTemplate, UpdateTemplate };
