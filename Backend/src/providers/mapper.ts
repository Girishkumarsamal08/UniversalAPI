/**
 * Helper to fetch a nested property from a JSON object using dot notation path
 */
export const getNestedValue = (obj: any, path: string): any => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

/**
 * Transforms a raw CRM object into the unified model shape based on declarative mapping config
 */
export const transform = <T>(raw: any, mapping: any, provider: string): T => {
  if (!raw || !mapping) return raw;

  const result: any = {};

  for (const [targetKey, sourceMapping] of Object.entries(mapping)) {
    if (typeof sourceMapping === 'string') {
      // Direct string mapping (nested path)
      const val = getNestedValue(raw, sourceMapping);
      result[targetKey] = val !== null && val !== undefined ? val : undefined;
    } else if (typeof sourceMapping === 'object' && sourceMapping !== null) {
      const mappingObj = sourceMapping as any;

      if (mappingObj.type === 'join') {
        // Concatenate multiple fields with a separator
        const parts = mappingObj.fields
          .map((f: string) => getNestedValue(raw, f))
          .filter((v: any) => v !== null && v !== undefined && v !== '');
        result[targetKey] = parts.join(mappingObj.separator || ' ') || undefined;
      } else if (mappingObj.type === 'array_find') {
        // Find an item in an array (e.g. email/phone list) and retrieve a specific property
        const arr = getNestedValue(raw, mappingObj.arrayPath);
        if (Array.isArray(arr)) {
          // Fallback to first item if none is explicitly marked as primary
          const matchedItem = arr.find((x: any) => x.primary || x.primary === 'true') || arr[0];
          result[targetKey] = matchedItem ? matchedItem[mappingObj.valueKey] : undefined;
        } else {
          result[targetKey] = undefined;
        }
      }
    }
  }

  // Common properties
  result.provider = provider;
  result.id = ''; // Default ID field for DB mapping reference
  
  // Passthrough Escape Hatch: Always include raw, unmodified upstream object
  result._raw_passthrough = raw;

  return result as T;
};
