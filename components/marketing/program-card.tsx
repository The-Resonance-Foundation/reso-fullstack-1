import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
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
}

export function ProgramCard({ program, href }: ProgramCardProps) {
  const content = (
    <Card className="group overflow-hidden border-border/80 transition-shadow hover:shadow-lg">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={imagePath(program.image)}
          alt={`${program.name} program`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="font-serif text-xl font-bold text-white">{program.name}</h3>
          <p className="text-sm text-white/85">{program.shortDescription}</p>
        </div>
      </div>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
