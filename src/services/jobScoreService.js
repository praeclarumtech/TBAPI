import fs from 'fs';
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import mammoth from 'mammoth';
import WordExtractor from 'word-extractor';

const extractTextFromFile = async (file) => {
  if (!file) return '';

  const ext = file.originalname.split('.').pop().toLowerCase();
  const buffer = new Uint8Array(fs.readFileSync(file.path));

  if (ext === 'pdf') {
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
  } else if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (ext === 'doc') {
    const extractor = new WordExtractor();
    const doc = await extractor.extract(file.path);
    return doc.getBody();
  }

  return '';
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

  if (resumeFile) fs.unlinkSync(resumeFile.path);
  if (jdFile) fs.unlinkSync(jdFile.path);

  const score = calculateJobScore(resumeText, jobDescriptionText);

  return { score}
};