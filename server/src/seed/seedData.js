export const initialDepartments = [
  {
    _id: "dept-1",
    code: "ROADS",
    name: "Roads & Bridges Department",
    description: "Maintenance of city roads, pothole repairs, bridges, flyovers and pedestrian pavements.",
    headOfficer: {
      name: "Eng. Rajesh Sharma",
      designation: "Chief Superintending Engineer (PWD)",
      email: "pwd.roads@civix.gov",
      phone: "+1 (555) 019-2831",
    },
    slaHours: { urgent: 12, high: 24, medium: 48, low: 96 },
    activeStaffCount: 42,
    color: "#f97316",
    icon: "Truck",
  },
  {
    _id: "dept-2",
    code: "SANITATION",
    name: "Sanitation & Solid Waste Management",
    description: "Garbage collection, overflowing dumpsters, hazardous waste clearance, and street sweeping.",
    headOfficer: {
      name: "Dr. Ananya Roy",
      designation: "Director of Municipal Solid Waste",
      email: "sanitation.head@civix.gov",
      phone: "+1 (555) 019-4822",
    },
    slaHours: { urgent: 8, high: 16, medium: 36, low: 72 },
    activeStaffCount: 65,
    color: "#10b981",
    icon: "Trash2",
  },
  {
    _id: "dept-3",
    code: "ELECTRICAL",
    name: "Electrical & Public Streetlighting",
    description: "Streetlight blackouts, exposed hanging power cables, faulty junction boxes and transformers.",
    headOfficer: {
      name: "Eng. Vikram Patel",
      designation: "Executive Engineer (Public Lighting)",
      email: "electrical.grid@civix.gov",
      phone: "+1 (555) 019-9182",
    },
    slaHours: { urgent: 6, high: 18, medium: 36, low: 72 },
    activeStaffCount: 28,
    color: "#eab308",
    icon: "Zap",
  },
  {
    _id: "dept-4",
    code: "WATER",
    name: "Water Supply & Drainage Board",
    description: "Burst main pipes, contaminated tap water, blocked monsoon storm drains, and sewage overflows.",
    headOfficer: {
      name: "Meera Krishnan",
      designation: "Chief Engineer (Water & Sewerage)",
      email: "water.board@civix.gov",
      phone: "+1 (555) 019-3321",
    },
    slaHours: { urgent: 10, high: 20, medium: 48, low: 96 },
    activeStaffCount: 38,
    color: "#06b6d4",
    icon: "Droplets",
  },
  {
    _id: "dept-5",
    code: "SAFETY",
    name: "Urban Safety & Hazard Prevention",
    description: "Fallen trees blocking roads, collapsed walls, dangerous open construction pits, and missing manhole covers.",
    headOfficer: {
      name: "Insp. David Chen",
      designation: "Civic Safety & Emergency Coordinator",
      email: "urban.safety@civix.gov",
      phone: "+1 (555) 019-7711",
    },
    slaHours: { urgent: 4, high: 12, medium: 24, low: 48 },
    activeStaffCount: 30,
    color: "#ef4444",
    icon: "ShieldAlert",
  },
];

export const initialIssues = [
  {
    ticketId: "CVX-2026-1049",
    title: "Deep Crater Pothole on High-Speed Commuter Arterial",
    description: "Large 1.2-meter wide pothole near the subway entrance. Two two-wheelers suffered rim damage this morning, high skid hazard in rainy weather.",
    category: "ROADS",
    priority: "Urgent",
    status: "Pending Triage",
    location: {
      type: "Point",
      coordinates: [-73.985131, 40.748817], // [lng, lat] ~ Manhattan / Midtown 5th Ave
    },
    address: {
      street: "350 5th Avenue, Crossroad 34th St",
      landmark: "Opposite Empire Civic Plaza",
      area: "Central Midtown Ward 4",
      city: "Metro City",
      postalCode: "10001",
      formatted: "350 5th Ave, Ward 4, Metro City, 10001",
    },
    media: {
      photoUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1000&auto=format&fit=crop&q=80", // pothole / asphalt crack
      resolutionPhotoUrl: "",
    },
    aiAnalysis: {
      analyzedAt: new Date(Date.now() - 3600000 * 4),
      modelUsed: "Gemini 1.5 Flash Vision",
      identifiedProblem: "Severe Asphalt Disintegration & Deep Pothole (Depth ~14cm, Width ~1.2m)",
      category: "ROADS",
      severity: "Urgent",
      hazardScore: 92,
      confidence: 0.96,
      detectedObjects: ["Sub-base exposure", "Cracked asphalt rim", "Vehicular trajectory collision risk", "Standing water layer"],
      recommendedDepartment: "Roads & Bridges Department",
      recommendedTimeline: "Emergency patch within 12 Hours",
      grievanceDraft: `FORMAL CIVIC GRIEVANCE NOTICE
File Ref: CIVIX/PWD/2026/URG-1049
Date of Inspection: October 7, 2026

TO:
The Executive Engineer, PWD Central Highway Division
Municipal Corporation of Metro City

SUBJECT: Immediate Remediation Notice under Urban Public Safety Code § 402 - Severe Roadway Hazard

Madam / Sir,

Pursuant to automated AI multimodal civic triage and computer vision telemetry, notice is hereby served regarding a severe roadway structural failure at 350 5th Avenue, Ward 4.

OBSERVATION & IMPACT:
1. Deep crater pothole measuring approx 120cm diameter and >14cm depth.
2. Directly aligns with peak commuter vehicular and two-wheeler trajectory.
3. Multiple vehicle damage incidents logged; severe risk of fatal ejection during wet conditions.

STATUTORY OBLIGATION:
Under Municipal Road Safety Standard § 88(b), structural defects classified as 'Urgent' carry an SLA cap of 12 hours. Rapid cold-mix bituminous leveling is urgently required.

Sincerely,
CivixAI Automated Governance Protocol (Citizen Advocacy Wing)`,
    },
    assignedDepartment: "Roads & Bridges Department",
    assignedOfficer: {
      name: "Eng. Rajesh Sharma",
      phone: "+1 (555) 019-2831",
      email: "pwd.roads@civix.gov",
    },
    citizenInfo: {
      name: "Sarah Jenkins",
      phone: "+1 (555) 441-9921",
      email: "sarah.j@example.com",
      anonymous: false,
    },
    timeline: [
      {
        status: "Pending Triage",
        note: "Issue flagged by citizen with high-res photo. Vision AI scored hazard at 92/100 (Urgent). Auto-routed to PWD dispatch.",
        updatedBy: "CivixAI Vision Core",
        timestamp: new Date(Date.now() - 3600000 * 4),
      },
    ],
    upvotes: 24,
    comments: [
      {
        author: "Mark Davis (Local Merchant)",
        text: "Saw a cyclist fall here yesterday evening. Please repair this immediately before peak rain!",
        isOfficial: false,
        timestamp: new Date(Date.now() - 3600000 * 3),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 4),
    updatedAt: new Date(Date.now() - 3600000 * 4),
  },
  {
    ticketId: "CVX-2026-1050",
    title: "Overflowing Commercial Trash Compactor & Illegal Dump",
    description: "Garbage container has not been cleared for 4 days. Stench is unbearable, encroaching onto the pedestrian walkway, attracting stray animals.",
    category: "SANITATION",
    priority: "High",
    status: "In Progress",
    location: {
      type: "Point",
      coordinates: [-73.978003, 40.758896], // Rockefeller Center vicinity
    },
    address: {
      street: "45 Rockefeller Plaza, Corner 50th",
      landmark: "Behind East Market Alley",
      area: "Downtown Commercial Sector",
      city: "Metro City",
      postalCode: "10111",
      formatted: "45 Rockefeller Plaza, Ward 2, Metro City, 10111",
    },
    media: {
      photoUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=1000&auto=format&fit=crop&q=80", // overflowing garbage / dumpster
      resolutionPhotoUrl: "",
    },
    aiAnalysis: {
      analyzedAt: new Date(Date.now() - 3600000 * 18),
      modelUsed: "Gemini 1.5 Flash Vision",
      identifiedProblem: "Hazardous Municipal Solid Waste Spillage & Pedestrian Pathway Obstruction",
      category: "SANITATION",
      severity: "High",
      hazardScore: 78,
      confidence: 0.94,
      detectedObjects: ["Decomposing organic matter", "Overflowing 4-yard waste skip", "Biological vector breeding hazard", "Pavement blockage"],
      recommendedDepartment: "Sanitation & Solid Waste Management",
      recommendedTimeline: "Heavy collection loader dispatch within 16 Hours",
      grievanceDraft: `FORMAL CIVIC GRIEVANCE NOTICE
File Ref: CIVIX/SWM/2026/HIGH-1050
Date of Inspection: October 6, 2026

TO:
Chief Health Inspector & Director of Solid Waste
Metro City Municipal Sanitation Commission

SUBJECT: Official Notice under Public Health Sanitation Regulation § 19 - Uncollected Waste

Madam / Sir,

Vision analysis confirms extensive bio-waste accumulation spilling across public thoroughfares at 45 Rockefeller Plaza. Unattended organic waste poses an acute vector-borne epidemic hazard.

IMMEDIATE DIRECTIVE:
Sanitation Taskforce Compactor Truck #4 is instructed to evacuate the site, sanitize the perimeter with disinfectants, and deploy an additional 6-yard container.

Generated via CivixAI Governance Portal`,
    },
    assignedDepartment: "Sanitation & Solid Waste Management",
    assignedOfficer: {
      name: "Inspector Kevin Miller",
      phone: "+1 (555) 019-4822",
      email: "sanitation.head@civix.gov",
    },
    citizenInfo: {
      name: "Alex Martinez",
      phone: "+1 (555) 302-8812",
      email: "alex.martinez@citymail.org",
      anonymous: false,
    },
    timeline: [
      {
        status: "Pending Triage",
        note: "Complaint submitted with visual evidence. AI categorized as Sanitation High Hazard.",
        updatedBy: "CivixAI Vision Core",
        timestamp: new Date(Date.now() - 3600000 * 18),
      },
      {
        status: "Assigned",
        note: "Assigned to Ward 2 Sanitation Rapid Response Team under Inspector Kevin Miller.",
        updatedBy: "Dr. Ananya Roy (Director SWM)",
        timestamp: new Date(Date.now() - 3600000 * 12),
      },
      {
        status: "In Progress",
        note: "Sanitation Compactor Truck dispatched to location. Crew currently clearing debris.",
        updatedBy: "Insp. Kevin Miller",
        timestamp: new Date(Date.now() - 3600000 * 2),
      },
    ],
    upvotes: 38,
    comments: [
      {
        author: "Insp. Kevin Miller (Official)",
        text: "Team has arrived on site with high-pressure wash tanker. Clearance underway.",
        isOfficial: true,
        timestamp: new Date(Date.now() - 3600000 * 2),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 18),
    updatedAt: new Date(Date.now() - 3600000 * 2),
  },
  {
    ticketId: "CVX-2026-1051",
    title: "High-Voltage Exposed Wire Hanging from Damaged Streetlight",
    description: "Storm caused streetlight glass to shatter and live wire is dangling just 1.5 meters from ground near a school crossing bus stop.",
    category: "ELECTRICAL",
    priority: "Urgent",
    status: "Assigned",
    location: {
      type: "Point",
      coordinates: [-73.965415, 40.782865], // Central Park East / 86th St
    },
    address: {
      street: "East 86th St & 5th Avenue",
      landmark: "Adjacent to Central Community Academy School Gate",
      area: "Upper District Ward 8",
      city: "Metro City",
      postalCode: "10028",
      formatted: "East 86th St & 5th Ave, Ward 8, Metro City, 10028",
    },
    media: {
      photoUrl: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=1000&auto=format&fit=crop&q=80", // street light / power pole
      resolutionPhotoUrl: "",
    },
    aiAnalysis: {
      analyzedAt: new Date(Date.now() - 3600000 * 2),
      modelUsed: "Gemini 1.5 Flash Vision",
      identifiedProblem: "Live Hanging Electrical Conductor & Luminaire Structural Damage",
      category: "ELECTRICAL",
      severity: "Urgent",
      hazardScore: 98,
      confidence: 0.98,
      detectedObjects: ["Exposed copper insulation breach", "Damaged pole arm", "Overhead conductor sag", "Pedestrian proximity < 2m"],
      recommendedDepartment: "Electrical & Public Streetlighting",
      recommendedTimeline: "Emergency power isolation within 4 Hours",
      grievanceDraft: `CRITICAL SAFETY NOTIFICATION - PRIORITY 1 EMERGENCY
File Ref: CIVIX/ELEC/2026/CRIT-1051
Date: October 7, 2026

TO:
Emergency Dispatcher, Metropolitan Electricity & Public Lighting Board

SUBJECT: LIFE SAFETY THREAT - Exposed 240V Cable Near Elementary School

Vision algorithms have verified high-probability electrocution danger at East 86th St & 5th Avenue.
Proximity to school bus embarkation point demands immediate circuit shutoff and boom truck deployment.

Action Plan:
1. Remotely de-energize feeder line circuit #88B.
2. Cordon off 10-meter perimeter.
3. Splice and re-insulate underground conduits.`,
    },
    assignedDepartment: "Electrical & Public Streetlighting",
    assignedOfficer: {
      name: "Eng. Vikram Patel",
      phone: "+1 (555) 019-9182",
      email: "electrical.grid@civix.gov",
    },
    citizenInfo: {
      name: "Parent Association Rep (Elena Vance)",
      phone: "+1 (555) 789-1029",
      email: "elena.v@pta.org",
      anonymous: false,
    },
    timeline: [
      {
        status: "Pending Triage",
        note: "Urgent electrocution threat detected by AI. Hazard score 98/100.",
        updatedBy: "CivixAI Vision Core",
        timestamp: new Date(Date.now() - 3600000 * 2),
      },
      {
        status: "Assigned",
        note: "Auto-escalated to Electrical Rapid Emergency Squad. Substation team notified.",
        updatedBy: "System Emergency Trigger",
        timestamp: new Date(Date.now() - 3600000 * 1),
      },
    ],
    upvotes: 56,
    comments: [],
    createdAt: new Date(Date.now() - 3600000 * 2),
    updatedAt: new Date(Date.now() - 3600000 * 1),
  },
  {
    ticketId: "CVX-2026-1048",
    title: "Burst Underground Water Main Causing Road Flooding & Pressure Loss",
    description: "Massive geyser of potable water erupting from asphalt seam. Low pressure in adjacent residential towers, flooding basement car park.",
    category: "WATER",
    priority: "High",
    status: "Resolved",
    location: {
      type: "Point",
      coordinates: [-73.993438, 40.750504], // Penn Station / 33rd St
    },
    address: {
      street: "W 33rd St & 8th Avenue",
      landmark: "Near Transit Concourse Gate B",
      area: "Transit Hub Ward 5",
      city: "Metro City",
      postalCode: "10001",
      formatted: "W 33rd St & 8th Ave, Ward 5, Metro City, 10001",
    },
    media: {
      photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=1000&auto=format&fit=crop&q=80", // water / construction site
      resolutionPhotoUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80", // repaired infrastructure / worker
    },
    aiAnalysis: {
      analyzedAt: new Date(Date.now() - 3600000 * 36),
      modelUsed: "Gemini 1.5 Flash Vision",
      identifiedProblem: "Pressurized Potable Water Main Rupture with Road Sub-base Erosion",
      category: "WATER",
      severity: "High",
      hazardScore: 84,
      confidence: 0.95,
      detectedObjects: ["High-pressure water plume", "Asphalt buckling", "Storm drain overwhelmed"],
      recommendedDepartment: "Water Supply & Drainage Board",
      recommendedTimeline: "Main valve isolation within 2 Hours",
      grievanceDraft: `CIVIC GRIEVANCE & DAMAGE MITIGATION PETITION
File Ref: CIVIX/WTR/2026/8941
Issued: October 5, 2026

TO:
Executive Engineer, Metro Water Works

SUBJECT: Major Pipeline Breach at W 33rd St & 8th Ave

Loss of approximately 1,500 liters/minute logged. Ground saturation may compromise structural integrity of adjoining curb and fiber optic lines. Immediate emergency valve isolation requested.`,
    },
    assignedDepartment: "Water Supply & Drainage Board",
    assignedOfficer: {
      name: "Meera Krishnan",
      phone: "+1 (555) 019-3321",
      email: "water.board@civix.gov",
    },
    citizenInfo: {
      name: "David Sterling",
      phone: "+1 (555) 901-2244",
      email: "david.sterling@metro.com",
      anonymous: false,
    },
    timeline: [
      {
        status: "Pending Triage",
        note: "Issue submitted by commuter. AI flagged as High severity water infrastructure rupture.",
        updatedBy: "CivixAI Vision Core",
        timestamp: new Date(Date.now() - 3600000 * 36),
      },
      {
        status: "In Progress",
        note: "Water board isolated zone valve. Excavation crew replaced 8-inch cast iron pipe section.",
        updatedBy: "Eng. Meera Krishnan",
        timestamp: new Date(Date.now() - 3600000 * 20),
      },
      {
        status: "Resolved",
        note: "Repairs completed, hydro-testing passed, roadway backfilled and paved. Pressure restored to Ward 5.",
        updatedBy: "Superintendent Robert Hayes",
        timestamp: new Date(Date.now() - 3600000 * 6),
      },
    ],
    upvotes: 41,
    comments: [
      {
        author: "Superintendent Robert Hayes (Official)",
        text: "Cast iron collar replaced and road repaved. Verified 60 PSI mains pressure restored.",
        isOfficial: true,
        timestamp: new Date(Date.now() - 3600000 * 6),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 36),
    updatedAt: new Date(Date.now() - 3600000 * 6),
  },
  {
    ticketId: "CVX-2026-1052",
    title: "Large Broken Branch Partially Blocking Eastbound Traffic",
    description: "Heavy oak tree branch cracked during high winds, suspended precariously over pedestrian sidewalk and cycling lane.",
    category: "SAFETY",
    priority: "Medium",
    status: "Pending Triage",
    location: {
      type: "Point",
      coordinates: [-73.972322, 40.764356], // Near 59th / Central Park South
    },
    address: {
      street: "59th St & 5th Avenue",
      landmark: "Near Grand Army Plaza",
      area: "Central Park Perimeter Ward 3",
      city: "Metro City",
      postalCode: "10019",
      formatted: "59th St & 5th Ave, Ward 3, Metro City, 10019",
    },
    media: {
      photoUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1000&auto=format&fit=crop&q=80", // trees / park nature
      resolutionPhotoUrl: "",
    },
    aiAnalysis: {
      analyzedAt: new Date(Date.now() - 3600000 * 1),
      modelUsed: "Gemini 1.5 Flash Vision",
      identifiedProblem: "Hazardous Arborist Failure & Overhead Fall Risk to Cyclists",
      category: "SAFETY",
      severity: "Medium",
      hazardScore: 64,
      confidence: 0.91,
      detectedObjects: ["Fractured limb", "Overhead canopy breach", "Bike lane obstruction"],
      recommendedDepartment: "Urban Safety & Hazard Prevention",
      recommendedTimeline: "Arborist chainsaw crew within 24 Hours",
      grievanceDraft: `FORMAL CIVIC GRIEVANCE PETITION
File Ref: CIVIX/HZD/2026/MED-1052
Date: October 7, 2026

TO:
Urban Forestry & Hazard Prevention Division
Metro City Parks & Civic Safety

SUBJECT: Dangerous Tree Limb Hanging Over Designated Cycling Lane

Field visual telemetrics indicate high probability of sudden detachment of heavy oak branch under gust conditions. Request deployment of bucket crane and pruning team to eliminate hazard.`,
    },
    assignedDepartment: "Urban Safety & Hazard Prevention",
    assignedOfficer: {
      name: "Insp. David Chen",
      phone: "+1 (555) 019-7711",
      email: "urban.safety@civix.gov",
    },
    citizenInfo: {
      name: "Jordan Lee",
      phone: "+1 (555) 621-3904",
      email: "jordan.lee@cyclist.org",
      anonymous: false,
    },
    timeline: [
      {
        status: "Pending Triage",
        note: "New report received. AI categorized as Urban Hazard Medium.",
        updatedBy: "CivixAI Vision Core",
        timestamp: new Date(Date.now() - 3600000 * 1),
      },
    ],
    upvotes: 12,
    comments: [],
    createdAt: new Date(Date.now() - 3600000 * 1),
    updatedAt: new Date(Date.now() - 3600000 * 1),
  },
];
