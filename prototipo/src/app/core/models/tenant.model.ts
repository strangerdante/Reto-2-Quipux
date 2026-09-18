export interface Tenant {
  id: string;
  name: string;
  portalUrl: string;
  logoUrl?: string;
}

export type UserRole = 'Editor' | 'Revisor' | 'Publicador';

export interface UserSession {
  name: string;
  role: UserRole;
  initials: string;
}

export const AVAILABLE_TENANTS: Tenant[] = [
  {
    id: 'valle',
    name: 'Gobernación del Valle (Impuestos)',
    portalUrl: 'https://impuestos.valledelcauca.gov.co',
    logoUrl: '/brand/logos/valle.svg'
  },
  {
    id: 'medellin',
    name: 'Movilidad Medellín',
    portalUrl: 'https://www.medellin.gov.co/movilidad',
    logoUrl: '/brand/logos/medellin.svg'
  },
  {
    id: 'cali',
    name: 'Tránsito Cali',
    portalUrl: 'https://www.cali.gov.co/movilidad',
    logoUrl: '/brand/logos/cali.svg'
  }
];
