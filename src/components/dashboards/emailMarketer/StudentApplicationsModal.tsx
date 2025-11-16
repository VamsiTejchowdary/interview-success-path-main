import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Building2, Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  getStudentApplications, 
  unlinkContactFromApplication,
  type StudentWithApplications, 
  type ApplicationWithContacts 
} from "@/lib/emailMarketer";
import { getEmailMarketerSession } from "@/lib/emailMarketerAuth";

interface StudentApplicationsModalProps {
  student: StudentWithApplications;
  open: boolean;
  onClose: () => void;
  onUpdate: () => Promise<void>;
}

const StudentApplicationsModal = ({ student, open, onClose, onUpdate }: StudentApplicationsModalProps) => {
  const [applications, setApplications] = useState<ApplicationWithContacts[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingContact, setRemovingContact] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadApplications();
    }
  }, [open, student.user_id]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await getStudentApplications(student.user_id);
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveContact = async (applicationId: string, contactId: string) => {
    if (!confirm("Remove this contact from the application?")) return;

    try {
      setRemovingContact(contactId);
      await unlinkContactFromApplication(applicationId, contactId);
      toast({ title: "Success", description: "Contact removed" });
      await loadApplications();
      await onUpdate();
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove contact", variant: "destructive" });
    } finally {
      setRemovingContact(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>{student.first_name} {student.last_name}</span>
              <p className="text-sm text-slate-400 font-normal mt-1">{student.email}</p>
            </div>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Manage email outreach for this student's applications
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No applications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.application_id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Building2 className="w-5 h-5 text-purple-400" />
                          <h3 className="text-lg font-semibold text-white">{app.company_name || 'Unknown'}</h3>
                          <Badge className="bg-blue-500/20 text-blue-400">{app.status}</Badge>
                        </div>
                        <p className="text-slate-300 font-medium mb-2">{app.job_title}</p>
                        <p className="text-sm text-slate-400">Applied: {new Date(app.applied_at).toLocaleDateString()}</p>
                      </div>
                      
                      <Button
                        onClick={() => alert('Add contact feature - implement ContactFormDialog')}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contact
                      </Button>
                    </div>

                    {app.contacts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-300 mb-3">
                          Email Contacts ({app.contacts.length})
                        </h4>
                        <div className="space-y-2">
                          {app.contacts.map((contact) => (
                            <div
                              key={contact.contact_id}
                              className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700"
                            >
                              <div>
                                <p className="text-white font-medium">{contact.email}</p>
                                {contact.role && <p className="text-xs text-slate-400">{contact.role}</p>}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveContact(app.application_id, contact.contact_id)}
                                disabled={removingContact === contact.contact_id}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                {removingContact === contact.contact_id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default StudentApplicationsModal;
