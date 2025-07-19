import { InstagramContact } from "@/types/instagram";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquareIcon, PencilIcon, SaveIcon } from "lucide-react";
import { useContactActions } from "@/hooks";

interface ExpandedContactRowProps {
  contact: InstagramContact;
  isEditing: boolean;
  notesValue: string;
  onEditClick: () => void;
  onNotesChange: (value: string) => void;
}

export function ExpandedContactRow({
  contact,
  isEditing,
  notesValue,
  onEditClick,
  onNotesChange,
}: ExpandedContactRowProps) {
  const { isPending, handleNotesChange } = useContactActions();

  const saveNotes = async () => {
    await handleNotesChange(contact.id, notesValue);
    onEditClick();
  };

  return (
    <Card className="bg-card shadow-sm py-0 rounded-none border-none">
      <CardContent className="p-4 space-y-4">
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
          <div className="flex items-center justify-between">
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
              placeholder="Add your personal notes about this contact..."
              className="min-h-[100px] focus-visible:ring-ring"
              disabled={isPending}
            />
          ) : (
            <div className="border text-sm text-muted-foreground p-3 bg-muted/50 rounded-md min-h-[100px] whitespace-pre-wrap">
              {notesValue || "No personal notes yet. Click edit to add notes."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}