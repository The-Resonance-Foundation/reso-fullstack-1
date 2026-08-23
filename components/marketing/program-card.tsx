import Image from "next/image"
import Link from "next/link"
import { imagePath } from "@/lib/utils"

type Program = {
  name: string
  shortDescription: string
  image: string
  id?: string
}

type ProgramCardProps = {
  program: Program
  href?: string
  /** Position in the grid — renders the design's "01"-style index and staggers the reveal. */
  index?: number
}

export function ProgramCard({ program, href, index = 0 }: ProgramCardProps) {
  const content = (
    <div
      data-reveal="1"
      data-reveal-delay={index ? String(index * 90) : undefined}
      data-tilt="1"
      className="noc-card group h-full cursor-pointer overflow-hidden will-change-transform"
    >
      <div className="relative h-[200px] overflow-hidden">
        <Image
          src={imagePath(program.image)}
          alt={`${program.name} program`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 25vw"
        />
      </div>
      <div className="px-[22px] pb-6 pt-[22px]">
        <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[var(--noc-accent-400)]">
          {String(index + 1).padStart(2, "0")}
        </div>
        <h3 className="mb-1.5 text-[21px] font-medium">{program.name}</h3>
        <p className="text-[13.5px] leading-[1.5] text-[var(--noc-neutral-300)]">
          {program.shortDescription}
        </p>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
