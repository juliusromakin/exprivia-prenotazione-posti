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

export interface UserRegistration {
    name: string;
    lastName: string;
    email: string;
    password?: string;
}