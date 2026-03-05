import { cn } from "@pilot/ui/lib/utils";

const StickerCard = ({
  title,
  description,
  Icon,
}: {
  title: string;
  description: string;
  Icon: React.ElementType;
}) => (
  <div
    className={cn(
      "text-sm",
      "relative z-10 mt-0 block h-full w-full overflow-hidden",
      "transition-all duration-180 ease-in-out",
      "rounded-lg rounded-tr-[26px] bg-card px-4 pt-5 pb-4.5 shadow-[inset_0_0_0_1px] shadow-border before:absolute before:top-0 before:right-0 before:z-3 before:h-[30px] before:w-[30px] before:-translate-y-1/2 before:translate-x-1/2 before:rotate-45 before:bg-background before:shadow-[0_1px_0_0] before:shadow-border before:transition-all before:duration-180 before:ease-in-out before:content-[''] after:absolute after:top-0 after:right-0 after:z-2 after:size-7 after:-translate-y-2 after:translate-x-2 after:rounded-bl-lg after:border after:border-border after:bg-background after:shadow-xs after:transition-all after:duration-180 after:ease-in-out after:content-[''] hover:rounded-tr-[45px] hover:before:h-[50px] hover:before:w-[50px] hover:after:h-[42px] hover:after:w-[42px] hover:after:shadow-lg hover:after:shadow-black/5",
    )}
  >
    <div className="relative flex items-center gap-2">
      <div className="absolute -left-4 h-5 w-0.75 rounded-r-sm bg-primary" />
      <Icon className="size-5 shrink-0 text-primary" />
      <h3 className="font-medium text-foreground">{title}</h3>
    </div>
    <p className="mt-2 text-muted-foreground">{description}</p>
  </div>
);

export default StickerCard;
