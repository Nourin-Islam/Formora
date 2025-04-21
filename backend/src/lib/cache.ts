// utils/cache.ts
import NodeCache from "node-cache";

export const cache = new NodeCache({
  stdTTL: 60, // Cache for 60 seconds (adjust as needed)
  checkperiod: 120, // Optional cleanup check every 2 minutes
});

// export function invalidateTemplateCache() {
//   const keys = cache.keys();
//   const templateKeys = keys.filter((key) => key.startsWith("templates:"));
//   cache.del(templateKeys);
// }

// above not working when changing likes count, so using this instead
