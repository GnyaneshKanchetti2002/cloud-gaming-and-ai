import React from 'react';

export default function VPCNetworksPage() {
  return (
    <div className="flex flex-col gap-6 text-white">
      <div>
        <h1 className="text-2xl font-semibold mb-1">VPC Networks</h1>
        <p className="text-gray-400 text-sm">Configure isolated virtual private clouds and internal subnets.</p>
      </div>

      <div className="bg-[#111827] border border-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">Configured Networks</h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors">
            + Create VPC
          </button>
        </div>

        <div className="border border-gray-800 rounded-md overflow-hidden text-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-800/50 text-gray-400">
              <tr>
                <th className="p-4 font-medium">VPC Name</th>
                <th className="p-4 font-medium">CIDR Block</th>
                <th className="p-4 font-medium">Gateways</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr>
                <td className="p-4 font-medium">default-vpc-eu1</td>
                <td className="p-4 font-mono text-gray-400">10.0.0.0/16</td>
                <td className="p-4">igw-01, nat-01</td>
                <td className="p-4"><span className="text-green-400">Active</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}