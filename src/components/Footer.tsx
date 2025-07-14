import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="w-full py-6 bg-gray-100 border-t mt-8">
    <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
      <div className="text-gray-600 text-sm mb-2 sm:mb-0">&copy; {new Date().getFullYear()} BillBlaze POS. All rights reserved.</div>
      <nav className="flex flex-wrap gap-4 text-sm">
        <Link to="/support" className="text-blue-600 hover:underline">Support</Link>
        <Link to="/termsservice" className="text-blue-600 hover:underline">Terms of Service</Link>
        <Link to="/policy" className="text-blue-600 hover:underline">Privacy Policy</Link>
        <Link to="/refundpolicy" className="text-blue-600 hover:underline">Refund Policy</Link>
      </nav>
    </div>
  </footer>
);

export default Footer; 