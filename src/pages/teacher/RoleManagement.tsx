import React, { useState } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Gift, 
  Users, 
  AlertCircle,
  ClipboardList,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle,
  Save,
  X
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { Role } from '../../types';

export default function RoleManagement({ userId, roles }: { userId: string, roles: Role[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isBulkDeleteConfirm, setIsBulkDeleteConfirm] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [newRole, setNewRole] = useState<Partial<Role>>({
    name: '',
    quota: 1,
    description: '',
    reward: ''
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name || !newRole.quota) return;

    try {
      await addDoc(collection(db, `users/${userId}/roles`), {
        ...newRole,
        applicantCount: 0
      });
      setNewRole({ name: '', quota: 1, description: '', reward: '' });
      setIsAdding(false);
      setStatus({ type: 'success', message: '새 역할이 등록되었습니다.' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: '역할 등록 중 오류가 발생했습니다.' });
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkInput.trim()) return;
    setIsLoading(true);
    setStatus(null);

    // Robust CSV parser that handles quotes and newlines within quotes
    const parseCSV = (text: string) => {
      const rows = [];
      let currentRow: string[] = [];
      let currentField = "";
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          currentRow.push(currentField.trim());
          currentField = "";
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
          if (currentField || currentRow.length > 0) {
            currentRow.push(currentField.trim());
            rows.push(currentRow);
            currentRow = [];
            currentField = "";
          }
          if (char === '\r' && nextChar === '\n') i++;
        } else {
          currentField += char;
        }
      }
      
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
      }
      
      return rows;
    };

    try {
      const rows = parseCSV(bulkInput.trim());
      // Skip the first row (header) if there are multiple rows
      const dataRows = rows.length > 1 ? rows.slice(1) : rows;
      
      const batch = writeBatch(db);
      let count = 0;
      
      dataRows.forEach((row) => {
        const [name, quotaRaw, description, reward] = row;
        
        // Skip empty rows or rows without characters
        if (name && name.trim() && quotaRaw) {
          const quota = parseInt(quotaRaw);
          if (!isNaN(quota)) {
            const roleRef = doc(collection(db, `users/${userId}/roles`));
            batch.set(roleRef, {
              name: name.trim(),
              quota,
              description: (description || '').trim(),
              reward: (reward || '').trim(),
              applicantCount: 0
            });
            count++;
          }
        }
      });

      if (count > 0) {
        await batch.commit();
        setBulkInput('');
        setIsBulkMode(false);
        setStatus({ type: 'success', message: `${count}개의 역할이 성공적으로 등록되었습니다.` });
      } else {
        setStatus({ type: 'error', message: '올바른 형식의 데이터를 입력해주세요.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: '등록 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      let content = "";
      
      try {
        // Try decoding as UTF-8 first (fatal: true will throw on invalid sequences)
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        content = utf8Decoder.decode(buffer);
      } catch (err) {
        // Fallback to EUC-KR (Common for Korean Excel CSV files)
        const eucKrDecoder = new TextDecoder('euc-kr');
        content = eucKrDecoder.decode(buffer);
      }
      
      setBulkInput(content);
      setIsBulkMode(true);
      // Reset input value to allow same file re-upload
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const headers = '역할명,정원,상세내용,보상\n';
    const example = '칠판 도우미,2,수업 후 칠판을 깨끗이 닦아요,간식권 1매\n급식 도우미,3,급식 배차 및 정리를 도와요,급식 우선권';
    const csvContent = "\uFEFF" + headers + example;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', '역할_등록_양식.csv');
    link.click();
  };

  const deleteRole = async (id: string) => {
    try {
      await deleteDoc(doc(db, `users/${userId}/roles`, id));
      setStatus({ type: 'success', message: '역할이 삭제되었습니다.' });
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: '삭제 중 오류가 발생했습니다.' });
    }
  };

  const toggleRoleSelection = (id: string) => {
    if (isDeleteMode) {
      const newSelected = new Set(selectedRoleIds);
      if (newSelected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
      setSelectedRoleIds(newSelected);
    }
  };

  const handleSelectAll = () => {
    if (selectedRoleIds.size === roles.length) {
      setSelectedRoleIds(new Set());
    } else {
      setSelectedRoleIds(new Set(roles.map(r => r.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRoleIds.size === 0) return;

    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      selectedRoleIds.forEach(id => {
        batch.delete(doc(db, `users/${userId}/roles`, id));
      });
      await batch.commit();
      setSelectedRoleIds(new Set());
      setIsDeleteMode(false);
      setIsBulkDeleteConfirm(false);
      setStatus({ type: 'success', message: '선택한 역할들이 삭제되었습니다.' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: '일괄 삭제 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">1인 1역 설정</h1>
          <p className="text-slate-500 mt-1">학급 내에서 수행할 역할들을 정의하고 정원을 설정하세요.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDeleteMode ? (
            <>
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
              >
                {selectedRoleIds.size === roles.length ? '전체 해제' : '전체 선택'}
              </button>
              <button
                onClick={() => setIsBulkDeleteConfirm(true)}
                disabled={selectedRoleIds.size === 0 || isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all shadow-sm disabled:opacity-50"
              >
                <Trash2 size={18} />
                {selectedRoleIds.size}개 삭제 실행
              </button>
              <button
                onClick={() => { setIsDeleteMode(false); setSelectedRoleIds(new Set()); }}
                className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl font-medium"
              >
                취소
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsDeleteMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 font-medium rounded-xl hover:bg-red-50 transition-all border border-red-200"
              >
                <Trash2 size={18} />
                삭제
              </button>
              <div className="relative group">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all border border-slate-200"
                >
                  <Download size={18} />
                  양식 다운로드
                </button>
              </div>
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-xl hover:bg-blue-100 transition-all border border-blue-200 cursor-pointer">
                <Upload size={18} />
                일괄 등록
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-all shadow-sm"
              >
                <Plus size={20} />
                역할 추가
              </button>
            </>
          )}
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-xl flex items-center justify-between gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          <div className="flex items-center gap-3">
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <p className="font-medium text-sm">{status.message}</p>
          </div>
          <button onClick={() => setStatus(null)} className="opacity-50 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      {isBulkMode ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="mb-4 p-4 bg-blue-50 text-blue-800 rounded-2xl text-sm flex gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <p>
              엑셀에서 <strong>[역할명, 정원, 설명, 보상]</strong> 열을 복사해서 붙여넣거나 파일을 업로드하세요. <br />
              각 열은 콤마(,) 또는 탭(Tab)으로 구분되어야 합니다.
            </p>
          </div>
          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            className="w-full h-80 p-5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono"
            placeholder="칠판 도우미,2,칠판 닦기,사탕&#10;우유 당번,3,우유 배달,쿠폰"
          />
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => { setIsBulkMode(false); setBulkInput(''); }}
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
              {isLoading ? '등록 중...' : '역할 일괄 등록 완료'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isAdding && (
            <div className="bg-white p-6 rounded-3xl border-2 border-primary ring-4 ring-primary/5 transition-all">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">새 역할 만들기</h3>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">역할명</label>
                  <input
                    required
                    value={newRole.name}
                    onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="예: 칠판 도우미"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">정원 (명)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newRole.quota}
                    onChange={(e) => setNewRole({...newRole, quota: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">설명</label>
                  <textarea
                    value={newRole.description}
                    onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none h-24"
                    placeholder="무슨 일을 하나요?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">보상 (선택사항)</label>
                  <input
                    value={newRole.reward}
                    onChange={(e) => setNewRole({...newRole, reward: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="예: 간식권 1매"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 bg-primary text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-md shadow-blue-200"
                  >
                    저장
                  </button>
                </div>
              </form>
            </div>
          )}

          {roles.map((role) => (
            <div 
              key={role.id} 
              onClick={() => isDeleteMode && toggleRoleSelection(role.id)}
              className={`bg-white p-6 rounded-3xl shadow-sm border transition-all flex flex-col group relative ${isDeleteMode ? 'cursor-pointer hover:border-red-400' : 'border-slate-200'} ${selectedRoleIds.has(role.id) ? 'border-red-500 ring-2 ring-red-100 bg-red-50/10' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                  <Users size={12} />
                  정원 {role.quota}명
                </div>
                
                {isDeleteMode ? (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedRoleIds.has(role.id) ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-300 text-transparent'}`}>
                    <CheckCircle size={14} />
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(role.id); }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              <h3 className="text-xl font-bold mb-2">{role.name}</h3>
              <p className="text-slate-500 text-sm flex-1 line-clamp-3 mb-4 italic">
                {role.description || '작성된 설명이 없습니다.'}
              </p>

              {role.reward && (
                <div className="mb-4 p-3 bg-amber-50 rounded-xl flex items-center gap-2 text-amber-700 text-xs font-semibold">
                  <Gift size={16} />
                  <span>보상: {role.reward}</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1">
                  신청 인원: <span className="text-slate-900 font-bold">{role.applicantCount || 0}</span>명
                </span>
                <span className={`font-bold ${role.applicantCount > role.quota ? 'text-red-500' : 'text-emerald-500'}`}>
                  {role.applicantCount > role.quota ? '경합 중' : '여유'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {roles.length === 0 && !isAdding && !isBulkMode && (
        <div className="mt-12 text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <ClipboardList size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-600">아직 등록된 역할이 없습니다</h3>
          <p className="text-slate-400 mt-2">새 역할 추가 또는 일괄 등록을 통해 역할을 만들어보세요.</p>
        </div>
      )}

      {/* Confirmation Modals */}
      {(deleteConfirmId || isBulkDeleteConfirm) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setDeleteConfirmId(null); setIsBulkDeleteConfirm(false); }}></div>
          <div className="relative bg-white w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold mb-4">정말로 삭제하시겠습니까?</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              {isBulkDeleteConfirm 
                ? `선택한 ${selectedRoleIds.size}개의 역할을 모두 삭제합니다.` 
                : "이 역할을 삭제합니다."
              } <br />
              삭제된 데이터는 복구할 수 없으며, 신청 내역이 있는 학생의 데이터가 꼬일 수 있습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteConfirmId(null); setIsBulkDeleteConfirm(false); }}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                취소
              </button>
              <button
                onClick={() => isBulkDeleteConfirm ? handleBulkDelete() : deleteConfirmId && deleteRole(deleteConfirmId)}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
