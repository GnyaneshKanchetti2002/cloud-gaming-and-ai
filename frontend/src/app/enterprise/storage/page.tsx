import React from 'react';

export default function TrueNASStoragePage() {
  return (
    <div className="flex flex-col gap-6 text-white">
      <div>
        <h1 className="text-2xl font-semibold mb-1">TrueNAS Storage</h1>
        <p className="text-gray-400 text-sm">Manage your enterprise NAS pools and dataset allocations.</p>
      </div>

      <div className="bg-[#111827] border border-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">Storage Pools</h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors">
            + Connect Pool
          </button>
        </div>
        
        {/* Placeholder for Storage Data */}
        <div className="border border-gray-800 rounded-md overflow-hidden text-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-800/50 text-gray-400">
              <tr>
                <th className="p-4 font-medium">Pool Name</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Capacity</th>
                <th className="p-4 font-medium">Usage</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr>
                <td className="p-4">flash-nvme-01</td>
                <td className="p-4"><span className="text-green-400 bg-green-400/10 px-2 py-1 rounded-full text-xs">Healthy</span></td>
                <td className="p-4">12.5 TB</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '45%' }}></div></div>
                    <span className="text-gray-400 text-xs">45%</span>
                  </div>
                </td>
                <td className="p-4 text-right text-blue-500 hover:text-blue-400 cursor-pointer">Manage</td>
              </tr>
            </tbody>
          </table>
          <div className="p-8 text-center text-gray-500">
             No additional storage pools found. Ensure your TrueNAS API key is valid.
          </div>
        </div>
      </div>
    </div>
  );
}