import type { Guide } from "./types";

export const staffGuides: Guide[] = [
  {
    slug: "stylist-commission-structures",
    title: "Salary, commission or chair rental: paying salon staff fairly",
    description: "Compare salary, commission, hybrid and chair-rental models for paying stylists, barbers and therapists, and how to calculate commission correctly.",
    category: "Staff",
    updated: "2026-11-15",
    takeaways: [
      "Commission rewards busy stylists but makes income unpredictable. A base plus commission balances both.",
      "Agree in writing what commission is calculated on: service price after discounts, excluding products and tips.",
      "Chair rental means the stylist runs their own business, including their own clients and payments.",
      "Let each stylist see their own services and earnings. Transparency prevents most pay disputes.",
    ],
    blocks: [
      {
        p: ["How you pay your team shapes everything: how hard people push for bookings, whether they stay, and how much profit is left. There's no single right model, but each has trade-offs you should choose deliberately."],
      },
      {
        h: "The main models",
        list: [
          "Fixed salary: predictable for staff, but the salon carries the cost on quiet days and there's little reward for building a client base.",
          "Commission only: staff earn a percentage of the services they do, often 20–40% in Kenyan salons and barbershops. Busy stylists earn well; new ones can struggle.",
          "Base plus commission: a modest guaranteed amount plus a lower commission. Often the fairest balance between security and reward.",
          "Chair rental: the stylist pays the salon a fixed fee for a chair, keeps their takings, and usually takes payments on their own number. The salon becomes a landlord rather than an employer.",
        ],
      },
      {
        h: "Calculate commission on the right amount",
        p: ["Disputes usually come from unclear maths. Write down the rules:"],
        list: [
          "Commission is calculated on the service price actually charged, after any discount.",
          "Products the salon paid for aren't part of commission, unless you pay a separate retail commission.",
          "Tips belong to the stylist and aren't part of commission or salon revenue.",
          "Deposits count towards the service when the client pays the balance, not twice.",
        ],
      },
      {
        h: "Make earnings visible",
        p: ["Stylists often can't see their monthly totals until payday, which breeds suspicion. When every service is recorded against the stylist who did it, each person can see their own services, commission and tips at any time, and payday becomes a formality."],
      },
      {
        h: "Statutory deductions",
        p: ["Employees in Kenya are subject to statutory deductions and contributions, such as PAYE and social security and health schemes. Rates and schemes have changed in recent years, so confirm current requirements with KRA, the relevant authorities or an accountant before setting pay."],
      },
      {
        h: "Choosing a model",
        steps: [
          "Work out what each service earns per hour after products and overheads.",
          "Decide what share the salon needs to stay profitable.",
          "Choose the model and rate that leaves both stylist and salon better off when the stylist is busy.",
          "Put it in writing and review it once a year.",
        ],
      },
    ],
    faqs: [
      { q: "What commission do stylists usually earn in Kenya?", a: "Commission of around 20–40% of service revenue is commonly reported for salons and barbershops, but it varies with location, base pay and who supplies products. Choose a rate that keeps the salon profitable." },
      { q: "Should commission be paid on the price before or after a discount?", a: "After. Commission on the full price when the client paid less means the salon pays commission on money it never received. Write the rule down." },
      { q: "Do tips belong to the stylist?", a: "Generally yes. Tips are for the person who served the client and shouldn't be counted as salon revenue or mixed with commission. If tips come through the salon till, record who they belong to and pay them out in full." },
    ],
    related: ["managing-salon-staff", "how-to-price-salon-services", "mpesa-reconciliation-for-salons"],
  },
  {
    slug: "managing-salon-staff",
    title: "Managing salon staff: hiring, scheduling and keeping good people",
    description: "How to hire, schedule, train and keep stylists and therapists, with clear expectations, fair rotas and performance you can actually measure.",
    category: "Staff",
    updated: "2026-11-15",
    takeaways: [
      "Hire with a paid trial day, not just an interview.",
      "Build the rota from booking data so staffing matches busy hours.",
      "Measure what matters: rebooking rate, revenue per hour, reviews, not just time in the building.",
      "Good stylists leave over unclear pay and unfair treatment more than over money alone.",
    ],
    blocks: [
      {
        p: ["Your team is the product. Clients come back for the stylist as much as the salon. Managing people well protects your reputation and your profit."],
      },
      {
        h: "Hiring",
        list: [
          "Ask to see real work: photos, references, a portfolio on Instagram.",
          "Do a paid trial day on real clients, with you watching consultation, finish and how they treat people.",
          "Agree pay, hours, the services they'll do and house rules in writing before day one.",
        ],
      },
      {
        h: "Scheduling",
        p: ["Look at when you're actually busy. Most salons have slow weekday mornings and packed weekends. Staff the busy hours fully, and use quiet hours for training, cleaning and admin. Publish the rota in advance and agree how swaps and leave requests work."],
      },
      {
        h: "Training and standards",
        p: ["Write down how services are done: consultation steps, hygiene, timings, how to handle complaints. New staff learn faster and clients get the same experience whoever serves them. Short team meetings to share what's working keep standards up."],
      },
      {
        h: "Measuring performance fairly",
        list: [
          "Rebooking rate: how many clients book again with this stylist.",
          "Revenue per hour worked, not just total revenue.",
          "Reviews and complaints.",
          "Punctuality and no-shows on their own bookings.",
        ],
        p: ["Share the numbers with each stylist privately. Most people improve when they can see their own results."],
      },
      {
        h: "Keeping good people",
        p: ["Clear, accurate pay, the chance to grow (new skills, better clients, a senior role) and being treated with respect matter as much as the rate. Make sure stylists can see what they've earned, and pay on time, every time."],
      },
      {
        h: "When someone leaves",
        p: ["Keep client records, booking history and notes in the salon's system so the business keeps its relationships. Thank the person, settle pay promptly, and part on good terms. Salon communities are small."],
      },
    ],
    faqs: [
      { q: "How do I schedule salon staff efficiently?", a: "Use your booking history to see which hours and days are busiest, staff those fully, and use quiet periods for training and admin. Publish the rota in advance." },
      { q: "How can I measure a stylist's performance?", a: "Look at rebooking rate, revenue per hour worked, reviews and punctuality, rather than hours in the salon. Share each person's numbers with them privately." },
    ],
    related: ["stylist-commission-structures", "prevent-theft-in-a-salon", "handling-difficult-salon-clients"],
  },
];
