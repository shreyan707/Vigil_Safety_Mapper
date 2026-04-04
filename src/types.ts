export interface Service {
  id: number;
  name: string;
  type: 'NGO' | 'Police' | 'Helpline' | 'SafeZone';
  description: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  hours: string;
  languages: string;
  service_tags?: string | null;
  verified: number;
}

export interface HelpRequest {
  id: string;
  issue_type: string;
  description: string;
  location: string;
  lat?: number;
  lng?: number;
  urgency: 'Low' | 'Medium' | 'High' | 'Urgent';
  contact_preference: 'None' | 'SMS' | 'Call';
  contact_info?: string;
  status: 'New' | 'In Progress' | 'Resolved';
  created_at: string;
  updated_at?: string;
  resolved_at?: string | null;
  provider_id?: number;
}

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'provider';
  name: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RequestNote {
  id: number;
  request_id: string;
  provider_id?: number | null;
  text: string;
  kind?: 'provider' | 'system' | string | null;
  created_at: string;
}

export interface ProviderProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  operatingHours: string;
  languages: string;
  servicesOffered: {
    domesticViolence: boolean;
    harassment: boolean;
    legalAid: boolean;
    counseling: boolean;
    medicalEmergency: boolean;
  };
}

export interface AdminDashboardData {
  totals: {
    today: number;
    week: number;
    month: number;
  };
  activeProviders: number;
  pendingVerifications: number;
  heatmap: Array<{
    id: string;
    lat: number;
    lng: number;
    issueType?: string | null;
    intensity: number;
  }>;
  recentActivity: Array<{
    id: number;
    action: string;
    entityType: string;
    entityId?: string | null;
    description?: string | null;
    actorName: string;
    created_at: string;
  }>;
  quickLinks: Array<{
    label: string;
    path: string;
  }>;
}

export interface AdminProvider {
  id: number;
  name: string;
  type: string;
  description: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  phone: string;
  email: string;
  hours: string;
  languages: string;
  service_tags?: string | null;
  verified: number;
  provider_id?: number | null;
  providerName?: string | null;
  providerEmail?: string | null;
  providerActive?: boolean | null;
}

export interface AdminRequest extends HelpRequest {
  providerName?: string | null;
  providerEmail?: string | null;
  providerActive?: boolean | null;
}

export interface AdminUser extends User {
  linkedServices?: Array<{ id: number; name: string }>;
  lastLogin?: {
    id: number;
    success: boolean;
    created_at: string;
    ip_address?: string | null;
  } | null;
  loginCount?: number;
}

export interface AdminLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  description?: string | null;
  actor_user_id?: number | null;
  actor_name: string;
  metadata?: unknown;
  created_at: string;
}

export interface AdminReferenceData {
  serviceTypes: string[];
  statusOptions: string[];
  providerOptions: Array<{
    id: number;
    serviceId: number;
    name: string;
    type: string;
    verified?: number | null;
  }>;
  issueTypes: string[];
  locations: string[];
}

export interface AdminAnalyticsData {
  summary: {
    totalRequests: number;
    resolvedRequests: number;
    avgResolutionHours: number | null;
    peakRequestDay: string;
  };
  issueTypes: Array<{ name: string; value: number }>;
  geographicDistribution: Array<{
    location: string;
    lat?: number | null;
    lng?: number | null;
    total: number;
    urgent: number;
  }>;
  statusFunnel: Array<{ name: string; value: number }>;
  providerPerformance: Array<{
    name: string;
    total: number;
    resolved: number;
    avgResolutionHours: number | null;
  }>;
  trendAnalysis: Array<{ name: string; requests: number }>;
}

export interface AdminSettings {
  twilio: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
    enabled: boolean;
  };
  smtp: {
    host: string;
    port: number;
    username: string;
    password: string;
    fromEmail: string;
    enabled: boolean;
  };
  map: {
    centerLat: number;
    centerLng: number;
    zoom: number;
  };
  autoAssignment: {
    enabled: boolean;
    maxRadiusKm: number;
    assignOnlyVerified: boolean;
    allowFallbackUnassigned: boolean;
  };
}
