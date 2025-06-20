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

  // return {
  //   score,
    // insights: {
    //   matchedKeywords,
    //   missingKeywords: jdKeywords.filter(w => !resumeKeywords.includes(w)),
    //   totalJDKeywords: jdKeywords.length,
    //   totalResumeKeywords: resumeKeywords.length,
    // }
  // };
};

// const stopwords = new Set([
//   "the", "and", "with", "from", "that", "this", "have", "for", "you", "are", "but", "not", "all", "any", "can", "your", "has", "more", "will", "our"
// ]);

// // Synonym normalization map
// const synonymMap = {
//   js: 'javascript',
//   nodejs: 'node',
//   expressjs: 'express',
//   mern: ['mongodb', 'express', 'react', 'node']
// };

// const normalizeWord = (word) => {
//   if (synonymMap[word]) {
//     return synonymMap[word];
//   }
//   return word;
// };

// // Tokenizer with normalization
// const tokenizeAndNormalize = (text) => {
//   return text
//     .toLowerCase()
//     .split(/\W+/)
//     .filter(word => word.length > 3 && !stopwords.has(word))
//     .flatMap(word => {
//       const normalized = normalizeWord(word);
//       return Array.isArray(normalized) ? normalized : [normalized];
//     });
// };

// export const calculateJobScore = (resumeText, jdText, jobMeta = {}) => {
//   const resumeKeywords = [...new Set(tokenizeAndNormalize(resumeText))];
//   const jdKeywords = [...new Set(tokenizeAndNormalize(jdText))];

//   // Skills match (assume from resume/jd text, or jobMeta.skills)
//   const skills = jobMeta.skills || ["nodejs","mongodb"];

//   console.log("aAAAAAAAAAAAAAAA>>",jobMeta)
//   const normalizedSkills = skills.map(s => normalizeWord(s.toLowerCase()));
//   const matchedSkills = normalizedSkills.filter(skill => resumeKeywords.includes(skill));
//   const skillScore = normalizedSkills.length > 0
//     ? (matchedSkills.length / normalizedSkills.length) * 50
//     : 0;

//   // Role match
//   let roleScore = 0;
//   if (jobMeta.role) {
//     const normalizedRole = normalizeWord(jobMeta.role.toLowerCase());
//     if (resumeKeywords.includes(normalizedRole)) {
//       roleScore = 30;
//     }
//   }

//   // JD keyword match
//   const matchedKeywords = jdKeywords.filter(word => resumeKeywords.includes(word));
//   const keywordScore = jdKeywords.length > 0
//     ? (matchedKeywords.length / jdKeywords.length) * 20
//     : 0;

//   const finalScore = Math.round(skillScore + roleScore + keywordScore);

//   return {
//     score: finalScore,
//     insights: {
//       matchedSkills,
//       missingSkills: normalizedSkills.filter(skill => !resumeKeywords.includes(skill)),
//       matchedRole: roleScore === 30 ? jobMeta.role : null,
//       matchedKeywords,
//       missingKeywords: jdKeywords.filter(w => !resumeKeywords.includes(w)),
//       totalJDKeywords: jdKeywords.length,
//       totalResumeKeywords: resumeKeywords.length
//     }
//   };
// };



// const calculateJobScore = (resumeText, jdText) => {
//   const resumeWords = resumeText.toLowerCase().split(/\W+/);
//   const jdWords = jdText.toLowerCase().split(/\W+/);

//   const jdKeywords = [...new Set(jdWords.filter(word => word.length > 3))];
//   const resumeKeywords = [...new Set(resumeWords)];

//   const matchedKeywords = jdKeywords.filter(word => resumeKeywords.includes(word));

//   const score = Math.round((matchedKeywords.length / jdKeywords.length) * 100);

//   const insights = {
//     matchedKeywords,
//     missingKeywords: jdKeywords.filter(word => !resumeKeywords.includes(word)),
//     totalJDKeywords: jdKeywords.length,
//     totalResumeKeywords: resumeKeywords.length,
//   };

//   return { score, insights };
// }

export const processResumeAndJD = async (resumeFile, jdFile, jdText) => {
  const resumeText = await extractTextFromFile(resumeFile);
  const jobDescriptionText = jdText || await extractTextFromFile(jdFile);

  if (resumeFile) fs.unlinkSync(resumeFile.path);
  if (jdFile) fs.unlinkSync(jdFile.path);

  const { score, insights } = calculateJobScore(resumeText, jobDescriptionText);

  return { score, insights };
};