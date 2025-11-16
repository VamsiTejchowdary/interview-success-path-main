import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Building2, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// @ts-ignore - TypeScript cache issue
import ActiveStudentsTab from "./emailMarketer/ActiveStudentsTab";
// @ts-ignore - TypeScript cache issue
import CompanyContactsTab from "./emailMarketer/CompanyContactsTab";
import {
  getActiveStudents,
  getAllCompanyContacts,
  type StudentWithApplications,
  type CompanyContactData,
} from "@/lib/emailMarketer";
import { isEmailMarketerLoggedIn } from "@/lib/emailMarketerAuth";

interface EmailMarketerDashboardProps {
  onLogout: () => void;
}

const EmailMarketerDashboard = ({ onLogout }: EmailMarketerDashboardProps) => {
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState<StudentWithApplications[]>([]);
  const [contacts, setContacts] = useState<CompanyContactData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isEmailMarketerLoggedIn()) {
      window.location.href = '/';
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, contactsData] = await Promise.all([
        getActiveStudents(),
        getAllCompanyContacts(),
      ]);

      setStudents(studentsData);
      setContacts(contactsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-slate-200 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">
                  Email Marketer Dashboard
                </h1>
              </div>
              <p className="text-slate-300 text-sm ml-13">
                Manage student outreach and company contacts
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-xs text-slate-400">Active Students</p>
                    <p className="text-lg font-bold text-white">
                      {students.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="text-xs text-slate-400">Total Contacts</p>
                    <p className="text-lg font-bold text-white">
                      {contacts.length}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={onLogout}
                className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-slate-800/50 border border-slate-700 p-1 inline-flex rounded-xl">
            <TabsTrigger
              value="students"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300 hover:text-white transition-colors rounded-lg px-6"
            >
              <Users className="w-4 h-4 mr-2" />
              Active Students
            </TabsTrigger>
            <TabsTrigger
              value="contacts"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300 hover:text-white transition-colors rounded-lg px-6"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Company Contacts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-6">
            <ActiveStudentsTab students={students} loadData={loadData} />
          </TabsContent>

          <TabsContent value="contacts" className="mt-6">
            <CompanyContactsTab contacts={contacts} loadData={loadData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmailMarketerDashboard;
