import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@pilot/ui/components/accordion"

const faq = [
  {
    q: "How is Pilot different from flow-builder bots?",
    a: "Pilot is a sales system, not a brittle keyword tree. It combines intent-aware AI replies, CRM depth, and human handoff when risk or complexity appears.",
  },
  {
    q: "Why does Pilot emphasize HRN safety routing?",
    a: "Because account health matters. Pilot is built to pause risky threads, respect messaging constraints, and route conversations to humans before damage is done.",
  },
  {
    q: "Is Pilot only for agencies?",
    a: "No. It is designed for creators, coaches, founders, and social teams who need reliable DM qualification and follow-up without brittle automation.",
  },
  {
    q: "What is being prioritized on the roadmap now?",
    a: "Near-term work focuses on conversion lift: faster knowledge ingestion, comment-to-DM templates, safer throttling, and better trigger understanding.",
  },
  {
    q: "Will Pilot include deeper analytics and pipeline views?",
    a: "Yes. Upcoming phases include CRM pipeline visibility, AI lead scoring, attribution from post to pipeline value, and conversation quality diagnostics.",
  },
  {
    q: "Can I self-host Pilot?",
    a: "Yes. The project is open source and self-hostable so teams can control data, reduce vendor lock-in, and adapt workflows to their own infrastructure.",
  },
  {
    q: "Why do teams switch from contact-based pricing tools?",
    a: "Because one viral post should not become a software penalty. Pilot is designed for predictable economics so audience growth does not trigger pricing shock.",
  },
  {
    q: "How does Pilot stay safe with Meta messaging rules?",
    a: "Pilot is designed around current constraints like rate limits and messaging windows. It uses guardrails and human handoff to reduce account risk while keeping conversations moving.",
  },
]

const FAQSection = () => {
  const middle = Math.ceil(faq.length / 2)
  const leftFaq = faq.slice(0, middle)
  const rightFaq = faq.slice(middle)

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="mx-auto w-full max-w-6xl"
    >
      <h2
        id="faq-title"
        className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        Frequently asked questions
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
        Straight answers for teams evaluating DM automation seriously.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Accordion type="single" collapsible className="rounded-xl border px-5 h-fit">
          {leftFaq.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <Accordion type="single" collapsible className="rounded-xl border px-5 h-fit">
          {rightFaq.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

export default FAQSection
