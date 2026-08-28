"use client"

import { motion } from "motion/react"

/**
 * Remounts on every portal navigation, giving each page a subtle fade-up
 * entrance. This runs after the content has already arrived, so its duration
 * is added directly to how slow a click feels — keep it short.
 */
export default function PortalTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14, ease: [0.21, 1.02, 0.73, 1] }}
    >
      {children}
    </motion.div>
  )
}
