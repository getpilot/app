import { Avatar, AvatarFallback } from "@pilot/ui/components/avatar";

const Testimonial = () => {
  return (
    <section
      id="social-proof"
      className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-xl border border-border/60 shadow-2xl shadow-primary/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/30" />
      <div className="relative z-10 px-8 py-14 sm:px-14 lg:px-24">
        <figure className="mx-auto flex w-full max-w-xl flex-col items-center justify-center">
          <blockquote className="font-heading text-center text-lg leading-tight tracking-tight sm:text-xl md:text-3xl">
            &quot;Pilot gave us the follow-up discipline we were missing. Warm
            leads stopped slipping through inbox cracks.&quot;
          </blockquote>

          <div className="mask-[linear-gradient(to_right,transparent,black,transparent)] mx-auto my-5 h-px w-full max-w-sm bg-border" />

          <figcaption className="flex flex-col items-center gap-5">
            <div className="space-y-0.5 text-center">
              <cite className="font-medium text-foreground text-lg not-italic">
                Early access customer
              </cite>
              <div className="text-base text-muted-foreground">
                Creator-led business operator
              </div>
            </div>

            <Avatar className="size-12 rounded-full border object-cover">
              <AvatarFallback>EC</AvatarFallback>
            </Avatar>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

export default Testimonial
