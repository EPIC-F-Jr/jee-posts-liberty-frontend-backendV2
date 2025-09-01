import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Comment } from '../models/comment';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private readonly apiUrl = '/comments';
  private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  /**
   * READ (all) - Get all comments for a given post.
   */
  getCommentsByPostId(postId: string | number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/post/${postId}`).pipe(
      catchError(error => {
        console.error(`CommentService.getCommentsByPostId: Error fetching comments for post=${postId}:`, error);
        return of([] as Comment[]);
      })
    );
  }

  /**
   * READ (one) - Fetch a single comment by its ID.
   */
  getCommentById(id: string | number): Observable<Comment | null> {
    return this.http.get<Comment>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`CommentService.getCommentById: Error fetching comment with id=${id}:`, error);
        return of(null);
      })
    );
  }

  /**
   * CREATE - Submit a new comment for a post.
   */
  createComment(commentData: {
    id: number;
    postId: number;
    content: string;
    userId: number;
  }): Observable<Comment> {
    return this.http.post<Comment>(this.apiUrl, commentData, { headers: this.jsonHeaders }).pipe(
      catchError(error => {
        console.error('CommentService.createComment: Error creating comment:', error);
        throw error;
      })
    );
  }

  /**
   * UPDATE - Update an existing comment by ID.
   * Sends only the content to be updated, receives full Comment back.
   */
  updateComment(id: string | number, updateData: { content: string }): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/${id}`, updateData, { headers: this.jsonHeaders }).pipe(
      catchError(error => {
        console.error(`CommentService.updateComment: Error updating comment with id=${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * DELETE - Remove (soft delete) a comment by ID.
   */
  deleteComment(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`CommentService.deleteComment: Error deleting comment with id=${id}:`, error);
        throw error;
      })
    );
  }
}
