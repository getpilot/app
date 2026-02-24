import { InstagramContact } from "@/types/instagram";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircleIcon,
  ClockIcon,
  MessageSquareIcon,
  PencilIcon,
  SaveIcon,
} from "lucide-react";
import { useContactActions } from "@/hooks/use-contact-actions";
import { toast } from "sonner";

interface ExpandedContactRowProps {
  contact: InstagramContact;
  isEditing: boolean;
  notesValue: string;
  onEditClick: () => void;
  onNotesChange: (value: string) => void;
  onStopEditing: () => void;
}

export function ExpandedContactRow({
  contact,
  isEditing,
  notesValue,
  onEditClick,
  onNotesChange,
  onStopEditing,
}: ExpandedContactRowProps) {
  const { isPending, handleNotesChange, handleHRNStateChange } =
    useContactActions();

  const saveNotes = async () => {
    try {
      await handleNotesChange(contact.id, notesValue);
      onStopEditing();
      toast.success("Notes saved successfully");
    } catch (error) {
      console.error("Failed to save notes:", error);
      toast.error("Failed to save notes. Please try again.");
    }
  };

  return (
    <Card className="bg-card shadow-sm py-0 rounded-none border-none">
      <CardContent className="p-4 space-y-4">
        {/* HRN banner */}
        {contact.requiresHumanResponse ? (
          <div className="flex flex-col gap-2 rounded-md border border-orange-500/60 bg-orange-50 p-3 text-orange-900 dark:border-orange-500/50 dark:bg-orange-950/40 dark:text-orange-100">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AlertCircleIcon size={16} />
              Human response needed — bot is paused for this thread.
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-orange-900/80 dark:text-orange-100/80">
              <div className="flex items-center gap-1">
                <ClockIcon size={14} />
                <span>Reply ASAP to protect momentum.</span>
              </div>
              {contact.humanResponseSetAt && (
                <span>
                  Set at:{" "}
                  {new Date(contact.humanResponseSetAt).toLocaleString()}
                </span>
              )}

            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleHRNStateChange(contact.id, false)}
                disabled={isPending}
                className="h-8"
              >
                Mark as handled (back to auto)
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
            <AlertCircleIcon size={16} className="text-slate-500" />
            <span className="text-sm">
              Auto replies are enabled. Mark HRN if this thread needs a human.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto h-8"
              onClick={() => handleHRNStateChange(contact.id, true)}
              disabled={isPending}
            >
              Mark HRN
            </Button>
          </div>
        )}

        {/* Next Action section */}
        {contact.nextAction && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <PencilIcon size={18} className="text-primary" />
              <h3 className="text-sm font-medium">Recommended Next Action</h3>
            </div>
            <div className="border text-sm p-3 bg-muted/50 rounded-md whitespace-pre-wrap">
              {contact.nextAction}
            </div>
          </div>
        )}

        {/* Notes section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageSquareIcon size={18} className="text-primary" />
              <h3 className="text-sm font-medium">Notes</h3>
            </div>
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={onEditClick}
              >
                <PencilIcon size={14} className="mr-1" />
                Edit
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={saveNotes}
                disabled={isPending}
              >
                <SaveIcon size={14} className="mr-1" />
                Save
              </Button>
            )}
          </div>

          {isEditing ? (
            <Textarea
              value={notesValue}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="What do you know about this person? What are they interested in? Any red flags or green flags?"
              className="min-h-[100px] focus-visible:ring-ring"
              disabled={isPending}
            />
          ) : (
            <div className="border text-sm text-muted-foreground p-3 bg-muted/50 rounded-md min-h-[100px] whitespace-pre-wrap">
              {notesValue ||
                "No notes yet. Click edit to add what you know about this person."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}