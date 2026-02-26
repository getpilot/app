export interface Offer {
  name: string;
  content: string;
}

export interface ToneProfile {
  toneType?: string;
}

export interface UserProfile {
  name?: string;
  business_type?: string | null;
  main_offering?: string | null;
  use_case?: string[] | string | null;
  pilot_goal?: string[] | string | null;
  leads_per_month?: string | number | null;
  active_platforms?: string[] | string | null;
  current_tracking?: string[] | string | null;
}

export interface UserPersonalizationData {
  user?: UserProfile;
  toneProfile?: ToneProfile;
  offers?: Offer[];
}