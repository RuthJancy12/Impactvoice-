export type ScreenId =
  | 'landing'
  | 'login'
  | 'signup'
  | 'citizen-dashboard'
  | 'report-issue'
  | 'my-reports'
  | 'report-details'
  | 'notifications'
  | 'profile'
  | 'admin-dashboard';

export type IssueCategory =
  | 'Water Leakage'
  | 'Road Damage'
  | 'Street Light'
  | 'Garbage'
  | 'Drainage'
  | 'Electricity'
  | 'Other';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ReportStatus = 'Pending' | 'In Progress' | 'Resolved';

export type ThoothukudiLocation =
  | 'Millerpuram'
  | 'Bryant Nagar'
  | 'Korampallam'
  | 'Muthiahpuram'
  | 'Beach Road'
  | 'Palayamkottai Road'
  | 'SIPCOT Industrial Estate'
  | 'Thermal Nagar'
  | 'Harbour Area'
  | 'Thoothukudi Old Bus Stand'
  | 'New Bus Stand'
  | '3rd Mile'
  | 'Spic Nagar';

export interface TimelineEvent {
  id: string;
  status: ReportStatus;
  timestamp: string;
  actor: string;
  note: string;
}

export interface ReportComment {
  id: string;
  authorName: string;
  authorRole: 'Citizen' | 'Municipal Dispatch' | 'Field Crew';
  timestamp: string;
  message: string;
}

export interface IssueReport {
  id: string;
  referenceCode: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: PriorityLevel;
  status: ReportStatus;
  location: string;
  ward: string;
  coordinates: { lat: number; lng: number; mapX: number; mapY: number };
  createdAt: string;
  updatedAt: string;
  observedAt: string;
  reporterId: string;
  userId?: string;
  reporterName: string;
  imageUrl?: string;
  assignedDepartment: string;
  assignedCrew?: string;
  upvotes: number;
  userUpvoted?: boolean;
  isOfflineQueued?: boolean;
  isFirestoreSynced?: boolean;
  timeline: TimelineEvent[];
  comments: ReportComment[];
}

export interface AppNotification {
  id: string;
  type: 'status' | 'alert' | 'reply' | 'sync' | 'official';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  reportId?: string;
  department?: string;
  officialTitle?: string;
  location?: string;
  priority?: PriorityLevel;
  category?: IssueCategory;
  description?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'citizen' | 'admin';
  location: string;
  ward: string;
  streetAddress: string;
  organization?: string;
  avatarUrl: string;
  joinedDate: string;
  isAuthenticated?: boolean;
  preferences: {
    smsAlerts: boolean;
    emailDigest: boolean;
    pushNotifications: boolean;
    offlineAutoSync: boolean;
  };
}
