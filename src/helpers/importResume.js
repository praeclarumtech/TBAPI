import mammoth from 'mammoth';
import fs from 'fs';
import logger from '../loggers/logger.js';
import WordExtractor from 'word-extractor';
import { Message } from '../utils/constant/message.js';
import { applicantEnum } from '../utils/enum.js';

import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const uint8Array = new Uint8Array(dataBuffer);

    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    const pagePromises = Array.from({ length: pdf.numPages }, (_, i) =>
      pdf.getPage(i + 1)
    );

    const pages = await Promise.all(pagePromises);

    const textPromises = pages.map(async (page) => {
      const textContent = await page.getTextContent();
      return textContent.items
        .map((item) => item.str.replace(/[●►⇨❖✓]/g, '').trim())
        .join(' ');
    });

    const extractedText = (await Promise.all(textPromises)).join('\n');

    return extractedText.replace(/\s+/g, ' ').trim();
  } catch (error) {
    logger.error(`${Message.FAILED_TO} extracting text from PDF:${error}`);
    return null;
  }
};

export const extractTextFromDocx = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.replace(/\s+/g, ' ').trim();
  } catch (error) {
    logger.error(`${Message.FAILED_TO} extracting text from DOCX:${error}`);
    return null;
  }
};

const extractor = new WordExtractor();

export const extractTextFromDoc = async (filePath) => {
  try {
    const doc = await extractor.extract(filePath);
    const text = doc.getBody()?.trim();
    if (!text) {
      throw new Error('Extracted text is empty');
    }
    return text.replace(/\s+/g, ' ');
  } catch (error) {
    logger.error(`Failed to extract text from DOC: ${error.message}`);
    return null;
  }
};

export const parseResumeText = (text) => {
  const emailRegex =
    /\b[a-zA-Z0-9._%+-]+(?:\s*@\s*|\s+at\s+)[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,}\b/g;
  const phoneRegex = /(?:\+?\s*91[\s-]*)?(?:\(\s*91\s*\)[\s-]*)?(?:\(?\d{3,5}\)?[\s-]*){2,3}\d{2,4}/g;

  const nameTagRegex =
    /(?:Name|Full Name)\s*[:\-]\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?(?:\s[A-Z][a-z]+)?)/i;
  const skillsMatch = text.match(/(Technical Skills|Skills)[:\s]*(.*)/i);
  const experienceRegex = /(\d+(?:\.\d+)?)\s*(?:\+?\s*years?|yrs?|year)/gi;
  const locationRegex =
    /(Address|Location|Current Address)[:\s]*(\S+(?:\s+\S+){0,5})/i;
  const preferredLocationRegex =
    /(Preferred Location)[:\s]*(\S+(?:\s+\S+){0,5})/i;
  const matches = [...text.matchAll(experienceRegex)].map((match) =>
    parseFloat(match[1])
  );
  const qualificationMatch = text.match(
    /(BTech|Bachelor|Master|B\.Sc|M\.Sc|MTech|PhD|Diploma|B.Tech|M.Tech).*?(?:\d{4})?/i
  );
  const preferredLocationMatch = text.match(preferredLocationRegex);
  const linkedInMatch = text.match(
    /(https?:\/\/)?(www\.)?linkedin\.com\/[a-zA-Z0-9-_/]+/
  );
  const currentCompanyMatch = text.match(
    /(Current Employer|Current Company|Company Name)[:\s]*(\S+(?:\s+\S+){0,5})/i
  );
  const maritalStatusMatch = text.match(/Marital Status:\s*(Single|Married)/i);
  const dobMatch = text.match(/Date of Birth:\s*(\d{2}[-/]\d{2}[-/]\d{4})/i);
  const genderRegex = /\b(male|female|famale|femail)\b/i;

  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[0].replace(/\s+/g, '') : '';
  const phoneMatch = text.match(phoneRegex);
  let phone = phoneMatch
    ? phoneMatch[0].replace(/[-()\s]/g, '').replace(/^\+91/, '')
    : '';
  const totalExperience = matches.length > 0 ? Math.max(...matches) : 0;
  const qualification = qualificationMatch
    ? qualificationMatch[1]
    : 'Not Provided';
  const locationMatch = text.match(locationRegex);
  const currentAddress = locationMatch
    ? locationMatch[2].trim()
    : 'Not Provided';
  const preferredLocations = preferredLocationMatch
    ? preferredLocationMatch[2].trim()
    : 'Not Provided';
  const linkedinUrl = linkedInMatch ? linkedInMatch[0] : '';
  const currentCompanyName = currentCompanyMatch
    ? currentCompanyMatch[2].trim()
    : '';
  const maritalStatus = maritalStatusMatch ? maritalStatusMatch[1] : '';
  const genderMatch = text.match(genderRegex);
  const dateOfBirth = dobMatch
    ? new Date(dobMatch[1].split('/').reverse().join('-'))
    : null;

  let potentialName = 'Unknown';

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const nameTagMatch = text.match(nameTagRegex);
  if (nameTagMatch) {
    potentialName = nameTagMatch[1];
  }

  if (potentialName === 'Unknown' && email) {
    let emailPrefix = email
      .split('@')[0]
      .replace(/[0-9._]/g, '')
      .trim();

    if (emailPrefix.length >= 4) {
      emailPrefix = emailPrefix.substring(0, 4);
    }

    if (emailPrefix) {
      const wordRegex = new RegExp(`\\b${emailPrefix}[a-zA-Z]*\\b`, 'i');
      const matchedWord = text.match(wordRegex);

      if (matchedWord) {
        let firstName = matchedWord[0];

        const lastNameRegex = new RegExp(
          `\\b${firstName}\\b\\s+([A-Z][a-z]+)`,
          'i'
        );
        const lastNameMatch = text.match(lastNameRegex);

        let lastName = lastNameMatch ? lastNameMatch[1] : 'Unknown';

        potentialName = `${firstName} ${lastName}`;
      }
    }
  }

  if (potentialName === 'Unknown') {
    const firstWords = text.split('\n')[0].trim();
    const nameParts = firstWords.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/);
    if (nameParts) {
      potentialName = nameParts[0];
    }
  }

  const nameParts = potentialName.split(' ');
  const firstName = nameParts[0] || 'Unknown';
  const middleName = nameParts.length > 2 ? nameParts[1] : '';
  const lastName =
    nameParts.length > 2 ? nameParts[2] : nameParts[1] || 'Unknown';

  let finalGender = null;

  if (genderMatch && genderMatch[0]) {
    const found = genderMatch[0].toLowerCase();

    if (['male'].includes(found)) {
      finalGender = 'male';
    }

    if (['female', 'famale', 'femail'].includes(found)) {
      finalGender = 'female';
    }
  }

  return {
    name: {
      firstName,
      middleName,
      lastName,
    },
    email,
    phone: {
      phoneNumber: phone,
      whatsappNumber: phone,
    },
    totalExperience,
    qualification,
    currentAddress,
    linkedinUrl,
    currentCompanyName,
    preferredLocations,
    maritalStatus,
    dateOfBirth,
    gender: finalGender,
  };
};
