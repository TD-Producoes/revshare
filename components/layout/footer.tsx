"use client";

import Link from "next/link";
import { PieChart, ArrowRight, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("relative z-10 py-16", className)}>
      <div className="mx-auto max-w-7xl px-6">
        {/* Main Footer Content */}
        <div className="bg-[#3D2B1F] rounded-[2.5rem] p-8 md:p-12 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Product Links */}
            <div>
              <h3 className="text-sm font-bold text-white/80 mb-4 uppercase tracking-wider">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/product/how-it-works" className="text-sm text-white/70 hover:text-white transition-colors">
                    How RevShare Works
                  </Link>
                </li>
                <li>
                  <Link href="/product/revshare-vs-affiliate-networks" className="text-sm text-white/70 hover:text-white transition-colors">
                    vs Affiliate Networks
                  </Link>
                </li>
                <li>
                  <Link href="/product/revshare-vs-affiliate-marketing" className="text-sm text-white/70 hover:text-white transition-colors">
                    vs Affiliate Marketing
                  </Link>
                </li>
                <li>
                  <Link href="/product/trust" className="text-sm text-white/70 hover:text-white transition-colors">
                    Trust & Security
                  </Link>
                </li>
                <li>
                  <Link href="/product/rewards" className="text-sm text-white/70 hover:text-white transition-colors">
                    Rewards & Milestones
                  </Link>
                </li>
                <li>
                  <Link href="/product/marketplace" className="text-sm text-white/70 hover:text-white transition-colors">
                    Public Marketplace
                  </Link>
                </li>
              </ul>
            </div>

            {/* Solutions Links */}
            <div>
              <h3 className="text-sm font-bold text-white/80 mb-4 uppercase tracking-wider">Solutions</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/solutions/for-founders" className="text-sm text-white/70 hover:text-white transition-colors">
                    For Founders
                  </Link>
                </li>
                <li>
                  <Link href="/solutions/for-marketers" className="text-sm text-white/70 hover:text-white transition-colors">
                    For Marketers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h3 className="text-sm font-bold text-white/80 mb-4 uppercase tracking-wider">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/projects" className="text-sm text-white/70 hover:text-white transition-colors">
                    Projects
                  </Link>
                </li>
                <li>
                  <Link href="/marketers" className="text-sm text-white/70 hover:text-white transition-colors">
                    Marketers
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-white/70 hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-sm font-bold text-white/80 mb-4 uppercase tracking-wider">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/terms" className="text-sm text-white/70 hover:text-white transition-colors">
                    Terms and Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-white/70 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row gap-8 md:items-start">
              <div className="flex-1 max-w-md">
                <h3 className="text-base font-semibold text-white/80 mb-2">Subscribe to our newsletter.</h3>
                <p className="text-sm text-white/50 mb-4">
                  Stay updated with product updates & news from the RevShare team
                </p>
                <form className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
                  />
                  <Button
                    type="submit"
                    className="bg-[#FFB347] hover:bg-[#FFA500] text-[#3D2B1F] font-semibold rounded-xl px-6"
                  >
                    Subscribe
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </div>
              <div className="md:ml-auto">
                <h3 className="text-base font-semibold text-white/80 mb-3 flex items-center gap-2">
                  Follow us on <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" className="h-4 w-4">
                    <path fill="currentColor" d="M11.9539 1.68994H14.0624L9.45607 6.95462L14.875 14.1187H10.632L7.30877 9.77371L3.50622 14.1187H1.39652L6.3234 8.4875L1.125 1.68994H5.47569L8.47962 5.6614L11.9539 1.68994ZM11.2139 12.8567H12.3822L4.84087 2.88565H3.58716L11.2139 12.8567Z" className="text-white/80" />
                  </svg>
                </h3>
                <div className="flex items-center gap-2">
                  <a
                    href="https://x.com/tiagomanel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-opacity hover:opacity-80 inline-flex"
                  >
                    <Avatar className="rounded-full ring-white/20 hover:ring-white/40 transition-all [&[data-size]]:!size-7">
                      <AvatarImage src="https://unavatar.io/x/tiagomanel" alt="@tiagomanel" className="rounded-full" />
                      <AvatarFallback className="bg-white/10 text-white text-[10px] font-semibold rounded-full">TM</AvatarFallback>
                    </Avatar>
                  </a>
                  <a
                    href="https://x.com/davidantunespt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-opacity hover:opacity-80 inline-flex"
                  >
                    <Avatar className="rounded-full ring-white/20 hover:ring-white/40 transition-all [&[data-size]]:!size-7">
                      <AvatarImage src="https://unavatar.io/x/davidantunespt" alt="@davidantunespt" className="rounded-full" />
                      <AvatarFallback className="bg-white/10 text-white text-[10px] font-semibold rounded-full">DA</AvatarFallback>
                    </Avatar>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/10 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-white/60" />
              <span className="text-sm text-white/60">
                ©{new Date().getFullYear()} RevShare
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-[#FFB347] fill-[#FFB347]" />
              <span>in Lisbon</span>
            </div>
          </div>
        </div>

        {/* Built in Public Note */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-black/40">
            Built in public with{" "}
            <a
              href="https://buildpublic.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-600 transition-colors"
            >
              buildPublic.dev
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
