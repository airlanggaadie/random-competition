const SAMPLE = [
  { name: "Group A", winners: 1, players: ["Ayu", "Budi", "Citra", "Dimas"] },
  { name: "Group B", winners: 2, players: ["Eko", "Fitri", "Gilang", "Hana"] },
  { name: "Group C", winners: 1, players: ["Indra", "Joko", "Kartika"] },
];

export const sampleGroups = () => structuredClone(SAMPLE);

// The setup (not the results) is remembered in this browser between visits.
const STORE_KEY = "draw-cup-setup-v3";

export function loadGroups() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE_KEY));
    if (Array.isArray(d) && d.every((g) => g && typeof g.name === "string" && Array.isArray(g.players))) return d;
  } catch {
    // Storage blocked or corrupt: fall back to the sample.
  }
  return sampleGroups();
}

export function saveGroups(groups) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(groups));
  } catch {
    // Storage blocked: the setup just won't be remembered.
  }
}
