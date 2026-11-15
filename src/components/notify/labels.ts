// Shared by the server-rendered notifications page and the client notification centre.
export const label = (k: string) => ({ booking: "New booking", rescheduled: "Rescheduled", cancelled: "Cancelled", payment: "Payment", deposit: "Deposit", alert: "Needs attention", test: "Test" })[k] ?? "Notification";
