
import { openDB } from "idb";

const dbPromise = openDB("CivicAI-DB", 1, {
  upgrade(db) {
    db.createObjectStore("drafts", {
      keyPath: "id",
    });
  },
});

export async function saveDraft(draft) {
  const db = await dbPromise;
  await db.put("drafts", draft);
}

export async function getDrafts() {
  const db = await dbPromise;
  return db.getAll("drafts");
}

export async function deleteDraft(id) {
  const db = await dbPromise;
  await db.delete("drafts", id);
}
