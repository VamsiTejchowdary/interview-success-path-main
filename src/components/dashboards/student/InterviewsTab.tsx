import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const upcomingInterviews = [
  { company: 'TechCorp Solutions', position: 'Frontend Developer', date: 'Today', time: '2:00 PM', type: 'Technical' },
  { company: 'Innovation Labs', position: 'Full Stack Engineer', date: 'Tomorrow', time: '10:30 AM', type: 'HR Screening' },
  { company: 'StartupXYZ', position: 'React Developer', date: 'Friday', time: '3:00 PM', type: 'Culture Fit' },
];

const InterviewsTab = () => (
  <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg">
    <CardHeader>
      <CardTitle>Upcoming Interviews</CardTitle>
      <CardDescription className="text-gray-600">Your scheduled interviews and preparation status</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        {upcomingInterviews.map((interview, index) => (
          <div key={index} className="p-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">{interview.company}</h3>
                <p className="text-gray-600">{interview.position}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-800">{interview.date}</p>
                <p className="text-sm text-gray-600">{interview.time}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge 
                variant="outline" 
                className={`border-blue-300 text-blue-700 ${
                  interview.type === 'Technical' ? 'bg-blue-50' :
                  interview.type === 'HR Screening' ? 'bg-green-50' :
                  'bg-purple-50'
                }`}
              >
                {interview.type}
              </Badge>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                  Prep Materials
                </Button>
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                  Join Interview
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default InterviewsTab; 