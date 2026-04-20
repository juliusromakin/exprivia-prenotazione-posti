export interface AuthResponse {
    token: string;
    type: string;
    id: number;
    username: string;
    email: string;
    roles: string[];
}

export interface Credentials {
    email: string;
    password: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}