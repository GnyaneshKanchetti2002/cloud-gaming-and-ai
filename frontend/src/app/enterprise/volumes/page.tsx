import React from 'react';

export default function BlockVolumesPage() {
  return (
    <div className="flex flex-col gap-6 text-white">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Block Volumes</h1>
        <p className="text-gray-400 text-sm">Provision and attach high-performance block storage to your compute slices.</p>
      </div>

      <div className="bg-[#111827] border border-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">Active Volumes</h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors">
            + Create Volume
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Example Volume Card */}
          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-blue-400">vol-nvme-a1b2</h3>
                <p className="text-xs text-gray-500 mt-1">Attached to: instance-982</p>
              </div>
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">In Use</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400 border-t border-gray-700 pt-3">
              <span>Size: 500 GB</span>
              <span>Type: NVMe</span>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center border-dashed cursor-pointer hover:border-gray-500 transition-colors text-gray-400 min-h-[120px]">
            <span className="text-lg mb-1">+</span>
            <span className="text-sm">Provision New Volume</span>
          </div>
        </div>
      </div>
    </div>
  );
}