export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string;
  photoURL: string | null;
  lastSignIn: string | null;
}

export interface Note {
  id: string;
  userId: string;
  title?: string;
  content: string;
  createdAt: string;
  color?: string;
}
