import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Mail, User, Plus, Loader2, ChevronRight, ChevronDown, AlertCircle, Search, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getCompaniesWithContacts,
  searchCompanies,
  checkCompanyExists,
  createCompany,
  createCompanyContact,
  updateCompanyContact,
  type CompanyWithContacts,
  type CompanyContactData,
} from "@/lib/emailMarketer";

interface CompanyContactsTabProps {
  contacts: any[];
  loadData: () => Promise<void>;
}

const CompanyContactsTab = ({ loadData }: CompanyContactsTabProps) => {
  const [companies, setCompanies] = useState<CompanyWithContacts[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyWithContacts[]>([]);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Add Contact Dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companySearchResults, setCompanySearchResults] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [showCompanyConfirm, setShowCompanyConfirm] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [creating, setCreating] = useState(false);
  const [searchingCompanies, setSearchingCompanies] = useState(false);
  
  // Edit Contact Dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<CompanyContactData | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [updating, setUpdating] = useState(false);
  
  const { toast } = useToast();
  const pageSize = 10;

  useEffect(() => {
    loadCompanies();
  }, [currentPage]);

  useEffect(() => {
    // Filter companies based on search query
    if (!searchQuery.trim()) {
      setFilteredCompanies(companies);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = companies.filter(company => {
      // Search in company name
      if (company.company_name.toLowerCase().includes(query)) {
        return true;
      }
      // Search in contact emails and roles
      return company.contacts.some(contact => 
        contact.email.toLowerCase().includes(query) ||
        contact.role?.toLowerCase().includes(query)
      );
    });
    setFilteredCompanies(filtered);
  }, [searchQuery, companies]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const result = await getCompaniesWithContacts(currentPage, pageSize);
      setCompanies(result.companies);
      setFilteredCompanies(result.companies);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      console.error("Error loading companies:", error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCompany = (companyId: string) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  const handleCompanySearch = async (query: string) => {
    setCompanySearchQuery(query);
    setSelectedCompany(null);
    
    if (!query || query.trim().length < 2) {
      setCompanySearchResults([]);
      return;
    }

    try {
      setSearchingCompanies(true);
      const results = await searchCompanies(query);
      setCompanySearchResults(results);
    } catch (error) {
      console.error("Error searching companies:", error);
    } finally {
      setSearchingCompanies(false);
    }
  };

  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company);
    setCompanySearchQuery(company.company_name);
    setCompanySearchResults([]);
  };

  const handleCreateNewCompany = async () => {
    if (!companySearchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a company name",
        variant: "destructive",
      });
      return;
    }

    // Check if company already exists (case-insensitive)
    try {
      const existing = await checkCompanyExists(companySearchQuery);
      if (existing) {
        toast({
          title: "Company Exists",
          description: `"${existing.company_name}" already exists. Please select it from the list.`,
          variant: "destructive",
        });
        setSelectedCompany(existing);
        setCompanySearchQuery(existing.company_name);
        setShowCompanyConfirm(false);
        return;
      }

      // Create new company
      setCreating(true);
      const newCompany = await createCompany(companySearchQuery);
      setSelectedCompany(newCompany);
      setCompanySearchQuery(newCompany.company_name);
      setShowCompanyConfirm(false);
      
      toast({
        title: "Success",
        description: `Company "${newCompany.company_name}" created`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create company",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAddContact = async () => {
    if (!selectedCompany) {
      setShowCompanyConfirm(true);
      return;
    }

    if (!contactEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      await createCompanyContact(
        selectedCompany.company_id,
        contactEmail,
        contactRole || undefined
      );

      toast({
        title: "Success",
        description: "Contact added successfully",
      });

      // Reset form
      setShowAddDialog(false);
      setCompanySearchQuery("");
      setSelectedCompany(null);
      setContactEmail("");
      setContactRole("");
      setCompanySearchResults([]);

      // Reload data
      await loadCompanies();
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add contact",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditContact = (contact: CompanyContactData, companyName: string) => {
    // Add company name to contact object
    const contactWithCompany = {
      ...contact,
      company_name: companyName
    };
    setEditingContact(contactWithCompany);
    setEditEmail(contact.email);
    setEditRole(contact.role || "");
    setShowEditDialog(true);
  };

  const handleUpdateContact = async () => {
    if (!editingContact) return;

    if (!editEmail.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);
      await updateCompanyContact(editingContact.contact_id, {
        email: editEmail,
        role: editRole || undefined,
      });

      toast({
        title: "Success",
        description: "Contact updated successfully",
      });

      setShowEditDialog(false);
      setEditingContact(null);
      setEditEmail("");
      setEditRole("");

      await loadCompanies();
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-white text-2xl">Company Contacts</CardTitle>
              <CardDescription className="text-slate-400">
                {total} {total === 1 ? 'company' : 'companies'} in database
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search companies, emails, or roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                />
              </div>
              
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading companies...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">
                {searchQuery ? "No matches found" : "No companies yet"}
              </p>
              <p className="text-slate-500 text-sm">
                {searchQuery ? "Try a different search term" : "Add your first company contact to get started"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCompanies.map((company) => (
                <div
                  key={company.company_id}
                  className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/30"
                >
                  {/* Company Header */}
                  <button
                    onClick={() => toggleCompany(company.company_id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {expandedCompanies.has(company.company_id) ? (
                        <ChevronDown className="w-5 h-5 text-indigo-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      )}
                      <Building2 className="w-5 h-5 text-indigo-400" />
                      <span className="text-white font-semibold text-lg">
                        {company.company_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-slate-400 text-sm">
                        {company.contact_count} {company.contact_count === 1 ? 'contact' : 'contacts'}
                      </span>
                    </div>
                  </button>

                  {/* Contacts List (Expanded) */}
                  {expandedCompanies.has(company.company_id) && (
                    <div className="border-t border-slate-700 bg-slate-900/50">
                      {company.contacts.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">
                          No contacts for this company
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-700">
                          {company.contacts.map((contact) => (
                            <div
                              key={contact.contact_id}
                              className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                            >
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Mail className="w-4 h-4 text-slate-500" />
                                  <span className="text-white">{contact.email}</span>
                                </div>
                                {contact.role && (
                                  <div className="flex items-center space-x-2 ml-6">
                                    <User className="w-3 h-3 text-slate-600" />
                                    <span className="text-slate-400 text-sm">{contact.role}</span>
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditContact(contact, company.company_name)}
                                className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700">
              <p className="text-slate-400 text-sm">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Company Contact</DialogTitle>
            <DialogDescription className="text-slate-400">
              Search for a company or create a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Company Search */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-slate-300">
                Company Name <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="company"
                  placeholder="Start typing company name..."
                  value={companySearchQuery}
                  onChange={(e) => handleCompanySearch(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                  disabled={creating}
                />
                {searchingCompanies && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-500" />
                )}
              </div>

              {/* Search Results Dropdown */}
              {companySearchResults.length > 0 && (
                <div className="border border-slate-700 rounded-lg bg-slate-900 max-h-48 overflow-y-auto">
                  {companySearchResults.map((company) => (
                    <button
                      key={company.company_id}
                      onClick={() => handleSelectCompany(company)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800 transition-colors flex items-center space-x-2"
                    >
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      <span className="text-white">{company.company_name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Company */}
              {selectedCompany && (
                <div className="flex items-center space-x-2 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-indigo-300 font-medium">{selectedCompany.company_name}</span>
                </div>
              )}

              {/* No Results - Create New */}
              {companySearchQuery.length >= 2 && companySearchResults.length === 0 && !selectedCompany && !searchingCompanies && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-amber-300 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Company not found. Click "Next" to create it.
                  </p>
                </div>
              )}
            </div>

            {/* Email Field (shown after company selected) */}
            {selectedCompany && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Contact Email <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                    disabled={creating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-slate-300">
                    Role (Optional)
                  </Label>
                  <Input
                    id="role"
                    placeholder="e.g., HR Manager, Recruiter"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                    disabled={creating}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setCompanySearchQuery("");
                setSelectedCompany(null);
                setContactEmail("");
                setContactRole("");
                setCompanySearchResults([]);
              }}
              disabled={creating}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddContact}
              disabled={creating || !companySearchQuery.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {selectedCompany ? 'Adding...' : 'Creating...'}
                </>
              ) : (
                selectedCompany ? 'Add Contact' : 'Next'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Create Company Dialog */}
      <Dialog open={showCompanyConfirm} onOpenChange={setShowCompanyConfirm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Company?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This company doesn't exist in the database yet.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <p className="text-white font-medium mb-1">Company Name:</p>
              <p className="text-indigo-300 text-lg font-semibold">{companySearchQuery}</p>
            </div>
            <p className="text-slate-400 text-sm mt-4">
              Click "Create Company" to add it to the database, then you can add contact details.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompanyConfirm(false)}
              disabled={creating}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewCompany}
              disabled={creating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Company'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update contact information for {editingContact?.company_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-300 font-medium">{editingContact?.company_name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-slate-300">
                Contact Email <span className="text-red-400">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="contact@company.com"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                disabled={updating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role" className="text-slate-300">
                Role (Optional)
              </Label>
              <Input
                id="edit-role"
                placeholder="e.g., HR Manager, Recruiter"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                disabled={updating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingContact(null);
                setEditEmail("");
                setEditRole("");
              }}
              disabled={updating}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateContact}
              disabled={updating || !editEmail.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Contact'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CompanyContactsTab;
