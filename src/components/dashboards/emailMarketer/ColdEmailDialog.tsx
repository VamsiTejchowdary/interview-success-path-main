import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Mail,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  Briefcase,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  searchCompanies,
  checkCompanyExists,
  type DetailedApplication,
  type CompanyContactData,
  linkContactToApplication,
  updateApplicationContactNotes,
  updateApplicationContact,
} from "@/lib/emailMarketer";
import { supabase } from "@/lib/supabase";

interface ColdEmailDialogProps {
  application: DetailedApplication;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ColdEmailDialog = ({
  application,
  open,
  onClose,
  onSuccess,
}: ColdEmailDialogProps) => {
  const { toast } = useToast();

  const [step, setStep] = useState<"search" | "select" | "confirm">(
    application.has_contact ? "select" : "search"
  );
  const [companySearchQuery, setCompanySearchQuery] = useState(
    application.company_name
  );
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [companyContacts, setCompanyContacts] = useState<CompanyContactData[]>(
    []
  );
  const [selectedContact, setSelectedContact] =
    useState<CompanyContactData | null>(null);
  const [notes, setNotes] = useState(application.contact_info?.notes || "");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset state
      setCompanySearchQuery(application.company_name);
      setNotes(application.contact_info?.notes || "");
      setSelectedCompany(null);
      setSelectedContact(null);
      setCompanyContacts([]);

      // If updating existing contact, we need to load the company data first
      if (application.has_contact && application.contact_info) {
        // Search for the company to get its data
        const loadExistingData = async () => {
          const results = await searchCompanies(application.company_name);
          if (results.length > 0) {
            // Find exact match or use first result
            const company =
              results.find(
                (c) => c.company_name === application.company_name
              ) || results[0];
            await handleSelectCompany(company);
          }
        };
        loadExistingData();
      } else {
        setStep("search");
        handleSearch(application.company_name);
      }
    }
  }, [open, application]);

  const handleSearch = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const results = await searchCompanies(query);
      setSearchResults(results);

      // Don't auto-select - let user choose
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCompany = async (company: any) => {
    setSelectedCompany(company);
    setCompanySearchQuery(company.company_name);
    setSearchResults([]);

    // Fetch contacts for this company
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("company_contacts")
        .select("contact_id, name, email, role, company_id, created_at, updated_at")
        .eq("company_id", company.company_id);

      if (error) throw error;

      const contacts: CompanyContactData[] = (data || []).map((c) => ({
        contact_id: c.contact_id,
        name: c.name,
        email: c.email,
        role: c.role,
        company_id: c.company_id,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));

      setCompanyContacts(contacts);

      // Pre-select existing contact if updating
      if (application.contact_info) {
        const existing = contacts.find(
          (c) => c.contact_id === application.contact_info?.contact_id
        );
        if (existing) {
          setSelectedContact(existing);
          // Stay on confirm step if we're updating
          setStep("confirm");
        } else {
          setStep("select");
        }
      } else {
        setStep("select");
        // Auto-select if only one contact
        if (contacts.length === 1) {
          setSelectedContact(contacts[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContact = (contact: CompanyContactData) => {
    setSelectedContact(contact);
    // Don't auto-advance to confirm step - let user click Next button
  };

  const handleSubmit = async () => {
    if (!selectedContact) return;

    try {
      setLoading(true);

      // Get email marketer ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: emailMarketer } = await supabase
        .from("email_marketers")
        .select("email_marketer_id")
        .eq("email", user.email)
        .single();

      if (!emailMarketer) throw new Error("Email marketer not found");

      if (application.has_contact && application.contact_info) {
        // Update existing
        if (
          selectedContact.contact_id === application.contact_info.contact_id
        ) {
          // Same contact, just update notes
          await updateApplicationContactNotes(
            application.application_id,
            selectedContact.contact_id,
            notes
          );
        } else {
          // Different contact, replace
          await updateApplicationContact(
            application.application_id,
            application.contact_info.contact_id,
            selectedContact.contact_id,
            notes
          );
        }

        toast({
          title: "Success",
          description: "Contact updated successfully",
        });
      } else {
        // Create new
        await linkContactToApplication(
          application.application_id,
          selectedContact.contact_id,
          emailMarketer.email_marketer_id,
          notes
        );

        toast({
          title: "Success",
          description: "Cold email contact added successfully",
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error submitting:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save contact",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("select");
      setSelectedContact(null);
    } else if (step === "select") {
      setStep("search");
      setSelectedCompany(null);
      setCompanyContacts([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {application.has_contact
              ? "Update Cold Email Contact"
              : "Add Cold Email Contact"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {application.job_title} at {application.company_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step 1: Search Company */}
          {step === "search" && (
            <>
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Search Company <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Type company name..."
                    value={companySearchQuery}
                    onChange={(e) => {
                      setCompanySearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    className="bg-slate-900 border-slate-700 text-white"
                    autoFocus
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-500" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border border-slate-700 rounded-lg bg-slate-900 max-h-48 overflow-y-auto">
                    {searchResults.map((company) => (
                      <button
                        key={company.company_id}
                        onClick={() => handleSelectCompany(company)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors flex items-center space-x-2 border-b border-slate-700 last:border-0"
                      >
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        <span className="text-white">
                          {company.company_name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {companySearchQuery.length >= 2 &&
                  searchResults.length === 0 &&
                  !searching && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-amber-300 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Company not found. Please add it in the Company Contacts
                        tab first.
                      </p>
                    </div>
                  )}
              </div>
            </>
          )}

          {/* Step 2: Select Contact */}
          {step === "select" && selectedCompany && (
            <>
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <span className="text-white font-medium">
                  {selectedCompany.company_name}
                </span>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">
                  Select Contact Email <span className="text-red-400">*</span>
                </Label>

                {loading ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
                  </div>
                ) : companyContacts.length === 0 ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-amber-300 text-sm">
                      No contacts found for this company. Please add a contact
                      first.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-700 rounded-lg bg-slate-900 max-h-64 overflow-y-auto">
                    {companyContacts.map((contact) => (
                      <button
                        key={contact.contact_id}
                        onClick={() => handleSelectContact(contact)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors border-b border-slate-700 last:border-0 ${
                          selectedContact?.contact_id === contact.contact_id
                            ? "bg-indigo-500/20"
                            : ""
                        }`}
                      >
                        {contact.name && (
                          <div className="flex items-center space-x-2 mb-1">
                            <User className="w-4 h-4 text-emerald-400" />
                            <span className="text-white font-medium">{contact.name}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-indigo-400" />
                          <span className="text-white">{contact.email}</span>
                        </div>
                        {contact.role && (
                          <div className="flex items-center space-x-2 mt-1 ml-6">
                            <Briefcase className="w-3 h-3 text-amber-400" />
                            <span className="text-slate-400 text-sm">
                              {contact.role}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Step 3: Confirm & Add Notes */}
          {step === "confirm" && selectedContact && (
            <>
              <div className="space-y-3">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <p className="text-emerald-400 font-semibold mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Contact Selected
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span className="text-white">
                        {selectedCompany?.company_name}
                      </span>
                    </div>
                    {selectedContact.name && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-emerald-400" />
                        <span className="text-white font-medium">
                          {selectedContact.name}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-indigo-400" />
                      <span className="text-white">
                        {selectedContact.email}
                      </span>
                    </div>
                    {selectedContact.role && (
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-amber-400" />
                        <span className="text-slate-300">
                          {selectedContact.role}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-slate-300">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this contact or email..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white min-h-[100px]"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === "confirm" && application.has_contact && (
            <Button
              variant="outline"
              onClick={() => setStep("select")}
              disabled={loading}
              className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600 hover:text-white"
            >
              Change Contact
            </Button>
          )}
          {step !== "search" && step !== "confirm" && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600 hover:text-white"
            >
              Back
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600 hover:text-white"
          >
            Cancel
          </Button>
          {step === "select" && selectedContact && (
            <Button
              onClick={() => setStep("confirm")}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Next
            </Button>
          )}
          {step === "confirm" && (
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedContact}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : application.has_contact ? (
                "Update Contact"
              ) : (
                "Add Contact"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ColdEmailDialog;
