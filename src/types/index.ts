export enum Role {
    User = 'User',
    Admin = 'Admin',
    SuperAdmin = 'SuperAdmin',
}

export interface User {
    id: number;
    email: string;
    fullName: string;
    role: Role;
    avatar?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface Company {
    id: number;
    name: string;
    service?: string | null;
    capital?: number;
    logo?: string | null;
    locationLat?: number | null;
    locationLon?: number | null;
    ownerId: number;
    createdAt: string;
    updatedAt: string;
}

export enum ActionType {
    USER_CREATED = 'USER_CREATED',
    USER_UPDATED = 'USER_UPDATED',
    USER_DELETED = 'USER_DELETED',
    PROFILE_EDITED = 'PROFILE_EDITED',
    PASSWORD_CHANGED = 'PASSWORD_CHANGED',

    COMPANY_CREATED = 'COMPANY_CREATED',
    COMPANY_EDITED = 'COMPANY_EDITED',
    COMPANY_DELETED = 'COMPANY_DELETED',

    ADMIN_CREATED = 'ADMIN_CREATED',
    ADMIN_DELETED = 'ADMIN_DELETED',
    ADMIN_UPDATED = 'ADMIN_UPDATED',
}

export enum EntityType {
    USER = 'USER',
    COMPANY = 'COMPANY',
}

export interface HistoryEntry {
    id: number;
    userId: number;
    user: User;
    action: ActionType;
    entityType: EntityType;
    entityId?: number | null;
    details: string;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}