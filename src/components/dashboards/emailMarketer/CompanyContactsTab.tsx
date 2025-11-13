import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Building2, Mail, User, Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteCompanyContact, type CompanyContactData } from "@/lib/emailMarketer";

interface CompanyContactsTabProps {
  contacts: CompanyContactData[];
  loadData: () => Promise<void>;
}

const CompanyContactsTab = ({ contacts, loadData }: CompanyContactsTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase();
    return (
      contact.email.toLowerCase().includes(query) ||
      contact.company_name?.toLowerCase().includes(query) ||
      contact.role?.toLowerCase().includes(query)
    );
  });

  const handleDelete = async (contactId: string, email: string) => {
    if (!confirm(`Delete ${email}? This will remove it from all applications.`)) return;

    try {
      setDeleting(contactId);
      await deleteCompanyContact(contactId);
      toast({ title: "Success", description: "Contact deleted" });
      await loadData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete contact", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-white text-2xl">Company Contacts</CardTitle>
            <CardDescription className="text-slate-400">
              Manage your database of company contacts
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by company, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
              />
            </div>
            
            <Button
              onClick={() => alert('Add contact feature - implement dialog')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">
              {searchQuery ? "No contacts found" : "No contacts yet"}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-900/50 hover:bg-slate-900/50 border-slate-700">
                  <TableHead className="text-slate-300">Company</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Role</TableHead>
                  <TableHead className="text-slate-300">Added</TableHead>
                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.contact_id} className="border-slate-700 hover:bg-slate-800/30">
                    <TableCell className="text-white font-medium">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        <span>{contact.company_name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span>{contact.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {contact.role ? (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span>{contact.role}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(contact.contact_id, contact.email)}
                        disabled={deleting === contact.contact_id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        {deleting === contact.contact_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompanyContactsTab;
