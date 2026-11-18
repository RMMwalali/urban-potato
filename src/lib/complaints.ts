export const COMPLAINT_CATEGORIES = [
  { id: "bug", label: "Something isn't working" },
  { id: "payments", label: "Payments or M-Pesa" },
  { id: "billing", label: "My plan or billing" },
  { id: "messages", label: "Reminders or messages" },
  { id: "service", label: "How we treated you" },
  { id: "idea", label: "An idea or request" },
  { id: "other", label: "Something else" },
] as const;

export const complaintRef = (n: number) => `C-${String(n).padStart(4, "0")}`;

