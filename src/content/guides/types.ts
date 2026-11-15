export type Block = {
  h?: string; // section heading
  p?: string[]; // paragraphs
  list?: string[]; // bullet list
  steps?: string[]; // numbered steps
};

export type Guide = {
  slug: string;
  title: string;
  description: string; // meta description, ~150 chars
  category: "Profit & pricing" | "Clients" | "Staff" | "Running the salon" | "Choosing software";
  updated: string; // ISO date
  takeaways: string[];
  blocks: Block[];
  faqs: { q: string; a: string }[];
  related: string[]; // slugs
};
