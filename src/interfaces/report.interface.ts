export interface Report {
  id: number;
  issue: string;
  description: string | null;
  priority: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  reporter: {
    id: string;
    email: string;
    username: string | null;
    profilePicture: string | null;
  };
  reported: {
    id: string;
    email: string;
    username: string | null;
    profilePicture: string | null;
  };
}