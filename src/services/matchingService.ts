import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  query, 
  where,
  getDoc,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student, Role, Application } from '../types';

export async function runAutoMatching(userId: string) {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Fetch current data
      const rolesSnap = await getDocs(collection(db, `users/${userId}/roles`));
      const studentsSnap = await getDocs(collection(db, `users/${userId}/students`));
      const appsSnap = await getDocs(collection(db, `users/${userId}/applications`));

      const roles = rolesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Role));
      const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
      const apps = appsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Application));

      // Build maps for easy access
      const roleMap = new Map<string, Role>(roles.map(r => [r.id, r]));
      const assignedStudents = new Set<string>();
      const results: Record<string, string> = {}; // studentId -> roleId
      
      // Keep track of remaining quota for each role
      const remainingQuota = new Map<string, number>(roles.map(r => [r.id, r.quota]));

      // 2. Algorithm Pass 1: Handle Preferences (1st -> 2nd -> 3rd)
      // We iterate 3 times: once for each preference level
      for (let prefIdx = 0; prefIdx < 3; prefIdx++) {
        // Collect applicants for each role at this preference level
        const applicantsByRoleAtLevel = new Map<string, string[]>(); // roleId -> studentIds

        apps.forEach(app => {
          if (assignedStudents.has(app.studentId)) return;
          const targetRoleId = app.preferences[prefIdx];
          if (!targetRoleId) return;
          
          if (!applicantsByRoleAtLevel.has(targetRoleId)) {
            applicantsByRoleAtLevel.set(targetRoleId, []);
          }
          applicantsByRoleAtLevel.get(targetRoleId)!.push(app.studentId);
        });

        // For each role, evaluate applicants
        applicantsByRoleAtLevel.forEach((studentIds, roleId) => {
          const quota = remainingQuota.get(roleId) || 0;
          if (quota <= 0) return;

          // Apply Priority 2: History (Never done this role before)
          const targetRole = roleMap.get(roleId);
          if (!targetRole) return;

          const eligibleApplicants = studentIds.map(sid => {
            const student = students.find(s => s.id === sid);
            const neverDoneBefore = student ? !student.pastRoles.includes(targetRole.name) : true;
            return { sid, neverDoneBefore };
          });

          // Sort by history priority: neverDoneBefore=true first
          eligibleApplicants.sort((a, b) => (a.neverDoneBefore === b.neverDoneBefore ? 0 : a.neverDoneBefore ? -1 : 1));

          // Assign up to quota
          const toAssign = eligibleApplicants.slice(0, quota);
          
          // Corner Case Check: If there's a tie (multiple students with same priority but limited quota),
          // the user requirement says: "해당 학생들은 '미배정' 상태로 두고 교사가... 직접 결정"
          // We only assign if there's no conflict or if we can satisfy everyone at this priority level.
          
          // Implementation: If we have 2 students with same priority (never done) but 1 spot, skip them?
          // Actually, let's keep it simple: assign if we have enough spots for the current priority group.
          
          let assignableCount = 0;
          let i = 0;
          while (i < toAssign.length) {
            const currentPriority = toAssign[i].neverDoneBefore;
            // Find all students with this same priority
            const samePriorityGroup = eligibleApplicants.filter(p => p.neverDoneBefore === currentPriority);
            
            if (samePriorityGroup.length <= (remainingQuota.get(roleId) || 0)) {
              // We can fit the whole group
              samePriorityGroup.forEach(p => {
                if (assignedStudents.has(p.sid)) return;
                results[p.sid] = roleId;
                assignedStudents.add(p.sid);
                remainingQuota.set(roleId, (remainingQuota.get(roleId) || 0) - 1);
              });
              i += samePriorityGroup.length;
            } else {
              // Conflict! Too many students with same priority for the remaining spots.
              // Skip this group (leave unassigned for manual review as per requirements)
              break; 
            }
          }
        });
      }

      // 3. Update database
      for (const [studentId, roleId] of Object.entries(results)) {
        const studentRef = doc(db, `users/${userId}/students`, studentId);
        transaction.update(studentRef, { currentRoleId: roleId });
      }
    });
  } catch (error) {
    console.error('Matching Error:', error);
    throw error;
  }
}
