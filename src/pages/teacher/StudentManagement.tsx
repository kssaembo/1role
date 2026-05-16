import { useState } from 'react';
import { 
  collection, 
  doc, 
  writeBatch, 
  addDoc, 
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { 
  UserPlus, 
  Trash2, 
  FileSpreadsheet, 
  AlertCircle,
  CheckCircle,
  Save,
  Users
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { Student } from '../../types';

export default function StudentManagement({ userId, students }: { userId: string, students: Student[] }) {
  const [bulkInput, setBulkInput] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleBulkUpload = async () => {
    if (!bulkInput.trim()) return;
    setIsLoading(true);
    setStatus(null);

    try {
      const lines = bulkInput.trim().split('\n');
      const batch = writeBatch(db);
      
      lines.forEach((line) => {
        const parts = line.split(/[,\t\s]+/).filter(Boolean);
        const number = parts[0];
        const name = parts.slice(1).join(' ');
        
        if (number && name) {
          const studentRef = doc(collection(db, `users/${userId}/students`));
          batch.set(studentRef, {
            studentNumber: parseInt(number),
            name: name,
            currentRoleId: '',
            pastRoles: []
          });
        }
      });

      await batch.commit();
      setBulkInput('');
      setIsBulkMode(false);
      setStatus({ type: 'success', message: `${lines.length}명의 학생이 성공적으로 등록되었습니다.` });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: '등록 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      await deleteDoc(doc(db, `users/${userId}/students`, id));
      setDeleteId(null);
      setStatus({ type: 'success', message: '학생 정보가 삭제되었습니다.' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: '삭제 중 오류가 발생했습니다.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">학생 명단 관리</h1>
          <p className="text-slate-500 mt-1">학급 학생 번호와 이름을 등록하세요.</p>
        </div>
        <button
          onClick={() => setIsBulkMode(!isBulkMode)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-blue-600 font-medium rounded-xl hover:bg-primary/10 transition-all border border-blue-200"
        >
          {isBulkMode ? <Users size={18} /> : <FileSpreadsheet size={18} />}
          {isBulkMode ? '목록 보기' : '엑셀처럼 일괄 등록'}
        </button>
      </div>

      {status && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium text-sm">{status.message}</p>
        </div>
      )}

      {isBulkMode ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="mb-4 p-4 bg-blue-50 text-blue-800 rounded-2xl text-sm flex gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <p>
              한 줄에 한 명씩 <strong>[번호 이름]</strong> 형식으로 입력하세요. <br />
              (예: 1 홍길동)<br />
              엑셀이나 한글 표의 내용을 복사해서 붙여넣어도 작동합니다.
            </p>
          </div>
          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            className="w-full h-80 p-5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono"
            placeholder="1 김학생&#10;2 이수평&#10;3 박공정"
          />
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsBulkMode(false)}
              className="px-6 py-3 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            >
              취소
            </button>
            <button
              onClick={handleBulkUpload}
              disabled={isLoading || !bulkInput.trim()}
              className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              <Save size={18} />
              {isLoading ? '등록 중...' : '등록 완료'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-semibold text-slate-600 w-24">번호</th>
                <th className="px-6 py-4 font-semibold text-slate-600">이름</th>
                <th className="px-6 py-4 font-semibold text-slate-600">현재 역할</th>
                <th className="px-6 py-4 font-semibold text-slate-600">과거 이력</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                    <Users size={40} className="mx-auto mb-3 opacity-20" />
                    <p>등록된 학생이 없습니다. 상단의 일괄 등록 버튼을 사용해보세요.</p>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{student.studentNumber}번</td>
                    <td className="px-6 py-4 font-bold">{student.name}</td>
                    <td className="px-6 py-4">
                      {student.currentRoleId ? (
                        <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                          배정됨
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm italic">미배정</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {student.pastRoles.map((roleName, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded uppercase font-medium">
                            {roleName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteId(student.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
          <div className="relative bg-white w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold mb-4">학생을 삭제하시겠습니까?</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              삭제된 학생의 신청 정보와 배정 결과가 모두 삭제됩니다. <br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all font-sans"
              >
                취소
              </button>
              <button
                onClick={() => deleteStudent(deleteId)}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all font-sans"
              >
                삭제 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
