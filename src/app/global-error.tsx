"use client";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-semibold text-slate-700 mb-2">Application Error</h1>
            <p className="text-sm text-slate-400 mb-6">{error.message}</p>
            <button onClick={reset} className="px-4 py-2 bg-emerald-500 text-white rounded-lg">Try again</button>
          </div>
        </div>
      </body>
    </html>
  );
}
