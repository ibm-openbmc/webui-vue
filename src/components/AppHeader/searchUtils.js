import enUS from '@/locales/en-US.json';
import { hostConsoleSearchContent } from '@/views/Operations/HostConsole/HostConsoleSearchContent.js';
import { firmwareSearchContent } from '@/views/Operations/Firmware/FirmwareSearchContent.js';
import { ldapSearchContent } from '@/views/SecurityAndAccess/Ldap/LdapSearchContent.js';

/**
 * Extract all text values from a nested object
 * @param {Object} obj - Object to extract text from
 * @param {Array} results - Array to store results
 * @returns {Array} Array of text values
 */
function extractTextValues(obj, results = []) {
  if (typeof obj === 'string') {
    // Skip references (strings starting with @:)
    if (!obj.startsWith('@:')) {
      results.push(obj.toLowerCase());
    }
  } else if (typeof obj === 'object' && obj !== null) {
    Object.values(obj).forEach((value) => {
      extractTextValues(value, results);
    });
  }
  return results;
}

/**
 * Build search index from router routes and locale messages
 * @param {Array} routes - Array of route objects from the router
 * @returns {Object} Search index mapping route names to searchable content
 */
function buildSearchIndex(routes) {
  const searchIndex = {};
  const messages = enUS;

  // Process each route from the router
  routes.forEach((route) => {
    // Skip routes without names or titles, and special routes
    if (
      !route.name ||
      !route.meta?.title ||
      route.path === '/:pathMatch(.*)*' ||
      route.path.includes('/login') ||
      route.path.includes('/console') ||
      route.path.includes('/change-password')
    ) {
      return;
    }

    const routeName = route.name;
    const pageTitle = route.meta.title;
    const searchableContent = new Set();

    // Add the page title - this is the most important searchable content
    if (pageTitle && typeof pageTitle === 'string') {
      // Add the full title
      searchableContent.add(pageTitle.toLowerCase());
      // Also add individual words from the title for better matching
      pageTitle
        .toLowerCase()
        .split(/\s+/)
        .forEach((word) => {
          if (word.length > 2) {
            searchableContent.add(word);
          }
        });
    }

    // Add the route path segments as searchable content
    route.path
      .split('/')
      .filter((segment) => segment && !segment.startsWith(':'))
      .forEach((segment) => {
        searchableContent.add(segment.toLowerCase().replace(/-/g, ' '));
      });

    // Add custom search content for specific routes
    if (routeName === 'host-console') {
      // Add description
      if (hostConsoleSearchContent.description) {
        searchableContent.add(
          hostConsoleSearchContent.description.toLowerCase(),
        );
      }
      // Add features
      if (hostConsoleSearchContent.features) {
        hostConsoleSearchContent.features.forEach((feature) => {
          searchableContent.add(feature.toLowerCase());
        });
      }
      // Add keywords
      if (hostConsoleSearchContent.keywords) {
        hostConsoleSearchContent.keywords.forEach((keyword) => {
          searchableContent.add(keyword.toLowerCase());
        });
      }
      // Add related terms
      if (hostConsoleSearchContent.relatedTerms) {
        hostConsoleSearchContent.relatedTerms.forEach((term) => {
          searchableContent.add(term.toLowerCase());
        });
      }
    }

    // Add custom search content for Firmware page
    if (routeName === 'firmware') {
      // Add description
      if (firmwareSearchContent.description) {
        searchableContent.add(firmwareSearchContent.description.toLowerCase());
      }
      // Add features
      if (firmwareSearchContent.features) {
        firmwareSearchContent.features.forEach((feature) => {
          searchableContent.add(feature.toLowerCase());
        });
      }
      // Add keywords
      if (firmwareSearchContent.keywords) {
        firmwareSearchContent.keywords.forEach((keyword) => {
          searchableContent.add(keyword.toLowerCase());
        });
      }
      // Add related terms
      if (firmwareSearchContent.relatedTerms) {
        firmwareSearchContent.relatedTerms.forEach((term) => {
          searchableContent.add(term.toLowerCase());
        });
      }
    }

    // Add custom search content for LDAP page
    if (routeName === 'ldap') {
      // Add description
      if (ldapSearchContent.description) {
        searchableContent.add(ldapSearchContent.description.toLowerCase());
      }
      // Add features
      if (ldapSearchContent.features) {
        ldapSearchContent.features.forEach((feature) => {
          searchableContent.add(feature.toLowerCase());
        });
      }
      // Add keywords
      if (ldapSearchContent.keywords) {
        ldapSearchContent.keywords.forEach((keyword) => {
          searchableContent.add(keyword.toLowerCase());
        });
      }
      // Add related terms
      if (ldapSearchContent.relatedTerms) {
        ldapSearchContent.relatedTerms.forEach((term) => {
          searchableContent.add(term.toLowerCase());
        });
      }
    }

    // Try to find related content in the localization file
    const possibleSections = [
      routeName.replace(/-/g, ''),
      routeName.replace(/-/g, ' '),
    ];

    // Search through the entire localization file for related content
    Object.entries(messages).forEach(([sectionKey, sectionValue]) => {
      const sectionKeyLower = sectionKey.toLowerCase();

      // Check if this section might be related to the route
      const isRelated = possibleSections.some((term) =>
        sectionKeyLower.includes(term.toLowerCase()),
      );

      if (isRelated && typeof sectionValue === 'object') {
        // Extract all text from this section
        const texts = extractTextValues(sectionValue);
        texts.forEach((text) => searchableContent.add(text));
      }
    });

    // Also search for the route name in page-specific sections
    const pageSpecificSections = [
      'pageDescription',
      'pageTitle',
      'appPageTitle',
      'appNavigation',
    ];

    pageSpecificSections.forEach((section) => {
      if (messages[section]) {
        Object.entries(messages[section]).forEach(([key, value]) => {
          if (
            typeof value === 'string' &&
            key.toLowerCase().includes(routeName.replace(/-/g, ''))
          ) {
            searchableContent.add(value.toLowerCase());
          }
        });
      }
    });

    // Add navigation category names (Hardware status, Operations, etc.)
    if (messages.appNavigation) {
      const navCategories = [
        'hardwareStatus',
        'logs',
        'operations',
        'resourceManagement',
        'securityAndAccess',
        'settings',
      ];

      navCategories.forEach((category) => {
        if (messages.appNavigation[category]) {
          searchableContent.add(messages.appNavigation[category].toLowerCase());
        }
      });
    }

    searchIndex[routeName] = Array.from(searchableContent);
  });

  return searchIndex;
}

/**
 * Search through the index for matching pages
 * @param {string} query - Search query
 * @param {Array} routes - Array of route objects from the router
 * @returns {Array} Array of matching route names with relevance scores
 */
export function searchContent(query, routes) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  // Build search index from current routes
  const searchIndex = buildSearchIndex(routes);

  const searchTerms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  const results = [];

  Object.entries(searchIndex).forEach(([routeName, contentArray]) => {
    let score = 0;
    const matchedTerms = new Set();

    searchTerms.forEach((term) => {
      contentArray.forEach((content) => {
        if (content.includes(term)) {
          // Exact word match gets higher score
          const words = content.split(/\s+/);
          if (words.includes(term)) {
            score += 10;
          } else if (content.startsWith(term)) {
            score += 5;
          } else {
            score += 2;
          }
          matchedTerms.add(term);
        }
      });
    });

    if (score > 0) {
      results.push({
        routeName,
        score,
        matchedTerms: Array.from(matchedTerms),
      });
    }
  });

  // Sort by score (highest first)
  return results.sort((a, b) => b.score - a.score);
}
