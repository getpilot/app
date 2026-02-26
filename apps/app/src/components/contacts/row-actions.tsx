import { Row } from "@tanstack/react-table";
import { InstagramContact } from "@/types/instagram";
import { Button } from "@pilot/ui/components/button";
import { EllipsisIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@pilot/ui/components/dropdown-menu";
import { useContactActions } from "@/hooks/use-contact-actions";

interface RowActionsProps {
  row: Row<InstagramContact>;
  toggleRowExpanded: (rowId: string) => void;
  startEditingNotes: (rowId: string) => void;
}

export function RowActions({
  row,
  toggleRowExpanded,
  startEditingNotes,
}: RowActionsProps) {
  const {
    isPending,
    handleStageChange,
    handleSentimentChange,
    handleHRNStateChange,
  } = useContactActions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-end">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 border-border border-dashed hover:border-border hover:bg-muted/40"
            aria-label="Contact actions"
            disabled={isPending}
          >
            <EllipsisIcon
              size={16}
              className="text-muted-foreground"
              aria-hidden="true"
            />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-popover">
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              toggleRowExpanded(row.original.id);
            }}
          >
            <span>View details</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              toggleRowExpanded(row.original.id);
              startEditingNotes(row.original.id);
            }}
          >
            <span>Add notes</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              Change stage
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="bg-popover">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleStageChange(row.original.id, "new")}
                >
                  New
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleStageChange(row.original.id, "lead")}
                >
                  Lead
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() =>
                    handleStageChange(row.original.id, "follow-up")
                  }
                >
                  Follow-up
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleStageChange(row.original.id, "ghosted")}
                >
                  Ghosted
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              Change sentiment
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="bg-popover">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleSentimentChange(row.original.id, "hot")}
                >
                  Hot
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleSentimentChange(row.original.id, "warm")}
                >
                  Warm
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleSentimentChange(row.original.id, "cold")}
                >
                  Cold
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() =>
                    handleSentimentChange(row.original.id, "neutral")
                  }
                >
                  Neutral
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() =>
                    handleSentimentChange(row.original.id, "ghosted")
                  }
                >
                  Ghosted
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => handleHRNStateChange(row.original.id, true)}
          >
            Mark HRN (pause bot)
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => handleHRNStateChange(row.original.id, false)}
          >
            Back to auto
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}