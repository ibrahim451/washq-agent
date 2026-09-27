// WashQ Detailing / Westchester Auto Spa HQ
// 15 Independence St, White Plains, NY 10606
// (914) 573-6640 | washqdetailing.com

const BUSINESS_HOURS = {
  0: { open: 9, close: 16, label: "9 AM to 4 PM" },       // Sunday
  1: null,                                                    // Monday CLOSED
  2: { open: 8, close: 17.5, label: "8 AM to 5:30 PM" },  // Tuesday
  3: { open: 8, close: 17.5, label: "8 AM to 5:30 PM" },  // Wednesday
  4: { open: 8, close: 18, label: "8 AM to 6 PM" },        // Thursday
  5: { open: 8, close: 18, label: "8 AM to 6 PM" },        // Friday
  6: { open: 8, close: 18, label: "8 AM to 6 PM" },        // Saturday
};

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const SERVICES = {
  copper: {
    name: "Copper Treatment",
    durationMins: 120,
    bestFor: "Regular maintenance wash",
    pricing: { car: 99.99, midSizeSUV: 109.99, suv: 119.99, suv3Row: 124.99 },
    includes: [
      "Full interior vacuum", "Leather/vinyl wipe down", "Interior disinfected",
      "High gloss interior finish", "Screens cleaned", "Door/trunk jam cleaning",
      "Weather mats cleaned", "Foam cannon shine bath", "Two-bucket hand wash",
      "Tires and rims cleaned", "Tire shine dressing", "Exterior spray wax"
    ],
    popular: true,
  },
  bronze: {
    name: "Bronze Treatment",
    durationMins: 150,
    bestFor: "Monthly deep clean with interior detailing",
    pricing: { car: 199.99, midSizeSUV: 209.99, suv: 219.99, suv3Row: 229.99 },
    includes: [
      "Everything in Copper", "Full interior crevice cleaning",
      "Trunk vacuumed and shined", "Center console and plastics detailed",
      "Leather deep cleaning", "Leather protection applied", "Windshield coated"
    ],
  },
  silver: {
    name: "Silver Treatment",
    durationMins: 210,
    bestFor: "Thorough clean with shampooing and stain treatment",
    pricing: { car: 284.99, midSizeSUV: 294.99, suv: 299.99, suv3Row: 314.99 },
    includes: [
      "Everything in Bronze", "Wheel wells brake dust removal",
      "Leather and upholstery deep cleaning", "Light stain treatment",
      "Seat and floor shampoo and conditioning"
    ],
  },
  gold: {
    name: "Gold Treatment",
    durationMins: 420,
    bestFor: "Full premium restoration — the best we offer",
    pricing: { car: 449.99, suv: 499.99, suv3Row: 519.99 },
    includes: [
      "Everything in Silver", "Ventilation system steam cleaned",
      "Iron decontamination", "Clay bar treatment", "Polishing buff"
    ],
    premium: true,
  },
  "full-interior": {
    name: "Full Interior Treatment",
    durationMins: 210,
    bestFor: "Interior-only deep clean",
    pricing: { car: 244.99, suv: 259.99, suv3Row: 269.99 },
    includes: [
      "Full interior crevice cleaning", "Complete vacuum", "Trunk cleaned and shined",
      "All plastics detailed", "Full upholstery detailing", "Stain treatment",
      "High gloss finish", "Mats cleaned", "Windows and mirrors cleaned"
    ],
  },
  "full-exterior": {
    name: "Full Exterior Treatment",
    durationMins: 240,
    bestFor: "Exterior restoration with 4–6 month paint protection",
    pricing: { car: 274.99, suv: 299.99 },
    includes: [
      "Exterior wash", "Wheel wells brake dust removal", "Bug/tar/sap removal",
      "Iron decontamination", "Door and trunk jams cleaned", "Clay bar treatment",
      "Polishing buff", "Paint sealant 4–6 months", "Windows coated", "Tire shine"
    ],
  },
  detox: {
    name: "Detox Treatment",
    durationMins: 90,
    bestFor: "Vehicle disinfection and sanitization (90-day protection)",
    pricing: { car: 109.99, suv: 119.99, suv3Row: 124.99 },
    includes: ["Basic wash", "Steam treatment", "Full disinfection", "BioShield 75 applied"],
  },
  "paint-sealant-combo": {
    name: "Paint Sealant Combo",
    durationMins: 180,
    bestFor: "Paint protection with 6–12 month sealant",
    pricing: { car: 149.99, suv: 174.99 },
    includes: ["Exterior wash", "Clay bar", "Paint sealant 6–12 months", "Windows coated", "Tire shine"],
  },
  "paint-correction": {
    name: "Paint Correction",
    durationMins: 480,
    bestFor: "Removing scratches, swirl marks, paint imperfections",
    pricing: { stage1: "399.99 and up", stage2: "599.99 and up", stage3: "899.99 and up" },
    requiresAssessment: true,
  },
  "ceramic-coating": {
    name: "Ceramic Coating",
    durationMins: 480,
    bestFor: "Long-term paint, window, and leather protection",
    pricing: { body: "899.99 and up", windows: 199.99, rimsOn: 149.99, rimsOff: 349.99, leatherSeats: 249.99 },
    requiresAssessment: true,
  },
  "window-tinting": {
    name: "Window Tinting",
    durationMins: 180,
    bestFor: "Privacy, UV protection, and heat reduction",
    pricing: {
      fullCar: 284.99, fullSUV: 299.99, threeBack: 199.99,
      twoFront: 174.99, windshield: 174.99,
      ceramicCar: "449.99 and up", ceramicSUV: "524.99 and up",
    },
  },
};

// Recommend a service based on what the customer says
function recommendService(input = "") {
  const t = input.toLowerCase();
  if (t.match(/quick|basic|regular|maintenance|simple/)) return "copper";
  if (t.match(/pet|dog|cat|hair|animal/)) return "silver";
  if (t.match(/stain|shampoo|smell|odor/)) return "silver";
  if (t.match(/deep clean|thorough|monthly/)) return "bronze";
  if (t.match(/best|premium|everything|restore|restoration/)) return "gold";
  if (t.match(/inside only|interior only/)) return "full-interior";
  if (t.match(/outside only|exterior only/)) return "full-exterior";
  if (t.match(/disinfect|sanitize|virus|germ|covid/)) return "detox";
  if (t.match(/sealant|protect paint|protection/)) return "paint-sealant-combo";
  if (t.match(/scratch|swirl|fade|correction/)) return "paint-correction";
  if (t.match(/ceramic|long.?term|lasting protection/)) return "ceramic-coating";
  if (t.match(/tint|tinting|privacy|dark windows/)) return "window-tinting";
  return "copper"; // default: most popular
}

// Get price for a service + vehicle type combo
function getPrice(serviceId, vehicleType) {
  const svc = SERVICES[serviceId];
  if (!svc) return "call for pricing";
  const p = svc.pricing;
  if (vehicleType === "car" && p.car) return `$${p.car}`;
  if (vehicleType === "midSizeSUV" && p.midSizeSUV) return `$${p.midSizeSUV}`;
  if (vehicleType === "suv" && p.suv) return `$${p.suv}`;
  if (vehicleType === "suv3Row" && p.suv3Row) return `$${p.suv3Row}`;
  // fallback
  const first = Object.values(p)[0];
  return first ? `$${first}` : "call for pricing";
}

// Generate available time slots for a given date
function getAvailableSlots(dateStr, bookedStartTimes = [], durationMins = 120) {
  const date = new Date(dateStr + "T00:00:00");
  const dayHours = BUSINESS_HOURS[date.getDay()];
  if (!dayHours) return { closed: true, slots: [] };

  const slots = [];
  const durationHrs = durationMins / 60;
  let current = dayHours.open;

  while (current + durationHrs <= dayHours.close) {
    const slotDate = new Date(date);
    const hour = Math.floor(current);
    const minute = Math.round((current % 1) * 60);
    slotDate.setHours(hour, minute, 0, 0);

    const isoTime = slotDate.toISOString();
    const displayTime = slotDate.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true,
    });

    // Check if this slot overlaps with any existing booking
    const isBooked = bookedStartTimes.some(bookedISO => {
      const bookedTime = new Date(bookedISO).getTime();
      const slotTime = slotDate.getTime();
      return Math.abs(bookedTime - slotTime) < durationMins * 60 * 1000;
    });

    if (!isBooked) {
      slots.push({ time: displayTime, startAt: isoTime });
    }
    current += 0.5; // 30-minute intervals
  }

  return { closed: false, slots, hours: dayHours.label };
}

module.exports = { SERVICES, BUSINESS_HOURS, DAY_NAMES, recommendService, getPrice, getAvailableSlots };
