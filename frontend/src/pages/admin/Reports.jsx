import { useState, useEffect } from 'react';
import { Download, Calendar, FileText, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import api from '../../services/api';

function Reports() {
  const [reportType, setReportType] = useState('revenue');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/admin/reports', {
        params: {
          type: reportType,
          start_date: startDate,
          end_date: endDate
        }
      });
      setReportData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const { title, summary, data } = reportData;

    doc.setFontSize(18);
    doc.text(title, 14, 20);

    doc.setFontSize(10);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 28);

    if (summary) {
      doc.setFontSize(12);
      doc.text('Summary', 14, 38);
      doc.setFontSize(10);
      let yPos = 45;
      Object.entries(summary).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 14, yPos);
        yPos += 7;
      });
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]).map(key => ({
        header: key.replace(/_/g, ' ').toUpperCase(),
        dataKey: key
      }));

      doc.autoTable({
        columns,
        body: data,
        startY: summary ? 70 : 40,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] }
      });
    }

    doc.save(`${reportType}_report_${startDate}_${endDate}.pdf`);
  };

  const exportToExcel = () => {
    if (!reportData || !reportData.data) return;

    const worksheet = XLSX.utils.json_to_sheet(reportData.data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `${reportType}_report_${startDate}_${endDate}.xlsx`);
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.data) return;

    const worksheet = XLSX.utils.json_to_sheet(reportData.data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const data = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(data, `${reportType}_report_${startDate}_${endDate}.csv`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
          <p className="text-gray-600 mt-1">Generate and export business reports</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="revenue">Revenue Report</option>
                <option value="orders">Orders Report</option>
                <option value="rentals">Rentals Report</option>
                <option value="users">User Activity Report</option>
                <option value="inventory">Inventory Report</option>
                <option value="payments">Payments Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={generateReport}
                disabled={loading}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {reportData && (
          <>
            <div className="flex gap-3 mb-6">
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-2">{reportData.title}</h2>
              <p className="text-gray-600 text-sm mb-6">
                Period: {startDate} to {endDate}
              </p>

              {reportData.summary && (
                <div className="grid md:grid-cols-4 gap-4 mb-8">
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <div key={key} className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">
                        {key.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p className="text-2xl font-bold text-blue-900">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {reportData.data && reportData.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(reportData.data[0]).map((key) => (
                          <th
                            key={key}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {key.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.data.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((value, vidx) => (
                            <td key={vidx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No data available for this period</p>
              )}
            </div>
          </>
        )}

        {!reportData && !loading && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              Select report type and date range, then click "Generate Report"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
