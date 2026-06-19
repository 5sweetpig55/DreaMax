export interface TimelineEntry {
  date: string;
  title: string;
  description: string;
  link?: string;
  module: "machine-learning" | "agentic-scholar" | "algorithms" | "magic-corner";
}

export const timeline: TimelineEntry[] = [
  {
    date: "2025-06",
    title: "Latest Update Title",
    description: "What was added or updated.",
    module: "machine-learning",
  },
  {
    date: "2025-05",
    title: "Previous Update",
    description: "What was added or updated.",
    module: "agentic-scholar",
  },
  {
    date: "2025-04",
    title: "Earlier Update",
    description: "What was added or updated.",
    module: "magic-corner",
  },
];
