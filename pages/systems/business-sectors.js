/* ============================================================================
 * business-sectors.js  (v18.35 — Sector Overhaul, Stage 1)
 * ----------------------------------------------------------------------------
 * Redistributes every venture into 10 clean real-world sectors (10 ventures
 * each = 100 total), adds 69 new mid-to-high earning companies, and gives each
 * new venture its own signature action.  Loads AFTER business-entities.js so it
 * can extend the global entrepreneurshipCatalog and re-home existing ventures.
 *
 * Exposes for later stages (sector mechanics live here too):
 *   window.LEDGER_SECTORS          - ordered sector defs {id,name,icon,mechanic,blurb}
 *   window.SECTOR_ORDER            - sector names in display order
 *   window.SECTOR_OF               - { ventureId: sectorName } for all 100
 *   window.SECTOR_VENTURE_ACTIONS  - { ventureId: signatureAction } for new ventures
 * ========================================================================== */
(function () {
  "use strict";

  // ---- 10 sectors, in display order. `mechanic` is reserved for Stage 2. ----
  var SECTORS = [
    { id: "food",      name: "Food & Drink",          icon: "🍔", mechanic: "health",     blurb: "Restaurants, bars-as-kitchens, and food brands. Health ratings make or break you." },
    { id: "nightlife", name: "Nightlife & Events",    icon: "🌙", mechanic: "buzz",       blurb: "Clubs, venues, and events. Buzz spikes hot then cools fast." },
    { id: "retail",    name: "Retail & Commerce",     icon: "🛍️", mechanic: "inventory",  blurb: "Stores and brands. Inventory timing is everything." },
    { id: "trades",    name: "Trades & Services",     icon: "🔧", mechanic: "backlog",    blurb: "Hands-on service companies that live and die by their job backlog." },
    { id: "media",     name: "Media & Entertainment", icon: "🎬", mechanic: "audience",   blurb: "Content, studios, and agencies. Audience compounds — or fades." },
    { id: "tech",      name: "Tech & Startups",       icon: "💻", mechanic: "mrr",        blurb: "Software and platforms. Recurring revenue vs. churn." },
    { id: "finance",   name: "Finance & Professional",icon: "💼", mechanic: "aum",        blurb: "Firms that earn on a book of clients and assets under management." },
    { id: "realestate",name: "Real Estate & Property",icon: "🏢", mechanic: "occupancy",  blurb: "Property you rent, flip, build, or hold. Occupancy drives cash." },
    { id: "health",    name: "Health & Wellness",     icon: "🩺", mechanic: "patients",   blurb: "Clinics and wellness brands. Patient load and licensing matter." },
    { id: "logistics", name: "Logistics & Industrial",icon: "🚚", mechanic: "capacity",   blurb: "Move and make things at scale. Capacity utilization is king." }
  ];

  // ---- Existing 31 ventures → clean sector (re-homed, definitions untouched) ----
  var EXISTING_REMAP = {
    // Food & Drink
    foodtruck: "Food & Drink", hospitalitygroup: "Food & Drink",
    // Nightlife & Events
    sportsbar: "Nightlife & Events", nightclub: "Nightlife & Events",
    cornerbar: "Nightlife & Events", eventsecurity: "Nightlife & Events",
    // Retail & Commerce
    resale: "Retail & Commerce", ecommercebrand: "Retail & Commerce",
    // Trades & Services
    lawncare: "Trades & Services", contracting: "Trades & Services", carwashchain: "Trades & Services",
    // Media & Entertainment
    content: "Media & Entertainment", printshop: "Media & Entertainment",
    mediaagency: "Media & Entertainment", recordlabel: "Media & Entertainment",
    talentagency: "Media & Entertainment", filmstudio: "Media & Entertainment",
    // Tech & Startups
    startup: "Tech & Startups", saascompany: "Tech & Startups",
    // Finance & Professional
    tutoringbiz: "Finance & Professional", consultingfirm: "Finance & Professional",
    privateequity: "Finance & Professional", hedgefund: "Finance & Professional",
    // Real Estate & Property
    realestateholdco: "Real Estate & Property", luxuryrealty: "Real Estate & Property",
    // Health & Wellness
    medicalpractice: "Health & Wellness",
    // Logistics & Industrial
    vendingroute: "Logistics & Industrial", logisticsfleet: "Logistics & Industrial",
    aircraftcharter: "Logistics & Industrial", aircraftservices: "Logistics & Industrial",
    aircraftleasing: "Logistics & Industrial"
  };

  // ---- 69 NEW ventures (no `category` here — assigned from `sector` below) ----
  var NEW_VENTURES = [
    // ---------- Food & Drink (8 new) ----------
    { id: "coffeehouse",  sector: "Food & Drink", name: "Coffeehouse",            minAge: 18, startup: 35000,  yearlyMin: -8000,   yearlyMax: 160000,  scaleStat: "discipline", failureRisk: .12, desc: "Espresso, pastries, and regulars. Foot traffic is everything." },
    { id: "juicebar",     sector: "Food & Drink", name: "Juice & Smoothie Bar",   minAge: 18, startup: 28000,  yearlyMin: -7000,   yearlyMax: 120000,  scaleStat: "popularity", failureRisk: .12, desc: "Health-trend drinks. Cheap to run, trend-sensitive." },
    { id: "bakeryco",     sector: "Food & Drink", name: "Artisan Bakery",         minAge: 18, startup: 45000,  yearlyMin: -10000,  yearlyMax: 210000,  scaleStat: "creativity", failureRisk: .13, desc: "Bread, cakes, custom orders. Early mornings, loyal fans." },
    { id: "fastcasual",   sector: "Food & Drink", name: "Fast-Casual Chain",      minAge: 21, startup: 180000, yearlyMin: -55000,  yearlyMax: 1300000, scaleStat: "discipline", failureRisk: .20, desc: "Build-your-own bowls. Scales by opening locations." },
    { id: "finedining",   sector: "Food & Drink", name: "Fine Dining Restaurant", minAge: 24, startup: 320000, yearlyMin: -160000, yearlyMax: 1900000, scaleStat: "creativity", failureRisk: .27, desc: "Tasting menus and reviews. Prestige, brutal margins." },
    { id: "ghostkitchen", sector: "Food & Drink", name: "Ghost Kitchen Network",  minAge: 21, startup: 90000,  yearlyMin: -28000,  yearlyMax: 880000,  scaleStat: "smarts",     failureRisk: .18, desc: "Delivery-only brands from shared kitchens. App-driven." },
    { id: "breweryco",    sector: "Food & Drink", name: "Craft Brewery",          minAge: 21, startup: 260000, yearlyMin: -90000,  yearlyMax: 1500000, scaleStat: "creativity", failureRisk: .22, desc: "Beer, taproom, distribution. Capital-heavy, cult following." },
    { id: "cateringco",   sector: "Food & Drink", name: "Catering Company",       minAge: 21, startup: 70000,  yearlyMin: -18000,  yearlyMax: 620000,  scaleStat: "discipline", failureRisk: .15, desc: "Weddings, corporate events, big-batch logistics." },

    // ---------- Nightlife & Events (6 new) ----------
    { id: "loungebar",    sector: "Nightlife & Events", name: "Cocktail Lounge",       minAge: 21, startup: 95000,  yearlyMin: -38000,  yearlyMax: 720000,  scaleStat: "popularity", failureRisk: .20, desc: "Upscale drinks, bottle service, late nights." },
    { id: "concerthall",  sector: "Nightlife & Events", name: "Live Music Venue",      minAge: 21, startup: 280000, yearlyMin: -120000, yearlyMax: 1700000, scaleStat: "popularity", failureRisk: .26, desc: "Touring acts, ticketing, bar sales, and dead nights." },
    { id: "comedyclub",   sector: "Nightlife & Events", name: "Comedy Club",           minAge: 21, startup: 85000,  yearlyMin: -30000,  yearlyMax: 540000,  scaleStat: "popularity", failureRisk: .20, desc: "Headliners, open mics, two-drink minimums." },
    { id: "eventplanning",sector: "Nightlife & Events", name: "Event Planning Agency", minAge: 21, startup: 45000,  yearlyMin: -12000,  yearlyMax: 680000,  scaleStat: "popularity", failureRisk: .16, desc: "Weddings, galas, corporate events. Reputation business." },
    { id: "festivalco",   sector: "Nightlife & Events", name: "Festival Production Co",minAge: 25, startup: 600000, yearlyMin: -400000, yearlyMax: 4200000, scaleStat: "popularity", failureRisk: .33, desc: "Multi-day festivals. Massive upside, weather-and-permit risk." },
    { id: "ticketingco",  sector: "Nightlife & Events", name: "Ticketing Platform",    minAge: 23, startup: 220000, yearlyMin: -70000,  yearlyMax: 2400000, scaleStat: "smarts",     failureRisk: .24, desc: "Take a cut of every ticket. Scales with your venue network." },

    // ---------- Retail & Commerce (8 new) ----------
    { id: "boutiqueco",      sector: "Retail & Commerce", name: "Fashion Boutique",     minAge: 18, startup: 40000,  yearlyMin: -12000, yearlyMax: 280000,  scaleStat: "creativity", failureRisk: .15, desc: "Curated clothing. Trend-timing makes or breaks it." },
    { id: "sneakerstore",    sector: "Retail & Commerce", name: "Sneaker Boutique",     minAge: 18, startup: 60000,  yearlyMin: -20000, yearlyMax: 520000,  scaleStat: "popularity", failureRisk: .17, desc: "Hype drops, resale, lines out the door." },
    { id: "conveniencestore",sector: "Retail & Commerce", name: "Convenience Store",    minAge: 18, startup: 75000,  yearlyMin: -15000, yearlyMax: 340000,  scaleStat: "discipline", failureRisk: .12, desc: "Steady margins, theft risk, long hours." },
    { id: "thriftchain",     sector: "Retail & Commerce", name: "Thrift Store Chain",   minAge: 18, startup: 50000,  yearlyMin: -12000, yearlyMax: 410000,  scaleStat: "smarts",     failureRisk: .13, desc: "Secondhand goods, sorting, sustainable trend." },
    { id: "furniturestore",  sector: "Retail & Commerce", name: "Furniture Showroom",   minAge: 21, startup: 160000, yearlyMin: -50000, yearlyMax: 980000,  scaleStat: "smarts",     failureRisk: .18, desc: "Big-ticket sales, showroom space, delivery." },
    { id: "jewelrybrand",    sector: "Retail & Commerce", name: "Jewelry Brand",        minAge: 21, startup: 120000, yearlyMin: -40000, yearlyMax: 1400000, scaleStat: "creativity", failureRisk: .20, desc: "High margin, inventory ties up cash, brand-driven." },
    { id: "petsupply",       sector: "Retail & Commerce", name: "Pet Supply Store",     minAge: 18, startup: 55000,  yearlyMin: -14000, yearlyMax: 360000,  scaleStat: "discipline", failureRisk: .12, desc: "Recurring food and supplies, loyal pet owners." },
    { id: "beautybrand",     sector: "Retail & Commerce", name: "Cosmetics Brand",      minAge: 21, startup: 110000, yearlyMin: -45000, yearlyMax: 1900000, scaleStat: "popularity", failureRisk: .22, desc: "DTC makeup and skincare. Influencer-driven virality." },

    // ---------- Trades & Services (7 new) ----------
    { id: "cleaningco",  sector: "Trades & Services", name: "Cleaning Service",      minAge: 18, startup: 8000,  yearlyMin: -2000,  yearlyMax: 180000, scaleStat: "discipline", failureRisk: .10, desc: "Homes and offices. Low startup, recurring contracts." },
    { id: "hvacco",      sector: "Trades & Services", name: "HVAC Company",          minAge: 21, startup: 40000, yearlyMin: -10000, yearlyMax: 520000, scaleStat: "discipline", failureRisk: .13, desc: "Install and repair. Seasonal demand, skilled techs." },
    { id: "plumbingco",  sector: "Trades & Services", name: "Plumbing Company",      minAge: 21, startup: 35000, yearlyMin: -9000,  yearlyMax: 480000, scaleStat: "discipline", failureRisk: .12, desc: "Emergency calls pay well. Licensing matters." },
    { id: "electricco",  sector: "Trades & Services", name: "Electrical Contractor", minAge: 21, startup: 45000, yearlyMin: -12000, yearlyMax: 560000, scaleStat: "discipline", failureRisk: .14, desc: "Wiring, panels, code. Commercial jobs scale big." },
    { id: "landscapeco", sector: "Trades & Services", name: "Landscaping Company",   minAge: 18, startup: 25000, yearlyMin: -6000,  yearlyMax: 320000, scaleStat: "discipline", failureRisk: .11, desc: "Design, install, maintain. Seasonal crews." },
    { id: "roofingco",   sector: "Trades & Services", name: "Roofing Company",       minAge: 21, startup: 55000, yearlyMin: -18000, yearlyMax: 680000, scaleStat: "discipline", failureRisk: .17, desc: "Storm-driven demand, dangerous work, big tickets." },
    { id: "autorepair",  sector: "Trades & Services", name: "Auto Repair Shop",      minAge: 18, startup: 60000, yearlyMin: -15000, yearlyMax: 440000, scaleStat: "smarts",     failureRisk: .13, desc: "Service bays, parts margin, loyal customers." },

    // ---------- Media & Entertainment (4 new) ----------
    { id: "podcastnet",      sector: "Media & Entertainment", name: "Podcast Network",   minAge: 18, startup: 30000,  yearlyMin: -8000,   yearlyMax: 740000,  scaleStat: "creativity", failureRisk: .18, desc: "Shows, ads, subscriptions. Audience compounds." },
    { id: "gamestudio",      sector: "Media & Entertainment", name: "Indie Game Studio", minAge: 21, startup: 150000, yearlyMin: -90000,  yearlyMax: 3200000, scaleStat: "creativity", failureRisk: .30, desc: "One hit changes everything. Long dev cycles." },
    { id: "adagency",        sector: "Media & Entertainment", name: "Advertising Agency",minAge: 23, startup: 80000,  yearlyMin: -25000,  yearlyMax: 1500000, scaleStat: "creativity", failureRisk: .20, desc: "Campaigns, retainers, creative talent." },
    { id: "animationstudio", sector: "Media & Entertainment", name: "Animation Studio",  minAge: 24, startup: 200000, yearlyMin: -110000, yearlyMax: 2200000, scaleStat: "creativity", failureRisk: .27, desc: "Series, films, commercial work. Pipeline-heavy." },

    // ---------- Tech & Startups (8 new) ----------
    { id: "mobileapp",      sector: "Tech & Startups", name: "Mobile App Studio",   minAge: 18, startup: 40000,  yearlyMin: -20000,  yearlyMax: 900000,  scaleStat: "creativity", failureRisk: .24, desc: "Ship apps, chase downloads, monetize attention." },
    { id: "marketplaceapp", sector: "Tech & Startups", name: "Online Marketplace",  minAge: 21, startup: 250000, yearlyMin: -120000, yearlyMax: 3800000, scaleStat: "smarts",     failureRisk: .27, desc: "Connect buyers and sellers, take a cut. Network effects." },
    { id: "fintechstartup", sector: "Tech & Startups", name: "Fintech Startup",     minAge: 23, startup: 400000, yearlyMin: -200000, yearlyMax: 4600000, scaleStat: "iq",         failureRisk: .30, desc: "Payments, lending, banking apps. Heavy regulation." },
    { id: "cybersecfirm",   sector: "Tech & Startups", name: "Cybersecurity Firm",  minAge: 24, startup: 180000, yearlyMin: -60000,  yearlyMax: 2400000, scaleStat: "iq",         failureRisk: .20, desc: "Protect companies from breaches. Recurring contracts." },
    { id: "aistartup",      sector: "Tech & Startups", name: "AI Startup",          minAge: 21, startup: 500000, yearlyMin: -300000, yearlyMax: 6500000, scaleStat: "iq",         failureRisk: .33, desc: "Models and tooling. Insane ceiling, brutal burn." },
    { id: "devtools",       sector: "Tech & Startups", name: "Developer Tools Co",  minAge: 23, startup: 220000, yearlyMin: -90000,  yearlyMax: 2800000, scaleStat: "iq",         failureRisk: .24, desc: "Sell software to engineers. Sticky once adopted." },
    { id: "cloudhosting",   sector: "Tech & Startups", name: "Cloud Hosting Service",minAge: 24,startup: 350000, yearlyMin: -140000, yearlyMax: 3100000, scaleStat: "smarts",     failureRisk: .25, desc: "Servers and uptime. Capital-heavy, recurring revenue." },
    { id: "edtechco",       sector: "Tech & Startups", name: "EdTech Platform",     minAge: 21, startup: 130000, yearlyMin: -55000,  yearlyMax: 1700000, scaleStat: "smarts",     failureRisk: .23, desc: "Courses and learning tools. Mission-driven scaling." },

    // ---------- Finance & Professional (6 new) ----------
    { id: "lawfirm",         sector: "Finance & Professional", name: "Law Firm",             minAge: 27, startup: 90000,   yearlyMin: -25000,  yearlyMax: 2200000, scaleStat: "smarts",     failureRisk: .15, desc: "Billable hours, partners, retainers. Prestige scales fees." },
    { id: "accountingfirm",  sector: "Finance & Professional", name: "Accounting Firm",      minAge: 25, startup: 50000,   yearlyMin: -12000,  yearlyMax: 980000,  scaleStat: "discipline", failureRisk: .10, desc: "Tax, audit, advisory. Steady and recession-resistant." },
    { id: "vcfund",          sector: "Finance & Professional", name: "Venture Capital Fund", minAge: 30, startup: 1000000, yearlyMin: -500000, yearlyMax: 8000000, scaleStat: "smarts",     failureRisk: .30, desc: "Back startups for equity. Power-law returns." },
    { id: "wealthmgmt",      sector: "Finance & Professional", name: "Wealth Management Firm",minAge: 28, startup: 200000,  yearlyMin: -60000,  yearlyMax: 2600000, scaleStat: "smarts",     failureRisk: .16, desc: "Manage rich clients' money for a fee on assets." },
    { id: "insurancebroker", sector: "Finance & Professional", name: "Insurance Brokerage",  minAge: 24, startup: 70000,   yearlyMin: -18000,  yearlyMax: 1100000, scaleStat: "discipline", failureRisk: .12, desc: "Commissions and renewals. Boring but durable." },
    { id: "recruitingfirm",  sector: "Finance & Professional", name: "Executive Recruiting", minAge: 24, startup: 45000,   yearlyMin: -12000,  yearlyMax: 920000,  scaleStat: "popularity", failureRisk: .15, desc: "Place top talent for big placement fees." },

    // ---------- Real Estate & Property (8 new) ----------
    { id: "propertymgmt",    sector: "Real Estate & Property", name: "Property Management Co",  minAge: 23, startup: 60000,   yearlyMin: -15000,  yearlyMax: 760000,  scaleStat: "discipline", failureRisk: .13, desc: "Manage rentals for owners. Recurring fee per door." },
    { id: "houseflipping",   sector: "Real Estate & Property", name: "House Flipping Co",       minAge: 23, startup: 200000,  yearlyMin: -120000, yearlyMax: 1600000, scaleStat: "smarts",     failureRisk: .24, desc: "Buy, renovate, sell. Market-timing and budgets." },
    { id: "storageunits",    sector: "Real Estate & Property", name: "Self-Storage Facility",   minAge: 25, startup: 450000,  yearlyMin: -90000,  yearlyMax: 1700000, scaleStat: "discipline", failureRisk: .14, desc: "Recurring rent, low overhead, recession-resistant." },
    { id: "apartmentdev",    sector: "Real Estate & Property", name: "Apartment Developer",     minAge: 28, startup: 1200000, yearlyMin: -600000, yearlyMax: 6800000, scaleStat: "smarts",     failureRisk: .28, desc: "Build and rent units. Huge capital, long timelines." },
    { id: "commercialre",    sector: "Real Estate & Property", name: "Commercial Real Estate",  minAge: 28, startup: 900000,  yearlyMin: -400000, yearlyMax: 5200000, scaleStat: "smarts",     failureRisk: .26, desc: "Office, retail, industrial leases. Big tenants, big swings." },
    { id: "mobilehomepark",  sector: "Real Estate & Property", name: "Mobile Home Park",        minAge: 26, startup: 400000,  yearlyMin: -70000,  yearlyMax: 1500000, scaleStat: "discipline", failureRisk: .13, desc: "Cheap to operate, steady lot rent, underrated cash flow." },
    { id: "vacationrentals", sector: "Real Estate & Property", name: "Vacation Rental Portfolio",minAge: 23,startup: 250000,  yearlyMin: -80000,  yearlyMax: 1900000, scaleStat: "popularity", failureRisk: .20, desc: "Short-term rentals. Seasonal and review-driven." },
    { id: "reitfund",        sector: "Real Estate & Property", name: "Private REIT",            minAge: 30, startup: 1500000, yearlyMin: -500000, yearlyMax: 7500000, scaleStat: "smarts",     failureRisk: .24, desc: "Pool capital into income property at scale." },

    // ---------- Health & Wellness (9 new) ----------
    { id: "dentaloffice",    sector: "Health & Wellness", name: "Dental Practice",            minAge: 27, startup: 280000, yearlyMin: -70000, yearlyMax: 1600000, scaleStat: "smarts",     failureRisk: .13, desc: "Cleanings, procedures, insurance billing. Steady demand." },
    { id: "gymchain",        sector: "Health & Wellness", name: "Gym & Fitness Chain",        minAge: 21, startup: 150000, yearlyMin: -60000, yearlyMax: 1300000, scaleStat: "popularity", failureRisk: .20, desc: "Memberships, classes, churn. Scales by location." },
    { id: "medspaclinic",    sector: "Health & Wellness", name: "Med Spa Clinic",             minAge: 25, startup: 200000, yearlyMin: -55000, yearlyMax: 1900000, scaleStat: "popularity", failureRisk: .19, desc: "Aesthetics and wellness. High margin, trend-driven." },
    { id: "urgentcare",      sector: "Health & Wellness", name: "Urgent Care Clinic",         minAge: 28, startup: 500000, yearlyMin: -120000,yearlyMax: 2400000, scaleStat: "smarts",     failureRisk: .16, desc: "Walk-in care between doctor and ER. Volume business." },
    { id: "physicaltherapy", sector: "Health & Wellness", name: "Physical Therapy Clinic",    minAge: 26, startup: 120000, yearlyMin: -30000, yearlyMax: 920000,  scaleStat: "discipline", failureRisk: .12, desc: "Rehab and recovery. Referral-driven, recurring visits." },
    { id: "vetclinic",       sector: "Health & Wellness", name: "Veterinary Clinic",          minAge: 27, startup: 240000, yearlyMin: -60000, yearlyMax: 1500000, scaleStat: "smarts",     failureRisk: .13, desc: "Pet care, surgery, boarding. Owners spend on pets." },
    { id: "pharmacyco",      sector: "Health & Wellness", name: "Independent Pharmacy",       minAge: 26, startup: 300000, yearlyMin: -70000, yearlyMax: 1400000, scaleStat: "discipline", failureRisk: .14, desc: "Prescriptions and retail. Thin margins, steady traffic." },
    { id: "wellnessbrand",   sector: "Health & Wellness", name: "Wellness & Supplement Brand",minAge: 21, startup: 90000,  yearlyMin: -35000, yearlyMax: 1700000, scaleStat: "popularity", failureRisk: .22, desc: "Vitamins, programs, DTC. Influencer-fueled." },
    { id: "homecareco",      sector: "Health & Wellness", name: "Home Care Agency",           minAge: 25, startup: 80000,  yearlyMin: -20000, yearlyMax: 1100000, scaleStat: "discipline", failureRisk: .13, desc: "In-home senior care. Staffing-heavy, aging demand." },

    // ---------- Logistics & Industrial (5 new) ----------
    { id: "truckingco",      sector: "Logistics & Industrial", name: "Trucking Company",      minAge: 23, startup: 180000, yearlyMin: -70000,  yearlyMax: 1500000, scaleStat: "discipline", failureRisk: .20, desc: "Freight, drivers, fuel, contracts. Capacity is king." },
    { id: "warehouseco",     sector: "Logistics & Industrial", name: "Warehouse & Fulfillment",minAge: 24,startup: 320000, yearlyMin: -110000, yearlyMax: 2300000, scaleStat: "discipline", failureRisk: .19, desc: "Store and ship for brands. Recurring, space-bound." },
    { id: "manufacturingco", sector: "Logistics & Industrial", name: "Manufacturing Plant",   minAge: 26, startup: 700000, yearlyMin: -350000, yearlyMax: 4400000, scaleStat: "discipline", failureRisk: .25, desc: "Make physical goods at scale. Capital and capacity heavy." },
    { id: "recyclingco",     sector: "Logistics & Industrial", name: "Recycling & Waste Co",  minAge: 24, startup: 250000, yearlyMin: -80000,  yearlyMax: 1600000, scaleStat: "discipline", failureRisk: .16, desc: "Collection, sorting, resale of materials. Contract-driven." },
    { id: "importexport",    sector: "Logistics & Industrial", name: "Import/Export Trading", minAge: 24, startup: 150000, yearlyMin: -90000,  yearlyMax: 2100000, scaleStat: "smarts",     failureRisk: .24, desc: "Source abroad, sell domestic. Currency and shipping risk." }
  ];

  // ---- Signature action per NEW venture (existing 31 keep their own actions) ----
  // Shape matches business-entities.js VENTURE_ACTIONS: cost scales off the
  // venture's startup; rep/valueMult apply now; payoutMult pays a randomized bonus.
  var ACTIONS = {
    // Food & Drink
    coffeehouse:  { label: "Launch a Loyalty App",        icon: "☕", costMult: .15, costMin: 1500, rep: 5, payoutMult: .05, result: "Rolled out a loyalty app; regulars come more often." },
    juicebar:     { label: "Partner with a Gym",          icon: "🥤", costMult: .20, costMin: 1500, rep: 5, valueMult: 1.05, result: "Set up a juice bar inside a busy gym." },
    bakeryco:     { label: "Win a Wedding Cake Contract", icon: "🎂", costMult: .15, costMin: 2000, rep: 6, payoutMult: .06, result: "Became the go-to bakery for local weddings." },
    fastcasual:   { label: "Open a New Location",         icon: "🥗", costMult: .12, costMin: 8000, rep: 6, valueMult: 1.07, result: "Opened a new location in a busy corridor." },
    finedining:   { label: "Court a Food Critic",         icon: "🍽️", costMult: .08, costMin: 8000, rep: 9, valueMult: 1.08, result: "A glowing review put the restaurant on the map." },
    ghostkitchen: { label: "Launch a Delivery Brand",     icon: "🛵", costMult: .10, costMin: 4000, rep: 6, valueMult: 1.06, result: "Spun up a new delivery-only brand overnight." },
    breweryco:    { label: "Release a Seasonal Beer",     icon: "🍺", costMult: .10, costMin: 5000, rep: 7, payoutMult: .06, result: "A seasonal release sold out and built hype." },
    cateringco:   { label: "Land a Corporate Account",    icon: "🤵", costMult: .10, costMin: 3000, rep: 7, valueMult: 1.05, result: "Locked in a recurring corporate catering account." },

    // Nightlife & Events
    loungebar:     { label: "VIP Bottle Service Night", icon: "🍾", costMult: .08, costMin: 4000,  rep: 7,  payoutMult: .07, result: "A VIP night packed the lounge." },
    concerthall:   { label: "Book a Touring Act",       icon: "🎤", costMult: .08, costMin: 6000,  rep: 9,  payoutMult: .08, result: "Booked a touring act and sold out the room." },
    comedyclub:    { label: "Headliner Weekend",        icon: "🎙️", costMult: .10, costMin: 3000,  rep: 7,  payoutMult: .06, result: "A big headliner weekend drew crowds." },
    eventplanning: { label: "Plan a Celebrity Wedding", icon: "💍", costMult: .10, costMin: 3000,  rep: 9,  valueMult: 1.07, result: "Planned a high-profile wedding; referrals poured in." },
    festivalco:    { label: "Announce a Lineup",        icon: "🎪", costMult: .06, costMin: 20000, rep: 10, payoutMult: .07, result: "A stacked lineup announcement spiked ticket sales." },
    ticketingco:   { label: "Sign an Exclusive Venue",  icon: "🎟️", costMult: .06, costMin: 8000,  rep: 8,  valueMult: 1.08, result: "Signed an exclusive ticketing deal with a major venue." },

    // Retail & Commerce
    boutiqueco:       { label: "Drop a New Collection",     icon: "👗", costMult: .15, costMin: 2000, rep: 6, payoutMult: .06, result: "A new collection sold through fast." },
    sneakerstore:     { label: "Secure an Exclusive Drop",  icon: "👟", costMult: .12, costMin: 3000, rep: 7, payoutMult: .07, result: "Landed an exclusive sneaker drop; lines formed." },
    conveniencestore: { label: "Add a Hot Food Counter",    icon: "🌭", costMult: .15, costMin: 2000, rep: 4, payoutMult: .05, result: "Added a hot food counter; baskets got bigger." },
    thriftchain:      { label: "Open a New Store",          icon: "♻️", costMult: .15, costMin: 4000, rep: 5, valueMult: 1.06, result: "Opened a new thrift location." },
    furniturestore:   { label: "Run a Showroom Event",      icon: "🛋️", costMult: .10, costMin: 5000, rep: 6, payoutMult: .06, result: "A weekend showroom event cleared inventory." },
    jewelrybrand:     { label: "Launch a Signature Line",   icon: "💎", costMult: .10, costMin: 6000, rep: 8, valueMult: 1.08, result: "Launched a signature collection with buzz." },
    petsupply:        { label: "Start a Subscription Box",  icon: "🐾", costMult: .15, costMin: 2500, rep: 5, valueMult: 1.05, result: "Launched a recurring pet-supply subscription." },
    beautybrand:      { label: "Land an Influencer Campaign",icon: "💄",costMult: .10, costMin: 5000, rep: 8, payoutMult: .07, result: "An influencer campaign went viral." },

    // Trades & Services
    cleaningco:  { label: "Win a Commercial Contract",  icon: "🧹", costMult: .20, costMin: 1500, rep: 6, valueMult: 1.06, result: "Won a recurring office-cleaning contract." },
    hvacco:      { label: "Score a New-Build Contract", icon: "❄️", costMult: .12, costMin: 3000, rep: 6, valueMult: 1.06, result: "Locked in HVAC for a new development." },
    plumbingco:  { label: "Add 24/7 Emergency Service", icon: "🔧", costMult: .12, costMin: 2500, rep: 6, payoutMult: .06, result: "Launched 24/7 emergency service; calls jumped." },
    electricco:  { label: "Win a Commercial Wiring Job",icon: "⚡", costMult: .10, costMin: 4000, rep: 6, payoutMult: .06, result: "Won a big commercial wiring contract." },
    landscapeco: { label: "Land a City Maintenance Deal",icon: "🌳",costMult: .15, costMin: 2000, rep: 6, valueMult: 1.05, result: "Signed a city grounds-maintenance deal." },
    roofingco:   { label: "Chase Storm Repairs",        icon: "🏠", costMult: .12, costMin: 4000, rep: 5, payoutMult: .07, result: "A storm season brought a wave of repairs." },
    autorepair:  { label: "Become a Fleet Partner",     icon: "🚗", costMult: .10, costMin: 3000, rep: 6, valueMult: 1.06, result: "Became the service partner for a local fleet." },

    // Media & Entertainment
    podcastnet:      { label: "Sign an Ad Network Deal", icon: "🎧", costMult: .12, costMin: 3000,  rep: 7, valueMult: 1.07, result: "Signed a network ad deal across shows." },
    gamestudio:      { label: "Ship a Title",            icon: "🎮", costMult: .08, costMin: 10000, rep: 9, payoutMult: .08, result: "Shipped a title that found its audience." },
    adagency:        { label: "Win a National Account",  icon: "📺", costMult: .10, costMin: 6000,  rep: 8, valueMult: 1.07, result: "Won a national advertising account." },
    animationstudio: { label: "Land a Series Order",     icon: "✏️", costMult: .08, costMin: 12000, rep: 8, valueMult: 1.07, result: "Landed a multi-episode series order." },

    // Tech & Startups
    mobileapp:      { label: "Go Viral on the App Store", icon: "📱", costMult: .15, costMin: 3000,  rep: 7, payoutMult: .07, result: "An app hit the top charts." },
    marketplaceapp: { label: "Hit Critical Mass",         icon: "🛒", costMult: .08, costMin: 10000, rep: 8, valueMult: 1.08, result: "Buyers and sellers tipped into self-sustaining growth." },
    fintechstartup: { label: "Get a Banking License",     icon: "🏦", costMult: .06, costMin: 15000, rep: 8, valueMult: 1.08, result: "Secured a key license and unlocked new products." },
    cybersecfirm:   { label: "Land an Enterprise Deal",   icon: "🛡️", costMult: .08, costMin: 8000,  rep: 8, valueMult: 1.07, result: "Signed a major enterprise security contract." },
    aistartup:      { label: "Release a Breakthrough Model",icon: "🤖",costMult: .05, costMin: 20000, rep: 9, valueMult: 1.10, result: "Released a model that turned heads industry-wide." },
    devtools:       { label: "Get Adopted by Big Tech",   icon: "🧰", costMult: .07, costMin: 10000, rep: 8, valueMult: 1.08, result: "A major tech company adopted the tooling." },
    cloudhosting:   { label: "Sign a Whale Customer",     icon: "☁️", costMult: .06, costMin: 12000, rep: 8, payoutMult: .07, result: "Signed a massive customer onto the platform." },
    edtechco:       { label: "Partner with a District",   icon: "🎓", costMult: .08, costMin: 6000,  rep: 7, valueMult: 1.06, result: "Closed a district-wide rollout." },

    // Finance & Professional
    lawfirm:         { label: "Win a Landmark Case",     icon: "⚖️", costMult: .08, costMin: 6000,  rep: 9, payoutMult: .07, result: "Won a landmark case; the phones lit up." },
    accountingfirm:  { label: "Land Tax-Season Clients", icon: "🧾", costMult: .12, costMin: 3000,  rep: 6, payoutMult: .06, result: "A strong tax season brought waves of clients." },
    vcfund:          { label: "Hit a Unicorn Exit",      icon: "🦄", costMult: .04, costMin: 40000, rep: 9, payoutMult: .09, result: "A portfolio company exited huge." },
    wealthmgmt:      { label: "Win a Whale Client",      icon: "💼", costMult: .06, costMin: 8000,  rep: 8, valueMult: 1.07, result: "Brought a major client and their assets aboard." },
    insurancebroker: { label: "Build a Renewal Book",    icon: "📋", costMult: .12, costMin: 3000,  rep: 6, valueMult: 1.05, result: "Stacked up a fat book of renewing policies." },
    recruitingfirm:  { label: "Close an Executive Search",icon: "🤝", costMult: .10, costMin: 3000,  rep: 7, payoutMult: .07, result: "Closed a big executive placement." },

    // Real Estate & Property
    propertymgmt:    { label: "Win a Portfolio Account", icon: "🏘️", costMult: .10, costMin: 4000,  rep: 6, valueMult: 1.06, result: "Took over management of a whole portfolio." },
    houseflipping:   { label: "Nail a High-End Flip",    icon: "🔨", costMult: .06, costMin: 8000,  rep: 6, payoutMult: .07, result: "A high-end flip sold above ask." },
    storageunits:    { label: "Push to Full Occupancy",  icon: "📦", costMult: .08, costMin: 6000,  rep: 5, payoutMult: .06, result: "A marketing push filled the facility." },
    apartmentdev:    { label: "Break Ground on a Tower", icon: "🏗️", costMult: .04, costMin: 30000, rep: 8, valueMult: 1.08, result: "Broke ground on a major residential tower." },
    commercialre:    { label: "Sign an Anchor Tenant",   icon: "🏢", costMult: .04, costMin: 25000, rep: 8, valueMult: 1.08, result: "Signed an anchor tenant to a long lease." },
    mobilehomepark:  { label: "Add New Lots",            icon: "🚐", costMult: .10, costMin: 6000,  rep: 5, valueMult: 1.06, result: "Added lots and raised occupancy." },
    vacationrentals: { label: "Earn Superhost Status",   icon: "🏖️", costMult: .10, costMin: 4000,  rep: 6, payoutMult: .06, result: "Hit top-host status; bookings surged." },
    reitfund:        { label: "Acquire an Income Portfolio",icon: "🏛️",costMult: .03, costMin: 40000, rep: 8, valueMult: 1.07, result: "Acquired a portfolio of income-producing property." },

    // Health & Wellness
    dentaloffice:    { label: "Add Cosmetic Services",    icon: "🦷", costMult: .08, costMin: 6000,  rep: 6, valueMult: 1.06, result: "Added high-margin cosmetic dentistry." },
    gymchain:        { label: "Run a Membership Drive",   icon: "🏋️", costMult: .10, costMin: 4000,  rep: 6, payoutMult: .06, result: "A New Year membership drive packed the floor." },
    medspaclinic:    { label: "Add a Signature Treatment",icon: "💆", costMult: .08, costMin: 6000,  rep: 7, payoutMult: .07, result: "A signature treatment became the talk of the town." },
    urgentcare:      { label: "Go In-Network with Insurers",icon: "🏥",costMult: .06, costMin: 10000, rep: 7, valueMult: 1.07, result: "Went in-network with major insurers; volume jumped." },
    physicaltherapy: { label: "Build Referral Pipelines", icon: "🦵", costMult: .12, costMin: 3000,  rep: 6, valueMult: 1.05, result: "Built referral pipelines with local doctors." },
    vetclinic:       { label: "Add Surgical Services",    icon: "🐶", costMult: .08, costMin: 6000,  rep: 6, valueMult: 1.06, result: "Added a surgical suite and boarding." },
    pharmacyco:      { label: "Add a Compounding Lab",    icon: "💊", costMult: .08, costMin: 6000,  rep: 5, payoutMult: .05, result: "Added compounding services for steady margin." },
    wellnessbrand:   { label: "Launch a Subscription",    icon: "🌿", costMult: .10, costMin: 5000,  rep: 7, valueMult: 1.07, result: "Launched a recurring wellness subscription." },
    homecareco:      { label: "Win a Hospital Referral",  icon: "🩹", costMult: .10, costMin: 4000,  rep: 6, valueMult: 1.06, result: "Partnered with a hospital for discharge referrals." },

    // Logistics & Industrial
    truckingco:      { label: "Win a Long-Haul Contract", icon: "🚚", costMult: .08, costMin: 6000,  rep: 6, payoutMult: .06, result: "Won a steady long-haul freight contract." },
    warehouseco:     { label: "Sign a 3PL Client",        icon: "📦", costMult: .08, costMin: 8000,  rep: 7, valueMult: 1.06, result: "Signed a brand onto full-service fulfillment." },
    manufacturingco: { label: "Land a Bulk Order",        icon: "🏭", costMult: .06, costMin: 12000, rep: 7, payoutMult: .07, result: "Landed a bulk manufacturing order." },
    recyclingco:     { label: "Win a Municipal Contract", icon: "♻️", costMult: .08, costMin: 6000,  rep: 6, valueMult: 1.06, result: "Won a municipal recycling contract." },
    importexport:    { label: "Open a New Trade Lane",    icon: "🚢", costMult: .07, costMin: 8000,  rep: 6, payoutMult: .07, result: "Opened a profitable new trade lane." }
  };

  // ---- Build SECTOR_OF (all 100) from existing remap + new ventures ----
  var SECTOR_OF = {};
  Object.keys(EXISTING_REMAP).forEach(function (id) { SECTOR_OF[id] = EXISTING_REMAP[id]; });
  NEW_VENTURES.forEach(function (v) { SECTOR_OF[v.id] = v.sector; });

  var SECTOR_ORDER = SECTORS.map(function (s) { return s.name; });

  // ---- Merge new ventures into the global catalog + re-home existing ones ----
  function applyToCatalog() {
    var catalog = null;
    try { if (typeof entrepreneurshipCatalog !== "undefined" && Array.isArray(entrepreneurshipCatalog)) catalog = entrepreneurshipCatalog; } catch (e) {}
    if (!catalog) { try { if (Array.isArray(window.entrepreneurshipCatalog)) catalog = window.entrepreneurshipCatalog; } catch (e2) {} }
    if (!catalog) return false;

    // Add new ventures (idempotent).
    NEW_VENTURES.forEach(function (v) {
      if (catalog.some(function (x) { return x.id === v.id; })) return;
      var entry = {
        id: v.id, name: v.name, category: v.sector, minAge: Math.min(Number(v.minAge) || 21, 21),
        startup: v.startup, buy: Math.round(v.startup * 2.2),
        yearlyMin: v.yearlyMin, yearlyMax: v.yearlyMax,
        scaleStat: v.scaleStat, failureRisk: v.failureRisk, desc: v.desc
      };
      catalog.push(entry);
    });

    // Re-home every catalog entry into its clean sector.
    catalog.forEach(function (c) {
      if (c && c.id && SECTOR_OF[c.id]) c.category = SECTOR_OF[c.id];
      if (c && Number(c.minAge || 0) > 21) c.minAge = 21;
    });
    return true;
  }

  if (!applyToCatalog()) {
    // Catalog not ready yet — retry once shortly (defensive; load order should make this rare).
    try { setTimeout(applyToCatalog, 0); } catch (e) {}
  }

  // ---- Re-home categories on already-owned businesses in loaded saves ----
  try {
    if (typeof ensureStateShape === "function") {
      var __prevEnsureForSectors = ensureStateShape;
      ensureStateShape = function () {
        __prevEnsureForSectors();
        try {
          var bs = (typeof state !== "undefined" && state && state.finance && state.finance.businesses) || null;
          if (Array.isArray(bs)) bs.forEach(function (b) { if (b && b.id && SECTOR_OF[b.id]) b.category = SECTOR_OF[b.id]; });
        } catch (e) {}
      };
    }
  } catch (e) {}

  // ---- Expose for business-entities.js lookups and Stage 2 mechanics ----
  window.LEDGER_SECTORS = SECTORS;
  window.SECTOR_ORDER = SECTOR_ORDER;
  window.SECTOR_OF = SECTOR_OF;
  window.SECTOR_VENTURE_ACTIONS = ACTIONS;
})();

/* ============================================================================
 * Stage 2 — Sector running mechanics.
 * Every sector gets ONE meter (0-100) you actually manage, with a behavior
 * that makes the sector play differently:
 *   maintain  : decays each year — keep it up or income/risk suffer (Food,
 *               Nightlife, Real Estate, Logistics).
 *   compound  : grows with reputation and snowballs income, but churns/sets
 *               back on bad years (Media, Tech, Finance).
 *   band      : has a sweet-spot target — too low AND too high both hurt
 *               (Retail, Trades, Health).
 * The yearly loop calls applySectorMechanicV1851(); the focus desk shows the
 * meter + a dedicated sector action button (runSectorActionV1851, in
 * business-entities.js) that nudges the meter.
 * ========================================================================== */
(function () {
  "use strict";

  function clamp(v, lo, hi) { v = Number(v) || 0; return v < lo ? lo : v > hi ? hi : v; }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function rep(b) { return clamp((b && b.reputation) || 10, 0, 100); }

  // shape "maintain": meter - decay each year, softened by reputation.
  function maintainDrift(decay) {
    return function (b, m) { return clamp(m - decay + Math.round((rep(b) - 50) / 25), 0, 100); };
  }
  // shape "compound": grows with reputation; churn + bad-year setback.
  function compoundDrift(opts) {
    return function (b, m, good) {
      var grow = Math.round((rep(b) / 100) * opts.repGrowth + (opts.base || 0));
      var churn = opts.churnPct ? Math.round(m * opts.churnPct) : 0;
      var hit = (!good && opts.badHit) ? opts.badHit : 0;
      return clamp(m + grow - churn - hit, 0, 100);
    };
  }
  // shape "band": noisy drift around a sweet spot.
  function bandDrift(opts) {
    return function (b, m) {
      var pull = opts.repPull ? Math.round((rep(b) - 50) / opts.repPull) : 0;
      return clamp(m + pull + rnd(opts.noiseLo, opts.noiseHi), 0, 100);
    };
  }

  // Linear income multiplier helper: lo at meter 0, hi at meter 100.
  function lin(lo, hi) { return function (m) { return lo + (clamp(m, 0, 100) / 100) * (hi - lo); }; }

  var MECHANICS = {
    "Food & Drink": {
      shape: "maintain", icon: "🍴", label: "Health Rating", init: 80,
      income: lin(0.72, 1.28),
      risk: function (m) { return (m - 60) / 100 * 0.12; },
      drift: maintainDrift(7),
      actionLabel: "Pass Health Inspection", actionIcon: "🍴", actionGain: 16, actionCostMult: 0.08, actionCostMin: 1500,
      note: function (m) { return m < 50 ? "Low rating is scaring off customers — clean up." : m > 88 ? "Spotless. Customers trust your kitchen." : "Solid rating, but it slips every year."; }
    },
    "Nightlife & Events": {
      shape: "maintain", icon: "🔥", label: "Buzz", init: 55,
      income: lin(0.60, 1.45),
      risk: function (m) { return (m - 50) / 100 * 0.08; },
      drift: maintainDrift(16),
      actionLabel: "Run a Promo Blitz", actionIcon: "🔥", actionGain: 30, actionCostMult: 0.06, actionCostMin: 2000,
      note: function (m) { return m < 40 ? "The hype has cooled — get people talking again." : m > 80 ? "The place is the hottest ticket in town." : "Buzz fades fast — keep feeding it."; }
    },
    "Retail & Commerce": {
      shape: "band", icon: "📦", label: "Inventory Health", init: 62, target: 65,
      income: function (m) { return m < 65 ? 0.70 + (m / 65) * 0.45 : 1.15 - ((m - 65) / 35) * 0.25; },
      risk: function (m) { return (m >= 50 && m <= 80) ? 0.03 : -0.02; },
      drift: bandDrift({ repPull: 0, noiseLo: -15, noiseHi: 5 }),
      actionLabel: "Restock & Rebalance", actionIcon: "📦", actionGain: 24, actionCostMult: 0.10, actionCostMin: 1500,
      note: function (m) { return m < 45 ? "Shelves are thin — you're losing sales." : m > 85 ? "Overstocked — cash is tied up in inventory." : "Inventory is well-balanced."; }
    },
    "Trades & Services": {
      shape: "band", icon: "🗓️", label: "Job Backlog", init: 55, target: 70,
      income: function (m) { return m < 70 ? 0.70 + (m / 70) * 0.45 : 1.15 - ((m - 70) / 30) * 0.20; },
      risk: function (m) { return (m >= 55 && m <= 85) ? 0.03 : -0.02; },
      drift: bandDrift({ repPull: 10, noiseLo: -9, noiseHi: 8 }),
      actionLabel: "Book More Jobs", actionIcon: "🗓️", actionGain: 20, actionCostMult: 0.12, actionCostMin: 1000,
      note: function (m) { return m < 50 ? "Idle crews — you need more booked work." : m > 88 ? "Overbooked — quality and timelines are slipping." : "Crews are busy and on schedule."; }
    },
    "Media & Entertainment": {
      shape: "compound", icon: "📣", label: "Audience", init: 28,
      income: lin(0.70, 1.60),
      risk: function (m) { return (m - 40) / 100 * 0.06; },
      drift: compoundDrift({ repGrowth: 9, base: 2, badHit: 12 }),
      actionLabel: "Audience Push", actionIcon: "📣", actionGain: 18, actionCostMult: 0.10, actionCostMin: 2000,
      note: function (m) { return m < 35 ? "Small audience — keep showing up to grow it." : m > 75 ? "Massive, compounding audience." : "Your audience compounds the longer you stay relevant."; }
    },
    "Tech & Startups": {
      shape: "compound", icon: "🔁", label: "Recurring Revenue", init: 25,
      income: lin(0.70, 1.55),
      risk: function (m) { return (m - 35) / 100 * 0.07; },
      drift: compoundDrift({ repGrowth: 8, base: 1, churnPct: 0.12, badHit: 6 }),
      actionLabel: "Cut Churn / Upsell", actionIcon: "🔁", actionGain: 16, actionCostMult: 0.08, actionCostMin: 3000,
      note: function (m) { return m < 30 ? "Few subscribers — grow MRR faster than it churns." : m > 75 ? "Strong, sticky recurring revenue." : "Recurring revenue grows, but ~12% churns off yearly."; }
    },
    "Finance & Professional": {
      shape: "compound", icon: "💰", label: "Assets Under Mgmt", init: 30,
      income: lin(0.75, 1.45),
      risk: function (m) { return (m - 40) / 100 * 0.05; },
      drift: compoundDrift({ repGrowth: 7, base: 0, badHit: 8 }),
      actionLabel: "Raise Capital", actionIcon: "💰", actionGain: 16, actionCostMult: 0.05, actionCostMin: 5000,
      note: function (m) { return m < 35 ? "Thin book — bring in clients and assets." : m > 78 ? "Huge book; fees scale with the assets." : "Your fees scale with assets under management."; }
    },
    "Real Estate & Property": {
      shape: "maintain", icon: "🔑", label: "Occupancy", init: 78,
      income: lin(0.50, 1.25),
      risk: function (m) { return (m - 60) / 100 * 0.08; },
      drift: maintainDrift(9),
      actionLabel: "Lease Up Units", actionIcon: "🔑", actionGain: 18, actionCostMult: 0.06, actionCostMin: 4000,
      note: function (m) { return m < 55 ? "Vacancies are eating your cash flow." : m > 90 ? "Fully leased — every unit is paying." : "Occupancy slips as leases turn over."; }
    },
    "Health & Wellness": {
      shape: "band", icon: "🩺", label: "Patient Load", init: 60, target: 78,
      income: function (m) { return m < 78 ? 0.72 + (m / 78) * 0.46 : 1.18 + ((m - 78) / 22) * 0.07; },
      risk: function (m) { return m > 85 ? -((m - 85) / 15) * 0.08 : (m - 45) / 100 * 0.05; },
      drift: bandDrift({ repPull: 8, noiseLo: -6, noiseHi: 6 }),
      actionLabel: "Run a Patient Drive", actionIcon: "🩺", actionGain: 16, actionCostMult: 0.07, actionCostMin: 3000,
      note: function (m) { return m < 50 ? "Exam rooms sitting empty." : m > 88 ? "Overloaded — staff burnout is a real risk." : "Healthy, profitable patient load."; }
    },
    "Logistics & Industrial": {
      shape: "maintain", icon: "🚚", label: "Capacity Used", init: 65,
      income: lin(0.60, 1.32),
      risk: function (m) { return (m - 55) / 100 * 0.06; },
      drift: maintainDrift(10),
      actionLabel: "Win Freight Contracts", actionIcon: "🚚", actionGain: 20, actionCostMult: 0.07, actionCostMin: 4000,
      note: function (m) { return m < 50 ? "Idle trucks and lines are bleeding money." : m > 88 ? "Running near full capacity — very efficient." : "Contracts expire; refill them to stay utilized."; }
    }
  };

  function sectorNameFor(b) {
    if (!b) return null;
    try { if (window.SECTOR_OF && b.id && window.SECTOR_OF[b.id]) return window.SECTOR_OF[b.id]; } catch (e) {}
    return b.category || null;
  }
  function mechanicFor(b) {
    var name = sectorNameFor(b);
    return (name && MECHANICS[name]) ? MECHANICS[name] : null;
  }

  function ensureMeter(b) {
    var mech = mechanicFor(b);
    if (!mech) return null;
    if (b.sectorMeterV1851 == null || isNaN(b.sectorMeterV1851)) b.sectorMeterV1851 = mech.init;
    b.sectorMeterV1851 = clamp(b.sectorMeterV1851, 0, 100);
    return mech;
  }

  // Called once per business per year by the runtime income loop.
  function applyYearly(b, v, income, deltas) {
    var mech = ensureMeter(b);
    if (!mech) return income;
    var m = clamp(b.sectorMeterV1851, 0, 100);
    var mult = mech.income(m);
    var adjusted = Math.round((Number(income) || 0) * mult);
    b.sectorRiskCutV1851 = mech.risk(m) || 0;
    b.sectorMeterMultV1851 = mult;
    // Drift the meter for next year.
    b.sectorMeterV1851 = clamp(mech.drift(b, m, adjusted >= 0), 0, 100);
    return adjusted;
  }

  function bumpMeter(b, amt) {
    var mech = ensureMeter(b);
    if (!mech) return;
    var gain = (amt == null) ? mech.actionGain : amt;
    b.sectorMeterV1851 = clamp(b.sectorMeterV1851 + gain, 0, 100);
  }

  // UI data for the focus desk.
  function meterInfo(b) {
    var mech = ensureMeter(b);
    if (!mech) return null;
    var m = clamp(b.sectorMeterV1851, 0, 100);
    var mult = mech.income(m);
    var kind = mult >= 1.08 ? "good" : mult <= 0.92 ? "bad" : "warn";
    return {
      icon: mech.icon, label: mech.label, value: Math.round(m),
      kind: kind, barClass: kind === "good" ? "high" : kind === "bad" ? "low" : "",
      note: mech.note(m), mult: mult, multLabel: "×" + mult.toFixed(2) + " income this year",
      actionLabel: mech.actionLabel, actionIcon: mech.actionIcon,
      actionCost: Math.max(mech.actionCostMin, Math.round(((v_startup(b)) * mech.actionCostMult)))
    };
  }
  function v_startup(b) {
    try {
      var cat = (typeof entrepreneurshipCatalog !== "undefined" && entrepreneurshipCatalog) || window.entrepreneurshipCatalog || [];
      var v = cat.find(function (x) { return x.id === b.id; });
      return (v && v.startup) || 10000;
    } catch (e) { return 10000; }
  }

  window.SECTOR_MECHANICS = MECHANICS;
  window.sectorMechanicFor = mechanicFor;
  window.ensureSectorMeterV1851 = ensureMeter;
  window.applySectorMechanicV1851 = applyYearly;
  window.bumpSectorMeterV1851 = bumpMeter;
  window.sectorMeterInfoV1851 = meterInfo;
})();
