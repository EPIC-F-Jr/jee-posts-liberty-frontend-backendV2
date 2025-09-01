import { User } from './user';
import { Like } from './like';

export interface Post {
  id: number;
  // title: string;
  content: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
}
