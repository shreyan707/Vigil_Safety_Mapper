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
