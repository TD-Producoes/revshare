"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Menu, ChartPie } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  isAuthed: boolean;
  theme: string;
  dashboardHref: string;
  dashboardLabel: string;
  triggerClassName?: string;
  isTransparent?: boolean;
}

const menuVariants = {
  closed: (isTransparent: boolean) => ({
    clipPath: `circle(0px at calc(100% - 40px) ${isTransparent ? "80px" : "40px"})`,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 40,
    },
  }),
  open: (isTransparent: boolean) => ({
    clipPath: `circle(150% at calc(100% - 40px) ${isTransparent ? "80px" : "40px"})`,
    transition: {
      type: "spring" as const,
      stiffness: 150,
      damping: 25,
    },
  }),
};

const staggerVariants = {
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function MobileNav({ isAuthed, theme, dashboardHref, dashboardLabel, triggerClassName, isTransparent }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <Button
        variant={isOpen ? "ghost" : "outline"}
        size="icon"
        className={cn(
          "relative z-50 transition-colors",
          !isOpen && triggerClassName,
          isOpen && "hover:bg-transparent text-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="sr-only">Toggle menu</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            custom={isTransparent}
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl h-screen w-screen flex flex-col"
          >
            <div className={cn(
              "flex h-14 items-center px-4 transition-all duration-500",
              isTransparent ? "mt-10" : "mt-0"
            )}>
              <div className="flex items-center gap-2 font-bold text-xl text-foreground">
                <ChartPie strokeWidth={3} className="h-4 w-4" />
                <span>RevShare</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-10 pb-32">
              <div className="container mx-auto flex flex-col">
                <motion.div
                  variants={staggerVariants}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col gap-6"
                >
                  {/* Solutions Section */}
                  <motion.div variants={itemVariants} className="flex flex-col gap-3">
                    <div className="text-lg font-medium tracking-tight text-foreground">
                      Solutions
                    </div>
                    <div className="flex flex-col gap-3 pl-4 border-l border-border/40 ml-1">
                      <MobileLink href="/solutions/for-founders" onClick={() => setIsOpen(false)}>
                        For Founders
                      </MobileLink>
                      <MobileLink href="/solutions/for-marketers" onClick={() => setIsOpen(false)}>
                        For Marketers
                      </MobileLink>
                    </div>
                  </motion.div>

                  {/* Product Section */}
                  <motion.div variants={itemVariants} className="flex flex-col gap-3">
                    <div className="text-lg font-medium tracking-tight text-foreground">
                      Product
                    </div>
                    <div className="flex flex-col gap-3 pl-4 border-l border-border/40 ml-1">
                      <MobileLink href="/product/how-it-works" onClick={() => setIsOpen(false)}>
                        How RevShare Works
                      </MobileLink>
                      <MobileLink
                        href="/product/revshare-vs-affiliate-networks"
                        onClick={() => setIsOpen(false)}
                      >
                        RevShare vs Networks
                      </MobileLink>
                      <MobileLink
                        href="/product/revshare-vs-affiliate-marketing"
                        onClick={() => setIsOpen(false)}
                      >
                        RevShare vs Marketing
                      </MobileLink>
                      <MobileLink href="/product/trust" onClick={() => setIsOpen(false)}>
                        Trust & Security
                      </MobileLink>
                      <MobileLink href="/product/rewards" onClick={() => setIsOpen(false)}>
                        Rewards & Milestones
                      </MobileLink>
                      <MobileLink href="/product/marketplace" onClick={() => setIsOpen(false)}>
                        Public Marketplace
                      </MobileLink>
                    </div>
                  </motion.div>

                  {/* Main Links */}
                  <motion.div variants={itemVariants} className="flex flex-col gap-4 pt-1">
                    <Link
                      href="/projects"
                      className="text-lg font-medium tracking-tight hover:text-primary transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Projects
                    </Link>
                    <Link
                      href="/marketers"
                      className="text-lg font-medium tracking-tight hover:text-primary transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Marketers
                    </Link>
                    <Link
                      href="/pricing"
                      className="text-lg font-medium tracking-tight hover:text-primary transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Pricing
                    </Link>
                  </motion.div>

                </motion.div>
              </div>
            </div>

            {/* Sticky Footer CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-none p-6 bg-background/80 backdrop-blur-md border-t border-border/10 mb-safe"
            >
              <div className="flex items-center gap-4">
                {!isAuthed ? (
                  <>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="flex-1 h-14 rounded-full text-base font-semibold bg-secondary/50 hover:bg-secondary/70 border-none"
                      asChild
                    >
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        Log In
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      className={cn(
                        "flex-1 h-14 rounded-full text-base font-semibold shadow-none border-none",
                        theme === "founders"
                          ? "bg-[#BFF2A0] hover:bg-[#AEE190] text-[#0B1710]"
                          : theme === "how-it-works"
                            ? "bg-[#818CF8] hover:bg-[#717CF8] text-white"
                            : theme === "trust"
                              ? "bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
                              : theme === "rewards"
                                ? "bg-[#F59E0B] hover:bg-[#D97706] text-white"
                                : theme === "integrations"
                                  ? "bg-[#14B8A6] hover:bg-[#0D9488] text-white"
                                  : theme === "marketplace"
                                    ? "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                                    : "bg-amber-500 hover:bg-amber-600 text-white"
                      )}
                      asChild
                    >
                      <Link href="/signup" onClick={() => setIsOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button
                    size="lg"
                    className={cn(
                      "w-full h-14 rounded-full text-base font-semibold shadow-none border-none",
                      theme === "founders"
                        ? "bg-[#BFF2A0] hover:bg-[#AEE190] text-[#0B1710]"
                        : "bg-amber-500 hover:bg-amber-600 text-white"
                    )}
                    asChild
                  >
                    <Link href={dashboardHref} onClick={() => setIsOpen(false)}>
                      {dashboardLabel}
                    </Link>
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link href={href} className="block text-base font-medium text-foreground/80 hover:text-primary transition-colors" onClick={onClick}>
      {children}
    </Link>
  );
}
