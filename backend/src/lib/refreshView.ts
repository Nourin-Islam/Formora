// cron/refreshMaterializedView.ts
import { refreshEvents } from "./refresh.ts";
import { PrismaClient } from "@prisma/client";
import { cache } from "./cache.ts";

const prisma = new PrismaClient();

let refreshTimeout: NodeJS.Timeout | null = null;
let isRefreshing = false;

refreshEvents.on("refreshView", () => {
  if (refreshTimeout) return; // Already scheduled

  refreshTimeout = setTimeout(async () => {
    if (isRefreshing) return;

    isRefreshing = true;
    try {
      cache.flushAll(); // Clear all cache after refresh
      console.log("✅ Cache cleared");

      console.log("⏳ Refreshing materialized view...");
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY template_search_joined_view`;

      console.log("✅ View refreshed");
    } catch (err) {
      console.error("❌ Refresh failed:", err);
    } finally {
      isRefreshing = false;
      refreshTimeout = null;
    }
  }, 3000); // delay all refreshes for 3 seconds
});

// refreshEvents.on("refreshView", async () => {
//   try {
//     console.log("⏳ Refreshing materialized view...");
//     await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY template_search_joined_view`;

//     console.log("✅ View refreshed");
//   } catch (err) {
//     console.error("❌ Refresh failed:", err);
//   }
// });

// Then in any place that mutates related data, just trigger the event:

// import { refreshEvents } from './refresh.ts';

// After prisma.template.create/update/delete
// refreshEvents.emit('refreshView');
