import enUS from '@/locales/en-US.json';
import { hostConsoleSearchContent } from '@/views/Operations/HostConsole/HostConsoleSearchContent.js';
import { firmwareSearchContent } from '@/views/Operations/Firmware/FirmwareSearchContent.js';
import { ldapSearchContent } from '@/views/SecurityAndAccess/Ldap/LdapSearchContent.js';
import { rebootBmcSearchContent } from '@/views/Operations/RebootBmc/RebootBmcSearchContent.js';
import { serverPowerOperationsSearchContent } from '@/views/Operations/ServerPowerOperations/ServerPowerOperationsSearchContent.js';
import { serviceLoginConsolesSearchContent } from '@/views/Operations/ServiceLoginConsoles/ServiceLoginConsolesSearchContent.js';
import { memorySearchContent } from '@/views/ResourceManagement/Memory/MemorySearchContent.js';
import { powerSearchContent } from '@/views/ResourceManagement/Power/PowerSearchContent.js';
import { capacityOnDemandSearchContent } from '@/views/ResourceManagement/CapacityOnDemand/CapacityOnDemandSearchContent.js';
import { fieldCoreOverrideSearchContent } from '@/views/ResourceManagement/FieldCoreOverride/FieldCoreOverrideSearchContent.js';
import { systemParametersSearchContent } from '@/views/ResourceManagement/SystemParameters/SystemParametersSearchContent.js';
import { inventorySearchContent } from '@/views/HardwareStatus/Inventory/InventorySearchContent.js';
import { sensorsSearchContent } from '@/views/HardwareStatus/Sensors/SensorsSearchContent.js';
import { hardwareDeconfigurationSearchContent } from '@/views/Settings/HardwareDeconfiguration/HardwareDeconfigurationSearchContent.js';
import { pcieTopologySearchContent } from '@/views/HardwareStatus/PcieTopology/PcieTopologySearchContent.js';
import { postCodeLogsSearchContent } from '@/views/Logs/PostCodeLogs/PostCodeLogsSearchContent.js';
import { eventLogsSearchContent } from '@/views/Logs/EventLogs/EventLogsSearchContent.js';
import { auditLogsSearchContent } from '@/views/Logs/AuditLogs/AuditLogsSearchContent.js';
import { dumpsSearchContent } from '@/views/Logs/Dumps/DumpsSearchContent.js';
import { deconfigurationRecordsSearchContent } from '@/views/Logs/DeconfigurationRecords/DeconfigurationRecordsSearchContent.js';
import { dateTimeSearchContent } from '@/views/Settings/DateTime/DateTimeSearchContent.js';
import { networkSearchContent } from '@/views/Settings/Network/NetworkSearchContent.js';
import { powerRestorePolicySearchContent } from '@/views/Settings/PowerRestorePolicy/PowerRestorePolicySearchContent.js';
import { snmpAlertsSearchContent } from '@/views/Settings/SnmpAlerts/SnmpAlertsSearchContent.js';
import { factoryResetSearchContent } from '@/views/Operations/FactoryReset/FactoryResetSearchContent.js';
import { sessionsSearchContent } from '@/views/SecurityAndAccess/Sessions/SessionsSearchContent.js';
import { userManagementSearchContent } from '@/views/SecurityAndAccess/UserManagement/UserManagementSearchContent.js';
import { certificatesSearchContent } from '@/views/SecurityAndAccess/Certificates/CertificatesSearchContent.js';
import { policiesSearchContent } from '@/views/SecurityAndAccess/Policies/PoliciesSearchContent.js';
import { keyClearSearchContent } from '@/views/Operations/KeyClear/KeyClearSearchContent.js';
import { noticesSearchContent } from '@/views/Notices/NoticesSearchContent.js';
import { profileSettingsSearchContent } from '@/views/ProfileSettings/ProfileSettingsSearchContent.js';
import { concurrentMaintenanceSearchContent } from '@/views/HardwareStatus/ConcurrentMaintenance/ConcurrentMaintenanceSearchContent.js';
import { ibmiServiceFunctionsSearchContent } from '@/views/Logs/IBMiServiceFunctions/IBMiServiceFunctionsSearchContent.js';

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

    // Helper function to add search content
    const addSearchContent = (content) => {
      if (content.description) {
        searchableContent.add(content.description.toLowerCase());
      }
      if (content.features) {
        content.features.forEach((feature) => {
          searchableContent.add(feature.toLowerCase());
        });
      }
      if (content.keywords) {
        content.keywords.forEach((keyword) => {
          searchableContent.add(keyword.toLowerCase());
        });
      }
      if (content.relatedTerms) {
        content.relatedTerms.forEach((term) => {
          searchableContent.add(term.toLowerCase());
        });
      }
    };

    // Map of route names to their search content
    const routeSearchContentMap = {
      'host-console': hostConsoleSearchContent,
      firmware: firmwareSearchContent,
      ldap: ldapSearchContent,
      'reboot-bmc': rebootBmcSearchContent,
      'server-power-operations': serverPowerOperationsSearchContent,
      'service-login': serviceLoginConsolesSearchContent,
      memory: memorySearchContent,
      power: powerSearchContent,
      'capacity-on-demand': capacityOnDemandSearchContent,
      'field-core-override': fieldCoreOverrideSearchContent,
      'system-parameters': systemParametersSearchContent,
      inventory: inventorySearchContent,
      sensors: sensorsSearchContent,
      'hardware-deconfiguration': hardwareDeconfigurationSearchContent,
      'pcie-topology': pcieTopologySearchContent,
      'post-code-logs': postCodeLogsSearchContent,
      'event-logs': eventLogsSearchContent,
      'audit-logs': auditLogsSearchContent,
      dumps: dumpsSearchContent,
      'deconfiguration-records': deconfigurationRecordsSearchContent,
      'date-time': dateTimeSearchContent,
      network: networkSearchContent,
      'power-restore-policy': powerRestorePolicySearchContent,
      'snmp-alerts': snmpAlertsSearchContent,
      'factory-reset': factoryResetSearchContent,
      sessions: sessionsSearchContent,
      'local-users': userManagementSearchContent,
      certificates: certificatesSearchContent,
      policies: policiesSearchContent,
      'key-clear': keyClearSearchContent,
      notices: noticesSearchContent,
      'profile-settings': profileSettingsSearchContent,
      'concurrent-maintenance': concurrentMaintenanceSearchContent,
      'ibmi-service-functions': ibmiServiceFunctionsSearchContent,
    };

    // Add custom search content if available for this route
    if (routeSearchContentMap[routeName]) {
      addSearchContent(routeSearchContentMap[routeName]);
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
 * Calculate match score based on the number of matched words and match quality
 * @param {Array} searchTerms - Array of search terms from the query
 * @param {Array} contentArray - Array of searchable content for a route
 * @returns {Object} Object containing score, matched terms count, and matched terms
 */
function calculateMatchScore(searchTerms, contentArray) {
  const matchedTerms = new Set();
  let exactMatchScore = 0;
  let partialMatchScore = 0;
  let phraseMatchBonus = 0;

  // Join content array to check for phrase matches
  const fullContent = contentArray.join(' ');
  const searchPhrase = searchTerms.join(' ');

  // Check if the entire search phrase exists in content (highest priority)
  if (fullContent.includes(searchPhrase)) {
    phraseMatchBonus = 1000 * searchTerms.length;
  }

  // Check each search term
  searchTerms.forEach((term) => {
    let termMatched = false;

    contentArray.forEach((content) => {
      if (content.includes(term)) {
        termMatched = true;
        const words = content.split(/\s+/);

        // Exact word match (highest score per term)
        if (words.includes(term)) {
          exactMatchScore += 100;
        }
        // Starts with term (medium-high score)
        else if (content.startsWith(term)) {
          exactMatchScore += 50;
        }
        // Contains term anywhere (lower score)
        else {
          partialMatchScore += 20;
        }
      }
    });

    if (termMatched) {
      matchedTerms.add(term);
    }
  });

  // Calculate final score with word count multiplier
  const matchedCount = matchedTerms.size;
  const totalTerms = searchTerms.length;

  // Base score from matches
  const baseScore = exactMatchScore + partialMatchScore + phraseMatchBonus;

  // Multiplier based on percentage of matched terms
  // All terms matched = 10x multiplier
  // Most terms matched = progressively lower multiplier
  const matchPercentage = matchedCount / totalTerms;
  const matchMultiplier = Math.pow(matchPercentage, 0.5) * 10;

  // Final score prioritizes entries with more matched terms
  const finalScore = baseScore * matchMultiplier + matchedCount * 500;

  return {
    score: finalScore,
    matchedCount,
    matchedTerms: Array.from(matchedTerms),
    matchPercentage,
  };
}

/**
 * Search through the index for matching pages with prioritization based on word matches
 * @param {string} query - Search query
 * @param {Array} routes - Array of route objects from the router
 * @returns {Array} Array of matching route names with relevance scores, sorted by match quality
 */
export function searchContent(query, routes) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  // Build search index from current routes
  const searchIndex = buildSearchIndex(routes);

  // Normalize and split search query into terms
  const searchTerms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  const results = [];

  // Calculate scores for each route
  Object.entries(searchIndex).forEach(([routeName, contentArray]) => {
    const matchResult = calculateMatchScore(searchTerms, contentArray);

    // Only include results that have at least one matched term
    if (matchResult.matchedCount > 0) {
      results.push({
        routeName,
        score: matchResult.score,
        matchedTerms: matchResult.matchedTerms,
        matchedCount: matchResult.matchedCount,
        totalTerms: searchTerms.length,
        matchPercentage: matchResult.matchPercentage,
      });
    }
  });

  // Sort results by multiple criteria:
  // 1. Primary: Number of matched terms (descending)
  // 2. Secondary: Match score (descending)
  // 3. Tertiary: Route name (alphabetically for consistency)
  return results.sort((a, b) => {
    // First, prioritize by number of matched terms
    if (b.matchedCount !== a.matchedCount) {
      return b.matchedCount - a.matchedCount;
    }
    // If same number of matches, sort by score
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // If same score, sort alphabetically by route name
    return a.routeName.localeCompare(b.routeName);
  });
}
