// import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs'; 

export const extractTextFromPDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

export const extractTextFromDocx = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};

export const parseResumeText = (text) => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/;
  const nameRegex = /([A-Z][a-z]+)\s([A-Z][a-z]+)/;

  const email = text.match(emailRegex)?.[0] || '';
  const phone = text.match(phoneRegex)?.[0] || '';
  const nameMatch = text.match(nameRegex);
  const name = nameMatch ? `${nameMatch[1]} ${nameMatch[2]}` : '';

  return { name, email, phone };
};