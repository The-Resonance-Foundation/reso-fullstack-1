import Image from "next/image"
import { imagePath } from "@/lib/utils"
import { cn } from "@/lib/utils"

type Photo = {
  file: string
  alt: string
  wide?: boolean
}

type PhotoGridProps = {
  photos: readonly Photo[]
  columns?: 2 | 3 | 4
  className?: string
}

export function PhotoGrid({ photos, columns = 3, className }: PhotoGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3 md:gap-4",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-2 md:grid-cols-3",
        columns === 4 && "grid-cols-2 md:grid-cols-4",
        className
      )}
    >
      {photos.map((photo) => (
        <div
          key={photo.file}
          className={cn(
            "relative overflow-hidden rounded-xl",
            photo.wide && "col-span-2",
            columns === 4 ? "h-48" : "h-52 md:h-64"
          )}
        >
          <Image
            src={imagePath(photo.file)}
            alt={photo.alt}
            fill
            className="object-cover transition-transform duration-300 hover:scale-[1.02]"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        </div>
      ))}
    </div>
  )
}
