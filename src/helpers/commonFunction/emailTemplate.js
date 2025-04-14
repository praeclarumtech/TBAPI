import handlebars from 'handlebars';
import EmailTemplate from '../../models/emailTemplateModel.js';
 
export const getCompiledTemplate = async (type, dynamicData) => {
  const template = await EmailTemplate.findOne({ type, isDeleted: false });
 
  if (!template) {
    throw new Error(`No template found for type: ${type}`);
  }
 
  const compiledSubject = handlebars.compile(template.subject)(dynamicData);
  const compiledBody = handlebars.compile(template.body)(dynamicData);
 
  return {
    subject: compiledSubject,
    html: compiledBody,
  };
};