export interface User {
  id: string;
  _id?: string;
  name: string;
  fullName?: string;
  email: string;
  mobile?: string;
  mobileNumber?: string;
  role: 'student' | 'admin' | 'superadmin' | 'user';
  avatar?: string;
  emailVerified?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  slug: string;
  category: string;
  instructor: string;
  enrolled: number;
}
