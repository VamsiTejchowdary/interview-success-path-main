import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, User, Plus, Loader2, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createEmailMarketer, updateEmailMarketerStatus, deleteEmailMarketer, type EmailMarketerData } from "@/lib/admin";

interface AdminEmailMarketersTabProps {
  emailMarketers: EmailMarketerData[];
  updating: string | null;
  handleEmailMarketerStatusUpdate: (emailMarketerId: string, status: 'pending' | 'approved' | 'rejected') => Promise<void>;
  loadData: () => Promise<void>;
}

const AdminEmailMarketersTab = ({ 
  emailMarketers, 
  updating, 
  handleEmailMarketerStatusUpdate,
  loadData 
}: AdminEmailMarketersTabProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in name and email",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      await createEmailMarketer(
        formData.email,
        formData.name,
        formData.phone || undefined
      );
      
      toast({
        title: "Success",
        description: `Email marketer invited! Send them the signup link.`,
      });
      
      setShowCreateDialog(false);
      setFormData({ name: '', email: '', phone: '' });
      await loadData();
    } catch (error) {
      console.error('Error creating email marketer:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create email marketer",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (emailMarketerId: string, name: string) => {
    if (!confirm(`Delete ${name}? This action cannot be undone.`)) return;

    try {
      await deleteEmailMarketer(emailMarketerId);
      toast({ title: "Success", description: "Email marketer deleted" });
      await loadData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500 text-white">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500 text-white">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Email Marketers</CardTitle>
            <CardDescription className="text-slate-400">
              Manage email marketer accounts
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Email Marketer
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-900/50 hover:bg-slate-900/50 border-slate-700">
                  <TableHead className="text-slate-300">Name</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Phone</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Created</TableHead>
                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailMarketers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                      No email marketers found
                    </TableCell>
                  </TableRow>
                ) : (
                  emailMarketers.map((marketer) => (
                    <TableRow key={marketer.email_marketer_id} className="border-slate-700 hover:bg-slate-800/30">
                      <TableCell className="text-white font-medium">{marketer.name}</TableCell>
                      <TableCell className="text-slate-300">{marketer.email}</TableCell>
                      <TableCell className="text-slate-300">{marketer.phone || '-'}</TableCell>
                      <TableCell>
                        {getStatusBadge(marketer.status)}
                        {marketer.status === 'pending' && (
                          <p className="text-xs text-amber-400 mt-1">Awaiting email verification</p>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(marketer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {marketer.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleEmailMarketerStatusUpdate(marketer.email_marketer_id, 'approved')}
                              disabled={updating === marketer.email_marketer_id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              title="Approve after email verification"
                            >
                              {updating === marketer.email_marketer_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Approve'
                              )}
                            </Button>
                          )}
                          {marketer.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => handleEmailMarketerStatusUpdate(marketer.email_marketer_id, 'rejected')}
                              disabled={updating === marketer.email_marketer_id}
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              {updating === marketer.email_marketer_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Suspend'
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(marketer.email_marketer_id, marketer.name)}
                            className="border-slate-600 text-slate-400 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Create Email Marketer Account</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new email marketer account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">
                Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300">
                Phone (Optional)
              </Label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300 font-medium mb-1">
                📧 Signup Required
              </p>
              <p className="text-xs text-slate-400 mt-2 mb-3">
                After creating, send the email marketer this signup link. They must sign up with the exact email address you entered.
              </p>
              <div className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700">
                <code className="text-xs text-blue-400 flex-1 overflow-x-auto">
                  {window.location.origin}/email-marketer/signup
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/email-marketer/signup`);
                    toast({ title: "Copied!", description: "Signup link copied to clipboard" });
                  }}
                  className="text-slate-400 hover:text-white h-6 px-2"
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !formData.name || !formData.email}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmailMarketersTab;
