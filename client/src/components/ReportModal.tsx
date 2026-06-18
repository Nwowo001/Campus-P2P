import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import API from '../services/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ 
  isOpen, 
  onClose, 
  reportedUserId, 
  reportedUserName 
}) => {
  const [reasonCategory, setReasonCategory] = useState('Fraud / Scam');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!additionalDetails.trim()) {
      setError('Please add details to support your report');
      return;
    }

    setSubmitting(true);
    setError('');

    const reason = `[${reasonCategory}] ${additionalDetails}`;

    try {
      const res = await API.post('/reports', { reportedUserId, reason });
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setAdditionalDetails('');
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl transition-all duration-300 transform scale-100 fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-850">
          <div className="flex items-center space-x-2 text-red-500">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Report User
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-850 dark:text-white">Report Submitted</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Thank you. The report has been sent to admins for review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/40">
                {error}
              </div>
            )}

            <div className="p-3 bg-slate-50 dark:bg-slate-950 text-xs rounded-xl border border-slate-100 dark:border-slate-850 text-slate-500 dark:text-slate-400">
              You are reporting <strong className="text-slate-700 dark:text-slate-200">{reportedUserName}</strong>. Reporting helps keep our campus safe. Please provide clear details.
            </div>

            {/* Reason Dropdown */}
            <div className="space-y-1">
              <label htmlFor="reason" className="text-sm font-semibold text-slate-700 dark:text-slate-350">
                Reason Category
              </label>
              <select
                id="reason"
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
              >
                <option value="Fraud / Scam">Fraud / Scam / Fake listing</option>
                <option value="Inappropriate behavior">Inappropriate behavior</option>
                <option value="Poor communication">Poor communication / No-show</option>
                <option value="Harassment">Harassment / Bullying</option>
                <option value="Damaged item">Item does not match description</option>
                <option value="Other">Other reason</option>
              </select>
            </div>

            {/* Details */}
            <div className="space-y-1">
              <label htmlFor="details" className="text-sm font-semibold text-slate-700 dark:text-slate-350">
                Additional Details
              </label>
              <textarea
                id="details"
                rows={3}
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Please describe exactly what happened (dates, agreements, item state, etc.)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="pt-2 flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-red-500/10 hover:shadow-lg transition-all"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
