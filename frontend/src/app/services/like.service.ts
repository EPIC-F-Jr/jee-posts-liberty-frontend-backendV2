import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Like } from '../models/like';

@Injectable({
  providedIn: 'root'
})
export class LikeService {
  private readonly apiUrl = '/likes'; // base URL
  private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  /** READ - Get all likes for a given target (post or comment) */
  getLikesByTargetIdAndType(targetId: number, type: 'post' | 'comment'): Observable<Like[]> {
    return this.http.get<Like[]>(`${this.apiUrl}/target/${targetId}/type/${type}`).pipe(
      catchError(error => {
        console.error(`Error fetching likes for ${type}=${targetId}:`, error);
        return of([] as Like[]);
      })
    );
  }

  /** CREATE - Add a like for a post or comment */
  createLike(likeData: { targetId: number; targetType: 'post' | 'comment'; userId: number }): Observable<Like> {
    return this.http.post<Like>(`${this.apiUrl}/toggle`, likeData, { headers: this.jsonHeaders }).pipe(
      catchError(error => {
        console.error('Error creating like:', error);
        throw error;
      })
    );
  }

  /** DELETE - Remove a like by its ID */
  deleteLike(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error deleting like with id=${id}:`, error);
        throw error;
      })
    );
  }

  /** TOGGLE - Like/unlike a target */
  toggleLike(likeData: { targetId: number; targetType: 'post' | 'comment'; userId: number }): Observable<{ action: 'liked' | 'unliked' }> {
    return this.http.post<{ action: 'liked' | 'unliked' }>(`${this.apiUrl}/toggle`, likeData, { headers: this.jsonHeaders }).pipe(
      catchError(error => {
        console.error('Error toggling like:', error);
        throw error;
      })
    );
  }
}
