import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const DataTable = ({ columns, data, loading, pagination }) => {
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil((pagination?.total || 0) / (pagination?.limit || 20));

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-gray-700/30 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-600"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 bg-gray-700 rounded-lg text-white font-medium">
              {pagination.page} / {totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-600"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;