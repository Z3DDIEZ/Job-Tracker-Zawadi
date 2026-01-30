/**
 * Tagging Service
 * Provides intelligent tag suggestions and management for job applications
 */

import type { Tag, TagSuggestion, TagCategory, JobApplication } from '@/types';

/**
 * Predefined tag database organized by categories
 */
const TAG_DATABASE: Record<TagCategory, Tag[]> = {
  industry: [
    { id: 'tech', name: 'Technology', category: 'industry', color: '#3b82f6' },
    { id: 'finance', name: 'Finance', category: 'industry', color: '#10b981' },
    { id: 'healthcare', name: 'Healthcare', category: 'industry', color: '#f59e0b' },
    { id: 'education', name: 'Education', category: 'industry', color: '#8b5cf6' },
    { id: 'retail', name: 'Retail', category: 'industry', color: '#ef4444' },
    { id: 'consulting', name: 'Consulting', category: 'industry', color: '#06b6d4' },
    { id: 'government', name: 'Government', category: 'industry', color: '#84cc16' },
    { id: 'nonprofit', name: 'Non-Profit', category: 'industry', color: '#f97316' },
  ],
  'role-type': [
    { id: 'frontend', name: 'Frontend', category: 'role-type', color: '#3b82f6' },
    { id: 'backend', name: 'Backend', category: 'role-type', color: '#10b981' },
    { id: 'fullstack', name: 'Full-Stack', category: 'role-type', color: '#f59e0b' },
    { id: 'devops', name: 'DevOps', category: 'role-type', color: '#8b5cf6' },
    { id: 'data', name: 'Data Science', category: 'role-type', color: '#ef4444' },
    { id: 'mobile', name: 'Mobile', category: 'role-type', color: '#06b6d4' },
    { id: 'qa', name: 'QA/Testing', category: 'role-type', color: '#84cc16' },
    { id: 'product', name: 'Product', category: 'role-type', color: '#f97316' },
  ],
  'company-size': [
    { id: 'startup', name: 'Startup', category: 'company-size', color: '#3b82f6' },
    { id: 'small', name: 'Small (1-50)', category: 'company-size', color: '#10b981' },
    { id: 'medium', name: 'Medium (51-500)', category: 'company-size', color: '#f59e0b' },
    { id: 'large', name: 'Large (500+)', category: 'company-size', color: '#8b5cf6' },
    { id: 'enterprise', name: 'Enterprise', category: 'company-size', color: '#ef4444' },
  ],
  location: [
    { id: 'remote', name: 'Remote', category: 'location', color: '#3b82f6' },
    { id: 'hybrid', name: 'Hybrid', category: 'location', color: '#10b981' },
    { id: 'onsite', name: 'On-site', category: 'location', color: '#f59e0b' },
    { id: 'international', name: 'International', category: 'location', color: '#8b5cf6' },
  ],
  seniority: [
    { id: 'junior', name: 'Junior', category: 'seniority', color: '#3b82f6' },
    { id: 'mid', name: 'Mid-Level', category: 'seniority', color: '#10b981' },
    { id: 'senior', name: 'Senior', category: 'seniority', color: '#f59e0b' },
    { id: 'lead', name: 'Lead/Principal', category: 'seniority', color: '#8b5cf6' },
    { id: 'executive', name: 'Executive', category: 'seniority', color: '#ef4444' },
  ],
  'remote-work': [
    { id: 'remote-friendly', name: 'Remote Friendly', category: 'remote-work', color: '#3b82f6' },
    { id: 'remote-first', name: 'Remote First', category: 'remote-work', color: '#10b981' },
    { id: 'office-required', name: 'Office Required', category: 'remote-work', color: '#f59e0b' },
  ],
};

/**
 * Industry keywords and their associated tags
 */
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  tech: [
    'google',
    'microsoft',
    'amazon',
    'apple',
    'facebook',
    'meta',
    'netflix',
    'uber',
    'airbnb',
    'spotify',
    'slack',
    'zoom',
    'stripe',
    'shopify',
    'square',
    'twilio',
    'datadog',
    'snowflake',
    'mongodb',
    'elastic',
  ],
  finance: [
    'jpmorgan',
    'goldman',
    'morgan stanley',
    'blackrock',
    'fidelity',
    'vanguard',
    'wells fargo',
    'bank of america',
    'citigroup',
    'paypal',
    'venmo',
    'coinbase',
    'robinhood',
    'sofi',
  ],
  healthcare: [
    'unitedhealth',
    'anthem',
    'humana',
    'cvs',
    'walgreens',
    'pfizer',
    'johnson & johnson',
    'merck',
    'abbvie',
    'thermo fisher',
    'roche',
    'novartis',
    'astrazeneca',
    'gilead',
  ],
  education: [
    'coursera',
    'udacity',
    'udemy',
    'edx',
    'khan academy',
    'duolingo',
    'byju',
    'chegg',
    'pearson',
    'mcgraw hill',
  ],
  retail: [
    'walmart',
    'amazon retail',
    'target',
    'costco',
    'home depot',
    'lowes',
    'macy',
    'kohl',
    'nordstrom',
    'best buy',
  ],
  consulting: [
    'mckinsey',
    'bain',
    'bcg',
    'deloitte',
    'ey',
    'kpmg',
    'pwc',
    'accenture',
    'capgemini',
    'tcs',
    'infosys',
    'wipro',
  ],
};

/**
 * Role type keywords
 */
const ROLE_KEYWORDS: Record<string, string[]> = {
  frontend: [
    'frontend',
    'front-end',
    'ui',
    'ux',
    'react',
    'angular',
    'vue',
    'javascript',
    'typescript',
    'html',
    'css',
    'sass',
    'less',
  ],
  backend: [
    'backend',
    'back-end',
    'server',
    'api',
    'node',
    'python',
    'java',
    'c#',
    'go',
    'ruby',
    'php',
    'django',
    'flask',
    'spring',
  ],
  fullstack: ['fullstack', 'full-stack', 'full stack'],
  devops: [
    'devops',
    'sre',
    'infrastructure',
    'aws',
    'azure',
    'gcp',
    'docker',
    'kubernetes',
    'jenkins',
    'terraform',
  ],
  data: [
    'data scientist',
    'data engineer',
    'machine learning',
    'ml',
    'ai',
    'analytics',
    'bi',
    'tableau',
    'power bi',
  ],
  mobile: ['ios', 'android', 'mobile', 'react native', 'flutter', 'swift', 'kotlin'],
  qa: ['qa', 'quality assurance', 'testing', 'automation', 'selenium', 'cypress'],
  product: ['product manager', 'pm', 'product owner', 'po'],
};

/**
 * Seniority level keywords
 */
const SENIORITY_KEYWORDS: Record<string, string[]> = {
  junior: ['junior', 'jr', 'entry level', 'graduate', 'new grad'],
  mid: ['mid', 'intermediate', '3-5 years'],
  senior: ['senior', 'sr', 'experienced', '5+ years', '7+ years'],
  lead: ['lead', 'principal', 'staff', 'architect', 'tech lead'],
  executive: ['vp', 'vice president', 'director', 'chief', 'head of', 'cto', 'ceo'],
};

/**
 * Tagging Service Class
 */
export class TaggingService {
  /**
   * Generate tag suggestions for a job application
   */
  static generateTagSuggestions(application: JobApplication): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];
    const text = `${application.company} ${application.role}`.toLowerCase();

    // Industry suggestions
    suggestions.push(...this.suggestIndustryTags(text));

    // Role type suggestions
    suggestions.push(...this.suggestRoleTags(text));

    // Seniority suggestions
    suggestions.push(...this.suggestSeniorityTags(text));

    // Company size suggestions (basic heuristics)
    suggestions.push(...this.suggestCompanySizeTags(application.company));

    // Location suggestions (would need more context, but basic for now)
    if (text.includes('remote') || text.includes('distributed')) {
      suggestions.push({
        tag: TAG_DATABASE['location'].find(t => t.id === 'remote')!,
        confidence: 0.8,
        reason: 'Job posting mentions remote work',
      });
    }

    // Sort by confidence and return top suggestions
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5); // Limit to top 5 suggestions
  }

  /**
   * Suggest industry tags based on company name
   */
  private static suggestIndustryTags(text: string): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];

    for (const [industryId, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
      const matches = keywords.filter(keyword => text.includes(keyword.toLowerCase()));

      if (matches.length > 0) {
        const tag = TAG_DATABASE.industry.find(t => t.id === industryId);
        if (tag) {
          const confidence = Math.min(matches.length * 0.3 + 0.4, 0.9);
          suggestions.push({
            tag,
            confidence,
            reason: `Company name matches ${industryId} industry keywords`,
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Suggest role type tags based on job title
   */
  private static suggestRoleTags(text: string): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];

    for (const [roleId, keywords] of Object.entries(ROLE_KEYWORDS)) {
      const matches = keywords.filter(keyword =>
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      if (matches.length > 0) {
        const tag = TAG_DATABASE['role-type'].find(t => t.id === roleId);
        if (tag) {
          const confidence = Math.min(matches.length * 0.4 + 0.3, 0.95);
          suggestions.push({
            tag,
            confidence,
            reason: `Job title contains ${roleId} keywords`,
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Suggest seniority tags based on job title
   */
  private static suggestSeniorityTags(text: string): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];

    for (const [seniorityId, keywords] of Object.entries(SENIORITY_KEYWORDS)) {
      const matches = keywords.filter(keyword =>
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      if (matches.length > 0) {
        const tag = TAG_DATABASE.seniority.find(t => t.id === seniorityId);
        if (tag) {
          const confidence = Math.min(matches.length * 0.5 + 0.2, 0.9);
          suggestions.push({
            tag,
            confidence,
            reason: `Job title indicates ${seniorityId} level`,
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Suggest company size tags (basic heuristics)
   */
  private static suggestCompanySizeTags(companyName: string): TagSuggestion[] {
    const text = companyName.toLowerCase();
    const suggestions: TagSuggestion[] = [];

    // Simple heuristics based on company name patterns
    if (text.includes('inc') || text.includes('corp') || text.includes('ltd')) {
      suggestions.push({
        tag: TAG_DATABASE['company-size'].find(t => t.id === 'medium')!,
        confidence: 0.3,
        reason: 'Company appears to be an established corporation',
      });
    }

    if (text.includes('labs') || text.includes('studios') || text.includes('works')) {
      suggestions.push({
        tag: TAG_DATABASE['company-size'].find(t => t.id === 'small')!,
        confidence: 0.4,
        reason: 'Company name suggests creative/tech focus',
      });
    }

    return suggestions;
  }

  /**
   * Get all available tags by category
   */
  static getAllTags(): Record<TagCategory, Tag[]> {
    return TAG_DATABASE;
  }

  /**
   * Get tags for a specific category
   */
  static getTagsByCategory(category: TagCategory): Tag[] {
    return TAG_DATABASE[category] || [];
  }

  /**
   * Find tag by ID
   */
  static getTagById(id: string): Tag | undefined {
    for (const category of Object.values(TAG_DATABASE)) {
      const tag = category.find(t => t.id === id);
      if (tag) return tag;
    }
    return undefined;
  }

  /**
   * Validate tag array
   */
  static validateTags(tags: Tag[]): boolean {
    return tags.every(tag =>
      Object.values(TAG_DATABASE).some(categoryTags => categoryTags.some(t => t.id === tag.id))
    );
  }
}

// Export singleton instance
export const taggingService = new TaggingService();
export default taggingService;
