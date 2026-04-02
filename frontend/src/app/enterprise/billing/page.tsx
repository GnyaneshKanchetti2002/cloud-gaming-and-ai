import React from 'react';

export default function BillingDefaultsPage() {
  return (
    <div className="flex flex-col gap-6 text-white">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Billing Defaults</h1>
        <p className="text-gray-400 text-sm">Manage your organization's payment methods and view billing history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Balance Card */}
        <div className="bg-[#111827] border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Current Balance</h2>
          <div className="text-4xl font-bold text-white mb-2">$0.00</div>
          <p className="text-sm text-gray-400 mb-6">Est. end of month burn: $0.00</p>
          <button className="w-full bg-white text-black font-medium py-2 rounded-md hover:bg-gray-200 transition-colors">
            Add Funds
          </button>
        </div>

        {/* Payment Method Card */}
        <div className="bg-[#111827] border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Payment Method</h2>
          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-6 bg-gray-700 rounded flex items-center justify-center text-[10px] font-bold">VISA</div>
              <div>
                <div className="text-sm font-medium">•••• •••• •••• 4242</div>
                <div className="text-xs text-gray-500">Expires 12/28</div>
              </div>
            </div>
            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">Default</span>
          </div>
          <button className="text-sm text-blue-500 hover:text-blue-400">Update payment method &rarr;</button>
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-[#111827] border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Recent Invoices</h2>
        <div className="text-sm text-gray-500 text-center py-8">
          No invoices available for this billing period.
        </div>
      </div>
    </div>
  );
}