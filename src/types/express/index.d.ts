export interface Request {
  user?: {
    id: number;
    name?: string;
    email?: string;
    avatar?: string | null;
    badge?: string;
  };
}