import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import { Button } from "@pilot/ui/components/button";
import { ArrowUpRight } from "lucide-react";

const CallToAction = () => {
  return (
    <section
      id="final-cta"
      aria-labelledby="cta-title"
      className="mx-auto max-w-6xl text-center"
    >
      <div className="sm:col-span-2">
        <h2
          id="cta-title"
          className="font-heading scroll-my-60 text-3xl font-semibold tracking-tighter text-balance text-foreground md:text-4xl"
        >
          Ready to stop leaking warm leads?
        </h2>
        <p className="mt-3 mb-8 text-lg text-muted-foreground mx-auto max-w-xl">
          Join the waitlist to get early access and shape the roadmap, or review
          the open-source code behind the system.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4">
          <Button asChild>
            <Link href="/waitlist">Join waitlist</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={siteConfig.socials.github}>
              View GitHub <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
