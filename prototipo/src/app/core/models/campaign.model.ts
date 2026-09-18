export type CampaignStatus = 'Publicado' | 'Programado' | 'Borrador' | 'Inactivo' | 'En revisión' | 'Aprobado';
export type CampaignType = 'Modal con slider' | 'Modal informativo';
export type PopupLayout = 'side' | 'top' | 'content';

export interface Slide {
  id: number;
  order?: number;
  active?: boolean;
  name: string;
  title: string;
  description: string;
  cta: string;
  link: string;
  target?: '_blank' | '_self';
  alt: string;
  desktopName: string;
  mobileName: string;
  desktopPreview: string | null;
  mobilePreview: string | null;
}

export interface PopupRules {
  delay: number;
  frequency: string;
  pathRule: string;
  startDate?: string;
  endDate?: string;
  escToggle: boolean;
  autoplayToggle: boolean;
  dataLayerToggle: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  tenant: string;
  status: CampaignStatus;
  version: string;
  updated: string;
  layout: PopupLayout;
  slides: Slide[];
  rules: PopupRules;
}
