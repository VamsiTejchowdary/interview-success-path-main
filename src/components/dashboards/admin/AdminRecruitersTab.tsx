import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users } from "lucide-react";

const AdminRecruitersTab = ({ recruiters, updating, handleRecruiterStatusUpdate }) => {
  // Function to get initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to get status badge styling
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
          <h2 className="text-xl font-semibold text-white">Agent Management</h2>
          <p className="text-sm text-slate-400">Manage agents accounts and permissions</p>
        </div>
        <div className="ml-auto bg-slate-800/50 px-3 py-1.5 rounded-lg">
          <span className="text-sm text-slate-300">{recruiters.length} agents</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800 overflow-hidden">
        {recruiters.length === 0 ? (
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
                      <Users className="w-4 h-4" />
                      User Details
                    </div>
                  </th>
                  <th className="text-left text-slate-200 font-semibold py-3 px-4">Email</th>
                  <th className="text-left text-slate-200 font-semibold py-3 px-4">Phone</th>
                  <th className="text-left text-slate-200 font-semibold py-3 px-4">Users</th>
                  <th className="text-left text-slate-200 font-semibold py-3 px-4">Status</th>
                  <th className="text-center text-slate-200 font-semibold py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recruiters.map((recruiter) => (
                  <tr
                    key={recruiter.recruiter_id}
                    className="border-b border-slate-800 bg-slate-900 hover:bg-slate-800/80 transition-colors duration-200 group text-slate-200"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {getInitials(recruiter.name)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {recruiter.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            ID: {recruiter.recruiter_id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-300">{recruiter.email || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-300">{recruiter.phone || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-300">{recruiter.user_count}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(recruiter.status)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {updating === recruiter.recruiter_id ? (
                        <div className="flex items-center justify-center gap-2 text-blue-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Updating...</span>
                        </div>
                      ) : (
                        <Select
                          value={recruiter.status}
                          onValueChange={(value) => handleRecruiterStatusUpdate(recruiter.recruiter_id, value)}
                        >
                          <SelectTrigger className="w-28 bg-slate-800 border-slate-700 text-slate-200 text-sm h-9 hover:bg-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                            <SelectItem value="approved" className="text-green-300 hover:bg-slate-800">Approved</SelectItem>
                            <SelectItem value="pending" className="text-yellow-300 hover:bg-slate-800">Pending</SelectItem>
                            <SelectItem value="rejected" className="text-red-300 hover:bg-slate-800">Rejected</SelectItem>
                            <SelectItem value="on_hold" className="text-slate-300 hover:bg-slate-800">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRecruitersTab;