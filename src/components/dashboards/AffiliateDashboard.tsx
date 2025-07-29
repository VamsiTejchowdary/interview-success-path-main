import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  DollarSign,
  LogOut,
  BarChart3,
  CheckCircle,
  Clock,
  Star
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import OverviewTab from "./affiliate/OverviewTab";
import { getAffiliateCoupons } from "@/lib/admin";

interface AffiliateDashboardProps {
  onLogout: () => void;
}

const AffiliateDashboard = ({ onLogout }: AffiliateDashboardProps) => {
  const { user } = useAuth();
  const [affiliateId, setAffiliateId] = useState<string>("");
  const [stats, setStats] = useState({
    totalCouponsUsed: 0,
    activeUsers: 0,
    totalRevenue: 0
  });
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAffiliateData() {
      if (user?.email) {
        try {
          // Get affiliate ID
          const { data: affiliateData, error: affiliateError } = await supabase
            .from('affiliates')
            .select('affiliate_user_id')
            .eq('email', user.email)
            .single();

          if (affiliateError) {
            console.error('Error fetching affiliate data:', affiliateError);
            return;
          }

                      if (affiliateData?.affiliate_user_id) {
              setAffiliateId(affiliateData.affiliate_user_id);
              
              // Get coupon statistics and coupons list
              const [couponsData, affiliateCoupons] = await Promise.all([
                supabase
                  .from('coupons')
                  .select('no_of_coupon_used')
                  .eq('affiliate_user_id', affiliateData.affiliate_user_id),
                getAffiliateCoupons(affiliateData.affiliate_user_id)
              ]);

              if (couponsData.error) {
                console.error('Error fetching coupons:', couponsData.error);
              } else {
                const totalCouponsUsed = couponsData.data?.reduce((sum, coupon) => sum + (coupon.no_of_coupon_used || 0), 0) || 0;
                
                // Get active users (users who used this affiliate's coupons)
                const { data: couponUsages, error: usagesError } = await supabase
                  .from('coupon_usages')
                  .select(`
                    user_id,
                    coupon_id,
                    coupons!inner(affiliate_user_id)
                  `)
                  .eq('coupons.affiliate_user_id', affiliateData.affiliate_user_id);

                if (usagesError) {
                  console.error('Error fetching coupon usages:', usagesError);
                } else {
                  // Get unique user IDs from coupon usages
                  const userIds = [...new Set(couponUsages?.map(usage => usage.user_id) || [])];
                  
                  // Check user status for each user who used the affiliate's coupons
                  let activeUsers = 0;
                  if (userIds.length > 0) {
                    const { data: usersData, error: usersError } = await supabase
                      .from('users')
                      .select('user_id, status')
                      .in('user_id', userIds);

                    if (usersError) {
                      console.error('Error fetching users status:', usersError);
                    } else {
                      // Count only users with 'approved' status as active users
                      activeUsers = usersData?.filter(user => user.status === 'approved').length || 0;
                    }
                  }
                  
                  setStats({
                    totalCouponsUsed,
                    activeUsers,
                    totalRevenue: totalCouponsUsed * 30,
                  });
                }
              }

              // Set coupons list
              setCoupons(affiliateCoupons);
            }
        } catch (error) {
          console.error('Error in fetchAffiliateData:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchAffiliateData();
  }, [user?.email]);

  // Mock data for charts
  const weeklyPerformance = [
    { day: 'Mon', users: 5 },
    { day: 'Tue', users: 8 },
    { day: 'Wed', users: 12 },
    { day: 'Thu', users: 15 },
    { day: 'Fri', users: 18 },
    { day: 'Sat', users: 10 },
    { day: 'Sun', users: 7 },
  ];

  const monthlyTrend = [
    { month: 'Jan', revenue: 1200 },
    { month: 'Feb', revenue: 1800 },
    { month: 'Mar', revenue: 2400 },
    { month: 'Apr', revenue: 3000 },
    { month: 'May', revenue: 3600 },
    { month: 'Jun', revenue: 4200 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-green-200/50 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Affiliate Dashboard</h1>
            <p className="text-gray-600">Track your referrals and earnings</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={onLogout} className="bg-green-600 hover:bg-green-700 text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <span className="animate-spin w-8 h-8 text-green-600 mx-auto mb-4 block border-4 border-green-200 border-t-green-600 rounded-full"></span>
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white/60 backdrop-blur-xl border border-green-200/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">Analytics</TabsTrigger>
              <TabsTrigger value="coupons" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">Coupons</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab affiliateId={affiliateId} stats={stats} coupons={coupons} />
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Weekly Performance Chart */}
                <Card className="backdrop-blur-xl bg-white/60 border-green-200/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                      Weekly User Signups
                    </CardTitle>
                    <CardDescription>Number of users who signed up using your coupons</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={weeklyPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="users" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Monthly Revenue Trend */}
                <Card className="backdrop-blur-xl bg-white/60 border-green-200/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Monthly Revenue Trend
                    </CardTitle>
                    <CardDescription>Your monthly earnings from referrals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="coupons">
              <Card className="backdrop-blur-xl bg-white/60 border-green-200/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    Your Coupons
                  </CardTitle>
                  <CardDescription>Track your referral coupons and their usage</CardDescription>
                </CardHeader>
                <CardContent>
                  {coupons.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No coupons created yet</p>
                      <p className="text-sm text-gray-500">Contact admin to create coupons for you</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {coupons.map((coupon) => (
                        <div key={coupon.coupon_id} className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{coupon.code}</p>
                              <p className="text-sm text-gray-600">
                                Created: {new Date(coupon.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">{coupon.no_of_coupon_used}</p>
                            <p className="text-sm text-gray-500">times used</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AffiliateDashboard; 