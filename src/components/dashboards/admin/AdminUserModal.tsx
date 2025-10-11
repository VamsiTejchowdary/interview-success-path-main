import { useState } from "react";
import { Mail, Phone, FileText, Download } from "lucide-react";
import {
  updateUserPaid,
  updateUserNextBilling,
  updateUserSubscriptionFee,
} from "@/lib/admin";

const AdminUserModal = ({
  user,
  onClose,
  updating,
  handleUserStatusUpdate,
  handleAssignRecruiter,
  approvedRecruiters,
  loadData,
}) => {
  const [localPaid, setLocalPaid] = useState(user.is_paid ? "yes" : "no");
  const [localNextBilling, setLocalNextBilling] = useState(
    user.next_billing_at ? user.next_billing_at.slice(0, 10) : ""
  );
  const [localSubscriptionFee, setLocalSubscriptionFee] = useState(
    user.subscription_fee || 0
  );

  const isOverdue =
    user.next_billing_at && new Date(user.next_billing_at) < new Date();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-slate-900/90 rounded-xl shadow-xl overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="bg-slate-900/95 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
              {user.first_name?.[0]}
              {user.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-sm text-slate-400">User Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/80 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <div>
                <span className="text-sm text-slate-400 block">Email</span>
                <span className="text-white">{user.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-blue-400" />
              <div>
                <span className="text-sm text-slate-400 block">Phone</span>
                <span className="text-white">
                  {user.phone || (
                    <span className="italic text-slate-500">Not provided</span>
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <div className="flex-1">
                <span className="text-sm text-slate-400 block">Resume</span>
                {user.resume_url ? (
                  <a
                    href={user.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Resume</span>
                  </a>
                ) : (
                  <span className="italic text-slate-500">Not uploaded</span>
                )}
              </div>
            </div>
          </section>

          {/* Payment & Billing */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 bg-slate-800/80 rounded-lg p-4">
              <label className="text-sm font-medium text-slate-200">
                Payment Status
              </label>
              <select
                value={localPaid}
                onChange={async (e) => {
                  setLocalPaid(e.target.value);
                  await updateUserPaid(user.user_id, e.target.value === "yes");
                  loadData();
                }}
                className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  localPaid === "yes"
                    ? "bg-green-900/40 border-green-700 text-green-300"
                    : "bg-red-900/40 border-red-700 text-red-300"
                }`}
              >
                <option value="yes">Paid</option>
                <option value="no">Not Paid</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 bg-slate-800/80 rounded-lg p-4">
              <label className="text-sm font-medium text-slate-200">
                Next Billing Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={localNextBilling}
                  onChange={async (e) => {
                    setLocalNextBilling(e.target.value);
                    await updateUserNextBilling(user.user_id, e.target.value);
                    loadData();
                  }}
                  className="flex-1 px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  disabled={user.status !== "approved"}
                />
                {isOverdue && (
                  <div className="flex items-center gap-1 text-red-400">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-medium">Overdue</span>
                  </div>
                )}
              </div>
            </div>
            {/* Subscription Fee Field */}
            <div className="flex flex-col gap-2 bg-slate-800/80 rounded-lg p-4 col-span-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">
                Subscription Fee (₹)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={localSubscriptionFee}
                  onChange={(e) => setLocalSubscriptionFee(e.target.value)}
                  onBlur={async (e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value !== user.subscription_fee) {
                      await updateUserSubscriptionFee(user.user_id, value);
                      loadData();
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  disabled={user.status !== "approved"}
                />
                <span className="text-slate-400 text-sm">per month</span>
              </div>
            </div>
          </section>

          {/* Status & Recruiter */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 bg-slate-800/80 rounded-lg p-4">
              <label className="text-sm font-medium text-slate-200">
                Account Status
              </label>
              <select
                value={user.status}
                onChange={(e) =>
                  handleUserStatusUpdate(user.user_id, e.target.value)
                }
                className="w-full px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            {user.status === "approved" && (
              <div className="flex flex-col gap-2 bg-slate-800/80 rounded-lg p-4">
                <label className="text-sm font-medium text-slate-200">
                  Assigned Recruiter
                </label>
                <select
                  value={user.recruiter_id || "unassigned"}
                  onChange={(e) => {
                    if (e.target.value === "unassigned") {
                      handleUserStatusUpdate(user.user_id, "pending");
                    } else {
                      handleAssignRecruiter(user.user_id, e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="unassigned">Unassigned</option>
                  {approvedRecruiters?.map((r) => (
                    <option key={r.recruiter_id} value={r.recruiter_id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* Loading State */}
          {updating === user.user_id && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-blue-400">
                <svg
                  className="animate-spin w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-sm">Updating...</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-800 bg-slate-900/95">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserModal;
