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
  provider_id?: number;
}

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'provider';
  name: string;
}
