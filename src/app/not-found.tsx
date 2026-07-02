import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-slate-200 mb-2">404</p>
        <h1 className="text-xl font-semibold text-slate-700 mb-2">Page not found</h1>
        <p className="text-sm text-slate-400 mb-6">The page you're looking for doesn't exist.</p>
        <Link href="/dashboard"><Button className="bg-emerald-500 hover:bg-emerald-600">Go to Dashboard</Button></Link>
      </div>
    </div>
  );
}
