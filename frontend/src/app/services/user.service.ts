import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = '/users';
  private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  /**
   * READ (all) - Fetch all users.
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('UserService.getAllUsers: Error fetching users:', error);
        return of([] as User[]);
      })
    );
  }

  /**
   * READ (one) - Fetch a single user by ID.
   */
  getUserById(id: string | number): Observable<User | null> {
    return this.http.get<User>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`UserService.getUserById: Error fetching user with id=${id}:`, error);
        return of(null);
      })
    );
  }

  /**
   * CREATE - Create a new user.
   */
  createUser(userData: Partial<User>): Observable<User> {
    return this.http.post<User>(this.apiUrl, userData, { headers: this.jsonHeaders }).pipe(
      catchError(error => {
        console.error('UserService.createUser: Error creating user:', error);
        throw error;
      })
    );
  }

  /**
   * UPDATE - Update an existing user by ID.
   */
  updateUser(id: string | number, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user, { headers: this.jsonHeaders }).pipe(
      catchError(error => {
        console.error(`UserService.updateUser: Error updating user with id=${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * DELETE - Remove (soft delete) a user by ID.
   */
  deleteUser(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`UserService.deleteUser: Error deleting user with id=${id}:`, error);
        throw error;
      })
    );
  }
}
