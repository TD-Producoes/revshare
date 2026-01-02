/**
 * Project Categories
 *
 * This is the source of truth for valid project categories.
 * All category selections should use this constant array.
 */

export const projectCategories = [
  "Productivity",
  "Developer Tools",
  "Data & Analytics",
  "Marketing",
  "Design",
  "Finance & FinTech",
  "Education & EdTech",
  "E-commerce",
  "SaaS",
  "Health & Fitness",
  "Healthcare & HealthTech",
  "Real Estate",
  "Travel & Hospitality",
  "Food & Beverage",
  "Entertainment",
  "Gaming",
  "Social Media",
  "Communication",
  "HR & Recruiting",
  "Legal & Compliance",
  "Security & Privacy",
  "IoT & Hardware",
  "Blockchain & Crypto",
  "AI & Machine Learning",
  "Automation",
  "Logistics & Supply Chain",
  "Energy & Utilities",
  "Agriculture & AgTech",
  "Construction & Architecture",
  "Non-profit & Social Impact",
  "Other",
] as const;

/**
 * Type for project category values
 */
export type ProjectCategory = (typeof projectCategories)[number];

/**
 * Check if a string is a valid project category
 */
export function isValidCategory(
  category: string | null | undefined
): category is ProjectCategory {
  if (!category) return false;
  return projectCategories.includes(category as ProjectCategory);
}

/**
 * Get category display name (for future use if we need formatting)
 */
export function getCategoryDisplayName(category: ProjectCategory): string {
  return category;
}
