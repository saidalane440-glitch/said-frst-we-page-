export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  link?: string;
  createdAt: number;
}

export interface UserNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  createdAt: number;
  summary?: string;
}
