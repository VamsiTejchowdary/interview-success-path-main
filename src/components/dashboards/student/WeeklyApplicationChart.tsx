import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface WeeklyData {
  day: string;
  applications: number;
  date: string;
  fullDate: string;
  dayNumber: number;
  displayLabel: string;
}

export default function WeeklyApplicationChart() {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  // Get start and end of week for a given date
  const getWeekBounds = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  };

  // Generate 7 days data structure with enhanced date info
  const generateWeekDays = (weekStart: Date): WeeklyData[] => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      
      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        applications: 0,
        date: date.toISOString().split('T')[0],
        fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayNumber: date.getDate(),
        displayLabel: `${date.toLocaleDateString('en-US', { weekday: 'short' })}\n(${date.getDate()})`
      });
    }
    return days;
  };

  // Fetch applications for the selected week
  const fetchWeeklyData = async (weekStart: Date) => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      // Get user_id
      const { data: userData } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', user.email)
        .single();
      
      if (!userData?.user_id) {
        setWeeklyData(generateWeekDays(weekStart));
        setLoading(false);
        return;
      }

      const { start, end } = getWeekBounds(weekStart);
      
      // Fetch applications for the week
      const { data: applications } = await supabase
        .from('job_applications')
        .select('applied_at')
        .eq('user_id', userData.user_id)
        .gte('applied_at', start.toISOString())
        .lte('applied_at', end.toISOString());

      // Generate week structure
      const weekDays = generateWeekDays(start);
      
      // Count applications per day
      if (applications) {
        applications.forEach(app => {
          const appDate = new Date(app.applied_at).toISOString().split('T')[0];
          const dayIndex = weekDays.findIndex(day => day.date === appDate);
          if (dayIndex !== -1) {
            weekDays[dayIndex].applications += 1;
          }
        });
      }
      
      setWeeklyData(weekDays);
    } catch (error) {
      console.error('Error fetching weekly data:', error);
      setWeeklyData(generateWeekDays(weekStart));
    } finally {
      setLoading(false);
    }
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() - 7);
    setSelectedWeek(newWeek);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() + 7);
    setSelectedWeek(newWeek);
  };

  // Go to current week
  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  useEffect(() => {
    fetchWeeklyData(selectedWeek);
  }, [selectedWeek, user?.email]);

  const { start } = getWeekBounds(selectedWeek);
  const weekLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <Card className="w-full backdrop-blur-xl bg-gradient-to-br from-white/80 to-white/60 border-white/30 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-purple-50/80 to-blue-50/80 border-b border-white/20">
        <div className="flex flex-col space-y-4">
          {/* Title Section */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                Weekly Application Progress
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm font-medium">
                Your job application activity over time
              </CardDescription>
            </div>
          </div>
          
          {/* Week Navigation - Enhanced Mobile Design */}
          <div className="flex items-center justify-between bg-white/60 rounded-2xl p-3 border border-white/40 shadow-sm">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              className="h-10 w-10 p-0 rounded-xl border-purple-200/60 text-purple-600 hover:bg-purple-50 hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white/70"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex-1 text-center px-2 sm:px-4">
              <div className="text-sm sm:text-base font-bold text-gray-800 mb-1">
                {weekLabel}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToCurrentWeek}
                className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50/80 h-6 px-3 rounded-lg transition-all duration-200 font-medium"
              >
                This Week
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              className="h-10 w-10 p-0 rounded-xl border-purple-200/60 text-purple-600 hover:bg-purple-50 hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white/70"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-[320px] sm:h-[370px]">
            <div className="text-center space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg inline-block">
                <Loader2 className="animate-spin w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-gray-700 font-semibold">Loading weekly data...</p>
                <p className="text-sm text-gray-500">Just a moment</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[320px] sm:h-[370px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={weeklyData} 
                margin={{ 
                  top: 20, 
                  right: 10, 
                  left: -10, 
                  bottom: 40 
                }}
              >
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.8}/>
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <CartesianGrid 
                  strokeDasharray="2 4" 
                  stroke="#e0e7ff" 
                  strokeOpacity={0.6}
                  horizontal={true}
                  vertical={false}
                />
                
                <XAxis 
                  dataKey="day" 
                  stroke="#6b7280"
                  tick={{ 
                    fontSize: 12, 
                    fill: '#6b7280', 
                    fontWeight: 600 
                  }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={20}
                  height={60}
                />
                
                <YAxis 
                  stroke="#6b7280"
                  tick={{ 
                    fontSize: 12, 
                    fill: '#6b7280', 
                    fontWeight: 600 
                  }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tickMargin={12}
                />
                
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.96)', 
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25), 0 0 0 1px rgb(255 255 255 / 0.8)',
                    fontSize: '13px',
                    fontWeight: '500',
                    padding: '16px 20px',
                    backdropFilter: 'blur(20px)'
                  }}
                  labelStyle={{ 
                    fontWeight: 'bold', 
                    color: '#374151',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}
                  formatter={(value: number) => [
                    <span key="value" className="text-purple-600 font-bold text-lg">{value}</span>, 
                    <span key="label" className="text-gray-600 ml-1 font-medium">applications</span>
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0] && payload[0].payload) {
                      const data = payload[0].payload;
                      return `${data.day}, ${data.fullDate}`;
                    }
                    return label;
                  }}
                  cursor={{ 
                    stroke: '#8b5cf6', 
                    strokeWidth: 2, 
                    strokeOpacity: 0.3,
                    strokeDasharray: '5 5'
                  }}
                />
                
                <Line 
                  type="monotone" 
                  dataKey="applications" 
                  stroke="url(#lineGradient)"
                  strokeWidth={4} 
                  dot={{ 
                    fill: '#ffffff', 
                    strokeWidth: 4, 
                    r: 6,
                    stroke: '#8b5cf6',
                    filter: 'url(#glow)',
                    style: { cursor: 'pointer' }
                  }}
                  activeDot={{ 
                    r: 8, 
                    stroke: '#8b5cf6', 
                    strokeWidth: 4,
                    fill: '#ffffff',
                    filter: 'url(#glow)',
                    style: { cursor: 'pointer' }
                  }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}