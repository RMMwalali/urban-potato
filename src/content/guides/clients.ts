import type { Guide } from "./types";

export const clientGuides: Guide[] = [
  {
    slug: "handling-difficult-salon-clients",
    title: "How to handle difficult salon clients: lateness, complaints and refunds",
    description: "Practical scripts and policies for late arrivals, unhappy results, refund requests and rude clients, so your team stays calm and consistent.",
    category: "Clients",
    updated: "2026-11-15",
    takeaways: [
      "Most conflict comes from unclear expectations. Agree on the look, time and price before you start.",
      "Have written policies for lateness, redos and refunds, and apply them the same way for everyone.",
      "Listen first, then offer a fix. Arguing about who is right rarely ends well.",
      "Keep notes on the client record so the next stylist knows the history.",
    ],
    blocks: [
      {
        p: ["Every salon has clients who arrive late, change their mind halfway, or are unhappy with the result. You can't avoid them, but clear policies and a calm approach turn most of these moments into loyal clients rather than bad reviews."],
      },
      {
        h: "Prevent problems with a proper consultation",
        list: [
          "Look at reference photos together and say honestly what's achievable with their hair or skin.",
          "Confirm the price, including extras like length or product, before starting.",
          "Tell them how long it will take.",
          "Write the agreed look and any allergies on their client record.",
        ],
      },
      {
        h: "Late arrivals",
        p: ["Decide how late is too late (for example 15 minutes for a short service), and what happens: shorten the service, move them to the next free slot, or rebook. Say it kindly and the same way every time."],
        list: ["Example: “We've only got 40 minutes left in your slot, so we can do a wash and blow-dry today, or move the full style to 3pm. Which works better?”"],
      },
      {
        h: "Unhappy with the result",
        steps: [
          "Listen without interrupting and ask what exactly they'd like different.",
          "Acknowledge their feelings, even if the work matches what was agreed.",
          "Offer a fix within a set window, for example a free adjustment within 7 days.",
          "Record what happened on their client record.",
        ],
      },
      {
        h: "Refunds",
        p: ["Many salons offer a redo rather than a refund, because the time and products are already spent. Whatever you choose, write it down and show it at booking. When you do refund, record it so your takings stay accurate."],
      },
      {
        h: "Rude or abusive behaviour",
        p: ["Your team's safety and dignity come first. It's fine to end a service, ask someone to leave, and note on their record that you won't book them again. Make sure staff know they will be backed up."],
      },
      {
        h: "Bad reviews",
        p: ["Reply briefly and politely, offer to sort it out privately, and don't argue in public. Future clients read the reply more than the complaint."],
      },
    ],
    faqs: [
      { q: "Should a salon give refunds?", a: "Many salons offer a free adjustment or redo within a set time instead of a refund, since time and products are already used. Whatever the policy, show it clearly before booking and apply it consistently." },
      { q: "How do I deal with a client who is always late?", a: "Have a written lateness policy, apply it kindly and consistently, and offer options such as a shorter service or a later slot. Note repeat lateness on their record." },
    ],
    related: ["client-retention-for-salons", "reduce-salon-no-shows", "managing-salon-staff"],
  },
  {
    slug: "client-retention-for-salons",
    title: "Client retention: how to keep salon clients coming back",
    description: "Rebooking at checkout, remembering preferences and timely follow-ups: simple habits that turn first-time salon clients into regulars.",
    category: "Clients",
    updated: "2026-11-15",
    takeaways: [
      "Ask every client to book their next visit before they leave.",
      "Remember details: preferences, allergies, the last style. Write them down, don't rely on memory.",
      "Notice when regulars go quiet and send a personal message.",
      "Reward loyalty with attention and priority, not constant discounts.",
    ],
    blocks: [
      {
        p: ["A full salon is usually a salon full of regulars. Keeping an existing client costs far less than finding a new one, and regulars bring friends. Retention comes down to a few habits done consistently."],
      },
      {
        h: "Rebook before they leave",
        p: ["The best moment to book the next visit is at checkout, while the client is happy with the result. Suggest a date based on the service (braids, retouches and nails all have natural cycles) and book it there and then."],
      },
      {
        h: "Remember the person",
        list: [
          "Preferences: tension, products, how short is too short, coffee or tea.",
          "Allergies and sensitivities, shown clearly every time they book.",
          "The last service and what they said about it.",
          "Their usual stylist, and who else they're happy to see.",
        ],
        p: ["When these notes live on the client record rather than in one stylist's head, any team member can give a regular's experience."],
      },
      {
        h: "Follow up",
        p: ["A short message a few days after a big change (a new colour, a first set of extensions) shows you care and catches problems early. If someone who came every month hasn't returned in two, a friendly check-in brings many back."],
      },
      {
        h: "Make booking easy",
        p: ["If rebooking takes a phone call during working hours, people put it off. A booking link they can use any time, with automatic reminders, keeps regulars on schedule."],
      },
      {
        h: "Loyalty without discounting",
        p: ["Constant discounts train clients to wait for deals. Instead, offer regulars priority for busy slots, a small extra (a treatment, a nail art finish) occasionally, or a gift on their birthday."],
      },
      {
        h: "Measure it",
        p: ["Track how many first-time clients return within three months and how often regulars visit. If the numbers drop, ask why: price, a staff change, waiting times."],
      },
    ],
    faqs: [
      { q: "What is a good client retention strategy for a salon?", a: "Rebook at checkout, keep notes on each client's preferences, follow up after big services, and contact regulars who haven't visited in a while. Make online rebooking easy." },
      { q: "Do loyalty discounts work for salons?", a: "They can, but constant discounts reduce profit and train clients to wait for deals. Priority booking and occasional extras often build loyalty without cutting prices." },
    ],
    related: ["handling-difficult-salon-clients", "reduce-salon-no-shows", "instagram-whatsapp-bookings"],
  },
];
