/**
 * Fixed warm-aurora backdrop for the portal: three slow-drifting blurred
 * orbs over a radial charcoal gradient, dimmed by a vignette.
 */
export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 90% at 70% 0%, #241a12 0%, #16110d 45%, #0f0c0a 100%)",
      }}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: "56vw",
          height: "56vw",
          left: "-14vw",
          top: "-20vw",
          background:
            "radial-gradient(circle at 45% 45%, rgba(216,126,44,.42), rgba(216,126,44,0) 65%)",
          filter: "blur(70px)",
          animation: "aurora-drift 17s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "62vw",
          height: "62vw",
          right: "-18vw",
          bottom: "-24vw",
          background:
            "radial-gradient(circle at 50% 50%, rgba(88,128,94,.26), rgba(88,128,94,0) 62%)",
          filter: "blur(80px)",
          animation: "aurora-drift 23s ease-in-out infinite alternate-reverse",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "40vw",
          height: "40vw",
          left: "34vw",
          bottom: "-16vw",
          background:
            "radial-gradient(circle at 50% 50%, rgba(140,82,40,.34), rgba(140,82,40,0) 60%)",
          filter: "blur(70px)",
          animation: "aurora-drift 28s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.45))",
        }}
      />
    </div>
  )
}

/** The equalizer-bars brand mark from the design (animated gradient tile). */
export function BrandMark({ size = 40 }: { size?: number }) {
  const bar = (h: number, delay: string) => (
    <span
      className="animate-eq rounded-[3px]"
      style={{
        width: Math.max(3, Math.round(size / 10)),
        height: h,
        background: "rgba(255,252,246,.95)",
        animationDelay: delay,
      }}
    />
  )
  return (
    <span
      className="flex flex-none items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size / 3),
        gap: Math.max(2, Math.round(size / 14)),
        background: "linear-gradient(135deg, var(--acc-hi, #F8B269), var(--acc-lo, #C57326))",
        boxShadow: "0 8px 20px rgba(214,116,28,.35)",
      }}
    >
      {bar(Math.round(size * 0.28), "-0.2s")}
      {bar(Math.round(size * 0.48), "-0.9s")}
      {bar(Math.round(size * 0.35), "-1.5s")}
    </span>
  )
}
