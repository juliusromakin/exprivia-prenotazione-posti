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

export interface AdminCreateUserRequest {
    name: string;
    lastName: string;
    email: string;
    password?: string;
    authorities: string[]; // Il Set<String> di Java diventa un array di stringhe in TS
    enabled: boolean;
}

// 3. Se in futuro ti serve, puoi fare anche quello per l'aggiornamento (PUT)
export interface AdminUpdateUserRequest {
    name?: string;
    lastName?: string;
    enabled?: boolean;
    // magari qui la password non serve
}