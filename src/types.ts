export interface User {
  id: string;
  email: string;
  className: string;
  teacherName: string;
  createdAt: any;
}

export interface Student {
  id: string;
  studentNumber: number;
  name: string;
  currentRoleId: string; // Document ID of the role
  pastRoles: string[]; // Names or IDs of roles performed previously
}

export interface Role {
  id: string;
  name: string;
  quota: number;
  description: string;
  reward: string;
  applicantCount: number;
}

export interface Application {
  id: string;
  studentId: string;
  preferences: string[]; // [RoleID1, RoleID2, RoleID3]
  commitment: string;
  submittedAt: any;
}
