/**
 * Website Scraper Service
 *
 * Scrapes website HTML content and uses AI to extract structured information
 * about projects, products, or companies including features, description,
 * category, country, and other metadata.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { projectCategories } from "@/lib/data/categories";

// Initialize AI provider (supports OpenAI, Groq, or other OpenAI-compatible APIs)
// Uses GROQ by default (as shown in example), but can be configured for OpenAI
const getAIProvider = () => {
  if (process.env.OPENAI_API_KEY) {
    return createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }

  throw new Error("OPENAI_API_KEY must be configured");
};

const getAIModel = () => {
  const modelName = process.env.OPENAI_MODEL;
  if (!modelName) throw new Error("OPENAI_MODEL must be configured");
  const provider = getAIProvider();
  return provider.chat(modelName);
};

/**
 * Structured data extracted from a website
 */
export interface WebsiteScrapeResult {
  websiteUrl: string;
  projectName: string | null;
  category: string | null;
  country: string | null;
  shortDescription: string | null;
  foundedAt: string | null;
  keyFeatures: string[];
  about: string | null;
  logoUrl: string | null;
  images: string[];
}

/**
 * Result of the scraping operation
 */
export interface ScrapeResult {
  success: boolean;
  data?: WebsiteScrapeResult;
  error?: string;
}

/**
 * Strips HTML tags and extracts clean text content
 * Removes scripts, styles, and other non-content elements
 */
function extractTextContent(html: string): string {
  return (
    html
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove style tags and their content
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      // Remove all HTML tags
      .replace(/<[^>]+>/g, " ")
      // Normalize whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Gets the Chrome executable path for the current environment
 */
async function getChromePath(): Promise<{ executablePath: string; args: string[] }> {
  const isServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL;

  if (isServerless) {
    // Use @sparticuz/chromium for serverless (Vercel/Lambda)
    const chromium = (await import("@sparticuz/chromium")).default;
    return {
      executablePath: await chromium.executablePath(),
      args: chromium.args,
    };
  }

  // Local development - find local Chrome installation
  const possiblePaths = [
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    // Windows
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];

  const fs = await import("fs");
  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      return {
        executablePath: chromePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      };
    }
  }

  throw new Error("Chrome not found. Please install Google Chrome for local development.");
}

/**
 * Fetches fully rendered HTML content from a URL using a headless browser
 * This ensures we get the content as users see it, including JavaScript-rendered content
 */
async function fetchWebsiteHTML(url: string): Promise<string> {
  const puppeteer = await import("puppeteer-core");
  const { executablePath, args } = await getChromePath();

  const parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
  const targetUrl = parsedUrl.toString();

  let browser;
  try {
    browser = await puppeteer.launch({
      args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    // Set a realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Navigate to the page and wait for content to load
    // Wait for network to be idle (no requests for 500ms) or timeout after 15 seconds
    await page.goto(targetUrl, {
      waitUntil: "networkidle2", // Wait until there are no more than 2 network connections for at least 500ms
      timeout: 15000, // 15 second timeout for page load
    });

    // Additional wait for any lazy-loaded content
    // Wait a bit more for React/Vue/Angular apps to fully render
    // Use Promise-based delay instead of deprecated waitForTimeout
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get the fully rendered HTML
    const html = await page.content();

    return html;
  } catch (error) {
    console.error("Error fetching website with Puppeteer:", error);

    // If Puppeteer fails, throw a descriptive error
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        throw new Error("Request timed out while loading the website");
      }
      if (error.message.includes("net::ERR")) {
        throw new Error(`Failed to load website: ${error.message}`);
      }
      throw new Error(`Failed to fetch website: ${error.message}`);
    }

    throw new Error("Failed to fetch website with headless browser");
  } finally {
    // Always close the browser to free up resources
    if (browser) {
      await browser.close().catch((err: unknown) => {
        console.error("Error closing browser:", err);
      });
    }
  }
}

/**
 * Uses AI to analyze website content and extract structured information
 */
/**
 * Extracts favicon URL from HTML (for logo)
 */
function extractLogoUrl(html: string, baseUrl: string): string | null {
  try {
    const parsedUrl = new URL(baseUrl);
    const baseOrigin = `${parsedUrl.protocol}//${parsedUrl.host}`;

    // Try favicon/apple-touch-icon (prioritize these for logo)
    const iconMatch = html.match(
      /<link[^>]+rel=["'](?:apple-touch-icon|icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i
    );
    if (iconMatch) {
      const icon = iconMatch[1];
      return icon.startsWith("http") ? icon : `${baseOrigin}${icon}`;
    }

    // Fallback: try default favicon paths
    const defaultFavicon = `${baseOrigin}/favicon.ico`;
    // We can't check if it exists here, but it's a common path
    return defaultFavicon;
  } catch {
    return null;
  }
}

/**
 * Extracts image URLs from HTML (og:image and other meta images)
 */
function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  try {
    const parsedUrl = new URL(baseUrl);
    const baseOrigin = `${parsedUrl.protocol}//${parsedUrl.host}`;

    // Extract Open Graph image (primary image)
    const ogImageMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
    );
    if (ogImageMatch) {
      const ogImage = ogImageMatch[1];
      const fullUrl = ogImage.startsWith("http")
        ? ogImage
        : `${baseOrigin}${ogImage}`;
      images.push(fullUrl);
    }

    // Extract Twitter card image
    const twitterImageMatch = html.match(
      /<meta\s+(?:name|property)=["']twitter:image["']\s+content=["']([^"']+)["']/i
    );
    if (twitterImageMatch) {
      const twitterImage = twitterImageMatch[1];
      const fullUrl = twitterImage.startsWith("http")
        ? twitterImage
        : `${baseOrigin}${twitterImage}`;
      // Only add if different from og:image
      if (!images.includes(fullUrl)) {
        images.push(fullUrl);
      }
    }

    return images;
  } catch {
    return [];
  }
}

async function analyzeWebsiteContent(
  url: string,
  html: string,
  textContent: string
): Promise<WebsiteScrapeResult> {
  console.log("Analyzing website content for URL:", url);
  console.log("\n\n\nHTML:", html);
  console.log("\n\n\nText content:", textContent);

  // Limit text content to avoid token limits (keep first 8000 characters)
  const limitedTextContent = textContent.slice(0, 8000);

  // Try to extract basic metadata from HTML before AI analysis
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Clean title (remove common separators like " - ", " | ", etc.)
  let cleanTitle: string | null = null;
  if (title) {
    const extracted = title.split(/\s+[-|:•]\s+/)[0].trim();
    if (extracted.length >= 2) {
      cleanTitle = extracted;
    } else {
      cleanTitle = title;
    }
  }

  // Extract logo URL (favicon) and images (og:image, etc.)
  const logoUrl = extractLogoUrl(html, url);
  const images = extractImages(html, url);

  try {
    const model = getAIModel();

    const result = await generateText({
      model,
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing websites and extracting key information about projects, products, or companies. Your task is to analyze the website content and provide structured information in JSON format.

Rules:
- Extract the project/product name (use the website title if available)
- Identify the category - MUST be one of the following valid categories only:
  ${projectCategories.join(", ")}
  Choose the category that best matches the project. If none match closely, use "Other".
- Try to identify the country/region if mentioned (use 2-letter ISO country code)
- Create a short description (under 200 characters)
- Extract the founding year/date if available (format as YYYY or YYYY-MM-DD)
- List key features or value propositions (3-10 items as an array)
- Provide a comprehensive "about" section with as much information as possible from the website

Return ONLY valid JSON with this exact structure:
{
  "projectName": "Project name or null",
  "category": "One of the valid categories listed above, or Other if truly unknown or not found",
  "country": "Country 2-letter ISO code or null",
  "shortDescription": "Brief description under 200 characters or null",
  "foundedAt": "YYYY or YYYY-MM-DD or null",
  "keyFeatures": ["feature1", "feature2", "feature3"],
  "about": "Comprehensive description with as much information as possible from the website or null (use paragraphs separated by blank lines)"
}

Important:
- If information is not available, use null (not empty string)
- category MUST be exactly one of the valid categories listed above, or Other if truly unknown or not found
- keyFeatures should always be an array (even if empty)
- about should contain as much detail as possible from the website content
- format about in 2-4 paragraphs separated by a blank line (use \\n\\n)
- Be accurate and only extract information that is actually present in the content`,
        },
        {
          role: "user",
          content: `Analyze this website and extract structured information:

URL: ${url}
Title: ${title || "Not available"}

Website Content:
${limitedTextContent}`,
        },
      ],
      temperature: 0.3,
    });

    const aiResponse = result.text.trim();

    // Try to parse JSON response
    // Sometimes AI wraps JSON in markdown code blocks
    let jsonStr = aiResponse;
    if (aiResponse.startsWith("```")) {
      // Extract JSON from markdown code block
      const match = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        jsonStr = match[1].trim();
      }
    }

    const aiData = JSON.parse(jsonStr) as Partial<WebsiteScrapeResult>;

    // Merge AI analysis with URL and ensure all required fields
    return {
      websiteUrl: url,
      projectName: aiData.projectName || cleanTitle || null,
      category: aiData.category || null,
      country: aiData.country || null,
      shortDescription: aiData.shortDescription || null,
      foundedAt: aiData.foundedAt || null,
      keyFeatures: Array.isArray(aiData.keyFeatures) ? aiData.keyFeatures : [],
      about: aiData.about || null,
      logoUrl: logoUrl,
      images: images,
    };
  } catch (error) {
    console.error("AI analysis error:", error);

    // Return basic structure with minimal data if AI fails
    return {
      websiteUrl: url,
      projectName: cleanTitle,
      category: null,
      country: null,
      shortDescription: null,
      foundedAt: null,
      keyFeatures: [],
      about: null,
      logoUrl: logoUrl,
      images: images,
    };
  }
}

/**
 * Main function to scrape a website and extract structured information
 *
 * @param url - The website URL to scrape (with or without http/https)
 * @returns Promise with scrape result containing structured data
 *
 * @example
 * ```typescript
 * const result = await scrapeWebsite('https://example.com')
 * if (result.success) {
 *   console.log(result.data.projectName)
 *   console.log(result.data.keyFeatures)
 * }
 * ```
 */
export async function scrapeWebsite(url: string): Promise<ScrapeResult> {
  try {
    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return {
        success: false,
        error: "Invalid URL format",
      };
    }

    // Fetch website HTML
    const html = await fetchWebsiteHTML(parsedUrl.toString());

    // Extract text content from HTML
    const textContent = extractTextContent(html);

    // Use AI to analyze and extract structured information
    const data = await analyzeWebsiteContent(
      parsedUrl.toString(),
      html,
      textContent
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error scraping website:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // Handle timeout errors
      if (error.name === "TimeoutError" || error.message.includes("timeout")) {
        return {
          success: false,
          error: "Request timed out while fetching the website",
        };
      }

      // Handle fetch errors
      if (error.message.includes("Failed to fetch")) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Handle AI configuration errors
      if (error.message.includes("must be configured")) {
        return {
          success: false,
          error:
            "AI service not configured. Please set GROQ_API_KEY or OPENAI_API_KEY",
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to scrape website metadata",
    };
  }
}
