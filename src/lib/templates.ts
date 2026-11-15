// Opt-in starter menus so new salons aren't facing an empty screen. Prices are placeholders the owner edits.
export const SERVICE_TEMPLATES: Record<string, { label: string; items: [string, number, number][] }> = {
  hair: { label: "Hair salon", items: [["Wash & blow-dry", 45, 800], ["Silk press", 90, 2500], ["Cornrows", 120, 1500], ["Knotless braids", 300, 6000], ["Locs retwist", 90, 2000], ["Relaxer & style", 120, 2800], ["Wig install", 90, 2500]] },
  barber: { label: "Barbershop", items: [["Haircut", 30, 400], ["Haircut & beard", 45, 600], ["Kids cut", 30, 300], ["Shave", 20, 300], ["Hair dye", 45, 800]] },
  nails: { label: "Nails", items: [["Gel manicure", 60, 1500], ["Pedicure", 60, 1800], ["Acrylic full set", 90, 3000], ["Gel removal", 30, 500]] },
  spa: { label: "Spa & beauty", items: [["Swedish massage (60 min)", 60, 3500], ["Deep tissue massage", 90, 5000], ["Classic facial", 60, 3000], ["Eyebrow shaping", 20, 500], ["Lash extensions", 90, 3500], ["Waxing (full leg)", 45, 2000]] },
};
