import { Optional } from 'sequelize';

// Base user data that all user types share
export interface BaseUserData {
  email: string;
  password: string;
  name: string;
  avatar?: string;
}
// Add these to your existing UserTypes
export interface CreateMTMemberData extends BaseUserData  {
  role: 'MT-member';
  position: string;
  phone: string;
  location: string;
  joinDate: string;
  department: string;
  experience: string;
  skills: string[];
  bio: string;
  education: string[];
  certifications: string[];
  previousRoles: Array<{
    company: string;
    position: string;
    duration: string;
  }>;
  achievements: string[];
  salary: string;
  // reportingTo: string;
}

export interface UpdateMTMemberData  {
  name?: string;
  avatar?: string;
  position?: string;
  phone?: string;
  location?: string;
  joinDate?: string;
  department?: string;
  experience?: string;
  skills?: string[];
  bio?: string;
  education?: string[];
  certifications?: string[];
  previousRoles?: Array<{
    company: string;
    position: string;
    duration: string;
  }>;
  achievements?: string[];
  salary?: string;
  // reportingTo?: string;
}