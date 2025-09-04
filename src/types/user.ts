export interface Offer {
  name: string;
  content: string;
}

export interface ToneProfile {
  toneType?: string;
}

export interface UserProfile {
  name?: string;
  business_type?: string;
  main_offering?: string;
  use_case?: string[] | string;
  pilot_goal?: string[] | string;
  leads_per_month?: string | number;
  active_platforms?: string[] | string;
  current_tracking?: string[] | string;
}

export interface UserPersonalizationData {
  user?: UserProfile;
  toneProfile?: ToneProfile;
  offers?: Offer[];
}