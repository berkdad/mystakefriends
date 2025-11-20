import React, { useState } from 'react';
import { X, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function TestReportsModal({ stakes, onClose }) {
  const [reportType, setReportType] = useState('stake'); // 'stake' or 'ward'
  const [selectedStakeId, setSelectedStakeId] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const selectedStake = stakes.find(s => s.id === selectedStakeId);
  const functions = getFunctions();

  const handleSendReport = async () => {
    if (!selectedStakeId) {
      setError('Please select a stake');
      return;
    }

    if (reportType === 'ward' && !selectedWardId) {
      setError('Please select a ward');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (reportType === 'stake') {
        const sendTestStakeReport = httpsCallable(functions, 'sendTestStakeReport');
        const result = await sendTestStakeReport({ stakeId: selectedStakeId });
        setSuccess(`✅ Stake report sent to berkdad@gmail.com! Check your inbox.`);
      } else {
        const sendTestWardReport = httpsCallable(functions, 'sendTestWardReport');
        const result = await sendTestWardReport({
          stakeId: selectedStakeId,
          wardId: selectedWardId
        });
        setSuccess(`✅ Ward report sent to berkdad@gmail.com! Check your inbox.`);
      }
    } catch (err) {
      console.error('Error sending test report:', err);
      setError(`Failed to send report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-rose-500 to-amber-500 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Test Weekly Reports</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{success}</p>
                <p className="text-sm mt-1">The report was sent with the subject: "My Stake Friends - Weekly Report (TEST PREVIEW)"</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="stake"
                  checked={reportType === 'stake'}
                  onChange={(e) => {
                    setReportType(e.target.value);
                    setSelectedWardId('');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-rose-500 focus:ring-rose-500"
                />
                <span className="text-gray-700">Stake Report (All Wards)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="ward"
                  checked={reportType === 'ward'}
                  onChange={(e) => {
                    setReportType(e.target.value);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-rose-500 focus:ring-rose-500"
                />
                <span className="text-gray-700">Ward Report (Single Ward)</span>
              </label>
            </div>
          </div>

          {/* Stake Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Stake *
            </label>
            <select
              value={selectedStakeId}
              onChange={(e) => {
                setSelectedStakeId(e.target.value);
                setSelectedWardId('');
                setError('');
                setSuccess('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="">-- Select a Stake --</option>
              {stakes.map(stake => (
                <option key={stake.id} value={stake.id}>
                  {stake.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ward Selection (only show if ward report type) */}
          {reportType === 'ward' && selectedStake && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Ward *
              </label>
              <select
                value={selectedWardId}
                onChange={(e) => {
                  setSelectedWardId(e.target.value);
                  setError('');
                  setSuccess('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="">-- Select a Ward --</option>
                {(selectedStake.wards || []).map(ward => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>📧 Test Email:</strong> The report will be sent to <strong>berkdad@gmail.com</strong>
            </p>
            <p className="text-sm text-blue-700 mt-2">
              This generates a report for the past week (last Sunday through Saturday) with all statistics and week-over-week comparisons.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSendReport}
              disabled={loading || !selectedStakeId || (reportType === 'ward' && !selectedWardId)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-lg hover:from-rose-600 hover:to-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending Report...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Test Report
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}