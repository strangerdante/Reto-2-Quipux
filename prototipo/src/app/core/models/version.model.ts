export interface VersionRecord {
  id: string;
  version: string;
  author: string;
  timestamp: string;
  summary: string;
  isCurrent: boolean;
  snapshot?: any;
}

export interface PreflightCheck {
  id: string;
  label: string;
  detail: string;
  passed: boolean;
}
