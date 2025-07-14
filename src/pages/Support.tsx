import React from 'react';

const Support = () => (
  <div className="max-w-2xl mx-auto py-12 px-4">
    <h1 className="text-3xl font-bold mb-4">Support</h1>
    <p className="mb-6">Need help with BillBlaze POS? Our support team is here to assist you with any questions or issues you may have. Please reach out using the contact information below or visit our help center for FAQs and guides.</p>
    <div className="bg-blue-50 p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Contact Support</h2>
      <ul className="list-disc pl-6">
        <li>Email: <a href="mailto:support@billblaze.in" className="text-blue-600 underline">support@billblaze.in</a></li>
        <li>Phone: <a href="tel:+911234567890" className="text-blue-600 underline">+91 12345 67890</a></li>
        <li>Help Center: <a href="https://billblaze.in/support" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Visit Support Portal</a></li>
      </ul>
    </div>
  </div>
);

export default Support; 