export type PreferredChannel = "whatsapp" | "email" | "ligacao";

export type Contact = {
  id: string;
  name: string;
  greeting: string | null;
  job_title: string | null;
  phone: string | null;
  phone_normalized: string | null;
  whatsapp_number: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  preferred_channel: PreferredChannel | null;
  best_contact_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadContact = {
  id: string;
  lead_id: string;
  contact_id: string;
  is_primary: boolean;
  receives_whatsapp: boolean;
  receives_email: boolean;
  relationship_type: string | null;
  contact: Contact;
};
