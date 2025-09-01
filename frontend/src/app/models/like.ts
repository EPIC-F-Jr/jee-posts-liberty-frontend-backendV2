import { User } from './user';

export interface Like {
  id: number;
  targetId: number;
  targetType: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
}
