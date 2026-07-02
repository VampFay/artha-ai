"use client";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
      <div className="text-center max-w-md">
        <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-700 mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-400 mb-6">{error.message || "An unexpected error occurred."}</p>
        <Button onClick={reset} className="bg-emerald-500 hover:bg-emerald-600">Try again</Button>
      </div>
    </div>
  );
}
