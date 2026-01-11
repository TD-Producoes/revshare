"use client";

import { motion } from "framer-motion";

interface BulletListProps {
  // Array of bullet point text
  items: string[];
  // Optional: additional className for container
  className?: string;
  // Optional: animate items (default: false)
  animate?: boolean;
}

/**
 * Bullet list component for feature lists in onboarding.
 * Displays items with a primary-colored bullet point.
 */
export function BulletList({
  items,
  className,
  animate = false,
}: BulletListProps) {
  return (
    <ul className={className}>
      {items.map((item, i) => {
        const content = (
          <li
            key={i}
            className="flex items-center gap-2.5 text-xs font-bold tracking-tight"
          >
            <div className="size-1.5 rounded-full bg-primary" />
            {item}
          </li>
        );

        if (animate) {
          return (
            <motion.li
              key={i}
              className="flex items-center gap-2.5 text-xs font-bold tracking-tight"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="size-1.5 rounded-full bg-primary" />
              {item}
            </motion.li>
          );
        }

        return content;
      })}
    </ul>
  );
}

