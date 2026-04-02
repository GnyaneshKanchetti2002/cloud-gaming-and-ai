import React from 'react';

export default function SSHKeysPage() {
  return (
    <div className="flex flex-col gap-6 text-white">
      <div>
        <h1 className="text-2xl font-semibold mb-1">SSH Keys & DCV</h1>
        <p className="text-gray-400 text-sm">Manage public keys and remote desktop connection protocols for your nodes.</p>
      </div>

      <div className="bg-[#111827] border border-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">Stored SSH Keys</h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors">
            + Add Public Key
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-white">admin-desktop-key</h3>
                <span className="text-[10px] uppercase bg-gray-700 px-2 py-0.5 rounded text-gray-300">RSA 4096</span>
              </div>
              <p className="text-xs text-gray-500 font-mono truncate max-w-md">ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQD...</p>
            </div>
            <button className="text-red-500 hover:text-red-400 text-sm px-3 py-1 border border-red-500/30 hover:bg-red-500/10 rounded transition-colors">
              Delete
            </button>
          </div>
          
          <div className="text-center p-6 text-sm text-gray-500 border border-dashed border-gray-700 rounded-lg">
            No additional keys found. Add a key to securely connect to your provisioned slices.
          </div>
        </div>
      </div>
    </div>
  );
}