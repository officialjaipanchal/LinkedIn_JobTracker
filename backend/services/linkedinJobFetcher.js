const puppeteer = require("puppeteer");
const Job = require("../models/Job");

class LinkedInFetcher {
  constructor() {
    this.baseUrl = "https://www.linkedin.com/jobs/search/";
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  async waitForSelectorWithTimeout(page, selector, timeout = 10000) {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.log(`Timeout waiting for selector: ${selector}`);
      return false;
    }
  }

  async retry(fn, retries = this.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying... ${retries} attempts left`);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return this.retry(fn, retries - 1);
      }
      throw error;
    }
  }

  async fetchJobs(
    keywords = ["software developer"],
    location = "",
    hours = 24
  ) {
    let browser;
    try {
      console.log(
        `[INFO] Starting LinkedIn job fetch with keywords: ${keywords.join(
          ", "
        )}`
      );

      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      );

      const searchParams = new URLSearchParams({
        keywords: keywords.join(" "),
        location: location || "",
        f_TPR: `r${hours * 3600}`,
        sortBy: "DD",
      });

      const url = `${this.baseUrl}?${searchParams.toString()}`;
      console.log(`[INFO] Fetching jobs from: ${url}`);

      await this.retry(async () => {
        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });
      });

      // Wait for job cards to load
      await page.waitForSelector(".jobs-search__results-list", {
        timeout: 10000,
      });
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Use setTimeout instead of waitForTimeout

      // Scroll to load more jobs
      await autoScroll(page);

      const isBlocked = await page.evaluate(() => {
        return (
          document.body.innerText.includes("unusual traffic") ||
          document.body.innerText.includes("security check") ||
          document.body.innerText.includes("verify you're not a robot")
        );
      });

      if (isBlocked) {
        throw new Error(
          "LinkedIn is blocking the request. Consider using a proxy or adding delays."
        );
      }

      const jobs = await page.evaluate(() => {
        const cards = document.querySelectorAll(
          "ul.jobs-search__results-list li, .job-card-container, .base-card, .jobs-search-results__list-item"
        );

        return Array.from(cards).map((card) => {
          // Try multiple selectors for each field
          const title =
            card.querySelector(".base-search-card__title")?.innerText.trim() ||
            card.querySelector(".job-card-list__title")?.innerText.trim() ||
            card.querySelector("h3")?.innerText.trim() ||
            "";

          const company =
            card
              .querySelector(".base-search-card__subtitle")
              ?.innerText.trim() ||
            card
              .querySelector(".job-card-container__company-name")
              ?.innerText.trim() ||
            card
              .querySelector(".job-card-container__primary-description")
              ?.innerText.trim() ||
            "";

          const location =
            card
              .querySelector(".job-search-card__location")
              ?.innerText.trim() ||
            card
              .querySelector(".job-card-container__metadata-item")
              ?.innerText.trim() ||
            card
              .querySelector(".job-card-container__metadata-wrapper")
              ?.innerText.trim() ||
            "";

          const url =
            card.querySelector("a.base-card__full-link")?.href ||
            card.querySelector("a.job-card-container__link")?.href ||
            card.querySelector("a")?.href ||
            "";

          const jobId =
            card.getAttribute("data-job-id") ||
            card.getAttribute("data-job-id") ||
            url.split("/").pop() ||
            "";

          const description =
            card
              .querySelector(".base-search-card__snippet")
              ?.innerText.trim() ||
            card
              .querySelector(".job-card-container__description")
              ?.innerText.trim() ||
            card
              .querySelector(".job-card-container__snippet")
              ?.innerText.trim() ||
            "No description available";

          // Extract posted date
          const postedDateText =
            card
              .querySelector(".job-search-card__listdate")
              ?.innerText.trim() ||
            card
              .querySelector(".job-card-container__footer-item")
              ?.innerText.trim() ||
            card
              .querySelector(".job-card-container__metadata-item")
              ?.innerText.trim() ||
            "";

          // Parse the posted date
          let datePosted = new Date();
          if (postedDateText) {
            const now = new Date();
            const lowerText = postedDateText.toLowerCase();

            try {
              if (lowerText.includes("hour") || lowerText.includes("minute")) {
                // Posted within the last hour
                datePosted = now;
              } else if (lowerText.includes("day")) {
                // Posted X days ago
                const days = parseInt(postedDateText);
                if (!isNaN(days)) {
                  datePosted = new Date(
                    now.getTime() - days * 24 * 60 * 60 * 1000
                  );
                }
              } else if (lowerText.includes("week")) {
                // Posted X weeks ago
                const weeks = parseInt(postedDateText);
                if (!isNaN(weeks)) {
                  datePosted = new Date(
                    now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000
                  );
                }
              } else if (lowerText.includes("month")) {
                // Posted X months ago
                const months = parseInt(postedDateText);
                if (!isNaN(months)) {
                  datePosted = new Date(
                    now.getTime() - months * 30 * 24 * 60 * 60 * 1000
                  );
                }
              } else {
                // Try to parse as a regular date string
                const parsedDate = new Date(postedDateText);
                if (!isNaN(parsedDate.getTime())) {
                  datePosted = parsedDate;
                }
              }
            } catch (error) {
              console.error(
                `[ERROR] Failed to parse date: ${postedDateText}`,
                error
              );
              datePosted = now; // Fallback to current date
            }
          }

          // Ensure datePosted is a valid Date object
          if (!(datePosted instanceof Date) || isNaN(datePosted.getTime())) {
            console.error(`[ERROR] Invalid date object for job: ${title}`);
            datePosted = new Date();
          }

          return {
            title,
            company,
            location,
            url,
            jobId,
            description,
            source: "linkedin",
            datePosted: datePosted.toISOString(), // Convert to ISO string
            jobType: "full-time",
            isRemote: location.toLowerCase().includes("remote"),
            requirements: [],
            benefits: [],
            salary: "",
            status: "not_applied", // Changed from "new" to "not_applied"
          };
        });
      });

      if (!jobs.length) {
        throw new Error(
          "Could not find job cards. LinkedIn layout might have changed."
        );
      }

      console.log(`[INFO] Extracted ${jobs.length} jobs from LinkedIn.`);

      const savedJobs = [];
      for (const job of jobs) {
        try {
          if (!job.url || !job.title) {
            console.log(`[WARN] Skipping invalid job: ${JSON.stringify(job)}`);
            continue;
          }

          // Check if job already exists by URL (most reliable identifier)
          const existing = await Job.findOne({ url: job.url });

          if (existing) {
            console.log(
              `[INFO] Skipping existing job: ${job.title} at ${job.company}`
            );
            savedJobs.push(existing);
            continue;
          }

          // Create new job with validated date
          const newJob = await Job.create({
            ...job,
            source: "linkedin",
            jobType: "full-time",
            isRemote: job.location.toLowerCase().includes("remote"),
            requirements: [],
            benefits: [],
            salary: "",
            keywords: keywords,
            status: "not_applied",
            lastUpdated: new Date().toISOString(),
          });
          console.log(
            `[SUCCESS] Saved new job: ${newJob.title} at ${newJob.company} (Posted: ${newJob.datePosted})`
          );
          savedJobs.push(newJob);
        } catch (e) {
          console.error(`[ERROR] Failed to save job: ${job.title}`, e.message);
        }
      }

      console.log(
        `[INFO] Processed ${jobs.length} jobs: ${savedJobs.length} new jobs saved`
      );
      return savedJobs;
    } catch (error) {
      console.error("[ERROR] Error in LinkedIn fetcher:", error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

const linkedinFetcher = new LinkedInFetcher();
module.exports = linkedinFetcher;

// Update the autoScroll function
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
  // Add a small delay after scrolling
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
