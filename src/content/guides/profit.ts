import type { Guide } from "./types";

export const profitGuides: Guide[] = [
  {
    slug: "how-to-price-salon-services",
    title: "How to price salon services so every appointment makes money",
    description: "A simple pricing formula for salons and spas: product cost, labour, overheads and margin, with a worked example in Kenyan shillings.",
    category: "Profit & pricing",
    updated: "2026-11-15",
    takeaways: [
      "Price from your costs per hour, not from what the salon down the road charges.",
      "Every service price must cover products, the stylist's pay, a share of rent and bills, and profit.",
      "Long services with cheap prices are usually where money is lost. Check them first.",
      "Review prices at least once a year and whenever product or rent costs change.",
    ],
    blocks: [
      {
        p: [
          "Most salons set prices by looking at competitors and going slightly lower. It feels safe, but it ignores the one thing that decides whether you make money: what an hour in your chair actually costs you. Two salons charging the same for knotless braids can have completely different profits because their rent, staff pay and product use are different.",
        ],
      },
      {
        h: "Step 1: Work out your overhead per chair hour",
        p: [
          "Add up everything you pay each month that isn't tied to a single client: rent, electricity, water, internet, cleaning, security, licences, software, and any salaries that don't depend on services done (for example a receptionist). Divide that by the number of hours your chairs are realistically working in a month.",
          "If you are open 10 hours a day, 26 days a month, with 4 chairs, that's 1,040 chair hours. But chairs are rarely full. If they are busy about 60% of the time, use 624 hours. Using realistic busy hours, not opening hours, stops you underpricing.",
        ],
      },
      {
        h: "Step 2: Add the direct costs of the service",
        list: [
          "Products used: relaxer, hair, polish, wax, oils, foils, gloves, towels washed. Measure a typical service once and write it down.",
          "Labour: the stylist's commission or the share of their salary for the time spent.",
          "Payment costs: M-Pesa till or card charges, if you pay them.",
        ],
      },
      {
        h: "Step 3: Add your margin",
        p: [
          "Margin is what's left after costs. It pays for slow months, repairs, new equipment and you. Many owners only pay themselves from what's left over, which is why they feel busy but broke. Decide a target margin and build it into the price instead of hoping it appears.",
        ],
      },
      {
        h: "A worked example",
        p: [
          "These numbers are only an illustration. Use your own. Say overheads are KES 150,000 a month across 624 busy chair hours: about KES 240 per chair hour. A silk press takes 1.5 hours, so it carries KES 360 of overhead. Products cost about KES 300. The stylist earns 35% commission. You want 20% margin.",
          "Costs before commission and margin are KES 660. Commission and margin together are 55% of the price, so the price needs to be at least 660 ÷ 0.45 ≈ KES 1,470. If you currently charge KES 1,200, every silk press loses money once rent is counted, even though the chair looks busy.",
        ],
      },
      {
        h: "Common pricing mistakes",
        list: [
          "Charging by service name, not by time. A waist-length install takes far longer than a bob; price by length or time band.",
          "Giving permanent discounts to fill quiet days instead of fixing the quiet days.",
          "Forgetting the time between clients: setup, cleaning and chatting are real minutes.",
          "Never raising prices because you are afraid of losing clients. Small, regular increases with notice lose very few.",
        ],
      },
      {
        h: "How software helps",
        p: [
          "When every appointment and sale is recorded, you can see which services take the longest, which bring the most revenue per hour, and which stylists are fully booked. That turns pricing from a guess into a decision. A booking system that shows durations, prices and daily takings in one place makes the yearly price review a one-hour job.",
        ],
      },
    ],
    faqs: [
      { q: "Should I copy my competitors' prices?", a: "Use them as a reference for what clients expect, but set your price from your own costs per hour. If your costs are higher, compete on quality and reliability instead of going below cost." },
      { q: "How often should a salon raise prices?", a: "Review prices at least once a year and whenever rent or product costs change. Small increases announced a few weeks ahead are easier for clients to accept than rare large jumps." },
      { q: "How do I price long services like braids?", a: "Price by time or length band rather than one flat price, and make sure the hourly value of the service is close to your other services. Long, cheap services are a common hidden loss." },
    ],
    related: ["salon-profit-leaks", "stylist-commission-structures", "choosing-salon-software"],
  },
  {
    slug: "salon-profit-leaks",
    title: "Where salons lose money: 8 profit leaks and how to plug them",
    description: "No-shows, unrecorded cash, product waste and idle chairs quietly eat salon profits. How to spot each leak and fix it.",
    category: "Profit & pricing",
    updated: "2026-11-15",
    takeaways: [
      "Busy and profitable are not the same thing. Measure revenue per chair hour, not just how full the salon feels.",
      "No-shows, untracked cash and product waste are the most common leaks.",
      "A daily close, checking takings against M-Pesa and cash, stops most losses within weeks.",
    ],
    blocks: [
      {
        p: [
          "Plenty of salons are full every Saturday and still struggle to pay rent. Usually the problem isn't a lack of clients. It's money slipping out in small ways that nobody tracks. Here are the leaks owners mention most, and what to do about each one.",
        ],
      },
      {
        h: "1. No-shows and late cancellations",
        p: ["An empty slot you held for someone is pure loss: the stylist is still paid, the rent is still due. Ask for a deposit on long or expensive services, send a reminder the day before, and keep a record of who doesn't turn up so you can ask repeat offenders to pay upfront."],
      },
      {
        h: "2. Cash and M-Pesa payments that are never recorded",
        p: ["If payments go to personal phones or straight into a drawer without a record, you can't know what the day really made. Record every sale, take payments on the salon's own till, and close the day by matching recorded sales against the M-Pesa statement and the cash in the drawer."],
      },
      {
        h: "3. Product waste and product walking out the door",
        p: ["Over-mixing colour, using retail products on clients, and stock disappearing all add up. Measure what a typical service uses, keep retail stock separate, and count expensive items weekly."],
      },
      {
        h: "4. Idle chairs on quiet days",
        p: ["A chair empty on Tuesday morning costs the same as a busy one on Saturday. Look at which hours are always slow, then fill them: offer those times to regulars, run off-peak packages instead of blanket discounts, or reduce staff on those shifts."],
      },
      {
        h: "5. Underpriced long services",
        p: ["A five-hour service at a low price can earn less per hour than a quick manicure. Work out revenue per hour for each service and fix the worst ones first."],
      },
      {
        h: "6. Discounts nobody approved",
        p: ["Friendly discounts for friends and regulars feel small but compound. Decide who may give discounts and record each one so you can see what they cost each month."],
      },
      {
        h: "7. Commission paid on the wrong amount",
        p: ["If commission is calculated on the price before a discount, or includes products the salon paid for, you overpay. Agree in writing what commission is calculated on, and calculate it from recorded sales."],
      },
      {
        h: "8. Clients who never come back",
        p: ["Winning a new client costs far more than keeping one. Ask every client to rebook before they leave, note their preferences, and send a friendly message if someone who came every month hasn't returned in two."],
      },
      {
        h: "A 10-minute daily close",
        steps: [
          "Print or open the day's sales list.",
          "Add up M-Pesa payments and check each code against the till statement.",
          "Count the cash drawer and compare it with recorded cash sales.",
          "Check every completed appointment has a payment recorded.",
          "Note no-shows and cancellations.",
        ],
      },
    ],
    faqs: [
      { q: "What is a good way to measure salon profitability?", a: "Track revenue per chair hour and the share of booked hours that actually turned into paid appointments. These show whether the salon is earning, not just whether it looks busy." },
      { q: "How do I stop staff taking payments on their own phones?", a: "Take payments on the salon's till or paybill, record every sale in one system, and close the day by matching sales to the statement. Make it the rule for everyone, including the owner." },
    ],
    related: ["reduce-salon-no-shows", "mpesa-reconciliation-for-salons", "prevent-theft-in-a-salon"],
  },
  {
    slug: "reduce-salon-no-shows",
    title: "How to reduce no-shows at your salon or spa",
    description: "Deposits, reminders, clear cancellation policies and easy rescheduling: a practical system to cut salon no-shows without losing good clients.",
    category: "Profit & pricing",
    updated: "2026-11-15",
    takeaways: [
      "Most no-shows are forgetfulness, so a reminder the day before solves a large share.",
      "Ask for a deposit on long or high-value services. M-Pesa deposits work where card deposits don't.",
      "Make rescheduling easy: clients who can move a booking in seconds cancel instead of disappearing.",
      "Write your policy down and show it at booking, so it's never a surprise.",
    ],
    blocks: [
      {
        p: [
          "No-shows are the complaint salon owners raise more than any other. A three-hour slot held for someone who never arrives is lost money and a lost chance to serve someone else. You can't eliminate them, but a simple system cuts them sharply.",
        ],
      },
      {
        h: "1. Confirm every booking in writing",
        p: ["Send a confirmation as soon as the booking is made, by SMS or WhatsApp, with the date, time, service and your location. A written confirmation also settles arguments about the wrong day or time."],
      },
      {
        h: "2. Send a reminder the day before",
        p: ["A short reminder 24 hours ahead catches people who simply forgot. Include a link or a number to reschedule. Doing this by hand for every client is tiring and gets skipped on busy days, which is why automatic reminders make such a difference."],
      },
      {
        h: "3. Take deposits on the right services",
        p: [
          "You don't need a deposit for a quick eyebrow shape. You do for a five-hour braid install, colour work or anything that blocks a stylist for a long time. Twenty to fifty percent is common.",
          "Card no-show fees often fail because the card has expired or has no funds. An M-Pesa deposit paid at booking is collected upfront, so there's nothing to chase. Make it clear the deposit comes off the final bill.",
        ],
      },
      {
        h: "4. Have a clear, fair cancellation policy",
        p: ["Decide how much notice you need (24 or 48 hours is typical), what happens to the deposit if someone cancels late or doesn't come, and whether you make exceptions for emergencies. Show the policy when people book and in the confirmation. A policy clients saw in advance rarely causes arguments."],
        list: [
          "Example wording: “You can cancel or reschedule up to 24 hours before your appointment. Deposits are kept for no-shows and late cancellations.”",
        ],
      },
      {
        h: "5. Make rescheduling effortless",
        p: ["Many no-shows are people who couldn't make it and felt awkward calling. If they can tap a link and move their booking themselves, they will, and you get the slot back in time to fill it."],
      },
      {
        h: "6. Track repeat offenders",
        p: ["Keep a note of no-shows on each client's record. A client who has missed twice can be asked to pay a full deposit, or to book only same-day slots. Most good clients never notice the rule exists."],
      },
      {
        h: "7. Fill the gaps that still appear",
        p: ["Keep a short list of regulars who are happy to come in at short notice, and message them when a slot opens. Some salons share last-minute openings on their WhatsApp status."],
      },
    ],
    faqs: [
      { q: "How much deposit should a salon charge?", a: "Twenty to fifty percent of the service price is common for long or expensive services. Short, low-value services usually don't need a deposit." },
      { q: "Do reminders really reduce no-shows?", a: "Yes. Many no-shows are simply forgotten appointments, so a reminder the day before, with an easy way to reschedule, prevents a large share of them." },
      { q: "Is it rude to ask clients for a deposit?", a: "Not if the policy is clear and applied fairly. Most clients understand that long services block a stylist's whole day, and regulars appreciate that it protects their own booking times." },
    ],
    related: ["salon-profit-leaks", "client-retention-for-salons", "instagram-whatsapp-bookings"],
  },
];
