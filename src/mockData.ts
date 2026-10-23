import {
  IssueReport,
  AppNotification,
  UserProfile,
  IssueCategory,
  ThoothukudiLocation,
} from './types';
import heroCivicImg from './assets/images/hero_civic_neighborhood_1791103393734.jpg';
import waterLeakImg from './assets/images/issue_water_leakage_1791103413022.jpg';
import roadPotholeImg from './assets/images/issue_road_pothole_1791103428154.jpg';
import streetLightImg from './assets/images/issue_street_light_1791103445616.jpg';
import citizenAvatarImg from './assets/images/avatar_citizen_profile_1791103461711.jpg';

export const ASSETS = {
  heroCivic: heroCivicImg,
  waterLeak: waterLeakImg,
  roadPothole: roadPotholeImg,
  streetLight: streetLightImg,
  citizenAvatar: citizenAvatarImg,
};

export const THOOTHUKUDI_LOCATIONS: {
  name: ThoothukudiLocation;
  ward: string;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
}[] = [
  { name: 'Millerpuram', ward: 'Zone 2 — Central West', lat: 8.7986, lng: 78.1321, mapX: 38, mapY: 46 },
  { name: 'Bryant Nagar', ward: 'Zone 3 — South Central', lat: 8.7892, lng: 78.1348, mapX: 46, mapY: 58 },
  { name: 'Korampallam', ward: 'Zone 4 — Western Outskirts', lat: 8.7825, lng: 78.0984, mapX: 16, mapY: 64 },
  { name: 'Muthiahpuram', ward: 'Zone 4 — Southern Industrial', lat: 8.7495, lng: 78.1412, mapX: 54, mapY: 82 },
  { name: 'Beach Road', ward: 'Zone 1 — Coastal East', lat: 8.8054, lng: 78.1592, mapX: 82, mapY: 38 },
  { name: 'Palayamkottai Road', ward: 'Zone 2 — Arterial Corridor', lat: 8.7964, lng: 78.1285, mapX: 34, mapY: 48 },
  { name: 'SIPCOT Industrial Estate', ward: 'Zone 4 — SIPCOT Belt', lat: 8.8112, lng: 78.0895, mapX: 18, mapY: 28 },
  { name: 'Thermal Nagar', ward: 'Zone 1 — Harbour & Thermal', lat: 8.7681, lng: 78.1684, mapX: 78, mapY: 70 },
  { name: 'Harbour Area', ward: 'Zone 1 — Port Zone', lat: 8.7542, lng: 78.1765, mapX: 86, mapY: 78 },
  { name: 'Thoothukudi Old Bus Stand', ward: 'Zone 1 — Central Market', lat: 8.8038, lng: 78.1456, mapX: 62, mapY: 40 },
  { name: 'New Bus Stand', ward: 'Zone 2 — North Central', lat: 8.8145, lng: 78.1362, mapX: 48, mapY: 26 },
  { name: '3rd Mile', ward: 'Zone 3 — Madurai Bypass', lat: 8.8015, lng: 78.1165, mapX: 26, mapY: 42 },
  { name: 'Spic Nagar', ward: 'Zone 4 — South Port Corridor', lat: 8.7418, lng: 78.1495, mapX: 60, mapY: 86 },
];

export const DEPARTMENT_ROUTING: Record<IssueCategory, string> = {
  'Water Leakage': 'TWAD Board',
  Electricity: 'TANGEDCO',
  'Road Damage': 'Highways Department',
  Garbage: 'Sanitation Department',
  'Street Light': 'Thoothukudi Corporation',
  Drainage: 'Thoothukudi Corporation',
  Other: 'Thoothukudi Corporation',
};

export const OFFICIAL_BY_DEPARTMENT: Record<string, string> = {
  'TWAD Board': 'Executive Engineer, TWAD Board (Thoothukudi Division)',
  TANGEDCO: 'Assistant Executive Engineer, TANGEDCO Urban Distribution',
  'Highways Department': 'Divisional Engineer, Highways Department (Thoothukudi)',
  'Sanitation Department': 'City Health & Sanitation Officer, Thoothukudi',
  'Thoothukudi Corporation': 'Municipal Engineer, Thoothukudi City Municipal Corporation',
};

export function getDepartmentForCategory(category: IssueCategory): string {
  return DEPARTMENT_ROUTING[category] || 'Thoothukudi Corporation';
}

export function getOfficialForDepartment(department: string): string {
  return (
    OFFICIAL_BY_DEPARTMENT[department] ||
    'Municipal Engineer, Thoothukudi City Municipal Corporation'
  );
}

export const ISSUE_CATEGORIES: {
  category: IssueCategory;
  department: string;
  slaHours: number;
  description: string;
}[] = [
  {
    category: 'Water Leakage',
    department: 'TWAD Board',
    slaHours: 12,
    description: 'Drinking water pipeline bursts, Tamirabarani main supply leaks, or valve seepage.',
  },
  {
    category: 'Road Damage',
    department: 'Highways Department',
    slaHours: 48,
    description: 'Deep potholes, eroded bitumen surfaces, damaged speed breakers, or road cave-ins.',
  },
  {
    category: 'Street Light',
    department: 'Thoothukudi Corporation',
    slaHours: 24,
    description: 'Non-functioning LED street lamps, damaged poles, or dark pedestrian stretches.',
  },
  {
    category: 'Garbage',
    department: 'Sanitation Department',
    slaHours: 24,
    description: 'Uncollected municipal waste bins, roadside dumping, or solid waste backlog.',
  },
  {
    category: 'Drainage',
    department: 'Thoothukudi Corporation',
    slaHours: 18,
    description: 'Blocked stormwater channels, overflowing underground drainage (UGD), or stagnant water.',
  },
  {
    category: 'Electricity',
    department: 'TANGEDCO',
    slaHours: 6,
    description: 'Transformer sparks, low-hanging power lines, feeder trips, or voltage fluctuations.',
  },
  {
    category: 'Other',
    department: 'Thoothukudi Corporation',
    slaHours: 72,
    description: 'Public park upkeep, fallen trees, damaged footpath slabs, or civic signage.',
  },
];

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'usr-thoothukudi-01',
  name: 'Karthik Shunmugam',
  email: 'karthik.s@thoothukudi-citizens.in',
  phone: '+91 94431 28910',
  role: 'citizen',
  location: 'Bryant Nagar',
  ward: 'Zone 3 — South Central',
  streetAddress: '42, 5th Street, Bryant Nagar, Thoothukudi',
  organization: 'Thoothukudi Resident Welfare Forum',
  avatarUrl: ASSETS.citizenAvatar,
  joinedDate: 'March 2025',
  isAuthenticated: false,
  preferences: {
    smsAlerts: true,
    emailDigest: true,
    pushNotifications: true,
    offlineAutoSync: true,
  },
};

export const INITIAL_REPORTS: IssueReport[] = [
  {
    id: 'rep-101',
    referenceCode: 'TUT-2026-0841',
    title: 'Main drinking water pipeline burst near Millerpuram Water Tank',
    description:
      'High-pressure drinking water line has ruptured along the eastern curb near Millerpuram junction since 6:30 AM. Clean water is pooling across the carriageway and reducing supply pressure to adjacent streets.',
    category: 'Water Leakage',
    priority: 'Critical',
    status: 'In Progress',
    location: 'Millerpuram',
    ward: 'Zone 2 — Central West',
    coordinates: { lat: 8.7986, lng: 78.1321, mapX: 38, mapY: 46 },
    createdAt: '2026-10-04T06:45',
    updatedAt: '2026-10-04T09:15',
    observedAt: '2026-10-04T06:30',
    reporterId: 'usr-thoothukudi-01',
    reporterName: 'Karthik Shunmugam',
    imageUrl: ASSETS.waterLeak,
    assignedDepartment: 'TWAD Board',
    assignedCrew: 'TWAD Rapid Repair Unit 2',
    upvotes: 24,
    userUpvoted: true,
    timeline: [
      {
        id: 'tl-1',
        status: 'Pending',
        timestamp: '2026-10-04 06:45',
        actor: 'Karthik Shunmugam (Resident)',
        note: 'Report logged with field photo and GPS location at Millerpuram. Automatically routed to TWAD Board.',
      },
      {
        id: 'tl-2',
        status: 'In Progress',
        timestamp: '2026-10-04 07:30',
        actor: 'TWAD Board Dispatch',
        note: 'Escalated to Critical priority due to active main pipeline loss. Assigned to TWAD Rapid Repair Unit 2.',
      },
      {
        id: 'tl-3',
        status: 'In Progress',
        timestamp: '2026-10-04 09:15',
        actor: 'S. Murugan (Assistant Engineer, TWAD)',
        note: 'Sluice valve isolated at Palayamkottai Road junction. Excavation crew replacing damaged collar.',
      },
    ],
    comments: [
      {
        id: 'cm-1',
        authorName: 'Anitha Rajendran',
        authorRole: 'Citizen',
        timestamp: '2026-10-04 07:10',
        message: 'Confirmed — morning water supply pressure dropped across 3rd and 4th streets in Millerpuram.',
      },
      {
        id: 'cm-2',
        authorName: 'TWAD Rapid Repair Unit 2',
        authorRole: 'Field Crew',
        timestamp: '2026-10-04 09:20',
        message: 'Barricades placed on the eastbound lane. Normal pumping will resume by 1:30 PM today.',
      },
    ],
  },
  {
    id: 'rep-102',
    referenceCode: 'TUT-2026-0839',
    title: 'Deep road potholes and damaged surface near Palayamkottai Road flyover',
    description:
      'Multiple deep potholes spanning nearly 3 feet wide have formed along the service lane on Palayamkottai Road near VOC College. Two-wheelers and school buses are forced to swerve abruptly.',
    category: 'Road Damage',
    priority: 'High',
    status: 'In Progress',
    location: 'Palayamkottai Road',
    ward: 'Zone 2 — Arterial Corridor',
    coordinates: { lat: 8.7964, lng: 78.1285, mapX: 34, mapY: 48 },
    createdAt: '2026-10-03T14:20',
    updatedAt: '2026-10-03T17:40',
    observedAt: '2026-10-03T14:00',
    reporterId: 'usr-thoothukudi-01',
    reporterName: 'Karthik Shunmugam',
    imageUrl: ASSETS.roadPothole,
    assignedDepartment: 'Highways Department',
    assignedCrew: 'Highways Road Maintenance Squad A',
    upvotes: 35,
    userUpvoted: false,
    timeline: [
      {
        id: 'tl-201',
        status: 'Pending',
        timestamp: '2026-10-03 14:20',
        actor: 'Karthik Shunmugam (Resident)',
        note: 'Submitted with road surface damage photo. Automatically routed to Highways Department.',
      },
      {
        id: 'tl-202',
        status: 'In Progress',
        timestamp: '2026-10-03 17:40',
        actor: 'Highways Department Dispatch',
        note: 'Safety cones deployed by patrol inspector. Wet-mix macadam and hot bitumen patching underway.',
      },
    ],
    comments: [
      {
        id: 'cm-201',
        authorName: 'M. Selvakumar',
        authorRole: 'Citizen',
        timestamp: '2026-10-03 15:12',
        message: 'Thank you for reporting this! Commuters towards 3rd Mile face heavy congestion here every evening.',
      },
    ],
  },
  {
    id: 'rep-103',
    referenceCode: 'TUT-2026-0834',
    title: 'Five consecutive LED street lights not working along Beach Road promenade',
    description:
      'Street light poles #SL-112 to #SL-116 near Roche Park along Beach Road remain completely dark after 6:30 PM, creating safety concerns for evening walkers and families.',
    category: 'Street Light',
    priority: 'Medium',
    status: 'Pending',
    location: 'Beach Road',
    ward: 'Zone 1 — Coastal East',
    coordinates: { lat: 8.8054, lng: 78.1592, mapX: 82, mapY: 38 },
    createdAt: '2026-10-02T20:15',
    updatedAt: '2026-10-02T20:15',
    observedAt: '2026-10-02T19:50',
    reporterId: 'usr-thoothukudi-01',
    reporterName: 'Karthik Shunmugam',
    imageUrl: ASSETS.streetLight,
    assignedDepartment: 'Thoothukudi Corporation',
    assignedCrew: 'Corporation Electrical Wing 1',
    upvotes: 18,
    userUpvoted: true,
    timeline: [
      {
        id: 'tl-301',
        status: 'Pending',
        timestamp: '2026-10-02 20:15',
        actor: 'Karthik Shunmugam (Resident)',
        note: 'Logged via ImpactVoice mobile portal. Automatically routed to Thoothukudi Corporation.',
      },
    ],
    comments: [],
  },
  {
    id: 'rep-104',
    referenceCode: 'TUT-2026-0828',
    title: 'Distribution transformer sparking and voltage fluctuation in SIPCOT Industrial Estate',
    description:
      'Distribution transformer #DT-409 near SIPCOT Phase I main gate is emitting intermittent sparks and loud humming, causing frequent single-phase voltage drops.',
    category: 'Electricity',
    priority: 'Critical',
    status: 'In Progress',
    location: 'SIPCOT Industrial Estate',
    ward: 'Zone 4 — SIPCOT Belt',
    coordinates: { lat: 8.8112, lng: 78.0895, mapX: 18, mapY: 28 },
    createdAt: '2026-10-02T11:05',
    updatedAt: '2026-10-03T08:30',
    observedAt: '2026-10-02T10:45',
    reporterId: 'usr-thoothukudi-02',
    reporterName: 'Ramesh Babu',
    assignedDepartment: 'TANGEDCO',
    assignedCrew: 'TANGEDCO Line Maintenance Team',
    upvotes: 29,
    userUpvoted: false,
    timeline: [
      {
        id: 'tl-401',
        status: 'Pending',
        timestamp: '2026-10-02 11:05',
        actor: 'Ramesh Babu (Resident)',
        note: 'Initial report submitted for transformer #DT-409. Routed to TANGEDCO.',
      },
      {
        id: 'tl-402',
        status: 'In Progress',
        timestamp: '2026-10-03 08:30',
        actor: 'TANGEDCO Urban Subdivision',
        note: 'Junior Engineer inspected site; degraded HT bushing identified. Shutdown scheduled for replacement.',
      },
    ],
    comments: [],
  },
  {
    id: 'rep-105',
    referenceCode: 'TUT-2026-0819',
    title: 'Blocked stormwater drainage channel overflowing near Bryant Nagar 9th Street',
    description:
      'Silt and plastic debris have clogged the covered stormwater drain culvert in Bryant Nagar, causing greywater stagnation along the residential street corner.',
    category: 'Drainage',
    priority: 'High',
    status: 'Pending',
    location: 'Bryant Nagar',
    ward: 'Zone 3 — South Central',
    coordinates: { lat: 8.7892, lng: 78.1348, mapX: 46, mapY: 58 },
    createdAt: '2026-10-01T10:20',
    updatedAt: '2026-10-01T10:20',
    observedAt: '2026-10-01T09:45',
    reporterId: 'usr-thoothukudi-01',
    reporterName: 'Karthik Shunmugam',
    assignedDepartment: 'Thoothukudi Corporation',
    assignedCrew: 'UGD & Drainage Desilting Unit',
    upvotes: 21,
    userUpvoted: true,
    timeline: [
      {
        id: 'tl-500',
        status: 'Pending',
        timestamp: '2026-10-01 10:20',
        actor: 'Karthik Shunmugam (Resident)',
        note: 'Reported blocked culvert in Bryant Nagar. Automatically routed to Thoothukudi Corporation.',
      },
    ],
    comments: [],
  },
  {
    id: 'rep-106',
    referenceCode: 'TUT-2026-0812',
    title: 'Overflowing secondary garbage bins behind Thoothukudi Old Bus Stand',
    description:
      'Three commercial waste containers near the eastern entrance of Thoothukudi Old Bus Stand require immediate clearance and bleaching powder application.',
    category: 'Garbage',
    priority: 'Medium',
    status: 'Resolved',
    location: 'Thoothukudi Old Bus Stand',
    ward: 'Zone 1 — Central Market',
    coordinates: { lat: 8.8038, lng: 78.1456, mapX: 62, mapY: 40 },
    createdAt: '2026-09-29T09:10',
    updatedAt: '2026-09-30T14:05',
    observedAt: '2026-09-29T08:45',
    reporterId: 'usr-thoothukudi-03',
    reporterName: 'Jancy Priya',
    assignedDepartment: 'Sanitation Department',
    assignedCrew: 'Sanitation Compactor Fleet 3',
    upvotes: 14,
    userUpvoted: false,
    timeline: [
      {
        id: 'tl-501',
        status: 'Pending',
        timestamp: '2026-09-29 09:10',
        actor: 'Jancy Priya (Resident)',
        note: 'Reported overflowing bins at Old Bus Stand. Routed to Sanitation Department.',
      },
      {
        id: 'tl-502',
        status: 'In Progress',
        timestamp: '2026-09-29 13:00',
        actor: 'Sanitation Department Dispatch',
        note: 'Assigned to Sanitation Compactor Fleet 3.',
      },
      {
        id: 'tl-503',
        status: 'Resolved',
        timestamp: '2026-09-30 14:05',
        actor: 'Sanitation Compactor Fleet 3',
        note: 'All containers cleared, area swept and disinfected by sanitary supervisor.',
      },
    ],
    comments: [
      {
        id: 'cm-501',
        authorName: 'Municipal Dispatch',
        authorRole: 'Municipal Dispatch',
        timestamp: '2026-09-30 14:10',
        message: 'Issue marked Resolved. Thank you for helping keep Thoothukudi clean.',
      },
    ],
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'status',
    title: 'TWAD Board on site for TUT-2026-0841 (Millerpuram)',
    message:
      'TWAD Rapid Repair Unit 2 has isolated the main sluice valve at Millerpuram. Pipeline collar replacement is underway.',
    timestamp: '25 mins ago',
    read: false,
    reportId: 'rep-101',
  },
  {
    id: 'notif-2',
    type: 'reply',
    title: 'Highways Department update on Palayamkottai Road',
    message:
      'Highways Road Maintenance Squad A has started hot-mix bitumen patching near the VOC College service lane.',
    timestamp: '3 hours ago',
    read: false,
    reportId: 'rep-102',
  },
  {
    id: 'notif-3',
    type: 'alert',
    title: 'TANGEDCO Advisory: SIPCOT Phase I Transformer Maintenance',
    message:
      'TANGEDCO Line Maintenance Team is replacing the degraded HT bushing on transformer #DT-409.',
    timestamp: '4 hours ago',
    read: true,
    reportId: 'rep-104',
  },
  {
    id: 'notif-4',
    type: 'status',
    title: 'Resolved: TUT-2026-0812 (Thoothukudi Old Bus Stand)',
    message:
      'Sanitation Compactor Fleet 3 completed waste clearance and disinfection at Old Bus Stand.',
    timestamp: '2 days ago',
    read: true,
    reportId: 'rep-106',
  },
];

export const MUNICIPAL_CREWS = [
  'Unassigned',
  'TWAD Rapid Repair Unit 2',
  'TANGEDCO Line Maintenance Team',
  'Highways Road Maintenance Squad A',
  'Sanitation Compactor Fleet 3',
  'Corporation Electrical Wing 1',
  'UGD & Drainage Desilting Unit',
];
