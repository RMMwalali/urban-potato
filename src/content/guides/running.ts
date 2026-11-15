import type { Guide } from "./types";

export const runningGuides: Guide[] = [
  {
    slug: "mpesa-reconciliation-for-salons",
    title: "M-Pesa for salons: tills, Pochi la Biashara and closing the day",
    description: "How salons in Kenya can take M-Pesa payments, separate tips, check codes against the statement and avoid fake payment messages.",
    category: "Running the salon",
    updated: "2026-11-15",
    takeaways: [
      "Take payments on the salon's own till or paybill, not stylists' personal numbers, unless you run chair rental.",
      "Never accept a payment based on a forwarded or screenshot message. Check it reached your till.",
      "Record every M-Pesa code against the sale it paid for, and match codes to the statement daily.",
      "Decide in writing how tips are handled.",
    ],
    blocks: [
      {
        p: ["M-Pesa is how most clients pay in Kenyan salons, which makes it both convenient and easy to lose track of. A clear setup and a short daily routine keep the money visible."],
      },
      {
        h: "Choosing how to receive payments",
        list: [
          "Buy Goods till: money goes to the business, with a statement you can check. Best for salons that employ stylists.",
          "Paybill: similar, with an account number field that can carry a client name or invoice number.",
          "Pochi la Biashara: a business wallet on a personal line. Simple to start, but harder to separate from personal money.",
          "Stylists' own numbers: common in chair-rental setups, where each stylist runs their own business. In an employee salon it makes takings almost impossible to track.",
        ],
      },
      {
        h: "Protect yourself from fake payment messages",
        p: [
          "Fake M-Pesa messages and edited screenshots are a known trick. Only treat a payment as received when it shows on your own till or statement, not when a client shows you their phone.",
          "If your till is connected to Safaricom's payment notifications through your software, each payment appears automatically with the payer's name and amount, and a code can only be used once. That removes most of the risk at the counter.",
        ],
      },
      {
        h: "Tips",
        p: ["In many salons tips are sent straight to the stylist's personal number. That's fine if it's agreed. If tips come through the salon till, record who each tip belongs to and pay it out in full. Tips are not salon revenue and shouldn't be mixed with commission."],
      },
      {
        h: "The daily close",
        steps: [
          "Export or print the day's sales with their M-Pesa codes.",
          "Open the till statement for the same day.",
          "Tick off each code. Anything on the statement without a sale is an unrecorded service; anything recorded without a matching code needs checking.",
          "Count cash and compare with recorded cash sales.",
          "Note deposits taken for future appointments separately, so they aren't counted twice when the client pays the balance.",
        ],
      },
      {
        h: "Receipts and tax records",
        p: ["Keep a record of every sale and give receipts. Tax rules, including KRA's eTIMS requirements for invoices, change over time and depend on your business type and turnover, so confirm what applies to you with KRA or an accountant."],
      },
    ],
    faqs: [
      { q: "Is a Buy Goods till or Pochi la Biashara better for a salon?", a: "A Buy Goods till keeps business money separate and gives a clear statement, which suits salons with employees. Pochi la Biashara is quicker to set up and suits a solo stylist." },
      { q: "How can I tell if an M-Pesa message is fake?", a: "Check that the payment appears on your own till or account statement. Don't rely on a message shown on the client's phone or a forwarded screenshot." },
      { q: "Can software read the payer's name from an M-Pesa code?", a: "Not from the code alone. If your till or paybill is connected to Safaricom's payment notifications, the system receives each payment's details and can match the code to the payer and amount. For Pochi or personal numbers, the details can be read from the confirmation SMS but can't be verified." },
    ],
    related: ["salon-profit-leaks", "prevent-theft-in-a-salon", "stylist-commission-structures"],
  },
  {
    slug: "prevent-theft-in-a-salon",
    title: "Preventing theft and leakage in a salon without accusing your team",
    description: "Simple controls that stop missing cash, unrecorded services and disappearing products, while keeping trust with your staff.",
    category: "Running the salon",
    updated: "2026-11-15",
    takeaways: [
      "Good systems protect honest staff as much as they protect the owner.",
      "Record every service and payment in one place, and close the day by reconciling.",
      "Separate retail stock from salon-use stock and count expensive items weekly.",
      "Limit who can give discounts, delete records or change prices.",
    ],
    blocks: [
      {
        p: ["Most salon losses aren't dramatic theft. They're services done off the books, cash that never reaches the drawer, discounts nobody approved and products that slowly disappear. The fix is a routine that makes every shilling visible, applied to everyone, so nobody feels singled out."],
      },
      {
        h: "Make recording the only way to get paid",
        p: ["If commission is calculated from recorded sales, staff have a reason to record every service. Pair that with taking all payments on the salon's till and a daily close, and off-the-books work becomes obvious."],
      },
      {
        h: "Control the drawer",
        list: [
          "One cash float, counted at opening and closing.",
          "Every cash sale recorded before change is given.",
          "Differences noted and explained the same day, not at month end.",
        ],
      },
      {
        h: "Stock",
        list: [
          "Keep retail products for sale separate from products used on clients.",
          "Count high-value items such as hair extensions, colour and treatments weekly.",
          "Measure typical usage per service so you notice when usage jumps.",
        ],
      },
      {
        h: "Permissions",
        p: ["Give each person their own login. Staff should be able to book, check clients in and take payments, but only owners or managers should change prices, delete records or see full reports. An audit trail of changes discourages quiet edits."],
      },
      {
        h: "Client poaching",
        p: ["When client records live in a stylist's phone, the clients leave when the stylist leaves. Keep client details, history and notes in the salon's system, and make sure every booking goes through it."],
      },
      {
        h: "Talk about it openly",
        p: ["Explain the routine to the team as how the salon runs, not as a reaction to suspicion. Honest staff usually welcome it because it protects them from blame when something goes missing."],
      },
    ],
    faqs: [
      { q: "How do I stop stylists doing services off the books?", a: "Pay commission only on recorded sales, take all payments on the salon's till, and reconcile daily. Unrecorded work then costs the stylist money and shows up as a mismatch." },
      { q: "How do I keep clients when a stylist leaves?", a: "Keep client contacts, history and preferences in the salon's own system, and route all bookings through it so the relationship is with the salon as well as the stylist." },
    ],
    related: ["mpesa-reconciliation-for-salons", "salon-profit-leaks", "managing-salon-staff"],
  },
  {
    slug: "paper-diary-to-digital-bookings",
    title: "Moving your salon from a paper diary to digital bookings in one week",
    description: "A day-by-day plan to switch from the appointment book and scattered WhatsApp chats to one digital calendar without disrupting clients.",
    category: "Running the salon",
    updated: "2026-11-15",
    takeaways: [
      "Set up services and staff first, then move future bookings, then switch clients over.",
      "Run paper and digital side by side for a few days, then stop the paper.",
      "Put your booking link everywhere clients already message you.",
    ],
    blocks: [
      {
        p: ["The paper diary works until two people write in it at once, a page gets wet, or someone books over a regular's slot. Moving to a digital calendar doesn't need to be a big project. Here's a plan that fits into a normal week."],
      },
      {
        h: "Day 1: Set up the basics",
        steps: [
          "Enter your services with realistic durations and prices.",
          "Add each staff member and which services they do.",
          "Set opening hours, days and the buffer you need between clients.",
          "Add your M-Pesa till details and decide on a deposit policy.",
        ],
      },
      {
        h: "Day 2: Move future bookings",
        p: ["Copy every booking from the diary for the coming weeks into the calendar. Add each client's phone number as you go. This builds your client list without a separate data-entry job."],
      },
      {
        h: "Days 3 to 5: Run both",
        p: ["Keep writing new bookings in both places for a few days. Staff get used to the calendar while the diary is still there as a safety net. Take payments through the system so takings are recorded too."],
      },
      {
        h: "Day 6: Switch clients over",
        list: [
          "Put your booking link in your Instagram, TikTok and Facebook bios and your WhatsApp Business profile.",
          "Reply to booking DMs with the link instead of negotiating times by hand.",
          "Tell regulars they can now book, reschedule and cancel themselves.",
        ],
      },
      {
        h: "Day 7: Retire the paper",
        p: ["Stop writing in the diary. From now on, if it's not in the calendar it isn't booked. Keep the old diary for reference for a few months."],
      },
      {
        h: "What changes after the switch",
        p: ["You can see the whole week on your phone, clients get automatic confirmations and reminders, no-shows are tracked, and every sale is recorded. The biggest change owners notice is fewer arguments about who booked what."],
      },
    ],
    faqs: [
      { q: "How long does it take to move a salon to online booking?", a: "Most salons can set up and switch within a week: one day to add services and staff, one to move future bookings, a few days running paper and digital together, then the switch." },
      { q: "Do clients need to download an app to book?", a: "They shouldn't have to. A good booking page works in any phone browser from a link in your social bios or WhatsApp, with just a name and phone number." },
    ],
    related: ["instagram-whatsapp-bookings", "do-salons-need-a-website", "choosing-salon-software"],
  },
  {
    slug: "instagram-whatsapp-bookings",
    title: "Turning Instagram and WhatsApp DMs into confirmed bookings",
    description: "Stop losing clients in your DMs: use a booking link, saved replies and your social bios to turn enquiries into confirmed salon appointments.",
    category: "Running the salon",
    updated: "2026-11-15",
    takeaways: [
      "Your Instagram is your portfolio. Use it to attract clients and a booking link to book them.",
      "Answer price and availability questions with a link instead of a long chat.",
      "Saved replies and a clear bio save hours each week.",
    ],
    blocks: [
      {
        p: ["For many salons, Instagram, TikTok and WhatsApp bring most new clients. But booking through DMs is slow: back-and-forth about times, prices and deposits, messages missed while you're working, and bookings that never get written down. The goal is to keep social media for showing your work and move the booking itself to one place."],
      },
      {
        h: "Put the booking link where people look",
        list: [
          "Instagram and TikTok bio.",
          "WhatsApp Business profile and catalogue.",
          "Pinned posts or story highlights with prices and “Book here”.",
          "Google Business Profile, if you have one.",
        ],
      },
      {
        h: "Use saved replies",
        p: ["Most DMs are the same few questions: price, availability, location, deposit. Set up saved replies on WhatsApp Business and Instagram that answer briefly and include the booking link. You reply in seconds, even mid-service."],
        list: [
          "Example: “Hi! Prices and free times are here: [your booking link]. You can book and pay the deposit there in a minute.”",
        ],
      },
      {
        h: "Show prices clearly",
        p: ["“DM for price” creates work for you and puts clients off. Publish starting prices, by length or style if needed, and keep them current on your booking page."],
      },
      {
        h: "Keep the relationship personal",
        p: ["A booking link doesn't make you less personal. Clients still message you; you just spend that time on advice and style questions instead of juggling times. Automatic confirmations and reminders mean fewer awkward follow-ups."],
      },
    ],
    faqs: [
      { q: "Should salons take bookings in Instagram DMs?", a: "DMs are great for questions and inspiration, but booking through them is slow and easy to lose track of. Reply with a booking link so every appointment lands in one calendar." },
      { q: "What should I put in my salon's Instagram bio?", a: "What you do, where you are, your hours and a booking link, so people can go straight from your work to a confirmed appointment." },
    ],
    related: ["do-salons-need-a-website", "paper-diary-to-digital-bookings", "reduce-salon-no-shows"],
  },
];
