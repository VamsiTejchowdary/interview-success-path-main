import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  updateApplicationContactResponse,
  type DetailedApplication,
} from "@/lib/emailMarketer";

interface UpdateResponseDialogProps {
  application: DetailedApplication;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateResponseDialog = ({
  application,
  open,
  onClose,
  onSuccess,
}: UpdateResponseDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hasResponded, setHasResponded] = useState(
    application.contact_info?.has_responded || false
  );
  const [respondedAt, setRespondedAt] = useState(
    application.contact_info?.responded_at
      ? new Date(application.contact_info.responded_at)
          .toISOString()
          .slice(0, 16)
      : ""
  );

  const handleSubmit = async () => {
    if (!application.contact_info) return;

    try {
      setLoading(true);

      await updateApplicationContactResponse(
        application.application_id,
        application.contact_info.contact_id,
        hasResponded,
        hasResponded && respondedAt ? new Date(respondedAt).toISOString() : null
      );

      toast({
        title: "Success",
        description: "Response status updated successfully",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating response:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update response status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Response Status</DialogTitle>
          <DialogDescription className="text-slate-400">
            {application.job_title} at {application.company_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Contact Info */}
          {application.contact_info && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span className="text-white">
                  {application.contact_info.email}
                </span>
              </div>
            </div>
          )}

          {/* Response Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
            <div className="space-y-0.5">
              <Label className="text-slate-300 font-medium">
                Contact Responded
              </Label>
              <p className="text-slate-500 text-sm">
                Mark if you received a response
              </p>
            </div>
            <Switch
              checked={hasResponded}
              onCheckedChange={setHasResponded}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>

          {/* Response Date/Time */}
          {hasResponded && (
            <div className="space-y-2">
              <Label htmlFor="responded_at" className="text-slate-300">
                Response Date & Time
              </Label>
              <Input
                id="responded_at"
                type="datetime-local"
                value={respondedAt}
                onChange={(e) => setRespondedAt(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
              <p className="text-slate-500 text-xs">
                When did you receive the response?
              </p>
            </div>
          )}

          {/* Current Status Display */}
          {application.contact_info?.has_responded && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-emerald-400 text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Currently marked as responded
                {application.contact_info.responded_at && (
                  <span className="ml-1">
                    on{" "}
                    {new Date(
                      application.contact_info.responded_at
                    ).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateResponseDialog;
