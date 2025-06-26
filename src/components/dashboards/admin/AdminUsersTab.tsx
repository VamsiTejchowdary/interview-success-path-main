import { useState } from "react";
import { Users, Mail, Phone, UserCheck, Eye } from "lucide-react";
import AdminUserModal from "./AdminUserModal";

const AdminUsersTab = ({ users, updating, handleUserStatusUpdate, handleAssignRecruiter, approvedRecruiters, loadData }) => {
  const [selectedUser, setSelectedUser] = useState(null);

  const getStatusBadge = (status) => {
    const statusStyles = {
      approved: "bg-green-900/40 text-green-300 border-green-700",
      pending: "bg-yellow-900/40 text-yellow-300 border-yellow-700",
      rejected: "bg-red-900/40 text-red-300 border-red-700",
      on_hold: "bg-slate-800/80 text-slate-300 border-slate-700"
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[status?.toLowerCase()] || "bg-slate-800/80 text-slate-300 border-slate-700"}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </span>
    );
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 min-h-[80vh] rounded-2xl p-6 text-slate-200">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Users className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">User Management</h2>
          <p className="text-sm text-slate-400">Manage user accounts and permissions</p>
        </div>
        <div className="ml-auto bg-slate-800/50 px-3 py-1.5 rounded-lg">
          <span className="text-sm text-slate-300">{users.length} users</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800 overflow-hidden">
        {users.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-800/60 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No users found</h3>
            <p className="text-slate-500">Users will appear here once they register</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90">
                  <th className="text-left text-slate-200 font-semibold py-3 px-4">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      User Details
                    </div>
                  </th>
                  <th className="text-left text-slate-200 font-semibold py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Contact
                    </div>
                  </th>
                  <th className="text-left text-slate-200 font-semibold py-3 px-4">Status</th>
                  <th className="text-center text-slate-200 font-semibold py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isOverdue = user.status === 'approved' && user.next_billing_at && new Date(user.next_billing_at) < new Date();
                  return (
                    <tr
                      key={user.user_id}
                      className="border-b border-slate-800 bg-slate-900 hover:bg-slate-800/80 transition-colors duration-200 group text-slate-200"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-xs text-slate-400">
                              ID: {user.user_id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Mail className="w-4 h-4 text-slate-500" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Phone className="w-4 h-4 text-slate-500" />
                            <span className="text-sm">{user.phone || 'Not provided'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(user.status)}
                          {isOverdue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 text-xs font-semibold border border-red-700 ml-2 animate-pulse">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center">
                          <button
                            className="inline-flex items-center justify-center w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg transition-all duration-200 group-hover:bg-blue-500/10 group-hover:border-blue-500/30"
                            onClick={() => setSelectedUser(user)}
                            aria-label="View user details"
                          >
                            <Eye className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedUser && (
        <AdminUserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          updating={updating}
          handleUserStatusUpdate={handleUserStatusUpdate}
          handleAssignRecruiter={handleAssignRecruiter}
          approvedRecruiters={approvedRecruiters}
          loadData={loadData}
        />
      )}
    </div>
  );
};

export default AdminUsersTab;