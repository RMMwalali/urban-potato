import type { Guide } from "./types";

export const softwareGuides: Guide[] = [
  {
    slug: "do-salons-need-a-website",
    title: "Does a salon need a website? Why a booking engine matters more",
    description: "Your styles already live on Instagram and TikTok. What most salons need is online booking, client records and payments, not a brochure website.",
    category: "Choosing software",
    updated: "2026-11-15",
    takeaways: [
      "A brochure website shows your work; it doesn't book, remind or charge anyone.",
      "Instagram and TikTok already do the showcasing better than most salon websites.",
      "What fills chairs is a booking link clients can use any time, with reminders and deposits.",
      "If you have a website, add online booking to it. If you don't, start with the booking engine.",
    ],
    blocks: [
      {
        p: ["Many salon owners are told they need a website. They pay for one, it shows a few photos and a phone number, and nothing much changes. That's because a website isn't what's missing. Clients already find you on Instagram, TikTok, WhatsApp and Google. What's missing is a way to turn that interest into confirmed, paid appointments without hours of messaging."],
      },
      {
        h: "What a typical salon website does",
        list: [
          "Shows photos of your work, usually fewer and older than your Instagram.",
          "Lists services and maybe prices.",
          "Gives your location and phone number.",
        ],
        p: ["Useful, but it doesn't take bookings, send reminders, collect deposits, remember client preferences or tell you what you earned today."],
      },
      {
        h: "What a booking engine does",
        list: [
          "Shows your services, prices and real free times.",
          "Lets clients book themselves 24/7 from a link in your bio, with no app or account.",
          "Sends confirmations and reminders automatically.",
          "Takes deposits for long services.",
          "Builds a client record with history, allergies and preferences.",
          "Records payments so the day's takings are clear.",
        ],
      },
      {
        h: "Why this matters for revenue",
        p: ["Every DM that waits hours for a reply is a client who might book elsewhere. Every forgotten appointment is an empty chair. A booking engine works when you're busy with a client, closed for the night or on leave. That's the difference between being found and being booked."],
      },
      {
        h: "When a website still makes sense",
        p: ["Larger salons and spas with several branches, corporate clients or a strong brand story may still want a full website. Even then, the booking engine is the part that earns money. Make sure the website links straight to it."],
      },
    ],
    faqs: [
      { q: "Do salons need a website?", a: "Not necessarily. Most salons already show their work on Instagram and TikTok. What brings in revenue is a booking link clients can use any time, with reminders, deposits and client records." },
      { q: "What is a salon booking engine?", a: "An online booking system that shows your services, prices and free times, lets clients book and pay deposits themselves, sends reminders, and records each appointment and payment." },
      { q: "Can I take salon bookings without a website?", a: "Yes. A booking page with its own link can sit in your Instagram, TikTok and WhatsApp Business profiles, so clients go straight from your work to a confirmed appointment." },
    ],
    related: ["choosing-salon-software", "instagram-whatsapp-bookings", "paper-diary-to-digital-bookings"],
  },
  {
    slug: "choosing-salon-software",
    title: "How to choose salon and spa management software: a buyer's checklist",
    description: "What to check before you pick salon software: pricing and commission, M-Pesa support, deposits, client data ownership, phone use and support.",
    category: "Choosing software",
    updated: "2026-11-15",
    takeaways: [
      "Read the pricing carefully: commission on “new” clients and per-staff fees add up.",
      "Check how payments work. In Kenya, M-Pesa support matters more than card features.",
      "Make sure you own your client data and can export it any time.",
      "Use the free trial with real bookings before you commit.",
    ],
    blocks: [
      {
        p: ["Salon software reviews online are full of the same regrets: surprise fees, payouts held for weeks, no-show fees that never worked, support that never answered, and data that couldn't be taken elsewhere. Use this checklist to avoid them."],
      },
      {
        h: "1. Pricing you can predict",
        list: [
          "Is there one clear monthly price, or per-staff, per-booking or per-SMS charges?",
          "Does the platform take commission on clients it says it sent you, even if they found you on your own Instagram?",
          "What happens to the price after the first year?",
          "Can you cancel any time, and do charges actually stop?",
        ],
      },
      {
        h: "2. Payments that fit how you're paid",
        list: [
          "Does it support M-Pesa tills, paybills and Pochi la Biashara, not just cards?",
          "Does money go straight to your own till, or is it held by the platform first?",
          "Can it record split payments, for example part cash and part M-Pesa?",
          "Can it check M-Pesa codes so the same payment can't be used twice?",
        ],
      },
      {
        h: "3. No-show protection",
        list: [
          "Can you take deposits when clients book online?",
          "Are reminders automatic, and can you see whether each one was delivered?",
          "Can clients reschedule or cancel themselves within your policy?",
        ],
      },
      {
        h: "4. Your data stays yours",
        list: [
          "Can you export clients, bookings and sales to a spreadsheet at any time?",
          "Can you edit client records, or does the platform lock them once a client has an account?",
          "Are client records owned by the salon, so they stay when a stylist leaves?",
        ],
      },
      {
        h: "5. Built for daily use",
        list: [
          "Does it work well on the phone you already have?",
          "Can clients book without downloading an app or creating an account?",
          "Can staff see their own bookings and earnings?",
          "Are there daily summaries and simple reports?",
        ],
      },
      {
        h: "6. Real support",
        p: ["Can you reach a person on WhatsApp or phone, or only a chatbot? Ask during the trial and see how fast they answer."],
      },
      {
        h: "7. Test it properly",
        p: ["Use the free trial on real days: book real clients, take real payments, send real reminders. A week of genuine use tells you more than any demo."],
      },
    ],
    faqs: [
      { q: "What should I look for in salon booking software?", a: "Predictable pricing without commission on your own clients, M-Pesa support with money going straight to your till, deposits and automatic reminders, client records you own and can export, and support you can actually reach." },
      { q: "Is there salon software that works with M-Pesa?", a: "Yes. Look for software that supports Buy Goods tills, paybills and Pochi la Biashara, records split cash and M-Pesa payments, and can verify codes against Safaricom's payment notifications." },
      { q: "Why do salon owners switch software?", a: "Common reasons in public reviews include surprise fees and commission, payouts held by the platform, unreliable reminders, poor support and being unable to export client history." },
    ],
    related: ["do-salons-need-a-website", "reduce-salon-no-shows", "mpesa-reconciliation-for-salons"],
  },
];
