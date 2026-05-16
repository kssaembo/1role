import { useState } from 'react';
import { 
  updateDoc, 
  doc, 
  collection, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { 
  Play, 
  RotateCcw, 
  Save, 
  AlertTriangle, 
  HelpCircle,
  Settings2,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { Student, Role, Application } from '../../types';
import { runAutoMatching } from '../../services/matchingService';

export default function AssignmentTool({ 
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'automatic' | 'manual'>('automatic');

  const [confirmModal, setConfirmModal] = useState<{type: 'match' | 'reset', isOpen: boolean}>({ type: 'match', isOpen: false });

  const handleAutoMatch = async () => {
    setConfirmModal({ type: 'match', isOpen: false });
    setIsProcessing(true);
    try {
      await runAutoMatching(userId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAssignments = async () => {
    setConfirmModal({ type: 'reset', isOpen: false });
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      students.forEach(s => {
        const ref = doc(db, `users/${userId}/students`, s.id);
        batch.update(ref, { currentRoleId: '' });
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const manualAssign = async (studentId: string, roleId: string) => {
    const studentRef = doc(db, `users/${userId}/students`, studentId);
    await updateDoc(studentRef, { currentRoleId: roleId });
  };

  const unassignedStudents = students.filter(s => !s.currentRoleId);
  const assignedCount = students.filter(s => !!s.currentRoleId).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">매칭 및 최종 배정</h1>
          <p className="text-slate-500 mt-1">알고리즘을 통해 공정하게 배정 후 교사가 최종 검토합니다.</p>
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button 
            onClick={() => setActiveTab('automatic')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'automatic' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            자동 매칭
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            수동 조정
          </button>
        </div>
      </div>

      {activeTab === 'automatic' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm text-center">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
                <Settings2 size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-4">공정 매칭 알고리즘 실행</h2>
              <div className="text-slate-500 space-y-2 mb-10 max-w-md mx-auto">
                <p>1. 지망 순위를 1순위로 고려합니다.</p>
                <p>2. 경합 시 이 역할을 해보지 않은 학생을 우선합니다.</p>
                <p>3. 해결되지 않는 경합은 미배정 처리됩니다.</p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setConfirmModal({ type: 'reset', isOpen: true })}
                  disabled={isProcessing}
                  className="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-2"
                >
                  <RotateCcw size={20} />
                  전체 초기화
                </button>
                <button
                  onClick={() => setConfirmModal({ type: 'match', isOpen: true })}
                  disabled={isProcessing || students.length === 0}
                  className="px-12 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center gap-2"
                >
                  <Play size={20} />
                  {isProcessing ? '매칭 중...' : '자동 매칭 시작'}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex gap-4">
              <AlertTriangle className="text-amber-600 shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-amber-900">알고리즘 참고 사항</h4>
                <p className="text-amber-800 text-sm mt-1 leading-relaxed">
                  매칭 결과가 완벽하지 않을 수 있습니다. 특히 1지망 지망도가 높은 특정 역할의 경우, 
                  시스템은 무작위로 선택하는 대신 "미배정" 상태로 남깁니다. 
                  이 경우 수동 조정 탭에서 지원 다짐을 보고 결정해주세요.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-500" />
                배정 통계
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-slate-50 rounded-2xl">
                  <span className="text-slate-500">배정 완료</span>
                  <span className="font-bold">{assignedCount}명</span>
                </div>
                <div className="flex justify-between p-4 bg-red-50 rounded-2xl">
                  <span className="text-red-600">미배정 명단</span>
                  <span className="font-bold text-red-600">{unassignedStudents.length}명</span>
                </div>
              </div>
              
              <div className="mt-8 space-y-3 max-h-[400px] overflow-auto pr-2">
                {unassignedStudents.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <span className="text-sm font-semibold">{s.studentNumber}번 {s.name}</span>
                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded uppercase font-bold text-slate-500">Unassigned</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Unassigned Students with their applications */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <HelpCircle size={22} className="text-amber-500" />
              수동 배정이 필요한 학생
            </h3>
            <div className="space-y-4">
              {unassignedStudents.length === 0 && (
                <div className="p-20 text-center bg-emerald-50 rounded-[2rem] border border-emerald-100 text-emerald-700">
                  <CheckCircle2 size={40} className="mx-auto mb-3" />
                  <p className="font-bold">모든 학생이 배정되었습니다!</p>
                </div>
              )}
              {unassignedStudents.map(student => {
                const app = applications.find(a => a.studentId === student.id);
                return (
                  <div key={student.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold">
                          {student.studentNumber}
                        </div>
                        <span className="text-lg font-bold">{student.name}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl italic text-sm text-slate-600">
                      "{app?.commitment || '지원 다짐이 없습니다.'}"
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {app?.preferences.map((prefId, i) => {
                        const r = roles.find(role => role.id === prefId);
                        return (
                          <button
                            key={i}
                            onClick={() => manualAssign(student.id, prefId)}
                            className="p-3 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all text-center"
                          >
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{i + 1}지망</p>
                            <p className="text-xs font-bold truncate">{r?.name || '역할 정보 없음'}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Role Status */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <UserCheck size={22} className="text-blue-500" />
              역할별 배정 현황
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {roles.map(role => {
                const currentAssigned = students.filter(s => s.currentRoleId === role.id);
                const isOverQuoted = currentAssigned.length > role.quota;
                return (
                  <div key={role.id} className={`p-6 bg-white rounded-3xl border ${isOverQuoted ? 'border-red-200 bg-red-50/20' : 'border-slate-200'} shadow-sm`}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-lg">{role.name}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${isOverQuoted ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                        {currentAssigned.length} / {role.quota}명
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentAssigned.map(s => (
                        <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 text-sm font-medium relative group">
                          {s.name}
                          <button 
                            onClick={() => manualAssign(s.id, '')}
                            className="hidden group-hover:block ml-1 text-red-400 hover:text-red-600"
                          >
                             ×
                          </button>
                        </div>
                      ))}
                      {currentAssigned.length === 0 && (
                        <p className="text-slate-400 text-sm italic">배정된 학생이 없습니다.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}></div>
          <div className="relative bg-white w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 ${confirmModal.type === 'reset' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
              {confirmModal.type === 'reset' ? <RotateCcw size={32} /> : <Play size={32} />}
            </div>
            <h3 className="text-xl font-bold mb-4">
              {confirmModal.type === 'reset' ? '초기화하시겠습니까?' : '매칭을 시작할까요?'}
            </h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              {confirmModal.type === 'reset' 
                ? '모든 학생의 역할 배정 결과가 초기화됩니다.' 
                : '지망 순위와 이력을 분석하여 자동으로 역할을 배정합니다. 기존 결과가 있는 경우 덮어씌워질 수 있습니다.'
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                취소
              </button>
              <button
                onClick={confirmModal.type === 'reset' ? resetAssignments : handleAutoMatch}
                className={`flex-1 py-3 ${confirmModal.type === 'reset' ? 'bg-red-600' : 'bg-blue-600'} text-white font-bold rounded-xl transition-all shadow-lg`}
              >
                {confirmModal.type === 'reset' ? '초기화 실행' : '시작하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
