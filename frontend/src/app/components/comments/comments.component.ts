import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Comment } from '../../models/comment';
import { CommentService } from '../../services/comment.service';
import { PostDTO } from '../../models/post-dto';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css']
})
export class CommentsComponent implements OnInit {
  @Input() post!: PostDTO;
  @Input() isExpanded: boolean = false;
  @Output() toggleComments = new EventEmitter<number>();
  @Output() commentAdded = new EventEmitter<any>();

  // Comment state properties
  newCommentText: { [key: number]: string } = {};
  submittingComment: { [key: number]: boolean } = {};
  editingCommentId: number | null = null;
  editCommentContent: string = '';
  submittingCommentEdit: boolean = false;

  constructor(private commentService: CommentService) {}

  ngOnInit() {}

  // ==========================================
  // COMMENT UTILITY METHODS
  // ==========================================

  getActiveCommentsCount(comments: Comment[]): number {
    if (!comments) return 0;
    return comments.filter(comment => comment.active).length;
  }

  getActiveComments(comments: Comment[]): Comment[] {
    if (!comments) return [];
    return comments.filter(comment => comment.active);
  }

  getCurrentUserId(): number {
    // TODO: Replace with actual user service logic
    return 1; // Hardcoded for now
  }

  // ==========================================
  // COMMENT ACTIONS
  // ==========================================

  onToggleComments() {
    if (this.post && this.post.post && this.post.post.id) {
      this.toggleComments.emit(this.post.post.id);
    }
  }

  clearComment(postId: number) {
    this.newCommentText[postId] = '';
  }

  submitComment(postId: number) {
    const content = this.newCommentText[postId] && this.newCommentText[postId].trim();
    if (!content || !postId) return;

    this.submittingComment[postId] = true;

    const commentData = {
      id: 0, // Will be set by backend
      content: content,
      postId: postId,
      userId: this.getCurrentUserId()
    };

    this.commentService.createComment(commentData).subscribe({
      next: (newComment) => {
        const post = this.post;
        if (post && post.comments) {
          post.comments.push(newComment);
        }
        this.newCommentText[postId] = '';
        this.submittingComment[postId] = false;
        this.commentAdded.emit(newComment);
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.submittingComment[postId] = false;
      }
    });
  }

  // ==========================================
  // COMMENT OPTIONS
  // ==========================================

  toggleCommentOptions(comment: Comment, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    // Close all other comment options first
    if (this.post && this.post.comments) {
      this.post.comments.forEach(c => {
        if (c.id !== comment.id) {
          c.showOptions = false;
        }
      });
    }
    comment.showOptions = !comment.showOptions;
  }

  shareComment(comment: Comment) {
    console.log('Share comment:', comment);
    comment.showOptions = false;
  }

  editComment(comment: Comment) {
    this.editingCommentId = comment.id;
    this.editCommentContent = comment.content;
    comment.showOptions = false;
  }

  saveCommentEdit(comment: Comment) {
    if (!this.editCommentContent.trim()) {
      return;
    }

    this.submittingCommentEdit = true;

    const updateData = {
      content: this.editCommentContent.trim()
    };

    this.commentService.updateComment(comment.id, updateData).subscribe({
      next: (response) => {
        console.log('Comment updated successfully:', response);
        // Update the comment content in the UI
        comment.content = this.editCommentContent.trim();
        // Clear edit state
        this.cancelCommentEdit();
      },
      error: (error) => {
        console.error('Error updating comment:', error);
        this.submittingCommentEdit = false;
      }
    });
  }

  cancelCommentEdit() {
    this.editingCommentId = null;
    this.editCommentContent = '';
    this.submittingCommentEdit = false;
  }

  isEditingComment(commentId: number): boolean {
    return this.editingCommentId === commentId;
  }

  deleteComment(comment: Comment) {
    console.log('Delete comment:', comment);

    this.commentService.deleteComment(comment.id).subscribe({
      next: (response) => {
        // Mark comment as inactive (soft delete)
        comment.active = false;
        comment.showOptions = false;
        console.log('Comment deleted successfully:', response);
      },
      error: (error) => {
        console.error('Error deleting comment:', error);
      }
    });
  }
}
