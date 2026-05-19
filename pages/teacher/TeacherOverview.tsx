import { Student, Role, Application } from '../../types';
import { 
  Users, 
  ClipboardList, 
  CheckCircle2, 
  TrendingUp,
  AlertTriangle,
  Link as LinkIcon,
  Copy,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

export default function TeacherOverview({ 
  teacher, 
  students, 
  roles, 
  applications 
}: { 
  teacher: any, 
  students: Student[], 
  roles: Role[], 
  applications: Application[] 
}) {
  const [copied, setCopied] = useState(false);
  
  const getBaseUrl = () => {
    // If the hostname matches vercel or we are in a production-like environment, 
    // we use the provided vercel URL. Otherwise, use origin.
    const isVercel = window.location.hostname.includes('vercel.app');
    const isLocal = window.location.hostname === 'localhost';
    
    // If user is accessing from AI Studio preview or local, but wants to share the production link
    if (isLocal || window.location.hostname.includes('asia-northeast1.run.app')) {
      return 'https://1role.vercel.app';
    }
    
    return window.location.origin;
  };

  const studentLink = `${getBaseUrl()}/student/apply/${teacher?.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(studentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { label: '전체 학생', value: students.length, icon: Users, color: 'bg-blue-500' },
    { label: '등록된 역할', value: roles.length, icon: ClipboardList, color: 'bg-purple-500' },
    { label: '신청 완료', value: applications.length, icon: CheckCircle2, color: 'bg-emerald-500' },
    { label: '미배정 학생', value: students.filter(s => !s.currentRoleId).length, icon: AlertTriangle, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            반갑습니다, <span className="text-primary text-blue-600">{teacher?.teacherName || '선생님'}</span>!
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            {teacher?.className}의 1인 1역 현황을 한눈에 확인하세요.
          </p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-blue-100 shadow-sm flex flex-col gap-2 max-w-sm w-full">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <LinkIcon size={14} />
            학생 전용 접속 링크
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <input 
              readOnly 
              value={studentLink} 
              className="bg-transparent text-xs text-slate-500 flex-1 outline-none truncate"
            />
            <button 
              onClick={copyLink}
              className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 hover:text-blue-500 border border-slate-100 shadow-sm'}`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 italic">이 링크를 학생들에게 공유하면 비밀번호 없이 신청 가능합니다.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-${stat.color.split('-')[1]}-100`}>
              <stat.icon size={24} />
            </div>
            <p className="text-slate-500 font-medium text-sm">{stat.label}</p>
            <p className="text-3xl font-bold mt-1 text-slate-900">{stat.value}<span className="text-lg font-medium text-slate-400 ml-1">명</span></p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progress Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp size={24} className="text-blue-500" />
              배정 진행도
            </h3>
            <span className="text-sm font-bold text-blue-600">
              {students.length > 0 ? Math.round((students.filter(s => !!s.currentRoleId).length / students.length) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden mb-8">
            <div 
              className="bg-blue-500 h-full transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${students.length > 0 ? (students.filter(s => !!s.currentRoleId).length / students.length) * 100 : 0}%` }}
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
              <span className="text-sm text-slate-600">명단 등록</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${students.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                {students.length > 0 ? '완료' : '진행전'}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
              <span className="text-sm text-slate-600">역할 설정</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${roles.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                {roles.length > 0 ? '완료' : '진행전'}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
              <span className="text-sm text-slate-600">학생 신청</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${applications.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                {applications.length > 0 ? `${applications.length}명 진행` : '진행전'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-6">최근 소식</h3>
            <div className="space-y-4">
              {applications.slice(0, 3).map((app, i) => {
                const s = students.find(st => st.id === app.studentId);
                return (
                  <div key={app.id} className="flex gap-4 items-start p-4 bg-white/10 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                      {s?.studentNumber}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{s?.name} 학생이 신청을 완료했습니다.</p>
                      <p className="text-xs text-white/40 mt-1">방금 전 · 지원 다짐: {app.commitment.slice(0, 20)}...</p>
                    </div>
                  </div>
                );
              })}
              {applications.length === 0 && (
                <div className="py-10 text-center opacity-40">
                  <p>아직 학생들의 신청 내역이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 opacity-10">
            <TrendingUp size={300} />
          </div>
        </div>
      </div>
    </div>
  );
}
