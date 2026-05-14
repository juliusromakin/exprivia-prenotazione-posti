
import { Injectable } from "@angular/core";
import { Observable, from } from "rxjs";
import { map } from "rxjs/operators";
import { AxiosService } from "./axios.service";
import { User, AdminCreateUserRequest, AdminUpdateUserRequest, badgeDTO } from "../models";

@Injectable({
    providedIn: "root",
})
export class AdminService {
    private readonly baseUrl = "/api/admin/users";

    constructor(private axiosService: AxiosService) { }

    getAllUsers(): Observable<User[]> {
        return from(this.axiosService.get<User[]>(this.baseUrl));
    }

    getUserById(id: number): Observable<User> {
        return from(this.axiosService.get<User>(`${this.baseUrl}/${id}`));
    }

    getUserByEmail(email: string): Observable<User> {
        return from(this.axiosService.get<User>(`${this.baseUrl}/email/${email}`));
    }

    createUser(user: AdminCreateUserRequest): Observable<User> {
        return from(this.axiosService.post<User>(this.baseUrl, user));
    }

    updateUser(id: number, updates: AdminUpdateUserRequest): Observable<User> {
        return from(this.axiosService.put<User>(`${this.baseUrl}/${id}`, updates));
    }

    deleteUser(id: number): Observable<void> {
        return from(this.axiosService.delete(`${this.baseUrl}/${id}`)).pipe(
            map(() => void 0)
        );
    }

    approveUser(id: number): Observable<User> {
        return from(this.axiosService.post<User>(`${this.baseUrl}/${id}/approve`, {}));
    }

    getbadges(): Observable<badgeDTO[]> {
        return from(this.axiosService.get<badgeDTO[]>("/api/admin/badges"));
    }
}