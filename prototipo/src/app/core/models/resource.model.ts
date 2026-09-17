export interface ResourceFolder {
  id: string;
  name: string;
  path: string;
  fileCount: number;
  totalSize: string;
}

export interface ResourceAsset {
  id: string;
  name: string;
  type: string;
  dimensions: string;
  size: string;
  status: 'Verificado' | 'Pendiente' | 'Inseguro';
  cdnPath: string;
}
