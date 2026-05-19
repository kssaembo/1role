import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc,
  query,
  where,
  Timestamp,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { 
  Student, 
  Role, 
  User as TeacherData,
  Application 
} from '../types';
import { 
  CheckCircle2, 
  ChevronRight, 
  HelpCircle, 
  Award,
  Users,
  Send,
  ArrowLeft,
  Search,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StudentApplication() {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Step State
  const [step, setStep] = useState<'auth' | 'apply' | 'success'>('auth');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  
  // Application State
  const [preferences, setPreferences] = useState<string[]>([]); // role IDs
  const [commitment, setCommitment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!teacherId) return;
      try {
        const tDoc = await getDoc(doc(db, 'users', teacherId));
        if (!tDoc.exists()) throw new Error('학급이 존재하지 않습니다.');
        setTeacher({ id: tDoc.id, ...tDoc.data() } as TeacherData);

        const sSnap = await getDocs(collection(db, `users/${teacherId}/students`));
        setStudents(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student)).sort((a, b) => a.studentNumber - b.studentNumber));

        const rSnap = await getDocs(collection(db, `users/${teacherId}/roles`));
        setRoles(rSnap.docs.map(d => ({ id: d.id, ...d.data() } as Role)));
      } catch (err) {
        console.error(err);
        alert('정보를 불러오는 중 오류가 발생했습니다.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [teacherId, navigate]);

  const togglePreference = (roleId: string) => {
    if (preferences.includes(roleId)) {
      setPreferences(preferences.filter(id => id !== roleId));
    } else {
      if (preferences.length < 3) {
        setPreferences([...preferences, roleId]);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudent || preferences.length < 3 || !commitment.trim() || !teacherId) return;
    setIsSubmitting(true);
    try {
      // 1. Check if application already exists for this student
      const appPath = `users/${teacherId}/applications`;
      try {
        const q = query(collection(db, appPath), where('studentId', '==', selectedStudent.id));
        const existing = await getDocs(q);
        
        if (!existing.empty) {
          alert('이미 신청서를 제출하셨습니다.');
          setStep('success');
          return;
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, appPath);
      }

      // 2. Submit Application
      try {
        await addDoc(collection(db, appPath), {
          studentId: selectedStudent.id,
          preferences,
          commitment,
          submittedAt: Timestamp.now()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, appPath);
      }

      // 3. Increment applicant counts for roles
      const rolesPath = `users/${teacherId}/roles`;
      for (const roleId of preferences) {
        try {
          const roleRef = doc(db, rolesPath, roleId);
          await updateDoc(roleRef, { applicantCount: increment(1) });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `${rolesPath}/${roleId}`);
        }
      }

      setStep('success');
    } catch (err) {
      console.error(err);
      // If it's our JSON error, it might be messy in an alert, but it's for diagnostics
      alert('신청서 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 flex flex-col items-center">
      <header className="max-w-4xl w-full mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white rounded-xl transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{teacher?.className}</h1>
            <p className="text-slate-500 text-sm">{teacher?.teacherName} 선생님의 학급</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl w-full">
        <AnimatePresence mode="wait">
          {step === 'auth' && (
            <motion.div
              layout
              key="auth"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-xl border border-slate-200"
            >
              <h2 className="text-3xl font-bold mb-8 text-center italic">누구신가요?</h2>
              
              <div className="mb-8 relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                <input
                  type="text"
                  placeholder="이름이나 번호로 찾기"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-[2rem] bg-slate-50 border-none focus:ring-4 focus:ring-blue-100 outline-none text-lg transition-all"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-auto pr-2 custom-scrollbar">
                {students
                  .filter(s => s.name.includes(studentSearch) || s.studentNumber.toString().includes(studentSearch))
                  .map(student => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`
                        p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center
                        ${selectedStudent?.id === student.id 
                          ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100' 
                          : 'border-slate-50 bg-white hover:bg-slate-50 hover:border-slate-200'}
                      `}
                    >
                      <span className="text-sm text-slate-400 mb-1">{student.studentNumber}번</span>
                      <span className="text-lg font-bold">{student.name}</span>
                    </button>
                  ))}
              </div>

              <div className="mt-12 flex justify-center">
                <button
                  disabled={!selectedStudent}
                  onClick={() => setStep('apply')}
                  className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-xl hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-20 shadow-xl"
                >
                  본인 확인 완료 <ChevronRight />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'apply' && (
            <motion.div
              layout
              key="apply"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="bg-slate-900 text-white p-8 rounded-[3rem] flex items-center justify-between">
                <div>
                  <p className="text-blue-400 font-bold mb-1 uppercase tracking-widest text-xs">APPLICATION PAGE</p>
                  <h2 className="text-3xl font-bold">{selectedStudent?.name} 학생, 환영합니다!</h2>
                </div>
                <Users size={48} className="opacity-20" />
              </div>

              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">1</span>
                    역할 지망 선택
                  </h3>
                  <p className="text-slate-500 font-medium">3가지를 골라주세요 ({preferences.length}/3)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roles.map(role => {
                    const prefIdx = preferences.indexOf(role.id);
                    const isSelected = prefIdx !== -1;
                    return (
                      <button
                        key={role.id}
                        onClick={() => togglePreference(role.id)}
                        className={`
                          relative p-8 rounded-[2.5rem] border-2 text-left transition-all overflow-hidden group
                          ${isSelected 
                            ? 'border-blue-500 bg-white shadow-xl shadow-blue-50 scale-[1.02] z-10' 
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'}
                        `}
                      >
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] uppercase font-bold rounded-full">
                              정원 {role.quota}명
                            </span>
                            {isSelected && (
                              <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg shadow-blue-200">
                                {prefIdx + 1}
                              </div>
                            )}
                          </div>
                          <h4 className="text-2xl font-bold mb-2">{role.name}</h4>
                          <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{role.description}</p>
                          
                          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
                            <Users size={14} />
                            현 경쟁률: <span className="text-slate-900">{role.applicantCount || 0}</span> / {role.quota}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-all" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-3 px-2">
                  <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">2</span>
                  지원 다짐 작성
                </h3>
                <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
                  <MessageSquare className="absolute right-8 top-8 text-slate-100" size={100} />
                  <textarea
                    value={commitment}
                    onChange={(e) => setCommitment(e.target.value)}
                    placeholder="이 역할을 잘 수행할 수 있는 이유와 다짐을 적어주세요. 선생님이 배정 시 참고합니다."
                    className="w-full h-40 bg-transparent relative z-10 text-lg outline-none resize-none placeholder:text-slate-300"
                  />
                </div>
              </section>

              <div className="flex justify-center pt-10 pb-20">
                <button
                  disabled={preferences.length < 3 || !commitment.trim() || isSubmitting}
                  onClick={handleSubmit}
                  className="px-16 py-6 bg-blue-600 text-white rounded-[2.5rem] font-bold text-2xl hover:bg-blue-700 transition-all flex items-center gap-4 disabled:opacity-20 shadow-2xl shadow-blue-200"
                >
                  {isSubmitting ? '신청 중...' : '신청서 제출하기'}
                  <Send size={24} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              layout
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-12 md:p-20 rounded-[4rem] shadow-2xl border border-slate-200 text-center space-y-8"
            >
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h2 className="text-4xl font-bold mb-4">신청 완료!</h2>
                <p className="text-slate-500 text-lg leading-relaxed">
                  {selectedStudent?.name} 학생의 소중한 신청서가 선생님께 전달되었습니다. <br />
                  선생님이 공정하게 배정을 완료하면 알려드릴게요!
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-[2rem] font-bold hover:bg-slate-800 transition-all"
              >
                메인 화면으로 돌아가기
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
