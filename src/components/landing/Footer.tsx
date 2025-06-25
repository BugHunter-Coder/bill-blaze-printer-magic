
import { Store } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-gray-950 text-gray-400 py-12 px-4">
      <div className="container mx-auto text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center">
            <Store className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">BillBlaze</span>
        </div>
        <p className="text-gray-500">
          © 2024 BillBlaze. All rights reserved. Built with ❤️ for retailers everywhere.
        </p>
      </div>
    </footer>
  );
};
