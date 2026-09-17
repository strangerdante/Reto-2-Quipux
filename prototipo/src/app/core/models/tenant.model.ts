export interface Tenant {
  id: string;
  name: string;
  portalUrl: string;
  cdnPrefix: string;
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
    cdnPrefix: 'http://localhost:3000/resources/tenants/valle'
  },
  {
    id: 'medellin',
    name: 'Movilidad Medellín',
    portalUrl: 'https://www.medellin.gov.co/movilidad',
    cdnPrefix: 'http://localhost:3000/resources/tenants/medellin'
  },
  {
    id: 'cali',
    name: 'Tránsito Cali',
    portalUrl: 'https://www.cali.gov.co/movilidad',
    cdnPrefix: 'http://localhost:3000/resources/tenants/cali'
  },
  {
    id: 'sabaneta',
    name: 'Tránsito Sabaneta',
    portalUrl: 'https://www.sabaneta.gov.co/transito',
    cdnPrefix: 'http://localhost:3000/resources/tenants/sabaneta'
  },
  {
    id: 'manizales',
    name: 'Tránsito Manizales',
    portalUrl: 'https://www.manizales.gov.co/movilidad',
    cdnPrefix: 'http://localhost:3000/resources/tenants/manizales'
  }
];
