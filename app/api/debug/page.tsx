import { DebugPlaces } from "@/components/debug-places"

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Google Places API Debug</h1>
        <DebugPlaces />
      </div>
    </div>
  )
}
