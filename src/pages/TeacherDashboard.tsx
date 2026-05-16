import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, signOut } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  CheckCircle2, 
  LogOut, 
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { Student, Role, Application, User as TeacherData } from '../types';

import TeacherOverview from './teacher/TeacherOverview';
import StudentManagement from './teacher/StudentManagement';
import RoleManagement from './teacher/RoleManagement';
import ApplicationStatus from './teacher/ApplicationStatus';
import AssignmentTool from './teacher/AssignmentTool';

export default function TeacherDashboard({ user }: { user: User }) {
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Fetch or Initialize Teacher Record
    const userRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setTeacherData({ id: snap.id, ...snap.data() } as TeacherData);
      } else {
        // Initial setup
        const newData: Omit<TeacherData, 'id'> = {
          email: user.email || '',
          className: '새로운 학급',
          teacherName: user.displayName || '선생님',
          createdAt: Timestamp.now()
        };
        setDoc(userRef, newData);
      }
    });

    // 2. Fetch Sub-collections
    const unsubStudents = onSnapshot(collection(db, `users/${user.uid}/students`), (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)).sort((a, b) => a.studentNumber - b.studentNumber));
    });

    const unsubRoles = onSnapshot(collection(db, `users/${user.uid}/roles`), (snap) => {
      setRoles(snap.docs.map(d => ({ id: d.id, ...d.data() } as Role)));
    });

    const unsubApps = onSnapshot(collection(db, `users/${user.uid}/applications`), (snap) => {
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Application)));
    });

    return () => {
      unsubUser();
      unsubStudents();
      unsubRoles();
      unsubApps();
    };
  }, [user.uid]);

  const navItems = [
    { label: '홈', path: '/teacher/dashboard', icon: LayoutDashboard },
    { label: '학생 관리', path: '/teacher/students', icon: Users },
    { label: '역할 설정', path: '/teacher/roles', icon: ClipboardList },
    { label: '지망 현황', path: '/teacher/applications', icon: ClipboardList },
    { label: '매칭 및 배정', path: '/teacher/assign', icon: CheckCircle2 },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-bottom border-slate-100 mb-6">
            <h2 className="text-xl font-bold font-sans flex items-center gap-2">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <LayoutDashboard size={20} />
              </span>
              매니저 센터
            </h2>
            <div className="mt-4 p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400 mb-1">현재 학급</p>
              <p className="font-semibold text-sm truncate">{teacherData?.className || '로딩 중...'}</p>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path === '/teacher/dashboard' && location.pathname === '/teacher/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${isActive ? 'bg-primary text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'}
                  `}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight size={16} className="ml-auto" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 uppercase">
                {user.displayName?.charAt(0) || user.email?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{user.displayName || '선생님'}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut(auth)}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
            >
              <LogOut size={20} />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        <Routes>
          <Route path="/" element={<TeacherOverview teacher={teacherData} students={students} roles={roles} applications={applications} />} />
          <Route path="/dashboard" element={<TeacherOverview teacher={teacherData} students={students} roles={roles} applications={applications} />} />
          <Route path="/students" element={<StudentManagement userId={user.uid} students={students} />} />
          <Route path="/roles" element={<RoleManagement userId={user.uid} roles={roles} />} />
          <Route path="/applications" element={<ApplicationStatus userId={user.uid} students={students} roles={roles} applications={applications} />} />
          <Route path="/assign" element={<AssignmentTool userId={user.uid} students={students} roles={roles} applications={applications} />} />
        </Routes>
      </main>
    </div>
  );
}
