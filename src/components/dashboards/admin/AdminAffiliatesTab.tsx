import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Users, Plus, CreditCard } from "lucide-react";
import { useState } from "react";

const AdminAffiliatesTab = ({ affiliates, updating, handleAffiliateStatusUpdate, handleCreateCoupon }) => {
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [showCouponDialog, setShowCouponDialog] = useState(false);

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
        <div className="p-2 bg-green-500/10 rounded-lg">
          <Users className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Affiliate Management</h2>
          <p className="text-sm text-slate-400">Manage affiliate accounts and track their referrals</p>
        </div>
        <div className="ml-auto bg-slate-800/50 px-3 py-1.5 rounded-lg">
          <span className="text-sm text-slate-300">{affiliates.length} affiliates</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800 overflow-hidden">
        {affiliates.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-800/60 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No affiliates found</h3>
            <p className="text-slate-500">Affiliates will appear here once they register</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90">
                  <th className="text-left text-slate-200 font-semibold py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Affiliate Details
                    </div>
                  </th>
                  <th className="text-left text-slate-200 font-semibold py-3 px-4">Email</th>
                  <th className="text-left text-slate-200 font-semibold py-3 px-4">Phone</th>
                  <th className="text-left text-slate-200 font-semibold py-3 px-4">Users Enrolled</th>
                                      <th className="text-left text-slate-200 font-semibold py-3 px-4">Status</th>
                    <th className="text-center text-slate-200 font-semibold py-3 px-4">Actions</th>
                    <th className="text-center text-slate-200 font-semibold py-3 px-4">Coupons</th>
                  </tr>
                </thead>
              <tbody>
                {affiliates.map((affiliate) => (
                  <tr
                    key={affiliate.affiliate_user_id}
                    className="border-b border-slate-800 bg-slate-900 hover:bg-slate-800/80 transition-colors duration-200 group text-slate-200"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {getInitials(affiliate.name)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {affiliate.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            ID: {affiliate.affiliate_user_id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-300">{affiliate.email || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-300">{affiliate.phone || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-300">{affiliate.user_count}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(affiliate.status)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {updating === affiliate.affiliate_user_id ? (
                        <div className="flex items-center justify-center gap-2 text-green-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Updating...</span>
                        </div>
                      ) : (
                        <Select
                          value={affiliate.status}
                          onValueChange={(value) => handleAffiliateStatusUpdate(affiliate.affiliate_user_id, value)}
                        >
                          <SelectTrigger className="w-28 bg-slate-800 border-slate-700 text-slate-200 text-sm h-9 hover:bg-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                            <SelectItem value="approved" className="text-green-300 hover:bg-slate-800">Approved</SelectItem>
                            <SelectItem value="pending" className="text-yellow-300 hover:bg-slate-800">Pending</SelectItem>
                            <SelectItem value="rejected" className="text-red-300 hover:bg-slate-800">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {affiliate.status === 'approved' ? (
                        <Dialog open={showCouponDialog && selectedAffiliate?.affiliate_user_id === affiliate.affiliate_user_id} onOpenChange={(open) => {
                          if (!open) {
                            setShowCouponDialog(false);
                            setSelectedAffiliate(null);
                            setCouponCode('');
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-600/10 border-green-600/30 text-green-400 hover:bg-green-600/20"
                              onClick={() => {
                                setSelectedAffiliate(affiliate);
                                setShowCouponDialog(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Create Coupon
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-slate-900 border-slate-700 text-slate-200">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-green-400" />
                                Create Coupon for {selectedAffiliate?.name}
                              </DialogTitle>
                              <DialogDescription className="text-slate-400">
                                Enter a unique coupon code for this affiliate
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-300 mb-2 block">
                                  Coupon Code
                                </label>
                                <Input
                                  value={couponCode}
                                  onChange={(e) => setCouponCode(e.target.value)}
                                  placeholder="Enter coupon code (e.g., AFFILIATE10)"
                                  className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowCouponDialog(false);
                                  setSelectedAffiliate(null);
                                  setCouponCode('');
                                }}
                                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={async () => {
                                  if (!couponCode.trim()) return;
                                  setIsCreatingCoupon(true);
                                  try {
                                    await handleCreateCoupon(selectedAffiliate.affiliate_user_id, couponCode.trim());
                                    setShowCouponDialog(false);
                                    setSelectedAffiliate(null);
                                    setCouponCode('');
                                  } catch (error) {
                                    console.error('Error creating coupon:', error);
                                  } finally {
                                    setIsCreatingCoupon(false);
                                  }
                                }}
                                disabled={!couponCode.trim() || isCreatingCoupon}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {isCreatingCoupon ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                  </>
                                ) : (
                                  'Create Coupon'
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-sm text-slate-500">Approve first</span>
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

export default AdminAffiliatesTab; 