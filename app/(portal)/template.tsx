"use client"

import { motion } from "motion/react"

/**
 * Remounts on every portal navigation, giving each page a subtle
 * fade-up entrance. Kept fast (0.25s) so the portal never feels laggy.
 */
export default function PortalTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.21, 1.02, 0.73, 1] }}
    >
      {children}
    </motion.div>
  )
}
