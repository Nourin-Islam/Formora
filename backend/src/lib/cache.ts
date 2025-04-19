// utils/cache.ts
import NodeCache from "node-cache";

export const cache = new NodeCache({
  stdTTL: 60, // Cache for 60 seconds (adjust as needed)
  checkperiod: 120, // Optional cleanup check every 2 minutes
});
