"use client";
import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw, Trash2, Clock, Mail, User, FileText } from "lucide-react";
import Glass from "./Glass";

export default function FailedEmails() {
  const [failedEmails, setFailedEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingIds, setRetryingIds] = useState(new Set());
  const [clearing, setClearing] = useState(false);

  const fetchFailedEmails = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/failedEmails');
      const data = await response.json();
      
      if (data.success) {
        setFailedEmails(data.failedEmails);
      } else {
        console.error('Failed to fetch failed emails:', data.error);
      }
    } catch (error) {
      console.error('Error fetching failed emails:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedEmails();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchFailedEmails, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (emailId) => {
    try {
      setRetryingIds(prev => new Set(prev).add(emailId));
      
      const response = await fetch('/api/failedEmails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'retry',
          emailId: emailId
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove from failed emails list
        setFailedEmails(prev => prev.filter(email => email.id !== emailId));
      } else {
        console.error('Failed to retry email:', data.error);
        alert(`Failed to retry email: ${data.error}`);
      }
    } catch (error) {
      console.error('Error retrying email:', error);
      alert(`Error retrying email: ${error.message}`);
    } finally {
      setRetryingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(emailId);
        return newSet;
      });
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all failed emails? This action cannot be undone.')) {
      return;
    }

    try {
      setClearing(true);
      
      const response = await fetch('/api/failedEmails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clear'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFailedEmails([]);
      } else {
        console.error('Failed to clear failed emails:', data.error);
        alert(`Failed to clear failed emails: ${data.error}`);
      }
    } catch (error) {
      console.error('Error clearing failed emails:', error);
      alert(`Error clearing failed emails: ${error.message}`);
    } finally {
      setClearing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getErrorType = (error) => {
    if (error.includes('Authentication')) return 'Authentication Error';
    if (error.includes('Network')) return 'Network Error';
    if (error.includes('Template')) return 'Template Error';
    if (error.includes('Recipient')) return 'Recipient Error';
    return 'Processing Error';
  };

  if (loading) {
    return (
      <div className="p-4">
        <Glass tier="thick" className="p-4">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Loading failed emails...</span>
          </div>
        </Glass>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Glass tier="thick" className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold">Failed Emails</h3>
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              {failedEmails.length}
            </span>
          </div>
          
          {failedEmails.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors disabled:opacity-50"
            >
              {clearing ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1" />
              )}
              Clear All
            </button>
          )}
        </div>

        {failedEmails.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No failed emails</p>
            <p className="text-sm">All emails have been sent successfully!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {failedEmails.map((email) => (
              <div
                key={email.id}
                className="border border-red-200 rounded-lg p-3 bg-red-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <User className="w-4 h-4 text-gray-600 mr-1" />
                      <span className="font-medium text-sm">{email.recipientEmail}</span>
                    </div>
                    
                    <div className="flex items-center mb-1">
                      <FileText className="w-4 h-4 text-gray-600 mr-1" />
                      <span className="text-sm text-gray-600">
                        {email.metadata?.templateName || 'Unknown Template'}
                      </span>
                    </div>
                    
                    <div className="flex items-center mb-2">
                      <Clock className="w-4 h-4 text-gray-600 mr-1" />
                      <span className="text-xs text-gray-500">
                        {formatDate(email.failedAt)}
                      </span>
                      <span className="ml-2 px-2 py-0.5 bg-red-200 text-red-800 text-xs rounded">
                        {email.retryCount || 0} retries
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRetry(email.id)}
                    disabled={retryingIds.has(email.id) || !email.canRetry}
                    className="flex items-center px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {retryingIds.has(email.id) ? (
                      <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    {email.canRetry ? 'Retry' : 'Max Retries'}
                  </button>
                </div>
                
                <div className="text-xs">
                  <div className="mb-1">
                    <span className="font-medium text-red-700">
                      {getErrorType(email.error)}:
                    </span>
                  </div>
                  <div className="text-red-600 bg-red-100 p-2 rounded text-xs break-words">
                    {email.error}
                  </div>
                </div>
                
                {email.metadata?.senderEmail && (
                  <div className="text-xs text-gray-500 mt-2">
                    From: {email.metadata.senderEmail}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Total failed: {failedEmails.length}</span>
            <button
              onClick={fetchFailedEmails}
              className="flex items-center hover:text-gray-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </button>
          </div>
        </div>
      </Glass>
    </div>
  );
}
