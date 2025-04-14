import EmailTemplate from '../models/emailTemplateModel.js';
 
 
export const createEmailTemplate = async (templateData) => {
 try{
  const existing = await EmailTemplate.findOne({ type: templateData.type });
  if (existing) {
    throw new Error('Email template with this type already exists.');
  }
  const newTemplate = new EmailTemplate(templateData);
  return await newTemplate.save();
} catch (error) {
  logger.error('Error creating email template:', error);
  throw error;
}
};
 
export const getEmailTemplateByStatus = async (type) => {
    try{
        return await EmailTemplate.findOne({ type, isDeleted: false });
    } catch (error) {
        logger.error('Error getting email template by type:', error);
        throw error;
    }
};
 
export const updateEmailTemplate = async (id, updateData) => {
    try{
        return await EmailTemplate.findByIdAndUpdate(id, updateData, { new: true });
    } catch (error) {
        logger.error('Error updating email template:', error);
        throw error;
    }
};
 
export const deleteEmailTemplate = async (id) => {
    try{
        return await EmailTemplate.findOneAndDelete({ id });
    } catch (error) {
        logger.error('Error deleting email template:', error);
        throw error;
    }
};
 
export const getEmailTemplateById = async (id) => {
    try {
        return await EmailTemplate.findById(id);
    } catch (error) {
        logger.error('Error getting email template by ID:', error);
        throw error;
    }
};
 
export const getAllEmailTemplates = async (page, limit) => {
    try {
        return await EmailTemplate.find({isDeleted: false})
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    } catch (error) {
        logger.error('Error getting all email templates:', error);
        throw error;
    }
};