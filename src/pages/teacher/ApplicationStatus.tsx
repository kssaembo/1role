import { Student, Role, Application } from '../../types';
import { 
  ClipboardCheck, 
  Search, 
  MessageSquare,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function ApplicationStatus({ 
  userId, 
  students, 
  roles, 
  applications 
}: { 
  userId: string, 
  students: Student[], 
  roles: Role[], 
  applications: Application[] 
}) {
  const getRoleName = (id: string) => roles.find(r => r.id === id)?.name || '알 수 없음';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">학생 지망 현황</h1>
          <p className="text-slate-500 mt-1">학생들이 제출한 1, 2, 3지망과 지원 다짐을 확인하세요.</p>
        </div>
        <div className="flex items-center gap-4 px-4 py-2 bg-white rounded-xl border border-slate-200">
          <ClipboardCheck className="text-emerald-500" size={20} />
          <span className="text-sm font-semibold">전체 {students.length}명 중 {applications.length}명 제출</span>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 font-semibold text-slate-600">학생</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-center">1지망</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-center">2지망</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-center">3지망</th>
              <th className="px-6 py-4 font-semibold text-slate-600">지원 다짐</th>
              <th className="px-6 py-4 font-semibold text-slate-600">신청 시간</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-32 text-center text-slate-400">
                  <Clock size={40} className="mx-auto mb-3 opacity-20" />
                  <p>아직 제출된 신청서가 없습니다.</p>
                </td>
              </tr>
            ) : (
              applications.map((app) => {
                const student = students.find(s => s.id === app.studentId);
                return (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs">
                          {student?.studentNumber}
                        </div>
                        <span className="font-bold">{student?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                        {getRoleName(app.preferences[0])}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-semibold rounded-full border border-slate-100">
                        {getRoleName(app.preferences[1])}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-semibold rounded-full border border-slate-100">
                        {getRoleName(app.preferences[2])}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 group cursor-help">
                        <MessageSquare size={16} className="text-slate-300 shrink-0" />
                        <p className="text-sm text-slate-600 truncate max-w-[200px]" title={app.commitment}>
                          {app.commitment}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs text-slate-400">
                      {app.submittedAt?.toDate().toLocaleString('ko-KR', { hour12: false }).slice(0, -3)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
