import mammoth from 'mammoth';
import fs from 'fs'; 
import * as pdfjsLib from 'pdfjs-dist';

export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const uint8Array = new Uint8Array(dataBuffer);

    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    let extractedText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      extractedText += textContent.items.map((item) => item.str.trim()).join(' ') + '\n';
    }

    return extractedText.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return null;
  }
};

export const extractTextFromDocx = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    return null;
  }
};

export const parseResumeText = (text) => {
  const emailRegex = /[a-zA-Z0-9._%+-]+ ?@ ?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(\+91\s?)?[6-9]\d{4}\s?\d{5}/;
  // const nameMatch = text.match(/Name:\s*(.+)/i);
  const nameTagRegex = /(?:Name|Full Name)\s*[:\-]\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?(?:\s[A-Z][a-z]+)?)/i;
  // const genderMatch = text.match(/Gender:\s*(Male|Female|Other|gender)/i);
  const skillsMatch = text.match(/(Technical Skills|Skills)[:\s]*(.*)/i);
  const experienceRegex = /(\d+(?:\.\d+)?)\s*(?:\+?\s*years?|yrs?|year)/gi;
  const matches = [...text.matchAll(experienceRegex)].map(match => parseFloat(match[1]));
  const qualificationMatch = text.match(/(Bachelor|Master|B\.Sc|M\.Sc|BTech|MTech|PhD|tech).*?\n/i);
  // const appliedRoleMatch = text.match(/(Applied Role|Position Applied |Role)[:\s]*(.*)/i);
  const locationMatch = text.match(/(Address|Location|City|Current Address)[:\s]*(.*)/i);
  const preferredLocationsMatch = text.match(/(preferred location)[:\s]*(.*)/i);
  const linkedInMatch = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/[a-zA-Z0-9-_/]+/);
  const currentCompanyMatch = text.match(/(Current Employer|Current Company|Company Name)[:\s]*(.*)/i);
  const maritalStatusMatch = text.match(/Marital Status:\s*(Single|Married)/i);
  const dobMatch = text.match(/Date of Birth:\s*(\d{2}[-/]\d{2}[-/]\d{4})/i);


  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[0].replace(/\s+/g, '') : '';
  const phoneMatch = text.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : ''; 
  // const name = nameMatch ? `${nameMatch[1]} ${nameMatch[2]} ${nameMatch[3]}` : '';
  // const gender = genderMatch ? genderMatch[1] : '';
  // const skills = skillsMatch ? skillsMatch[2].split(',').map(skill => skill.trim()) : [];
  const totalExperience = matches.length > 0 ? Math.max(...matches) : 0;
  const qualification = qualificationMatch ? qualificationMatch[1] : "Not Provided";
  // const appliedRole = appliedRoleMatch ? appliedRoleMatch[2].trim() : "Na";
  const currentAddress = locationMatch ? locationMatch[0] : "Not Provided";
  const preferredLocations = preferredLocationsMatch ? preferredLocationsMatch[2] : "Not Provided";
  const linkedinUrl = linkedInMatch ? linkedInMatch[0] : "Not Found";
  const currentCompanyName = currentCompanyMatch ? currentCompanyMatch[2].trim() : "Not Provided";
  const maritalStatus = maritalStatusMatch ? maritalStatusMatch[1] : '';
  const dateOfBirth = dobMatch ? new Date(dobMatch[1].split('/').reverse().join('-')) : null;

  const skillWordList = [
    "JavaScript", "JS", "TypeScript", "Node.js", "Node", "React", "Angular", "Vue.js", "Vue",
    "HTML", "CSS", "Bootstrap", "Tailwind", "SASS", "LESS",
    "Python", "Django", "Flask", "Java", "Spring", "Spring Boot",
    "C#", ".NET", "ASP.NET", "ADO.NET", "C+", "C",
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Firebase", "Oracle",
    "GraphQL", "REST API", "SOAP", "Git", "GitHub", "GitLab",
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes",
    "Jenkins", "CI/CD", "Terraform", "Ansible", "Linux", "Bash","Php","Dot Net","ASP.Net", "MVC", "XML", "WPF", "MVVM",
    "jQuery", "ajax", "Linq", "Sqlite", "Ado.Net", "MSMQ", "IBM Cloud", "DAX", "Magento", "Nest", "laravel", "Agile Methodology",
    "Codeigniter" 
  ];

  const escapeRegex = (word) => word.replace(/[.*?^${}()|[\]\\]/g, '\\$&');

// Function to extract skills that match `skillWordList`
const extractMatchingWords = (text, skillWordList) => {
  return skillWordList.filter(word =>
    new RegExp(`\\b${escapeRegex(word)}\\b`, "i").test(text)
  );
};

  let skills = [];

  if (skillsMatch) {
    skills = skillsMatch[2]
      .replace(/[●►⇨]/g, '')
      .split(/,|\n|•/) 
      .map(skill => skill.trim())
      .filter(skill => skill.length > 1);

      skills = extractMatchingWords(skills.join(" "), skillWordList);
  }

  let potentialName = "Unknown";

  const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);

  // SSearch for "Name:" tag in text
  const nameTagMatch = text.match(nameTagRegex);
  if (nameTagMatch) {
    potentialName = nameTagMatch[1];
  }

if (potentialName === "Unknown" && email) {
  let emailPrefix = email.split("@")[0].replace(/[0-9._]/g, "").trim();

  if (emailPrefix.length >= 4) {
    emailPrefix = emailPrefix.substring(0, 4);
  }

  if (emailPrefix) {
    const wordRegex = new RegExp(`\\b${emailPrefix}\\w*\\b`, "i");
    const matchedWord = text.match(wordRegex);

    if (matchedWord) {
      let firstName = matchedWord[0];

      const lastNameRegex = new RegExp(`\\b${firstName}\\b\\s+([A-Z][a-z]+)`, "i");
      const lastNameMatch = text.match(lastNameRegex);

      let lastName = lastNameMatch ? lastNameMatch[1] : "Unknown";

      potentialName = `${firstName} ${lastName}`;
    }
  }
} 
  
  console.log('textttttttttttttttt?>>>>>>>>',text)
  console.log('textttttttttttttttt?>>>>>>>>',email)
  console.log('textttttttttttttttt?>>>>>>>>',phone)

  const nameParts = potentialName.split(" ");
  const firstName = nameParts[0] || "Unknown";
  const middleName = nameParts.length > 2 ? nameParts[1] : "";
  const lastName = nameParts.length > 2 ? nameParts[2] : nameParts[1] || "Unknown";

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
  appliedSkills: skills,
  totalExperience,
  qualification,
  // appliedRole,
  currentAddress,
  linkedinUrl,
  currentCompanyName,
  preferredLocations,
  // gender,
  maritalStatus,
  dateOfBirth,
};
}
