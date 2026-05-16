import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { Layout, Users, GraduationCap, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithGoogle } from '../lib/firebase';

export default function LandingPage({ user }: { user: User | null }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        <div className="mb-8 inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl text-primary">
          <Layout size={40} />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 font-sans">
          우리 반 <span className="text-primary text-blue-600">1인 1역</span> 매니저
        </h1>
        
        <p className="text-lg text-slate-600 mb-12 max-w-2xl mx-auto">
          초등 학급의 역할을 공정하고 민주적으로 배정하세요. <br />
          지망 순위와 과거 이력을 분석하여 최적의 매칭을 제공합니다.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Teacher Card */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-left relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="mb-4 text-blue-500">
                <Users size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">선생님</h3>
              <p className="text-slate-500 mb-6">
                학급을 개설하고 학생 명단과 역할을 등록합니다. 자동 매칭을 통해 공정하게 배정하세요.
              </p>
              {user ? (
                <Link
                  to="/teacher/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                >
                  대시보드 이동 <ArrowRight size={18} />
                </Link>
              ) : (
                <Link
                  to="/teacher/auth"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                >
                  선생님 시작하기 <ArrowRight size={18} />
                </Link>
              )}
            </div>
            <div className="absolute -right-4 -bottom-4 text-slate-50 opacity-10">
              <Users size={120} />
            </div>
          </motion.div>

          {/* Student Card */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-left relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="mb-4 text-emerald-500">
                <GraduationCap size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">학생</h3>
              <p className="text-slate-500 mb-6">
                선생님께 받은 전용 링크로 접속하세요. 원하는 역할을 신청하고 지원 다짐을 작성합니다.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-400 rounded-xl font-medium cursor-not-allowed">
                전용 링크로 접속하세요
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 text-slate-50 opacity-10">
              <GraduationCap size={120} />
            </div>
          </motion.div>
        </div>
      </motion.div>

      <footer className="mt-20 text-slate-400 text-sm">
        © 2024 우리 반 1인 1역 매니저 | 초등 교실을 위한 스마트 배정 솔루션
      </footer>
    </div>
  );
}
