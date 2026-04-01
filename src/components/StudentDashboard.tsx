import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Clock, FileText, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { User, Assignment, Submission } from '../types';
import AssignmentDo from './AssignmentDo';

interface StudentDashboardProps {
  user: User;
  showToast: (msg: string, type?: 'ok' | 'err' | 'info') => void;
}

export default function StudentDashboard({ user, showToast }: StudentDashboardProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [reviewSubmission, setReviewSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [assignRes, subRes] = await Promise.all([
        fetch('/api/student/assignments'),
        fetch('/api/student/submissions')
      ]);
      const assignData = await assignRes.json();
      const subData = await subRes.json();
      setAssignments(assignData);
      setSubmissions(subData);
    } catch (err) {
      showToast("Không thể tải dữ liệu", "err");
    } finally {
      setIsLoading(false);
    }
  };

  const getSubmission = (assignmentId: number) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  if (activeAssignment) {
    return (
      <AssignmentDo 
        assignment={activeAssignment} 
        submission={reviewSubmission || undefined}
        onClose={() => {
          setActiveAssignment(null);
          setReviewSubmission(null);
          fetchData();
        }} 
        showToast={showToast} 
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Chào em, {user.name}!</h2>
          <p className="text-slate-500 dark:text-slate-400">Hôm nay em muốn học gì nào?</p>
        </div>
        <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Học Sinh
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase mb-2">Bài tập đã giao</div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{assignments.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase mb-2">Đã hoàn thành</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{submissions.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase mb-2">Chưa làm</div>
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{assignments.length - submissions.length}</div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" />
        Danh sách bài tập
      </h3>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500">Đang tải bài tập...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-slate-500">Chưa có bài tập nào được giao.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(assignment => {
            const submission = getSubmission(assignment.id);
            return (
              <div 
                key={assignment.id}
                className={cn(
                  "bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border transition-all",
                  submission ? "border-emerald-100 dark:border-emerald-900/30" : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer"
                )}
                onClick={() => {
                  if (submission) {
                    setReviewSubmission(submission);
                    setActiveAssignment(assignment);
                  } else {
                    setActiveAssignment(assignment);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      submission ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                    )}>
                      {submission ? <CheckCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">{assignment.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Hạn: {assignment.due_date}
                        </span>
                        {submission && (
                          <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                            Điểm: {submission.score}/100
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!submission && (
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
