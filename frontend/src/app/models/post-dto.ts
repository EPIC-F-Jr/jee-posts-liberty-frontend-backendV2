import { Comment } from './comment';
import { Like } from './like';
import { Post } from './post';

export interface PostDTO {
  post: Post;
  likes: Like[];
  comments: Comment[];
  showOptions?: boolean;
}
// Extend your PostDTO safely in the component file
export interface PostWithOptions extends PostDTO {
  showOptions?: boolean;
}



