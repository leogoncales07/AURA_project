"use client";

import AnoAI from "@/components/ui/animated-shader-background";

export default function DemoPage() {
  return (
    <div className="w-full h-screen bg-background relative overflow-hidden flex items-center justify-center">
      <div className="z-10 text-center space-y-4 max-w-2xl px-6">
        <h1 className="text-5xl font-bold font-outfit text-gradient animate-float">
          Ethereal Aurora
        </h1>
        <p className="text-lg text-muted-foreground">
          Experience the calm, non-overwhelming shader effect perfectly adapted to your app's light and dark modes.
        </p>
        <div className="pt-8">
            <button className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
                Explore More
            </button>
        </div>
      </div>
      
      {/* The component itself is fixed by default in my implementation for root layout, 
          but if it were absolute it would show here too. */}
      <AnoAI />
    </div>
  );
}
