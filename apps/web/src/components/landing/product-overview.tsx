import {
  Bot,
  Droplets,
  Navigation,
  PieChart,
} from "lucide-react"
import AnalyticsIllustration from "./product-illustration"
import StickerCard from "./sticker-card"

const ProductOverview = () => {
  return (
    <section
      id="pipeline-analytics"
      aria-labelledby="pipeline-analytics-title"
      className="relative mx-auto w-full max-w-6xl overflow-hidden"
    >
      <div>
        <h2
          id="pipeline-analytics-title"
          className="font-heading relative scroll-my-24 text-lg font-semibold tracking-tight text-primary"
        >
          Product Overview
          <div className="absolute top-1 -left-2 h-5 w-0.75 rounded-r-sm bg-primary" />
        </h2>
        <p className="font-heading mt-2 max-w-lg text-3xl font-semibold tracking-tighter text-balance text-foreground md:text-4xl">
          Everything you need to turn Instagram conversations into pipeline
        </p>
      </div>
      <div className="*:pointer-events-none">
        <AnalyticsIllustration />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StickerCard
          Icon={Navigation}
          title="Smart Routing"
          description="Send hot leads to the right owner and escalate risky threads without manual triage."
        />
        <StickerCard
          Icon={Bot}
          title="AI Copilot"
          description="Generate context-aware replies that keep conversations moving and reduce inbox lag."
        />
        <StickerCard
          Icon={Droplets}
          title="Safety Guardrails"
          description="Apply sending controls and human handoff rules to protect account health."
        />
        <StickerCard
          Icon={PieChart}
          title="Pipeline Insights"
          description="Track what converts, where leads stall, and which actions recover revenue."
        />
      </div>
    </section>
  )
}

export default ProductOverview
