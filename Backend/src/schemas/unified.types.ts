// Phase 3: Unified CRM DTOs/Interfaces
// These are the canonical shapes that ALL providers must map to

export interface Contact {
  id: string;
  externalId: string;
  name: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  provider: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
  _raw_passthrough?: any;
}

export interface Company {
  id: string;
  externalId: string;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  provider: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
  _raw_passthrough?: any;
}

export interface Deal {
  id: string;
  externalId: string;
  title: string;
  amount?: number;
  stage?: string;
  provider: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
  _raw_passthrough?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
}

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  organizationId?: string;
  role?: string;
  department?: string;
  status?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface ProviderAuthUrl {
  provider: string;
  url: string;
}
