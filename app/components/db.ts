import { openDB } from "idb";

// One shared IndexedDB for the app: guest tasks + boombox settings.
// Bump the version whenever a new store is added.
export const openFlowsyncDb = () =>
  openDB("flowsync", 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("tasks")) {
        db.createObjectStore("tasks", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    },
  });
