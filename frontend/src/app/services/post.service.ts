import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PostDTO } from '../models/post-dto';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  // Base API URL for Post resources (matches backend JAX-RS /posts endpoint)
  private readonly apiUrl = '/posts';

  // Common headers for JSON requests
  private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  // Subject to emit when a new post is created
  private postCreatedSubject = new Subject<PostDTO>();

  // Observable for components to listen to new post creation
  postCreated$ = this.postCreatedSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * READ (all) - Fetch all posts (active posts only).
   */
  getAllPosts(): Observable<PostDTO[]> {
    return this.http.get<PostDTO[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('PostService.getAllPosts: Error fetching posts:', error);
        return of([] as PostDTO[]); // Return empty array on error
      })
    );
  }

  /**
   * READ (one) - Fetch a single PostDTO by its ID.
   */
  getPostById(id: string | number): Observable<PostDTO | null> {
    return this.http.get<PostDTO>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`PostService.getPostById: Error fetching post with id=${id}:`, error);
        return of(null); // Return null on error
      })
    );
  }

  /**
   * CREATE - Submit a new post to the backend.
   */
  createPost(postData: { userId: string; content: string }): Observable<PostDTO> {
    return this.http.post<PostDTO>(this.apiUrl, postData, { headers: this.jsonHeaders }).pipe(
      tap((newPost: PostDTO) => {
        // Emit the new post to all listeners
        this.postCreatedSubject.next(newPost);
      }),
      catchError(error => {
        console.error('PostService.createPost: Error creating post:', error);
        throw error; // Let the component handle this
      })
    );
  }

  /**
   * UPDATE - Update an existing post by its ID.
   * Sends only the content to be updated, receives full PostDTO back.
   */
  updatePost(id: string | number, updateData: { content: string }): Observable<PostDTO> {
    return this.http.put<PostDTO>(`${this.apiUrl}/${id}`, updateData, { headers: this.jsonHeaders }).pipe(
      catchError(error => {
        console.error(`PostService.updatePost: Error updating post with id=${id}:`, error);
        throw error; // Let the component handle this
      })
    );
  }

  /**
   * DELETE (soft delete on backend) - Mark a post as inactive by its ID.
   */
  deletePost(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`PostService.deletePost: Error deleting post with id=${id}:`, error);
        throw error; // Let the component handle this
      })
    );
  }
}
