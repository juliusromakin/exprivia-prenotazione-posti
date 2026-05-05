export interface User {
    id?: number;
    username?: string;
    name: string;
    lastName: string;
    email: string;
    password?: string;
    enabled: boolean;
    badges: string[];
    createdDate?: string | Date;
    updatedDate?: string | Date;
}

export interface badgeDTO {
    id?: number;
    name: string;
    type: 'ROLE' | 'ACTION';
    description?: string;
    parentIds?: number[];
    isActive: boolean;
}

export interface UserSummary {
    id: number;
    name: string;
    lastName: string;
    email: string;
}

export interface UserRegistration {
    name: string;
    lastName: string;
    email: string;
    password?: string;
}

export interface UserUpdate {
    name?: string;
    lastName?: string;
    email?: string;
    password?: string;
}

export interface AdminCreateUserRequest {
    name: string;
    lastName: string;
    email: string;
    password?: string;
    badges: string[];
    enabled: boolean;
}

export interface AdminUpdateUserRequest {
    name?: string;
    lastName?: string;
    email?: string;
    badges?: string[];
    enabled?: boolean;
}