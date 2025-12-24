import Settings from '../models/settingsModel.js';
import EmailTemplate from '../models/emailTemplateModel.js';
import logger from '../loggers/logger.js';

// Get settings (there should only be one settings document)
export const getSettings = async () => {
  try {
    let settings = await Settings.findOne({ isDeleted: false });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await createDefaultSettings();
    }

    return settings;
  } catch (error) {
    logger.error('Error while fetching settings', error);
    throw error;
  }
};

// Get settings with email templates from EmailTemplate table
export const getSettingsWithTemplates = async () => {
  try {
    let settings = await Settings.findOne({ isDeleted: false });

    // Fetch all email templates from EmailTemplate table
    const emailTemplates = await EmailTemplate.find({ isDeleted: false });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await createDefaultSettings();
    }

    // Map email templates with their visibility settings
    const templatesWithVisibility = emailTemplates.map((template) => {
      const visibilitySetting = settings.emailTemplateVisibility.find(
        (v) => v.templateType === template.type
      );

      return {
        templateType: template.type,
        templateName: template.subject,
        vendor: visibilitySetting?.vendor || false,
        client: visibilitySetting?.client || false,
        job: visibilitySetting?.job || false,
        qrCode: visibilitySetting?.qrCode || false,
        custom: visibilitySetting?.custom || false,
      };
    });

    return {
      ...settings.toObject(),
      emailTemplateVisibility: templatesWithVisibility,
    };
  } catch (error) {
    logger.error('Error while fetching settings with templates', error);
    throw error;
  }
};

// Create default settings (without hardcoded templates)
export const createDefaultSettings = async () => {
  try {
    // Fetch all email templates from EmailTemplate table
    const emailTemplates = await EmailTemplate.find({ isDeleted: false });

    // Create default visibility for each template (all false by default)
    const defaultTemplateVisibility = emailTemplates.map((template) => ({
      templateType: template.type,
      vendor: false,
      client: false,
      job: false,
      qrCode: false,
      custom: false,
    }));

    const settings = new Settings({
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12',
      timezone: 'IST',
      emailTemplateVisibility: defaultTemplateVisibility,
    });

    return await settings.save();
  } catch (error) {
    logger.error('Error while creating default settings', error);
    throw error;
  }
};

// Update settings
export const updateSettings = async (updateData, userId) => {
  try {
    let settings = await Settings.findOne({ isDeleted: false });

    if (!settings) {
      // Create new settings if none exist
      settings = new Settings({
        ...updateData,
        createdBy: userId,
        updatedBy: userId,
      });
      return await settings.save();
    }

    // Update existing settings
    Object.assign(settings, updateData, { updatedBy: userId });
    return await settings.save();
  } catch (error) {
    logger.error('Error while updating settings', error);
    throw error;
  }
};

// Update only date/time settings
export const updateDateTimeSettings = async (dateTimeData, userId) => {
  try {
    let settings = await Settings.findOne({ isDeleted: false });

    if (!settings) {
      settings = await createDefaultSettings();
    }

    if (dateTimeData.dateFormat) settings.dateFormat = dateTimeData.dateFormat;
    if (dateTimeData.timeFormat) settings.timeFormat = dateTimeData.timeFormat;
    if (dateTimeData.timezone) settings.timezone = dateTimeData.timezone;
    settings.updatedBy = userId;

    return await settings.save();
  } catch (error) {
    logger.error('Error while updating date/time settings', error);
    throw error;
  }
};

// Update email template visibility
export const updateEmailTemplateVisibility = async (
  templateVisibility,
  userId
) => {
  try {
    let settings = await Settings.findOne({ isDeleted: false });

    if (!settings) {
      settings = await createDefaultSettings();
    }

    settings.emailTemplateVisibility = templateVisibility;
    settings.updatedBy = userId;

    return await settings.save();
  } catch (error) {
    logger.error('Error while updating email template visibility', error);
    throw error;
  }
};

// Get email template visibility for a specific context (vendor, client, job, qrCode, custom)
export const getVisibleTemplatesForContext = async (context) => {
  try {
    const settings = await getSettings();

    if (!settings || !settings.emailTemplateVisibility) {
      return [];
    }

    // Get template types that are visible for this context
    const visibleTemplateTypes = settings.emailTemplateVisibility
      .filter((template) => template[context] === true)
      .map((template) => template.templateType);

    // Fetch full template details from EmailTemplate table
    const emailTemplates = await EmailTemplate.find({
      type: { $in: visibleTemplateTypes },
      isDeleted: false,
    });

    return emailTemplates.map((template) => ({
      type: template.type,
      subject: template.subject,
    }));
  } catch (error) {
    logger.error('Error while fetching visible templates for context', error);
    throw error;
  }
};
