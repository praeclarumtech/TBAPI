import fs from 'fs';
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import mammoth from 'mammoth';
import WordExtractor from 'word-extractor';
import { Message } from '../utils/constant/message.js';

const extractTextFromFile = async (file) => {
  if (!file) return '';

  const filePath = file.path;
  const fileType = file.mimetype;

  const buffer = new Uint8Array(fs.readFileSync(file.path));
 switch (fileType) {
    case 'application/pdf': {
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText.replace(/\s+/g, ' ').trim();
    }
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case 'application/msword': {
      const extractor = new WordExtractor();
      const doc = await extractor.extract(filePath);
      return doc.getBody();
    }
    default:
      throw new Error(`${Message.UNSUPPORTED_FILE}`);
  }
};


export const calculateJobScore = (resumeText, jdText) => {
  const resumeWords = resumeText.toLowerCase().split(/\W+/);
  const jdWords = jdText.toLowerCase().split(/\W+/);

  const jdKeywords = [...new Set(jdWords.filter(word => word.length > 3))];
  const resumeKeywords = [...new Set(resumeWords)];

  const matchedKeywords = jdKeywords.filter(word => resumeKeywords.includes(word));
  const score = Math.round((matchedKeywords.length / jdKeywords.length) * 100);

  return score;
};

export const processResumeAndJD = async (resumeFile, jdFile, jdText) => {
  const resumeText = await extractTextFromFile(resumeFile);
  const jobDescriptionText = jdText || await extractTextFromFile(jdFile);

  const score = calculateJobScore(resumeText, jobDescriptionText);

  return { score}
};