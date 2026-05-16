import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  auth,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInWithGoogle,
  updateProfile
} from '../lib/firebase';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AuthMode = 'login' | 'signup' | 'reset';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        navigate('/teacher/dashboard');
      } else if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/teacher/dashboard');
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setMessage('비밀번호 재설정 이메일이 발송되었습니다.');
        setMode('login');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('이미 사용 중인 이메일입니다.');
      else if (err.code === 'auth/wrong-password') setError('비밀번호가 일치하지 않습니다.');
      else if (err.code === 'auth/user-not-found') setError('등록되지 않은 사용자입니다.');
      else setError('인증 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/teacher/dashboard');
    } catch (err) {
      setError('구글 로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200"
      >
        <button 
          onClick={() => navigate('/')} 
          className="mb-6 p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeft size={16} /> 메인으로
        </button>

        <h1 className="text-3xl font-bold mb-2">
          {mode === 'login' && '선생님 로그인'}
          {mode === 'signup' && '교사 회원가입'}
          {mode === 'reset' && '비밀번호 찾기'}
        </h1>
        <p className="text-slate-500 mb-8">
          {mode === 'login' && '학급을 관리하기 위해 로그인하세요.'}
          {mode === 'signup' && '새로운 학급을 시작해보세요.'}
          {mode === 'reset' && '등록하신 이메일로 링크를 보내드립니다.'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-medium text-slate-700 mb-1 ml-1">이름</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="홍길동"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 ml-1">이메일</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                placeholder="teacher@example.com"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 ml-1">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm flex gap-3">
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {message && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm flex gap-3">
              <CheckCircle size={18} className="shrink-0" />
              <p>{message}</p>
            </div>
          )}

          <button
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading ? '처리 중...' : (
              <>
                {mode === 'login' && '로그인'}
                {mode === 'signup' && '가입하기'}
                {mode === 'reset' && '메일 보내기'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 space-y-4">
          {mode === 'login' && (
            <>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">또는</span></div>
              </div>
              <button
                onClick={socialLogin}
                className="w-full py-3.5 px-4 rounded-2xl border border-slate-200 font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="google" />
                Google로 로그인
              </button>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 px-1">
                <button onClick={() => setMode('signup')} className="hover:text-blue-600 transition-colors">새로운 계정 만들기</button>
                <button onClick={() => setMode('reset')} className="hover:text-blue-600 transition-colors">비밀번호를 잊으셨나요?</button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <p className="text-center text-xs font-semibold text-slate-500">
              이미 계정이 있으신가요? <button onClick={() => setMode('login')} className="text-blue-600 hover:underline">로그인하기</button>
            </p>
          )}

          {mode === 'reset' && (
            <p className="text-center text-xs font-semibold text-slate-500">
              <button onClick={() => setMode('login')} className="text-blue-600 hover:underline">로그인 화면으로 돌아가기</button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
