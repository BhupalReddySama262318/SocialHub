import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-2 sm:px-4">
      <Card className="w-full max-w-md mx-4 p-3 sm:p-6">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex mb-2 sm:mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-2 sm:mt-4 text-xs sm:text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
