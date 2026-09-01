import Template from '../models/templates.models.js';

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  return [];
};

const addTemplate = async (data = {}) => {
  try {
    const payload = {
      ...data,
      ownerId: data.ownerId || data.createdBy || '',
      title: String(data.title || '').trim(),
      description: String(data.description || '').trim(),
      category: String(data.category || 'Education').trim() || 'Education',
      icon: String(data.icon || '🎓').trim() || '🎓',
      gradient: String(data.gradient || 'template-purple').trim() || 'template-purple',
      url: String(data.url || '').trim(),
      tags: normalizeArray(data.tags),
      images: normalizeArray(data.images).slice(0, 3),
    };

    if (!payload.title || !payload.description) {
      throw new Error('Title and description are required.');
    }

    if (!payload.url || !/^https?:\/\//i.test(payload.url)) {
      throw new Error('Please provide a valid Template URL starting with http:// or https://');
    }

    const responseData = await Template.create(payload);
    return responseData;
  } catch (error) {
    throw error;
  }
};

const getAllTemplates = async () => {
  try {
    const responseData = await Template.find({ isActive: true }).sort({ createdAt: -1 });
    return responseData;
  } catch (error) {
    throw error;
  }
};

const getTemplateById = async (id) => {
  try {
    if (!id) {
      throw new Error('Template id is required');
    }

    const responseData = await Template.findById(id);
    return responseData;
  } catch (error) {
    throw error;
  }
};

const deleteTemplate = async (data = {}) => {
  try {
    const id = data.id || data._id || data.templateId;

    if (!id) {
      throw new Error('Template id is required');
    }

    const responseData = await Template.findByIdAndDelete(id);

    if (!responseData) {
      throw new Error('Template not found');
    }

    return responseData;
  } catch (error) {
    throw error;
  }
};

const updateTemplate = async (updateData = {}) => {
  try {
    const id = updateData.id || updateData._id || updateData.templateId;

    if (!id) {
      throw new Error('Template id is required');
    }

    const payload = {
      ...updateData,
      ownerId: updateData.ownerId || updateData.createdBy || undefined,
      title: updateData.title !== undefined ? String(updateData.title).trim() : undefined,
      description:
        updateData.description !== undefined ? String(updateData.description).trim() : undefined,
      category:
        updateData.category !== undefined
          ? String(updateData.category).trim() || 'Education'
          : undefined,
      icon: updateData.icon !== undefined ? String(updateData.icon).trim() || '🎓' : undefined,
      gradient:
        updateData.gradient !== undefined
          ? String(updateData.gradient).trim() || 'template-purple'
          : undefined,
      url: updateData.url !== undefined ? String(updateData.url).trim() : undefined,
      tags: updateData.tags !== undefined ? normalizeArray(updateData.tags) : undefined,
      images:
        updateData.images !== undefined ? normalizeArray(updateData.images).slice(0, 3) : undefined,
    };

    delete payload.id;
    delete payload._id;
    delete payload.templateId;

    if (payload.title !== undefined && !payload.title) {
      throw new Error('Template title is required');
    }

    if (payload.description !== undefined && !payload.description) {
      throw new Error('Template description is required');
    }

    if (payload.url !== undefined && (!payload.url || !/^https?:\/\//i.test(payload.url))) {
      throw new Error('Please provide a valid Template URL starting with http:// or https://');
    }

    const responseData = await Template.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!responseData) {
      throw new Error('Template not found');
    }

    return responseData;
  } catch (error) {
    throw error;
  }
};

export {
  addTemplate,
  getAllTemplates,
  getTemplateById,
  deleteTemplate,
  updateTemplate,
};
