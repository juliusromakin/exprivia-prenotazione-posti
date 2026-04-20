export interface User {
    id?: number;
    username?: string;
    name: string;
    lastName: string;
    email: string;
    password?: string;
    enabled: boolean;
    authorities: string[];
    createdDate?: string | Date;
    updatedDate?: string | Date;
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
    authorities: string[];
    enabled: boolean;
}

export interface AdminUpdateUserRequest {
    name?: string;
    lastName?: string;
    email?: string;
    authorities?: string[];
    enabled?: boolean;
}