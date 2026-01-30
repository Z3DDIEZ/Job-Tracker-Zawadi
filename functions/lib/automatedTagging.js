'use strict';
/**
 * Automated Tagging Cloud Function
 * Automatically suggests tags for new job applications
 */
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.autoTagApplication = void 0;
const functions = __importStar(require('firebase-functions'));
/**
 * Predefined tag database (simplified version for Cloud Functions)
 */
const TAG_DATABASE = {
  industry: [
    { id: 'tech', name: 'Technology', category: 'industry', color: '#3b82f6' },
    { id: 'finance', name: 'Finance', category: 'industry', color: '#10b981' },
    { id: 'healthcare', name: 'Healthcare', category: 'industry', color: '#f59e0b' },
    { id: 'education', name: 'Education', category: 'industry', color: '#8b5cf6' },
    { id: 'retail', name: 'Retail', category: 'industry', color: '#ef4444' },
    { id: 'consulting', name: 'Consulting', category: 'industry', color: '#06b6d4' },
  ],
  'role-type': [
    { id: 'frontend', name: 'Frontend', category: 'role-type', color: '#3b82f6' },
    { id: 'backend', name: 'Backend', category: 'role-type', color: '#10b981' },
    { id: 'fullstack', name: 'Full-Stack', category: 'role-type', color: '#f59e0b' },
    { id: 'devops', name: 'DevOps', category: 'role-type', color: '#8b5cf6' },
    { id: 'data', name: 'Data Science', category: 'role-type', color: '#ef4444' },
    { id: 'mobile', name: 'Mobile', category: 'role-type', color: '#06b6d4' },
  ],
  'company-size': [
    { id: 'startup', name: 'Startup', category: 'company-size', color: '#3b82f6' },
    { id: 'small', name: 'Small (1-50)', category: 'company-size', color: '#10b981' },
    { id: 'medium', name: 'Medium (51-500)', category: 'company-size', color: '#f59e0b' },
    { id: 'large', name: 'Large (500+)', category: 'company-size', color: '#8b5cf6' },
  ],
  location: [
    { id: 'remote', name: 'Remote', category: 'location', color: '#3b82f6' },
    { id: 'hybrid', name: 'Hybrid', category: 'location', color: '#10b981' },
    { id: 'onsite', name: 'On-site', category: 'location', color: '#f59e0b' },
  ],
  seniority: [
    { id: 'junior', name: 'Junior', category: 'seniority', color: '#3b82f6' },
    { id: 'mid', name: 'Mid-Level', category: 'seniority', color: '#10b981' },
    { id: 'senior', name: 'Senior', category: 'seniority', color: '#f59e0b' },
    { id: 'lead', name: 'Lead/Principal', category: 'seniority', color: '#8b5cf6' },
  ],
};
/**
 * Industry keywords mapping
 */
const INDUSTRY_KEYWORDS = {
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
  ],
  finance: [
    'jpmorgan',
    'goldman',
    'morgan stanley',
    'blackrock',
    'fidelity',
    'wells fargo',
    'bank of america',
    'paypal',
    'coinbase',
  ],
  healthcare: [
    'unitedhealth',
    'anthem',
    'cvs',
    'pfizer',
    'johnson & johnson',
    'merck',
    'thermo fisher',
  ],
  education: ['coursera', 'udacity', 'udemy', 'khan academy', 'duolingo', 'chegg'],
  retail: ['walmart', 'amazon retail', 'target', 'costco', 'home depot', 'best buy'],
  consulting: ['mckinsey', 'bain', 'bcg', 'deloitte', 'ey', 'kpmg', 'pwc', 'accenture'],
};
/**
 * Role keywords mapping
 */
const ROLE_KEYWORDS = {
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
  ],
  fullstack: ['fullstack', 'full-stack', 'full stack'],
  devops: ['devops', 'sre', 'infrastructure', 'aws', 'azure', 'gcp', 'docker', 'kubernetes'],
  data: ['data scientist', 'data engineer', 'machine learning', 'ml', 'ai', 'analytics'],
  mobile: ['ios', 'android', 'mobile', 'react native', 'flutter', 'swift', 'kotlin'],
};
/**
 * Seniority keywords mapping
 */
const SENIORITY_KEYWORDS = {
  junior: ['junior', 'jr', 'entry level', 'graduate', 'new grad'],
  mid: ['mid', 'intermediate', '3-5 years'],
  senior: ['senior', 'sr', 'experienced', '5+ years', '7+ years'],
  lead: ['lead', 'principal', 'staff', 'architect', 'tech lead'],
};
/**
 * Generate tag suggestions for an application
 */
function generateTagSuggestions(application) {
  const suggestions = [];
  const text = `${application.company} ${application.role}`.toLowerCase();
  // Industry suggestions
  suggestions.push(...suggestIndustryTags(text));
  // Role type suggestions
  suggestions.push(...suggestRoleTags(text));
  // Seniority suggestions
  suggestions.push(...suggestSeniorityTags(text));
  // Location suggestions
  if (text.includes('remote') || text.includes('distributed')) {
    const remoteTag = TAG_DATABASE.location.find(t => t.id === 'remote');
    if (remoteTag) {
      suggestions.push({
        tag: remoteTag,
        confidence: 0.8,
        reason: 'Job posting mentions remote work',
      });
    }
  }
  // Sort by confidence and return top suggestions
  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3); // Limit to top 3 for Cloud Function efficiency
}
/**
 * Suggest industry tags based on company name
 */
function suggestIndustryTags(text) {
  const suggestions = [];
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
function suggestRoleTags(text) {
  const suggestions = [];
  for (const [roleId, keywords] of Object.entries(ROLE_KEYWORDS)) {
    const matches = keywords.filter(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
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
function suggestSeniorityTags(text) {
  const suggestions = [];
  for (const [seniorityId, keywords] of Object.entries(SENIORITY_KEYWORDS)) {
    const matches = keywords.filter(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
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
 * Cloud Function: Automatically tag new applications
 * Triggered when a new application is created
 */
exports.autoTagApplication = functions.database
  .ref('/applications/{userId}/{applicationId}')
  .onCreate(async (snapshot, context) => {
    const { userId, applicationId } = context.params;
    try {
      const application = snapshot.val();
      // Skip if application already has tags
      if (application.tags && application.tags.length > 0) {
        functions.logger.info(
          `Application ${applicationId} already has tags, skipping auto-tagging`
        );
        return null;
      }
      // Generate tag suggestions
      const suggestions = generateTagSuggestions(application);
      if (suggestions.length === 0) {
        functions.logger.info(`No tag suggestions generated for application ${applicationId}`);
        return null;
      }
      // Convert suggestions to tags (only high-confidence suggestions)
      const autoTags = suggestions
        .filter(suggestion => suggestion.confidence >= 0.7)
        .map(suggestion => suggestion.tag);
      if (autoTags.length === 0) {
        functions.logger.info(`No high-confidence tags for application ${applicationId}`);
        return null;
      }
      // Update the application with auto-generated tags
      const updates = {
        tags: autoTags,
        updatedAt: Date.now(),
      };
      await snapshot.ref.update(updates);
      functions.logger.info(
        `Auto-tagged application ${applicationId} with ${autoTags.length} tags:`,
        {
          userId,
          applicationId,
          tags: autoTags.map(t => t.name),
        }
      );
      return null;
    } catch (error) {
      functions.logger.error('Error in autoTagApplication:', error);
      return null;
    }
  });
//# sourceMappingURL=automatedTagging.js.map
