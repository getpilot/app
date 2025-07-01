import { Button } from "@/components/ui/button";

interface StepButtonsProps {
  onBack?: () => void;
  showBack?: boolean;
  isLoading?: boolean;
  submitLabel?: string;
}

export function StepButtons({
  onBack,
  showBack = true,
  isLoading = false,
  submitLabel = "Next",
}: StepButtonsProps) {
  return (
    <div className="flex justify-between pt-6">
      {showBack ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="px-6"
        >
          Back
        </Button>
      ) : (
        <div></div>
      )}
      <Button type="submit" disabled={isLoading} className="px-6">
        {isLoading ? "Processing..." : submitLabel}
      </Button>
    </div>
  );
}