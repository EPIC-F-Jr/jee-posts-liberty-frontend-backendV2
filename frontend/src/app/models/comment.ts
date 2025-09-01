
import { User } from './user';

export interface Comment {
  id: number;
  postId: number;
  content: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  showOptions?: boolean;
}
