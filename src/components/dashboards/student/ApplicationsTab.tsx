import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, Upload, CheckCircle, TrendingUp } from "lucide-react";

const agentNotes = [
  { date: '2 days ago', note: 'Updated your resume with new project experience. Focus on React skills for upcoming interviews.' },
  { date: '5 days ago', note: 'Applied to 8 new positions this week. Great momentum! Keep practicing system design.' },
  { date: '1 week ago', note: 'Excellent interview feedback from TechCorp. They want to move to final round!' },
];

const ApplicationsTab = () => (
  <div className="grid lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2">
      <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle>Agent Notes & Updates</CardTitle>
          <CardDescription className="text-gray-600">Recent updates from your assigned agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agentNotes.map((note, index) => (
              <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200/50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800">{note.note}</p>
                    <p className="text-sm text-gray-500 mt-2">{note.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    <div>
      <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg mb-6">
        <CardHeader>
          <CardTitle>Your Agent</CardTitle>
          <CardDescription className="text-gray-600">Your dedicated career consultant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
              SC
            </div>
            <h3 className="font-semibold text-gray-800">Sarah Chen</h3>
            <p className="text-sm text-gray-600 mb-4">Senior Career Agent</p>
            <div className="flex justify-center mb-4">
              {[1,2,3,4,5].map((star) => (
                <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat with Agent
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription className="text-gray-600">Manage your profile and uploads</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start bg-blue-500 hover:bg-blue-600 text-white">
            <Upload className="w-4 h-4 mr-2" />
            Upload New Resume
          </Button>
          <Button className="w-full justify-start bg-green-500 hover:bg-green-600 text-white">
            <CheckCircle className="w-4 h-4 mr-2" />
            Update Preferences
          </Button>
          <Button className="w-full justify-start bg-purple-500 hover:bg-purple-600 text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default ApplicationsTab; 