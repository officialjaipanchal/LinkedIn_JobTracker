const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs").promises;

// Email template types
const EMAIL_TEMPLATES = {
  DAILY_DIGEST: "daily-digest",
  INSTANT_ALERT: "instant-alert",
  WEEKLY_SUMMARY: "weekly-summary",
};

// Alert preferences schema
const DEFAULT_ALERT_PREFERENCES = {
  minMatchScore: 70,
  alertFrequency: "daily", // instant, daily, weekly
  alertTime: "09:00", // For daily/weekly alerts
  keywords: [],
  excludeKeywords: [],
  locations: [],
  remoteOnly: false,
  salaryMin: 0,
  jobTypes: [], // empty means all types
  companies: [], // empty means all companies
  maxJobsPerAlert: 10,
};

/**
 * Create a nodemailer transporter
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Format job details for email
 * @param {Object} job - Job object
 * @returns {string} - Formatted HTML
 */
function formatJobDetails(job) {
  const salary = job.salary
    ? `<p><strong>Salary:</strong> ${job.salary}</p>`
    : "";
  const benefits = job.benefits?.length
    ? `<p><strong>Benefits:</strong> ${job.benefits.join(", ")}</p>`
    : "";

  return `
    <div class="job-card">
      <h3>${job.title} at ${job.company}</h3>
      <p><strong>Location:</strong> ${job.location} ${
    job.isRemote ? "(Remote)" : ""
  }</p>
      <p><strong>Match Score:</strong> ${job.matchScore}%</p>
      <p><strong>Job Type:</strong> ${job.jobType}</p>
      ${salary}
      ${benefits}
      <p><strong>Required Skills:</strong> ${job.skills.join(", ")}</p>
      <p><strong>Posted:</strong> ${new Date(
        job.datePosted
      ).toLocaleDateString()}</p>
      <div class="cta-button">
        <a href="${job.url}" class="view-job-btn">View Job Details</a>
      </div>
    </div>
  `;
}

/**
 * Generate email HTML content
 * @param {string} template - Template type
 * @param {Object} data - Template data
 * @returns {string} - Complete HTML content
 */
async function generateEmailContent(template, data) {
  const styles = `
    <style>
      .job-card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        background: #ffffff;
      }
      .job-card h3 {
        color: #2557a7;
        margin-top: 0;
      }
      .view-job-btn {
        display: inline-block;
        background: #2557a7;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        text-decoration: none;
        margin-top: 10px;
      }
      .stats {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
      }
    </style>
  `;

  const { matchedJobs, preferences, stats } = data;
  const jobsHtml = matchedJobs.map(formatJobDetails).join("");

  const statsHtml = stats
    ? `
    <div class="stats">
      <h3>Job Search Statistics</h3>
      <p>Total Jobs Found: ${stats.total}</p>
      <p>Remote Jobs: ${stats.remote}</p>
      <p>Average Match Score: ${stats.averageMatchScore}%</p>
    </div>
  `
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${styles}
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h2>Job Matches Found</h2>
        <p>Based on your preferences:</p>
        <ul>
          ${
            preferences.keywords.length
              ? `<li>Keywords: ${preferences.keywords.join(", ")}</li>`
              : ""
          }
          ${
            preferences.locations.length
              ? `<li>Locations: ${preferences.locations.join(", ")}</li>`
              : ""
          }
          ${preferences.remoteOnly ? "<li>Remote Only: Yes</li>" : ""}
          ${
            preferences.jobTypes.length
              ? `<li>Job Types: ${preferences.jobTypes.join(", ")}</li>`
              : ""
          }
        </ul>
        ${statsHtml}
        <div class="jobs-container">
          ${jobsHtml}
        </div>
        <p style="margin-top: 30px; color: #666;">
          To update your job alert preferences, please visit your account settings.
        </p>
      </body>
    </html>
  `;
}

/**
 * Send job alerts via email
 * @param {string} toEmail - Recipient email address
 * @param {Array} matchedJobs - Array of matched jobs
 * @param {Object} preferences - User's alert preferences
 * @param {Object} stats - Job search statistics
 * @returns {Promise} - Email sending result
 */
async function sendJobAlert(
  toEmail,
  matchedJobs,
  preferences = DEFAULT_ALERT_PREFERENCES,
  stats = null
) {
  // Filter jobs based on preferences
  const filteredJobs = matchedJobs
    .filter((job) => job.matchScore >= preferences.minMatchScore)
    .filter((job) => !preferences.remoteOnly || job.isRemote)
    .filter(
      (job) =>
        !preferences.jobTypes.length ||
        preferences.jobTypes.includes(job.jobType)
    )
    .filter(
      (job) =>
        !preferences.companies.length ||
        preferences.companies.includes(job.company)
    )
    .filter((job) =>
      job.salary ? parseInt(job.salary) >= preferences.salaryMin : true
    )
    .slice(0, preferences.maxJobsPerAlert);

  if (!filteredJobs.length) {
    console.log("No jobs match the user's preferences");
    return null;
  }

  const emailContent = await generateEmailContent(
    EMAIL_TEMPLATES.DAILY_DIGEST,
    {
      matchedJobs: filteredJobs,
      preferences,
      stats,
    }
  );

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: `${filteredJobs.length} New Job Matches Found!`,
    html: emailContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

module.exports = {
  sendJobAlert,
  EMAIL_TEMPLATES,
  DEFAULT_ALERT_PREFERENCES,
};
