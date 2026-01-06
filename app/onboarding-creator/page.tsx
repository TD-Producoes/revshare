"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types for creator onboarding state
type CreatorOnboardingData = {
  productType: string;
  projectName: string;
  tagline: string;
  website: string;
  targetMarketers: string[];
  audienceFocus: string;
  industryTags: string[];
  commissionType: "percentage" | "flat";
  commissionValue: number;
  recurring: boolean;
  productAccess: string;
  refundWindow: string;
  approvalType: "instant" | "request";
  limitMarketers: boolean;
};

const STEPS_COUNT = 11;

export default function CreatorOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<CreatorOnboardingData>({
    productType: "",
    projectName: "",
    tagline: "",
    website: "",
    targetMarketers: [],
    audienceFocus: "",
    industryTags: [],
    commissionType: "percentage",
    commissionValue: 20,
    recurring: true,
    productAccess: "Demo",
    refundWindow: "30",
    approvalType: "request",
    limitMarketers: false,
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS_COUNT));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const updateData = (updates: Partial<CreatorOnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const toggleTargetMarketer = (method: string) => {
    setData((prev) => ({
      ...prev,
      targetMarketers: prev.targetMarketers.includes(method)
        ? prev.targetMarketers.filter((m) => m !== method)
        : [...prev.targetMarketers, method],
    }));
  };

  const toggleIndustryTag = (tag: string) => {
    setData((prev) => ({
      ...prev,
      industryTags: prev.industryTags.includes(tag)
        ? prev.industryTags.filter((t) => t !== tag)
        : [...prev.industryTags, tag],
    }));
  };

  const progress = (currentStep / STEPS_COUNT) * 100;

  // Mock matched marketers for Step 10
  const matchedMarketers = [
    { name: "Alex Rivers", style: "YouTube / SaaS", region: "North America", color: "bg-blue-50/50" },
    { name: "Sarah Chen", style: "Blog / SEO", region: "Worldwide", color: "bg-green-50/50" },
    { name: "David Miller", style: "Newsletter", region: "Europe", color: "bg-purple-50/50" },
  ];

  return (
    <div className="flex min-h-screen bg-background font-sans selection:bg-primary/20">
      {/* Left Panel: Value Prop */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary/5 p-12 lg:flex border-none">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-lg">R</div>
            <span className="text-xl font-black tracking-tight">RevShare</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-md"
            >
              {currentStep === 1 && (
                <>
                  <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight">Turn revenue into a growth engine.</h2>
                  <p className="mb-8 text-lg text-muted-foreground font-bold tracking-tight">Launch an affiliate program where marketers earn from real revenue — transparently and fairly.</p>
                  <ul className="space-y-4">
                    {[
                      "Revenue-based commissions",
                      "Refund-aware payouts",
                      "No upfront costs"
                    ].map((bullet, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-bold tracking-tight text-muted-foreground">
                        <div className="size-1.5 rounded-full bg-primary" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              
              {currentStep === 3 && data.projectName && (
                <div className="space-y-6">
                  <p className="text-[12px] font-black text-primary/60">Live Preview</p>
                  <Card className="p-8 border-none rounded-3xl bg-background shadow-none space-y-4">
                    <div className="flex items-start justify-between">
                       <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl font-black">
                         {data.projectName.charAt(0) || "P"}
                       </div>
                       <Badge variant="secondary" className="rounded-full px-4 py-1 font-black text-[12px]">New Program</Badge>
                    </div>
                    <div>
                      <p className="text-2xl font-black tracking-tight">{data.projectName || "Your Project Name"}</p>
                      <p className="text-muted-foreground text-[12px] line-clamp-2 font-black">{data.tagline || "Your awesome tagline goes here..."}</p>
                    </div>
                    <div className="pt-4 flex items-center gap-8 border-t border-dashed">
                       <div>
                         <p className="text-[12px] text-muted-foreground font-black">Commission</p>
                         <p className="font-black text-primary text-xl">{data.commissionValue}{data.commissionType === "percentage" ? "%" : "$"}</p>
                       </div>
                       <div>
                         <p className="text-[12px] text-muted-foreground font-black">Refund Window</p>
                         <p className="font-black text-xl">{data.refundWindow} Days</p>
                       </div>
                    </div>
                  </Card>
                </div>
              )}

              {currentStep !== 1 && currentStep !== 3 && currentStep < 10 && (
                <div className="space-y-6">
                  <h2 className="text-4xl font-black leading-tight tracking-tight">
                    {currentStep === 2 && "Defining your project."}
                    {currentStep === 4 && "Finding your partners."}
                    {currentStep === 5 && "Incentivizing growth."}
                    {currentStep === 6 && "Enabling success."}
                    {currentStep === 7 && "Setting trust rules."}
                    {currentStep === 8 && "Maintaining control."}
                    {currentStep === 9 && "Everything looks perfect."}
                  </h2>
                  <p className="text-lg text-muted-foreground tracking-tight text-balance font-bold">
                    {currentStep === 2 && "The type of product helps us suggest the best default settings for your program."}
                    {currentStep === 4 && "Targeting the right marketers ensures your product is promoted to the right audience."}
                    {currentStep === 5 && "Higher commissions generally attract more experienced and high-capacity marketers."}
                    {currentStep === 6 && "Giving marketers access to your product helps them create high-quality, authentic content."}
                    {currentStep === 7 && "Refund windows protect your business while maintaining transparency with partners."}
                    {currentStep === 8 && "Flexible approval options let you decide who represents your brand."}
                    {currentStep === 9 && "Review your program details before we go live. You can always change these later."}
                  </p>
                </div>
              )}

              {currentStep === 10 && (
                 <div className="space-y-8">
                   <h2 className="text-4xl font-black leading-tight tracking-tight">Instant magic.</h2>
                   <p className="text-lg text-muted-foreground tracking-tight font-bold">Based on your program settings, these marketers are a perfect match.</p>
                   <div className="space-y-4">
                     {matchedMarketers.map((m, i) => (
                        <motion.div 
                         key={i}
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: i * 0.1 }}
                         className="bg-white/10 p-4 rounded-3xl flex items-center justify-between border-none"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("size-10 rounded-full", m.color)} />
                            <div>
                              <p className="text-sm font-black tracking-tight">{m.name}</p>
                              <p className="text-[12px] text-muted-foreground font-bold">{m.style}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[12px] font-black">Match</Badge>
                        </motion.div>
                     ))}
                   </div>
                 </div>
              )}

              {currentStep === 11 && (
                <div className="space-y-6">
                  <h2 className="text-4xl font-black leading-tight tracking-tight">Launch ready.</h2>
                  <p className="text-lg text-muted-foreground tracking-tight font-bold">Your program is defined. Now let&apos;s connect the tech and start growing.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Panel: Content */}
      <div className="flex w-full flex-col lg:w-1/2 border-none">
        {/* Header/Progress */}
        <div className="flex h-16 items-center justify-between px-8 border-none">
          <div className="lg:hidden flex items-center gap-2">
            <div className="size-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-black text-xs">R</div>
            <span className="font-black tracking-tight text-sm">RevShare</span>
          </div>
          <div className="flex flex-1 items-center justify-end gap-4 max-sm ml-auto">
             <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50 border-none">
               <motion.div 
                 className="h-full bg-primary border-none"
                 initial={{ width: 0 }}
                 animate={{ width: `${progress}%` }}
               />
             </div>
             <span className="text-xs font-black tabular-nums text-muted-foreground">
               {currentStep}/{STEPS_COUNT}
             </span>
          </div>
        </div>

        {/* Form Area */}
        <div className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-24 border-none">
          <div className="mx-auto w-full max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* Step 1: Welcome */}
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="space-y-2 text-center lg:text-left">
                      <h1 className="text-4xl font-black tracking-tight">Create your program.</h1>
                      <p className="text-lg text-muted-foreground tracking-tight font-bold">Let&apos;s define how marketers will grow your business.</p>
                    </div>
                    <div className="lg:hidden space-y-4 py-6">
                       <ul className="space-y-4">
                        {[
                          "Revenue-based commissions",
                          "Refund-aware payouts",
                          "No upfront costs"
                        ].map((bullet, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-bold tracking-tight text-muted-foreground">
                            <div className="size-1.5 rounded-full bg-primary" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Step 2: Product Type */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-black tracking-tight">What type of product are you promoting?</h1>
                      <p className="text-muted-foreground tracking-tight font-bold">This helps us suggest optimized program settings for your niche.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-1">
                      {[
                        { id: "saas", label: "SaaS / Subscription", color: "bg-blue-50/50" },
                        { id: "ecommerce", label: "Ecommerce / DTC", color: "bg-green-50/50" },
                        { id: "mobile", label: "Mobile app", color: "bg-orange-50/50" },
                        { id: "digital", label: "Digital product", color: "bg-purple-50/50" },
                        { id: "other", label: "Other", color: "bg-amber-50/50" },
                      ].map((item) => (
                        <Card
                          key={item.id}
                          className={cn(
                            "flex cursor-pointer ring-0 items-center px-10 transition-all duration-300 border-none rounded-3xl shadow-none",
                            item.color,
                            data.productType === item.id 
                              ? "bg-primary text-primary-foreground" 
                              : "hover:bg-primary/10"
                          )}
                          onClick={() => updateData({ productType: item.id })}
                        >
                          <p className="text-3xl font-black tracking-tight text-sm">{item.label}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Project Basics */}
                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-black tracking-tight">Project basics.</h1>
                      <p className="text-muted-foreground tracking-tight font-bold">How should marketers discover and identify you?</p>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="pName" className="ml-4 text-[12px] font-black text-muted-foreground">Project Name</Label>
                        <Input 
                           id="pName"
                           placeholder="Acme Analytics"
                           value={data.projectName}
                           autoFocus
                           onChange={(e) => updateData({ projectName: e.target.value })}
                           className="h-16 border-none bg-secondary/30 rounded-3xl px-8 focus-visible:bg-secondary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tagline" className="ml-4 text-[12px] font-black text-muted-foreground">Short tagline</Label>
                        <Input 
                           id="tagline"
                           placeholder="AI-powered insights"
                           value={data.tagline}
                           onChange={(e) => updateData({ tagline: e.target.value })}
                           className="h-16 border-none bg-secondary/30 rounded-3xl px-8 focus-visible:bg-secondary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="url" className="ml-4 text-[12px] font-black text-muted-foreground">Website URL</Label>
                        <Input 
                           id="url"
                           placeholder="https://..."
                           value={data.website}
                           onChange={(e) => updateData({ website: e.target.value })}
                           className="h-16 border-none bg-secondary/30 rounded-3xl px-8 focus-visible:bg-secondary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Marketer Targets */}
                {currentStep === 4 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-black tracking-tight">Who should promote this?</h1>
                      <p className="text-muted-foreground tracking-tight font-bold">Targeting specific promotion styles improves quality.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      {[
                        { id: "creators", label: "Content creators", color: "bg-blue-50/50" },
                        { id: "seo", label: "SEO / bloggers", color: "bg-green-50/50" },
                        { id: "newsletter", label: "Newsletter owners", color: "bg-orange-50/50" },
                        { id: "communities", label: "Communities", color: "bg-purple-50/50" },
                        { id: "agencies", label: "Agencies", color: "bg-pink-50/50" },
                        { id: "beginners", label: "Beginners welcome", color: "bg-amber-50/50" },
                      ].map((item) => (
                        <Card
                          key={item.id}
                          className={cn(
                            "cursor-pointer p-6 transition-all duration-300 border-none rounded-3xl shadow-none",
                            "ring-0",
                            item.color,
                            data.targetMarketers.includes(item.id) 
                              ? "bg-primary text-primary-foreground" 
                              : "hover:bg-primary/10"
                          )}
                          onClick={() => toggleTargetMarketer(item.id)}
                        >
                          <p className="font-black tracking-tight text-center text-sm">{item.label}</p>
                        </Card>
                      ))}
                    </div>
                    <div className="space-y-4 pt-4">
                       <p className="ml-4 text-[12px] font-black text-muted-foreground">Industry focus</p>
                       <div className="flex flex-wrap gap-3">
                          {["B2B", "B2C", "SaaS", "AI", "Fintech", "Health", "Social"].map(tag => (
                             <Badge 
                               key={tag}
                               className={cn(
                                 "cursor-pointer px-8 py-4 rounded-full border-none transition-all text-[12px] font-black shadow-none",
                                 data.industryTags.includes(tag) ? "bg-primary text-primary-foreground" : "bg-secondary/40 text-secondary-foreground"
                               )}
                               onClick={() => toggleIndustryTag(tag)}
                             >
                               {tag}
                             </Badge>
                          ))}
                       </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Commission Structure */}
                {currentStep === 5 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-black tracking-tight">How do you want to reward partners?</h1>
                      <p className="text-muted-foreground tracking-tight font-bold">Fair incentives attract the best marketers.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <Card 
                         className={cn(
                           "p-8 cursor-pointer border-none rounded-3xl shadow-none transition-all ring-0",
                           data.commissionType === "percentage" ? "bg-primary text-primary-foreground" : "bg-secondary/20 hover:bg-secondary/30"
                         )}
                         onClick={() => updateData({ commissionType: "percentage" })}
                       >
                         <p className="text-center font-black tracking-tight text-[12px]">% of revenue</p>
                       </Card>
                       <Card 
                         className={cn(
                           "p-8 cursor-pointer border-none rounded-3xl shadow-none transition-all ring-0",
                           data.commissionType === "flat" ? "bg-primary text-primary-foreground" : "bg-secondary/20 hover:bg-secondary/30"
                         )}
                         onClick={() => updateData({ commissionType: "flat" })}
                       >
                         <p className="text-center font-black tracking-tight text-[12px]">Flat fee per sale</p>
                       </Card>
                    </div>

                    <div className="space-y-8 pt-6">
                       <div className="flex items-center justify-between px-2 text-3xl font-black tracking-tight">
                         <span>Reward</span>
                         <span className="text-primary tabular-nums">{data.commissionValue}{data.commissionType === "percentage" ? "%" : "$"}</span>
                       </div>
                       
                       <input 
                         type="range"
                         min="5"
                         max="60"
                         step="5"
                         value={data.commissionValue}
                         onChange={(e) => updateData({ commissionValue: parseInt(e.target.value) })}
                         className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
                       />
                       
                       <div className="flex items-center justify-between text-[12px] text-muted-foreground font-black px-2">
                          <span>5%</span>
                          <span>60%</span>
                       </div>

                       <div className="p-8 rounded-3xl bg-blue-50/50 text-center">
                          <p className="text-[12px] font-black text-blue-800">Similar products usually offer 20–30%</p>
                       </div>

                       <div className="flex items-center justify-between p-8 bg-secondary/20 rounded-3xl">
                          <div className="space-y-1">
                            <p className="font-black tracking-tight text-sm">Recurring commissions</p>
                            <p className="text-[12px] text-muted-foreground font-black">Apply to all future payments</p>
                          </div>
                          <Checkbox 
                            checked={data.recurring}
                            onCheckedChange={(checked) => updateData({ recurring: checked as boolean })}
                            className="size-6 rounded-md border-none bg-background data-[state=checked]:bg-primary shadow-none"
                          />
                       </div>
                    </div>
                  </div>
                )}

                {/* Step 6: Product Access */}
                {currentStep === 6 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                       <h1 className="text-3xl font-black tracking-tight">Do marketers get access to your product?</h1>
                       <p className="text-muted-foreground tracking-tight font-bold">Access helps partners create authentic reviews.</p>
                    </div>
                    <div className="space-y-3">
                       {[
                         { id: "none", label: "No access", color: "bg-red-50/50" },
                         { id: "demo", label: "Demo / limited access", color: "bg-blue-50/50" },
                         { id: "after-approval", label: "Full access after approval", color: "bg-purple-50/50" },
                         { id: "after-conversion", label: "Full access after first conversion", color: "bg-green-50/50" },
                       ].map((item) => (
                         <Card
                           key={item.id}
                           className={cn(
                             "flex cursor-pointer items-center ring-0 px-10 transition-all duration-300 border-none rounded-3xl shadow-none",
                             item.color,
                             data.productAccess === item.id 
                               ? "bg-primary text-primary-foreground" 
                               : "hover:bg-primary/10"
                           )}
                           onClick={() => updateData({ productAccess: item.id })}
                         >
                           <p className="text-sm font-black tracking-tight">{item.label}</p>
                         </Card>
                       ))}
                    </div>
                  </div>
                )}

                {/* Step 7: Refund & Payout */}
                {currentStep === 7 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                       <h1 className="text-3xl font-black tracking-tight">When should commissions become payable?</h1>
                       <p className="text-muted-foreground tracking-tight font-bold">Commissions stay pending until the refund window closes.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       {["7", "14", "30", "60"].map((days) => (
                         <Card
                           key={days}
                           className={cn(
                             "flex h-28 flex-col items-center ring-0 justify-center cursor-pointer transition-all duration-300 border-none rounded-3xl shadow-none",
                             data.refundWindow === days ? "bg-primary text-primary-foreground" : "bg-secondary/20 hover:bg-secondary/30"
                           )}
                           onClick={() => updateData({ refundWindow: days })}
                         >
                           <p className="text-4xl font-black tabular-nums">{days}</p>
                           <p className="text-[12px] font-black opacity-80">Days</p>
                         </Card>
                       ))}
                    </div>
                    <div className="p-10 rounded-3xl bg-secondary/10 space-y-6">
                       <div className="flex items-center gap-4">
                         <div className="size-1.5 rounded-full bg-primary" />
                         <p className="text-[16px] font-black text-muted-foreground">Directly maps to payout scheduling</p>
                       </div>
                       <div className="flex items-center gap-4">
                         <div className="size-1.5 rounded-full bg-primary" />
                         <p className="text-[16px] font-black text-muted-foreground">Mitigates loss from refunds</p>
                       </div>
                       <div className="flex items-center gap-4">
                         <div className="size-1.5 rounded-full bg-primary" />
                         <p className="text-[16px] font-black text-muted-foreground">Sets professional expectations</p>
                       </div>
                    </div>
                  </div>
                )}

                {/* Step 8: Approval & Control */}
                {currentStep === 8 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                       <h1 className="text-3xl font-black tracking-tight">How do partners join?</h1>
                       <p className="text-muted-foreground tracking-tight font-bold">Choose between ease of growth and tight control.</p>
                    </div>
                    <div className="space-y-4">
                       <Card 
                         className={cn(
                           "p-10 cursor-pointer ring-0 border-none rounded-3xl shadow-none transition-all",
                           data.approvalType === "instant" ? "bg-green-50/50" : "bg-secondary/20"
                         )}
                         onClick={() => updateData({ approvalType: "instant" })}
                       >
                         <p className="text-xl font-black tracking-tight">Instant access</p>
                         <p className="text-[12px] text-muted-foreground font-black mt-1">Any marketer can start immediately</p>
                       </Card>

                       <Card 
                         className={cn(
                           "p-10 cursor-pointer ring-0 border-none rounded-3xl shadow-none transition-all",
                           data.approvalType === "request" ? "bg-blue-50/50" : "bg-secondary/20"
                         )}
                         onClick={() => updateData({ approvalType: "request" })}
                       >
                          <p className="text-xl font-black tracking-tight">Request approval</p>
                          <p className="text-[12px] text-muted-foreground font-black mt-1">Review every application manually</p>
                       </Card>

                       <div className="flex items-center justify-between p-8 bg-secondary/30 rounded-3xl">
                          <p className="font-black tracking-tight text-xs">Limit max marketers</p>
                          <Checkbox 
                            checked={data.limitMarketers}
                            onCheckedChange={(checked) => updateData({ limitMarketers: checked as boolean })}
                            className="size-6 rounded-md bg-background data-[state=checked]:bg-primary shadow-none"
                          />
                       </div>
                    </div>
                  </div>
                )}

                {/* Step 9: Program Summary */}
                {currentStep === 9 && (
                   <div className="space-y-8">
                      <div className="space-y-2 text-center text-balance">
                        <h1 className="text-4xl font-black tracking-tight">Review and launch.</h1>
                      </div>
                      <div className="p-10 rounded-3xl bg-primary/5 space-y-10">
                         <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                            <div>
                              <p className="text-[12px] font-black text-muted-foreground mb-2">Product</p>
                              <p className="font-black text-xl tracking-tight">{data.projectName || "Unnamed"}</p>
                            </div>
                            <div>
                              <p className="text-[12px] font-black text-muted-foreground mb-2">Commission</p>
                              <p className="font-black text-xl text-primary tracking-tight">{data.commissionValue}{data.commissionType === "percentage" ? "%" : "$"}</p>
                            </div>
                            <div>
                              <p className="text-[12px] font-black text-muted-foreground mb-2">Refund Window</p>
                              <p className="font-black text-xl tracking-tight">{data.refundWindow} Days</p>
                            </div>
                            <div>
                              <p className="text-[12px] font-black text-muted-foreground mb-2">Access</p>
                              <p className="font-black text-xl tracking-tight">{data.productAccess === "NONE" ? "None" : data.productAccess}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                )}

                {/* Step 10: Recommended partners */}
                {currentStep === 10 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                       <h1 className="text-3xl font-black tracking-tight">Recommended partners.</h1>
                       <p className="text-muted-foreground tracking-tight font-bold">We found marketers who match your program setup.</p>
                    </div>
                    <div className="space-y-4">
                       {matchedMarketers.map((m, i) => (
                         <Card
                           key={i}
                           className={cn(
                             "p-8 flex justify-between ring-0 border-none rounded-3xl transition-all shadow-none outline-none",
                             m.color
                           )}
                         >
                            <div className="flex items-center gap-6">
                               <div className="size-14 rounded-full bg-background" />
                               <div>
                                  <p className="font-black text-xl tracking-tight">{m.name}</p>
                                  <p className="text-[12px] font-black text-muted-foreground">{m.style} • {m.region}</p>
                               </div>
                            </div>
                            <Button size="lg" className="rounded-3xl px-10 font-black text-[12px] shadow-none">Invite</Button>
                         </Card>
                       ))}
                    </div>
                  </div>
                )}

                {/* Step 11: Next Steps */}
                {currentStep === 11 && (
                  <div className="space-y-12 text-center">
                    <div className="space-y-4">
                      <h1 className="text-4xl font-black tracking-tight">Program created.</h1>
                      <p className="text-muted-foreground text-lg tracking-tight font-bold">Your dashboard is ready for launch.</p>
                    </div>
                    <div className="space-y-4 py-8">
                      <div className="flex flex-col gap-4">
                         {[
                           "Connect Stripe to pay partners",
                           "Add tracking snippet to your landing page",
                           "Send invites to matched marketers",
                           "Personalize your public dashboard",
                         ].map((item, i) => (
                            <div key={i} className="flex items-center gap-8 text-[16px] font-bold text-left bg-secondary/20 p-4 rounded-3xl border-none text-muted-foreground">
                              <div className="size-1.5 rounded-full bg-primary" />
                              {item}
                            </div>
                         ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons - Integrated inline */}
                <div className="mt-12 flex items-center justify-between pt-12 border-t border-transparent">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className={cn(
                      "rounded-3xl h-14 px-10 text-[12px] font-black hover:bg-secondary/20 hover:bg-secondary/30 transition-all shadow-none border-none cursor-pointer",
                      currentStep === 1 && "invisible"
                    )}
                  >
                    Back
                  </Button>

                  {currentStep < 11 ? (
                    <Button 
                      size="lg" 
                      onClick={nextStep}
                      className="px-14 h-16 rounded-3xl bg-primary text-primary-foreground text-[12px] font-black border-none transition-all hover:scale-105 active:scale-95 shadow-none cursor-pointer"
                    >
                      {currentStep === 9 ? "Publish program" : "Continue"}
                    </Button>
                  ) : (
                    <Button size="lg" className="px-14 h-16 rounded-3xl bg-primary text-primary-foreground text-[12px] font-black border-none transition-all hover:scale-105 active:scale-95 shadow-none cursor-pointer">
                      Go to dashboard
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
