// // resumeParser.js
// const pdfParse = require("pdf-parse");
// const natural = require("natural");
// const fs = require("fs");
// const tokenizer = new natural.WordTokenizer();
// const TfIdf = natural.TfIdf;
// const stopwords = require("stopwords").english;

// // --- Utility Functions ---
// function normalizeText(text) {
//   return text
//     .replace(/\r/g, "")
//     .replace(/\n{2,}/g, "\n")
//     .replace(/[ ]{2,}/g, " ")
//     .trim();
// }

// function extractSection(text, header) {
//   // Support multiple variations of section headers
//   const variations = [
//     header,
//     header.toUpperCase(),
//     header.toLowerCase(),
//     header + ":",
//     header.toUpperCase() + ":",
//     header.toLowerCase() + ":",
//     "PROFESSIONAL " + header.toUpperCase(),
//     "Professional " + header,
//     "ACADEMIC " + header.toUpperCase(),
//     "Academic " + header,
//     header + " HISTORY",
//     header + " History",
//   ];

//   // First try exact section matching
//   for (const variant of variations) {
//     const pattern = `(?:^|\\n)${variant}\\s*\\n([\\s\\S]+?)(?=\\n(?:[A-Z][a-z]+|[A-Z]{2,})\\s*(?:\\n|:|$)|$)`;
//     const match = text.match(new RegExp(pattern, "i"));
//     if (match && match[1].trim()) {
//       return match[1].trim();
//     }
//   }

//   // If no exact match, try fuzzy section matching
//   const sectionHeaders = text
//     .split(/\n+/)
//     .filter((line) => /^[A-Z][A-Za-z\s]*$/.test(line.trim()));
//   for (const sectionHeader of sectionHeaders) {
//     if (
//       variations.some((v) =>
//         sectionHeader.toLowerCase().includes(header.toLowerCase())
//       )
//     ) {
//       const pattern = `${sectionHeader}\\s*\\n([\\s\\S]+?)(?=\\n(?:[A-Z][a-z]+|[A-Z]{2,})\\s*(?:\\n|:|$)|$)`;
//       const match = text.match(new RegExp(pattern, "i"));
//       if (match && match[1].trim()) {
//         return match[1].trim();
//       }
//     }
//   }

//   return "";
// }

// function escapeRegExp(string) {
//   return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// }

// // --- Patterns ---
// const patterns = {
//   email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
//   phone: /(?:\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g,
//   linkedin: /linkedin\.com\/in\/[a-zA-Z0-9-]+/g,
//   github: /github\.com\/[a-zA-Z0-9-]+/g,
//   website:
//     /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/g,
// };

// const skillCategories = {
//   programmingLanguages: [
//     "JavaScript",
//     "Python",
//     "Java",
//     "C++",
//     "C#",
//     "Ruby",
//     "PHP",
//     "Swift",
//     "Kotlin",
//     "Go",
//     "Rust",
//     "TypeScript",
//     "Scala",
//   ],
//   webTechnologies: [
//     "HTML",
//     "CSS",
//     "React",
//     "Angular",
//     "Vue",
//     "Node.js",
//     "Express",
//     "Django",
//     "Flask",
//     "Spring",
//     "ASP.NET",
//   ],
//   databases: [
//     "MongoDB",
//     "MySQL",
//     "PostgreSQL",
//     "Oracle",
//     "SQL Server",
//     "Redis",
//     "Elasticsearch",
//     "Cassandra",
//   ],
//   cloudPlatforms: [
//     "AWS",
//     "Azure",
//     "Google Cloud",
//     "Heroku",
//     "DigitalOcean",
//     "Firebase",
//     "Kubernetes",
//     "Docker",
//   ],
//   tools: ["Git", "Jira", "VS Code", "Eclipse"],
//   methodologies: ["Agile", "Scrum", "Kanban", "TDD", "BDD", "DevOps", "CI/CD"],
// };

// // --- Extractors ---
// async function extractTextFromPDF(buffer) {
//   const data = await pdfParse(buffer);
//   return normalizeText(data.text);
// }

// function extractContactInfo(text) {
//   return {
//     emails: text.match(patterns.email) || [],
//     phones: text.match(patterns.phone) || [],
//     linkedin: text.match(patterns.linkedin) || [],
//     github: text.match(patterns.github) || [],
//     websites: (text.match(patterns.website) || []).filter(
//       (url) => !url.includes("linkedin.com") && !url.includes("github.com")
//     ),
//   };
// }

// function extractEducation(text) {
//   const education = [];
//   let section = extractSection(text, "Education");

//   // If no education section found, try alternative headers
//   if (!section) {
//     section =
//       extractSection(text, "Academic Background") ||
//       extractSection(text, "Educational Background") ||
//       extractSection(text, "Academic History") ||
//       extractSection(text, "Qualifications");
//   }

//   if (!section) return education;

//   const lines = section
//     .split("\n")
//     .map((line) => line.trim())
//     .filter(Boolean);

//   const degreePattern =
//     /\b(?:Bachelor['']?s?|Master['']?s?|MBA|Ph\.?D\.?|B\.?Tech|M\.?Tech|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|MSc|BSc|Associate['']?s?|Diploma|Certificate)\b[^,\n]*(?:of|in|,)?\s*([^,\n]*)/i;
//   const datePattern =
//     /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4}|\d{4})(?:\s*(?:-|to|–|—|through|until|\||\/)?\s*(?:Present|Current|Now|\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4})?)/i;
//   const universityPattern =
//     /([A-Z][A-Za-z\s&,\.]+(?:University|College|Institute|School|Academy|Tech)(?:\s+of\s+[A-Za-z\s&,\.]+)?)/;

//   let current = null;
//   let buffer = [];

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];
//     const nextLine = i < lines.length - 1 ? lines[i + 1] : "";

//     const degreeMatch =
//       line.match(degreePattern) || (nextLine && nextLine.match(degreePattern));
//     const dateMatch =
//       line.match(datePattern) || (nextLine && nextLine.match(datePattern));
//     const uniMatch =
//       line.match(universityPattern) ||
//       (nextLine && nextLine.match(universityPattern));

//     if (degreeMatch || (uniMatch && dateMatch)) {
//       if (current && (current.degree || current.institution)) {
//         if (buffer.length) {
//           current.description = buffer.join(" ").trim();
//         }
//         education.push(current);
//         buffer = [];
//       }

//       current = {
//         degree: degreeMatch ? degreeMatch[0].trim() : "",
//         field: degreeMatch ? (degreeMatch[1] || "").trim() : "",
//         institution: uniMatch ? uniMatch[1].trim() : "",
//         dates: dateMatch ? [dateMatch[0].trim()] : [],
//         description: "",
//       };
//     } else if (current) {
//       if (uniMatch && !current.institution) {
//         current.institution = uniMatch[1].trim();
//       } else if (dateMatch && !current.dates.length) {
//         current.dates = [dateMatch[0].trim()];
//       } else if (line.length > 3 && !/^[•\-\*\+]/.test(line)) {
//         buffer.push(line);
//       }
//     }
//   }

//   if (current && (current.degree || current.institution)) {
//     if (buffer.length) {
//       current.description = buffer.join(" ").trim();
//     }
//     education.push(current);
//   }

//   return education.filter(
//     (entry) =>
//       (entry.degree || entry.institution) &&
//       !entry.degree?.toLowerCase().includes("summary")
//   );
// }

// function extractExperience(text) {
//   const experience = [];
//   let section = extractSection(text, "Experience");

//   // If no experience section found, try alternative headers
//   if (!section) {
//     section =
//       extractSection(text, "Work Experience") ||
//       extractSection(text, "Professional Experience") ||
//       extractSection(text, "Employment History") ||
//       extractSection(text, "Work History") ||
//       extractSection(text, "Career History");
//   }

//   if (!section) return experience;

//   const lines = section
//     .split("\n")
//     .map((line) => line.trim())
//     .filter(Boolean);

//   const datePattern =
//     /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4}|\d{4})(?:\s*(?:-|to|–|—|through|until|\||\/)?\s*(?:Present|Current|Now|\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4})?)/i;
//   const companyPattern =
//     /^[A-Z][\w\s&\-,\.]+(?:Inc|LLC|Ltd|Limited|Corporation|Corp|Company|Co|Technologies|Solutions|Systems|Group|International)?\.?$/;
//   const titlePattern =
//     /(?:^|\s)(?:Senior|Lead|Principal|Junior|Software|Full[\s-]Stack|Front[\s-]End|Back[\s-]End|DevOps|Cloud|Data|Product|Project|Program|Technical|Sr\.?|Jr\.?|I{1,3}|IV|V|\d{1,2}\+?\s*Years?)[\s\w]+(?:Engineer|Developer|Architect|Manager|Consultant|Analyst|Designer|Specialist|Lead)/i;

//   let current = null;
//   let buffer = [];

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];
//     const nextLine = i < lines.length - 1 ? lines[i + 1] : "";

//     const dateMatch =
//       line.match(datePattern) || (nextLine && nextLine.match(datePattern));
//     const titleMatch =
//       line.match(titlePattern) || (nextLine && nextLine.match(titlePattern));
//     const companyMatch =
//       line.match(companyPattern) ||
//       (nextLine && nextLine.match(companyPattern));

//     const isNewEntry =
//       dateMatch || titleMatch || companyMatch || /^[A-Z]/.test(line);

//     if (isNewEntry) {
//       if (current && (current.title || current.company)) {
//         if (buffer.length) {
//           current.description = buffer.join(" ").trim();
//         }
//         experience.push(current);
//         buffer = [];
//       }

//       current = {
//         title: titleMatch ? titleMatch[0].trim() : "",
//         company: companyMatch ? companyMatch[0].trim() : "",
//         dates: dateMatch ? [dateMatch[0].trim()] : [],
//         description: "",
//         level: detectExperienceLevel(titleMatch ? titleMatch[0] : ""),
//       };

//       // If the line contains both title and company, try to separate them
//       if (!current.company && line.includes(" at ")) {
//         const [title, company] = line.split(" at ").map((s) => s.trim());
//         if (title) current.title = title;
//         if (company) current.company = company;
//       }
//     } else if (current) {
//       if (dateMatch && !current.dates.length) {
//         current.dates = [dateMatch[0].trim()];
//       } else if (companyMatch && !current.company) {
//         current.company = companyMatch[0].trim();
//       } else if (titleMatch && !current.title) {
//         current.title = titleMatch[0].trim();
//       } else if (line.length > 3) {
//         // Check if this line might be a continuation of title or company
//         if (!current.title && /^[A-Z]/.test(line)) {
//           current.title = line;
//         } else if (!current.company && companyPattern.test(line)) {
//           current.company = line;
//         } else {
//           buffer.push(line);
//         }
//       }
//     }
//   }

//   if (current && (current.title || current.company)) {
//     if (buffer.length) {
//       current.description = buffer.join(" ").trim();
//     }
//     experience.push(current);
//   }

//   return experience.filter(
//     (entry) => (entry.title || entry.company) && entry.description
//   );
// }

// function categorizeSkills(text) {
//   const categorizedSkills = {};
//   Object.keys(skillCategories).forEach((category) => {
//     categorizedSkills[category] = [];
//   });

//   // Try to find dedicated skills section first
//   const skillsSection = extractSection(
//     text,
//     "Skills|Technical Skills|Core Competencies|Technologies|Technical Proficiencies"
//   );
//   const textToSearch = skillsSection || text;
//   const lines = textToSearch.split("\n");

//   // Helper function for fuzzy matching
//   const fuzzyMatch = (text, skill) => {
//     const normalized = text.toLowerCase().replace(/[-_./\\]/g, "");
//     const normalizedSkill = skill.toLowerCase().replace(/[-_./\\]/g, "");
//     return normalized.includes(normalizedSkill);
//   };

//   lines.forEach((line) => {
//     const normalizedLine = line.toLowerCase();
//     Object.entries(skillCategories).forEach(([category, skills]) => {
//       skills.forEach((skill) => {
//         if (
//           !categorizedSkills[category].includes(skill) &&
//           (new RegExp(`\\b${escapeRegExp(skill)}\\b`, "i").test(line) ||
//             fuzzyMatch(line, skill))
//         ) {
//           categorizedSkills[category].push(skill);
//         }
//       });
//     });
//   });

//   return categorizedSkills;
// }

// function extractKeywords(text) {
//   const tfidf = new TfIdf();
//   const tokens = tokenizer.tokenize(text.toLowerCase());
//   const filteredTokens = tokens.filter(
//     (token) => token.length > 2 && !stopwords.includes(token)
//   );

//   // Count word frequencies
//   const wordFrequencies = {};
//   filteredTokens.forEach((token) => {
//     wordFrequencies[token] = (wordFrequencies[token] || 0) + 1;
//   });

//   tfidf.addDocument(filteredTokens);

//   const keywords = [];
//   Object.entries(wordFrequencies).forEach(([word, frequency]) => {
//     const score = tfidf.tfidf(word, 0);
//     keywords.push({ word, score, frequency });
//   });

//   keywords.sort((a, b) => b.score - a.score);

//   return {
//     keywords: keywords.slice(0, 20).map((k) => k.word),
//     wordFrequencies,
//   };
// }

// function extractProjects(text) {
//   const lines = extractSection(text, "Projects").split("\n");
//   const projects = [];
//   let current = null;

//   lines.forEach((line) => {
//     if (/^(Built|Developed|Implemented|Created|Designed)/i.test(line)) {
//       if (current) projects.push(current);
//       current = { name: line.trim(), description: "", technologies: [] };
//     } else if (current && line.trim()) {
//       current.description += line.trim() + " ";
//       Object.values(skillCategories)
//         .flat()
//         .forEach((tech) => {
//           if (line.includes(tech) && !current.technologies.includes(tech)) {
//             current.technologies.push(tech);
//           }
//         });
//     }
//   });

//   if (current) projects.push(current);
//   return projects;
// }

// function saveParsedDataToFile(data, filename = "parsed_resume.json") {
//   fs.writeFileSync(filename, JSON.stringify(data, null, 2));
// }

// async function parseResume(fileBuffer) {
//   const text = await extractTextFromPDF(fileBuffer);
//   const { keywords, wordFrequencies } = extractKeywords(text);

//   return {
//     contactInfo: extractContactInfo(text),
//     education: extractEducation(text),
//     experience: extractExperience(text),
//     skills: categorizeSkills(text),
//     projects: extractProjects(text),
//     keywords,
//     wordFrequencies,
//     rawText: text,
//   };
// }

// module.exports = {
//   parseResume,
//   extractTextFromPDF,
//   extractContactInfo,
//   extractEducation,
//   extractExperience,
//   categorizeSkills,
//   extractKeywords,
//   extractProjects,
//   saveParsedDataToFile,
// };

const pdfParse = require("pdf-parse");
const natural = require("natural");
const fs = require("fs");
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const stopwords = require("stopwords").english || require("stopwords").en;

// --- Utility Functions ---
function normalizeText(text) {
  return text
    .replace(/\r/g, "")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSection(text, header) {
  const variations = [
    header,
    header.toUpperCase(),
    header.toLowerCase(),
    header + ":",
    header.toUpperCase() + ":",
    header.toLowerCase() + ":",
    "PROFESSIONAL " + header.toUpperCase(),
    "Professional " + header,
    "ACADEMIC " + header.toUpperCase(),
    "Academic " + header,
    header + " HISTORY",
    header + " History",
  ];

  for (const variant of variations) {
    const pattern = `(?:^|\\n)${escapeRegExp(
      variant
    )}\\s*\\n([\\s\\S]+?)(?=\\n(?:[A-Z][a-z]+|[A-Z]{2,})\\s*(?:\\n|:|$)|$)`;
    const match = text.match(new RegExp(pattern, "i"));
    if (match && match[1].trim()) return match[1].trim();
  }

  const sectionHeaders = text
    .split(/\n+/)
    .filter((line) => /^[A-Z][A-Za-z\s]*$/.test(line.trim()));
  for (const sectionHeader of sectionHeaders) {
    if (
      variations.some((v) =>
        sectionHeader.toLowerCase().includes(header.toLowerCase())
      )
    ) {
      const pattern = `${escapeRegExp(
        sectionHeader
      )}\\s*\\n([\\s\\S]+?)(?=\\n(?:[A-Z][a-z]+|[A-Z]{2,})\\s*(?:\\n|:|$)|$)`;
      const match = text.match(new RegExp(pattern, "i"));
      if (match && match[1].trim()) return match[1].trim();
    }
  }

  return "";
}

// --- Patterns ---
const patterns = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(?:\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g,
  linkedin: /linkedin\.com\/in\/[a-zA-Z0-9-]+/g,
  github: /github\.com\/[a-zA-Z0-9-]+/g,
  website:
    /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/g,
};

const skillCategories = {
  programmingLanguages: [
    "JavaScript",
    "Python",
    "Java",
    "C++",
    "C#",
    "Ruby",
    "PHP",
    "Swift",
    "Kotlin",
    "Go",
    "Rust",
    "TypeScript",
    "Scala",
  ],
  webTechnologies: [
    "HTML",
    "CSS",
    "React",
    "Angular",
    "Vue",
    "Node.js",
    "Express",
    "Django",
    "Flask",
    "Spring",
    "ASP.NET",
  ],
  databases: [
    "MongoDB",
    "MySQL",
    "PostgreSQL",
    "Oracle",
    "SQL Server",
    "Redis",
    "Elasticsearch",
    "Cassandra",
  ],
  cloudPlatforms: [
    "AWS",
    "Azure",
    "Google Cloud",
    "Heroku",
    "DigitalOcean",
    "Firebase",
    "Kubernetes",
    "Docker",
  ],
  tools: ["Git", "Jira", "VS Code", "Eclipse"],
  methodologies: ["Agile", "Scrum", "Kanban", "TDD", "BDD", "DevOps", "CI/CD"],
};

// --- Extractors ---
async function extractTextFromPDF(buffer) {
  const data = await pdfParse(buffer);
  return normalizeText(data.text);
}

function extractContactInfo(text) {
  return {
    emails: text.match(patterns.email) || [],
    phones: text.match(patterns.phone) || [],
    linkedin: text.match(patterns.linkedin) || [],
    github: text.match(patterns.github) || [],
    websites: (text.match(patterns.website) || []).filter(
      (url) => !url.includes("linkedin.com") && !url.includes("github.com")
    ),
  };
}

function categorizeSkills(text) {
  const categorizedSkills = {};
  Object.keys(skillCategories).forEach(
    (category) => (categorizedSkills[category] = [])
  );

  const skillsSection =
    extractSection(text, "Skills") ||
    extractSection(text, "Technical Skills") ||
    extractSection(text, "Core Competencies") ||
    extractSection(text, "Technologies") ||
    extractSection(text, "Technical Proficiencies");

  const textToSearch = skillsSection || text;
  const lines = textToSearch.split("\n");

  const fuzzyMatch = (text, skill) => {
    const normalized = text.toLowerCase().replace(/[-_./\\]/g, "");
    const normalizedSkill = skill.toLowerCase().replace(/[-_./\\]/g, "");
    return normalized.includes(normalizedSkill);
  };

  lines.forEach((line) => {
    Object.entries(skillCategories).forEach(([category, skills]) => {
      skills.forEach((skill) => {
        if (
          !categorizedSkills[category].includes(skill) &&
          (new RegExp(`\\b${escapeRegExp(skill)}\\b`, "i").test(line) ||
            fuzzyMatch(line, skill))
        ) {
          categorizedSkills[category].push(skill);
        }
      });
    });
  });

  return categorizedSkills;
}

function extractKeywords(text) {
  const tfidf = new TfIdf();
  const tokens = tokenizer.tokenize(text.toLowerCase());
  const filteredTokens = tokens.filter(
    (token) => token.length > 2 && !stopwords.includes(token)
  );

  const wordFrequencies = {};
  filteredTokens.forEach((token) => {
    wordFrequencies[token] = (wordFrequencies[token] || 0) + 1;
  });

  tfidf.addDocument(filteredTokens);

  const keywords = [];
  Object.entries(wordFrequencies).forEach(([word, frequency]) => {
    const score = tfidf.tfidf(word, 0);
    keywords.push({ word, score, frequency });
  });

  keywords.sort((a, b) => b.score - a.score);

  return {
    keywords: keywords.slice(0, 20).map((k) => k.word),
    wordFrequencies,
  };
}

function extractProjects(text) {
  const section = extractSection(text, "Projects");
  if (!section) return [];

  const lines = section.split("\n");
  const projects = [];
  let current = null;

  lines.forEach((line) => {
    if (/^(Built|Developed|Implemented|Created|Designed)/i.test(line)) {
      if (current) projects.push(current);
      current = { name: line.trim(), description: "", technologies: [] };
    } else if (current && line.trim()) {
      current.description += line.trim() + " ";
      Object.values(skillCategories)
        .flat()
        .forEach((tech) => {
          if (line.includes(tech) && !current.technologies.includes(tech)) {
            current.technologies.push(tech);
          }
        });
    }
  });

  if (current) projects.push(current);
  return projects;
}

function saveParsedDataToFile(data, filename = "parsed_resume.json") {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}

// Dummy placeholders – implement or import your `extractEducation()` and `extractExperience()` functions here
function extractEducation(text) {
  return []; // Replace with your implementation
}

function extractExperience(text) {
  return []; // Replace with your implementation
}

async function parseResume(fileBuffer) {
  const text = await extractTextFromPDF(fileBuffer);
  const { keywords, wordFrequencies } = extractKeywords(text);

  return {
    contactInfo: extractContactInfo(text),
    education: extractEducation(text),
    experience: extractExperience(text),
    skills: categorizeSkills(text),
    projects: extractProjects(text),
    keywords,
    wordFrequencies,
    rawText: text,
  };
}

module.exports = {
  parseResume,
  extractTextFromPDF,
  extractContactInfo,
  extractEducation,
  extractExperience,
  categorizeSkills,
  extractKeywords,
  extractProjects,
  saveParsedDataToFile,
};
