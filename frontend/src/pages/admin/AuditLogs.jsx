import { useState, useEffect } from 'react';
import { Activity, Download, Search, Calendar, Filter, Eye, RefreshCw } from 'lucide-react';
import api from '../../services/api';

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    start_date: '',
    end_date: '',
    status: '',
    page: 1
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/audit', { params: filters });
      setLogs(response.data.data.logs);
      setPagination({
        page: response.data.data.page,
        limit: response.data.data.limit,
        total: response.data.data.total,
        pages: response.data.data.pages
      });
    } catch (error) {
      console.error('Fetch logs error:', error);
      alert('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/audit/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/audit/export', {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export logs');
    }
  };

  const viewLogDetails = async (logId) => {
    try {
      const response = await api.get(`/audit/${logId}`);
      setSelectedLog(response.data.log);
      setShowDetails(true);
    } catch (error) {
      console.error('View log details error:', error);
      alert('Failed to fetch log details');
    }
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800';
    if (action.includes('PAYMENT')) return 'bg-yellow-100 text-yellow-800';
    if (action.includes('FAILED')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      entity_type: '',
      start_date: '',
      end_date: '',
      status: '',
      page: 1
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              Audit Logs
            </h1>
            <p className="text-gray-600 mt-1">Track system activities and changes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Total Logs (30d)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_logs || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Unique Users</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.unique_users || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Total Logins</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.login_count || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Failed Actions</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.failed_count || 0}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </h3>
            {(filters.action || filters.entity_type || filters.start_date || filters.end_date || filters.status) && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="USER_LOGIN">Login</option>
              <option value="USER_LOGOUT">Logout</option>
              <option value="LOGIN_FAILED">Login Failed</option>
              <option value="CREATE_USER">Create User</option>
              <option value="UPDATE_USER">Update User</option>
              <option value="DELETE_USER">Delete User</option>
              <option value="CREATE_PRODUCT">Create Product</option>
              <option value="UPDATE_PRODUCT">Update Product</option>
              <option value="CREATE_ORDER">Create Order</option>
              <option value="UPDATE_ORDER">Update Order</option>
              <option value="PAYMENT_SUCCESS">Payment Success</option>
              <option value="PAYMENT_FAILED">Payment Failed</option>
            </select>

            <select
              value={filters.entity_type}
              onChange={(e) => setFilters({ ...filters, entity_type: e.target.value, page: 1 })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Entities</option>
              <option value="USER">User</option>
              <option value="PRODUCT">Product</option>
              <option value="ORDER">Order</option>
              <option value="PAYMENT">Payment</option>
              <option value="INVOICE">Invoice</option>
              <option value="QUOTATION">Quotation</option>
            </select>

            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value, page: 1 })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Start Date"
            />

            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value, page: 1 })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="End Date"
            />

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading audit logs...</p>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{log.user_email || 'System'}</div>
                          {log.user_id && (
                            <div className="text-xs text-gray-500">ID: {log.user_id}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadgeColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {log.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          log.status === 'SUCCESS' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => viewLogDetails(log.id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setFilters({ ...filters, page })}
                      className={`px-3 py-1 rounded ${
                        filters.page === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page === pagination.pages}
                  className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Audit Log Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Log ID</label>
                  <p className="text-gray-900">{selectedLog.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Timestamp</label>
                  <p className="text-gray-900">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">User Email</label>
                  <p className="text-gray-900">{selectedLog.user_email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">User ID</label>
                  <p className="text-gray-900">{selectedLog.user_id || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Action</label>
                  <p>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getActionBadgeColor(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      selectedLog.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedLog.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Entity Type</label>
                  <p className="text-gray-900">{selectedLog.entity_type || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Entity ID</label>
                  <p className="text-gray-900">{selectedLog.entity_id || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">IP Address</label>
                  <p className="text-gray-900 font-mono">{selectedLog.ip_address || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Request Method</label>
                  <p className="text-gray-900">{selectedLog.request_method || '-'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900 mt-1">{selectedLog.description || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Request Path</label>
                <p className="text-gray-900 font-mono text-sm break-all">{selectedLog.request_path || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">User Agent</label>
                <p className="text-gray-900 text-sm break-all">{selectedLog.user_agent || '-'}</p>
              </div>
              {selectedLog.changes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Changes</label>
                  <pre className="mt-1 p-4 bg-gray-50 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;
