import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  DollarSign,
  CheckCircle,
  Clock,
  Star,
  Target,
  Copy,
  Check
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface OverviewTabProps {
  affiliateId: string;
  stats: {
    totalCouponsUsed: number;
    activeUsers: number;
    totalRevenue: number;
  };
  coupons: Array<{
    coupon_id: string;
    code: string;
    no_of_coupon_used: number;
    created_at: string;
  }>;
}

const OverviewTab = ({ affiliateId, stats, coupons }: OverviewTabProps) => {
  const { user } = useAuth();
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const handleCopyCoupon = async (couponCode: string) => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopiedCoupon(couponCode);
      setTimeout(() => setCopiedCoupon(null), 2000);
    } catch (error) {
      console.error('Failed to copy coupon code:', error);
    }
  };

  return (
    <>
      {/* Welcome Section */}
      <Card className="backdrop-blur-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200/50 mb-8">
        <CardContent className="p-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {user?.first_name || 'Affiliate'}! 🎉</h2>
            <p className="text-gray-600 text-lg">Great job on your referrals! Keep up the amazing work! 🚀</p>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <Card className="backdrop-blur-xl bg-white/60 border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Coupons Used</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats.totalCouponsUsed}</div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/60 border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats.activeUsers}</div>
            <p className="text-xs text-blue-600">
              Approved users using your coupons
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/60 border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">${stats.totalRevenue}</div>
            <p className="text-xs text-emerald-600">
              From your referrals
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/60 border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Current Month Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
            ${ stats.activeUsers * 30}
            </div>
            <p className="text-xs text-purple-600">
              Monthly Revenue 
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <Card className="backdrop-blur-xl bg-white/60 border-green-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Performance Overview
            </CardTitle>
            <CardDescription>Your affiliate performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Coupon Usage</span>
                <span className="text-sm text-gray-500">{stats.totalCouponsUsed} used</span>
              </div>
              <Progress value={Math.min((stats.totalCouponsUsed / 100) * 100, 100)} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Active Users</span>
                <span className="text-sm text-gray-500">{stats.activeUsers} approved users</span>
              </div>
              <Progress value={Math.min((stats.activeUsers / 50) * 100, 100)} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Revenue Generated</span>
                <span className="text-sm text-gray-500">${stats.totalRevenue}</span>
              </div>
              <Progress value={Math.min((stats.totalRevenue / 10000) * 100, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/60 border-green-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-green-600" />
              Your Coupon Codes
            </CardTitle>
            <CardDescription>Copy and share your referral codes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {coupons.length === 0 ? (
              <div className="text-center py-6">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No coupons available</p>
                <p className="text-sm text-gray-500">Contact admin to create coupons for you</p>
              </div>
            ) : (
              coupons.map((coupon) => (
                <div key={coupon.coupon_id} className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{coupon.code}</p>
                      <p className="text-sm text-gray-600">
                        Used {coupon.no_of_coupon_used} times
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-300 text-green-700">
                      {coupon.no_of_coupon_used} uses
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyCoupon(coupon.code)}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      {copiedCoupon === coupon.code ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="backdrop-blur-xl bg-white/60 border-green-200/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest affiliate activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.totalCouponsUsed > 0 ? (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">New user signed up with your coupon</p>
                  <p className="text-sm text-gray-600">Just now</p>
                </div>
                <Badge variant="outline" className="border-green-300 text-green-700">+$200</Badge>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent activity</p>
                <p className="text-sm text-gray-500">Start sharing your referral link to see activity here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default OverviewTab; 