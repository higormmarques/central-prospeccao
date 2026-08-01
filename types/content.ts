export type ContentType = "script" | "objecao" | "material" | "link" | "playbook" | "email_template";
export type ContentStatus = "draft" | "active" | "archived";
export type ContentChannel = "whatsapp" | "ligacao" | "email" | "reuniao" | "outro";

export type Content = {
  id: string;
  type: ContentType;
  category: string | null;
  title: string;
  description: string | null;
  body: string | null;
  file_url: string | null;
  external_url: string | null;
  channel: ContentChannel | null;
  version: number;
  status: ContentStatus;
  author_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentWithAuthor = Content & { author_name: string | null };
