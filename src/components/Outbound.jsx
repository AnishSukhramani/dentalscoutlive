// Import necessary React hooks and components
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Import custom UI components
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Outbound Component
 * 
 * Displays a list of practices with their contact information
 * and provides functionality to send emails to each practice.
 */
const Outbound = () => {
  // State to hold the list of practices fetched from Supabase
  const [practices, setPractices] = useState([]);
  const [emailCounts, setEmailCounts] = useState({});
  const [emailTemplates, setEmailTemplates] = useState({});
  const [senderEmails, setSenderEmails] = useState({});
  const [sendModes, setSendModes] = useState({});
  const [scheduledDates, setScheduledDates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);

  // Pagination state
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [customEntries, setCustomEntries] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPractices, setFilteredPractices] = useState([]);

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAllPage, setSelectAllPage] = useState(false);
  const [selectAllGlobal, setSelectAllGlobal] = useState(false);
  const [bulkTemplate, setBulkTemplate] = useState("");
  const [bulkSender, setBulkSender] = useState("");
  const [bulkSendMode, setBulkSendMode] = useState("");
  const [bulkScheduleType, setBulkScheduleType] = useState("");
  const [bulkScheduleDate, setBulkScheduleDate] = useState("");

  // Queue status state
  const [queueStatus, setQueueStatus] = useState({
    totalInQueue: 0,
    processedCount: 0,
    failedCount: 0,
    pendingCount: 0,
    hasFailedEntries: false,
    hasUnprocessedEntries: false,
    lastUpdated: null
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStartTime, setProcessingStartTime] = useState(null);
  
  // Scheduled emails state
  const [scheduledEmailsStatus, setScheduledEmailsStatus] = useState({
    total: 0,
    upcoming: 0,
    overdue: 0,
    emails: []
  });

  // Pagination logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPractices(practices);
      setPage(1);
      return;
    }
    const query = searchQuery.toLowerCase();
    const result = practices.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
    setFilteredPractices(result);
    setPage(1);
  }, [searchQuery, practices]);

  // Fetch queue status on component mount and periodically
  useEffect(() => {
    fetchQueueStatus();
    fetchScheduledEmailsStatus();
    
    // Set up periodic refresh every 10 seconds
    const interval = setInterval(() => {
      fetchQueueStatus();
      fetchScheduledEmailsStatus();
      // Also process scheduled emails automatically
      processScheduledEmails();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Highlight function
  const highlightMatch = (text) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery})`, "gi");
    return String(text).split(regex).map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <span key={i} className="bg-yellow-200 font-semibold">{part}</span>
      ) : (
        part
      )
    );
  };

  // Use filtered data for pagination
  const totalRows = filteredPractices.length;
  const totalPages = Math.ceil(totalRows / entriesPerPage);
  const startIndex = (page - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentPageData = filteredPractices.slice(startIndex, endIndex);

  // Get page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handleCustomEntriesChange = (e) => {
    const value = e.target.value;
    setCustomEntries(value);
    if (value && !isNaN(value) && value > 0 && value <= 100) {
      setEntriesPerPage(parseInt(value));
      setPage(1);
    }
  };

  const handleTemplateChange = (practiceEmail, templateValue) => {
    setEmailTemplates(prev => ({
      ...prev,
      [practiceEmail]: templateValue
    }));
  };

  const handleSenderEmailChange = (practiceEmail, senderValue) => {
    setSenderEmails(prev => ({
      ...prev,
      [practiceEmail]: senderValue
    }));
  };

  const handleSendModeChange = (practiceEmail, modeValue) => {
    setSendModes(prev => ({
      ...prev,
      [practiceEmail]: modeValue
    }));
    
    // Clear scheduled date when switching to draft mode
    if (modeValue === 'draft') {
      setScheduledDates(prev => ({
        ...prev,
        [practiceEmail]: null
      }));
    }
  };

  const handleScheduledDateChange = (practiceEmail, dateValue) => {
    setScheduledDates(prev => ({
      ...prev,
      [practiceEmail]: dateValue
    }));
  };

  // Fetch practices data from Supabase when the component mounts
  useEffect(() => {
    const fetchPractices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('practices')
          .select('email, first_name, email_sent_count, owner_name, id')
          .not('email', 'is', null);

        if (fetchError) {
          console.error('Error fetching practices:', fetchError);
          setError('Failed to load practices');
        } else {
          setPractices(data || []);
          
          // Extract email counts from the fetched data
          const counts = {};
          (data || []).forEach(practice => {
            if (practice.email) {
              counts[practice.email] = practice.email_sent_count || 0;
            }
          });
          setEmailCounts(counts);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchPractices();
    fetchTemplates();
    fetchUsers();
  }, []);

  // Remove the separate fetchEmailCounts function since we're getting counts directly

  // Handle sending email to a practice
  const handleSendEmail = async (practiceEmail) => {
    try {
      // Get the practice data
      const practice = practices.find(p => p.email === practiceEmail);
      if (!practice) {
        console.error('Practice not found:', practiceEmail);
        return;
      }

      // Get the selected values for this practice
      const templateId = emailTemplates[practiceEmail];
      const senderEmail = senderEmails[practiceEmail];
      const sendMode = sendModes[practiceEmail];
      const scheduledDate = scheduledDates[practiceEmail];

      // Validate that all required fields are selected
      if (!templateId || !senderEmail || !sendMode) {
        console.error('Missing required fields for email queue entry');
        return;
      }

      // Only proceed if send mode is 'send' (Send Directly) or 'draft' (Create Draft)
      if (sendMode !== 'send' && sendMode !== 'draft') {
        console.log('Send mode is not "send" or "draft", skipping email queue entry');
        return;
      }

      // Find the selected user to get additional user parameters
      const selectedUser = users.find(user => user.email === senderEmail);
      if (!selectedUser) {
        console.error('Selected user not found:', senderEmail);
        return;
      }

      // Create the email queue entry with user parameters
      const queueEntry = {
        recipientEmail: practiceEmail,
        recipientName: practice.first_name || 'N/A',
        templateId,
        senderEmail,
        senderName: selectedUser.name,
        senderPassword: selectedUser.password,
        sendMode,
        scheduledDate: scheduledDate || null,
        emailCount: emailCounts[practiceEmail] || 0
      };

      // Send to email queue API
      const response = await fetch('/api/emailQueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queueEntry),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Email queue entry created:', result);
        
        // Process the email queue after it's populated
        try {
          const processResponse = await fetch('/api/processEmailQueue', {
            method: 'POST',
          });
          const processResult = await processResponse.json();
          if (processResult.success) {
            console.log('Email queue processed successfully');
          } else {
            console.error('Error processing email queue:', processResult.error);
          }
        } catch (processorError) {
          console.error('Error processing email queue:', processorError);
          // Don't show error to user as the queue entry was still created successfully
        }
        
        // Show success message (you could add a toast notification here)
        const actionType = sendMode === 'send' ? 'Email queued for sending' : 'Draft saved to queue';
        alert(`${actionType} successfully for ${practiceEmail}`);
        
        // Update queue status after adding email
        setTimeout(() => {
          fetchQueueStatus();
        }, 1000);
      } else {
        const error = await response.json();
        console.error('Failed to create email queue entry:', error);
        alert('Failed to queue email. Please try again.');
      }
    } catch (error) {
      console.error('Error creating email queue entry:', error);
      alert('An error occurred while queuing the email.');
    }
  };

  // Helper for time conversion
  function convertTime(value, fromTz, toTz) {
    // value: 'HH:mm' string
    const [h, m] = value.split(":").map(Number);
    const now = new Date();
    now.setHours(h, m, 0, 0);
    // PST = UTC-8, IST = UTC+5:30
    let offset = 0;
    if (fromTz === 'PST' && toTz === 'IST') offset = 13.5;
    if (fromTz === 'IST' && toTz === 'PST') offset = -13.5;
    const newDate = new Date(now.getTime() + offset * 60 * 60 * 1000);
    const hh = String(newDate.getHours()).padStart(2, '0');
    const mm = String(newDate.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  function getCurrentTimeInTz(tz) {
    const now = new Date();
    if (tz === 'PST') {
      // PST = UTC-8
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const pst = new Date(utc - 8 * 3600000);
      return pst;
    } else if (tz === 'IST') {
      // IST = UTC+5:30
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const ist = new Date(utc + 5.5 * 3600000);
      return ist;
    }
    return now;
  }

  const PSTISTConverter = () => {
    // Live clocks for display
    const [livePst, setLivePst] = React.useState(() => {
      const d = getCurrentTimeInTz('PST');
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });
    const [liveIst, setLiveIst] = React.useState(() => {
      const d = getCurrentTimeInTz('IST');
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });

    // Input fields for conversion
    const [pstInput, setPstInput] = React.useState('');
    const [istInput, setIstInput] = React.useState('');

    // Live clocks update
    React.useEffect(() => {
      const interval = setInterval(() => {
        setLivePst(() => {
          const d = getCurrentTimeInTz('PST');
          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        });
        setLiveIst(() => {
          const d = getCurrentTimeInTz('IST');
          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        });
      }, 60000);
      return () => clearInterval(interval);
    }, []);

    // Conversion logic
    const handlePstInput = (e) => {
      const value = e.target.value;
      setPstInput(value);
      setIstInput(value ? convertTime(value, 'PST', 'IST') : '');
    };
    const handleIstInput = (e) => {
      const value = e.target.value;
      setIstInput(value);
      setPstInput(value ? convertTime(value, 'IST', 'PST') : '');
    };

    return (
      <div className="flex flex-col md:flex-row md:items-center md:space-x-8 w-full md:w-auto mb-4">
        <div className="flex flex-col items-center mb-2 md:mb-0">
          <span className="font-semibold text-xs text-gray-700">PST</span>
          <span className="text-lg font-mono text-blue-700">{livePst}</span>
          <input
            type="time"
            value={pstInput}
            onChange={handlePstInput}
            className="mt-1 border rounded px-2 py-1 text-xs w-20 text-center"
            placeholder="--:--"
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="font-semibold text-xs text-gray-700">IST</span>
          <span className="text-lg font-mono text-green-700">{liveIst}</span>
          <input
            type="time"
            value={istInput}
            onChange={handleIstInput}
            className="mt-1 border rounded px-2 py-1 text-xs w-20 text-center"
            placeholder="--:--"
          />
        </div>
      </div>
    );
  };

  // Selection logic
  const handleSelect = (id, checked) => {
    const updated = new Set(selectedIds);
    checked ? updated.add(id) : updated.delete(id);
    setSelectedIds(updated);
    setSelectAllPage(false);
    setSelectAllGlobal(false);
  };
  const handleSelectAllPage = () => {
    const updated = new Set(currentPageData.map((d) => d.email));
    setSelectedIds(updated);
    setSelectAllPage(true);
    setSelectAllGlobal(false);
  };
  const handleSelectAllGlobal = () => {
    setSelectedIds(new Set(filteredPractices.map((d) => d.email)));
    setSelectAllPage(false);
    setSelectAllGlobal(true);
  };
  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setSelectAllPage(false);
    setSelectAllGlobal(false);
    setBulkTemplate("");
    setBulkSender("");
    setBulkSendMode("");
    setBulkScheduleType("");
    setBulkScheduleDate("");
  };
  // Bulk actions
  const handleBulkTemplate = (value) => {
    setBulkTemplate(value);
    setEmailTemplates((prev) => {
      const updated = { ...prev };
      selectedIds.forEach((id) => { updated[id] = value; });
      return updated;
    });
  };
  const handleBulkSender = (value) => {
    setBulkSender(value);
    setSenderEmails((prev) => {
      const updated = { ...prev };
      selectedIds.forEach((id) => { updated[id] = value; });
      return updated;
    });
  };
  const handleBulkSendMode = (value) => {
    setBulkSendMode(value);
    setSendModes((prev) => {
      const updated = { ...prev };
      selectedIds.forEach((id) => { updated[id] = value; });
      return updated;
    });
    setBulkScheduleType("");
    setBulkScheduleDate("");
  };
  const handleBulkScheduleType = (value) => {
    setBulkScheduleType(value);
    if (value !== "schedule") setBulkScheduleDate("");
  };
  const handleBulkScheduleDate = (e) => {
    setBulkScheduleDate(e.target.value);
  };

  // Bulk send handler
  const handleBulkSend = async () => {
    if (!bulkTemplate || !bulkSender || !bulkSendMode) {
      alert('Please select template, sender, and send mode for bulk send');
      return;
    }

    if (bulkSendMode === 'send' && bulkScheduleType === 'schedule' && !bulkScheduleDate) {
      alert('Please select a schedule date for bulk send');
      return;
    }

    try {
      // Get selected practices - use email as the key since that's what the selection system uses
      const selectedPractices = practices.filter(practice => selectedIds.has(practice.email));
      
      console.log('Selected practices:', selectedPractices);
      console.log('Selected IDs:', Array.from(selectedIds));
      
      // Find the template and user details
      const template = templates.find(t => t.id === bulkTemplate);
      const user = users.find(u => u.email === bulkSender);
      
      if (!template || !user) {
        alert('Template or user not found');
        return;
      }

      // Create bulk entries for email queue
      const bulkEntries = selectedPractices.map(practice => ({
        id: Date.now() + Math.random(), // Generate unique ID
        recipientEmail: practice.email,
        recipientName: practice.owner_name || 'N/A',
        templateId: bulkTemplate,
        senderEmail: bulkSender,
        senderName: user.name,
        sendMode: bulkSendMode,
        scheduledDate: bulkSendMode === 'send' && bulkScheduleType === 'schedule' ? bulkScheduleDate : null,
        status: 'pending',
        createdAt: new Date().toISOString()
      }));

      console.log('Bulk entries to be sent:', bulkEntries);

      // Write bulk entries to email queue
      const response = await fetch('/api/emailQueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries: bulkEntries }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Bulk email queue entries created:', result);
        
        // Process the email queue after bulk entries are added
        try {
          const processResponse = await fetch('/api/processEmailQueue', {
            method: 'POST',
          });
          const processResult = await processResponse.json();
          if (processResult.success) {
            console.log('Bulk email queue processed successfully');
            alert(`Successfully queued ${bulkEntries.length} emails for processing`);
          } else {
            console.error('Error processing bulk email queue:', processResult.error);
            alert('Emails queued but processing failed. You can manually process the queue.');
          }
        } catch (processorError) {
          console.error('Error processing bulk email queue:', processorError);
          alert('Emails queued but processing failed. You can manually process the queue.');
        }
        
        // Clear selection after successful bulk send
        setSelectedIds(new Set());
        setBulkTemplate("");
        setBulkSender("");
        setBulkSendMode("");
        setBulkScheduleType("");
        setBulkScheduleDate("");
        
        // Update queue status after adding emails
        setTimeout(() => {
          fetchQueueStatus();
        }, 1000);
        
      } else {
        const error = await response.json();
        console.error('Failed to create bulk email queue entries:', error);
        alert('Failed to queue bulk emails. Please try again.');
      }
    } catch (error) {
      console.error('Error creating bulk email queue entries:', error);
      alert('An error occurred while queuing bulk emails.');
    }
  };

  // Queue status functions
  const fetchQueueStatus = async (resetProcessed = false) => {
    try {
      if (resetProcessed) {
        // Reset the processed count first
        const resetResponse = await fetch('/api/resetProcessedCount', {
          method: 'POST',
        });
        const resetData = await resetResponse.json();
        
        if (!resetData.success) {
          console.error('Error resetting processed count:', resetData.error);
          return;
        }
      }
      
      const response = await fetch('/api/queueStatus');
      const data = await response.json();
      
      if (data.success) {
        setQueueStatus(data.queueStatus);
      }
    } catch (error) {
      console.error('Error fetching queue status:', error);
    }
  };

  const fetchScheduledEmailsStatus = async () => {
    try {
      const response = await fetch('/api/scheduledEmails');
      const data = await response.json();
      
      if (data.success) {
        setScheduledEmailsStatus(data.scheduledEmails);
      }
    } catch (error) {
      console.error('Error fetching scheduled emails status:', error);
    }
  };

  const startProcessing = async () => {
    setIsProcessing(true);
    setProcessingStartTime(new Date());
    
    try {
      const response = await fetch('/api/processEmailQueue', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        // Fetch updated status after processing
        setTimeout(() => {
          fetchQueueStatus();
          setIsProcessing(false);
          setProcessingStartTime(null);
        }, 2000);
      } else {
        alert(`Error: ${result.error}`);
        setIsProcessing(false);
        setProcessingStartTime(null);
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
      alert('Error processing email queue');
      setIsProcessing(false);
      setProcessingStartTime(null);
    }
  };

  const processScheduledEmails = async () => {
    try {
      const response = await fetch('/api/processScheduledEmails', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success('Scheduled emails processed successfully');
        // Refresh scheduled emails status
        setTimeout(() => {
          fetchScheduledEmailsStatus();
        }, 1000);
      } else {
        toast.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error processing scheduled emails:', error);
      toast.error('Error processing scheduled emails');
    }
  };

  const getEstimatedTime = () => {
    if (!processingStartTime || !isProcessing) return null;
    
    const elapsed = (new Date() - processingStartTime) / 1000; // seconds
    const processed = queueStatus.processedCount;
    const remaining = queueStatus.pendingCount;
    
    if (processed === 0) return null;
    
    const avgTimePerEmail = elapsed / processed;
    const estimatedRemaining = remaining * avgTimePerEmail;
    
    const minutes = Math.floor(estimatedRemaining / 60);
    const seconds = Math.floor(estimatedRemaining % 60);
    
    return `${minutes}m ${seconds}s`;
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4">Outbound</h1>
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">Loading practices...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4">Outbound</h1>
        <div className="flex items-center justify-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Page header and PST/IST converter */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Outbound</h1>
          <p className="text-gray-600 mt-1">
            Manage and send emails to your practice contacts
          </p>
        </div>
        <div className="mt-4 md:mt-0 md:ml-8 flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
          <PSTISTConverter />
          <Button
            onClick={async () => {
              try {
                const response = await fetch('/api/processEmailQueue', {
                  method: 'POST',
                });
                const result = await response.json();
                if (result.success) {
                  alert('Email queue processed successfully!');
                } else {
                  alert(`Error: ${result.error}`);
                }
              } catch (error) {
                console.error('Error processing email queue:', error);
                alert('Error processing email queue');
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
          >
            Process Email Queue
          </Button>
        </div>
      </div>

      {/* Queue Status Component */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
              Email Queue Status
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                onClick={startProcessing}
                disabled={isProcessing || queueStatus.totalInQueue === 0}
                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                size="sm"
              >
                {isProcessing ? 'Processing...' : 'Start Processing'}
              </Button>
              <Button
                onClick={() => fetchQueueStatus(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                size="sm"
              >
                Refresh
              </Button>
              <Button
                onClick={processScheduledEmails}
                disabled={scheduledEmailsStatus.total === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                size="sm"
              >
                Process Scheduled
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">{queueStatus.totalInQueue}</div>
              <div className="text-xs text-gray-600">Total in Queue</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="text-2xl font-bold text-green-600">{queueStatus.processedCount}</div>
              <div className="text-xs text-gray-600">Processed</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-yellow-100">
              <div className="text-2xl font-bold text-yellow-600">{queueStatus.pendingCount}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-red-100">
              <div className="text-2xl font-bold text-red-600">{queueStatus.failedCount}</div>
              <div className="text-xs text-gray-600">Failed</div>
            </div>
          </div>

          {/* Scheduled Emails Status */}
          {scheduledEmailsStatus.total > 0 && (
            <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-gray-800 flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  Scheduled Emails
                </h4>
                <Button
                  onClick={fetchScheduledEmailsStatus}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                  size="sm"
                >
                  Refresh
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="text-xl font-bold text-purple-600">{scheduledEmailsStatus.total}</div>
                  <div className="text-xs text-gray-600">Total Scheduled</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="text-xl font-bold text-green-600">{scheduledEmailsStatus.upcoming}</div>
                  <div className="text-xs text-gray-600">Upcoming</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-100">
                  <div className="text-xl font-bold text-orange-600">{scheduledEmailsStatus.overdue}</div>
                  <div className="text-xs text-gray-600">Overdue</div>
                </div>
              </div>
              
              {/* Scheduled Emails List */}
              {scheduledEmailsStatus.emails.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Scheduled Emails:</h5>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {scheduledEmailsStatus.emails.slice(0, 5).map((email, index) => {
                      const scheduledTime = new Date(email.scheduledDate);
                      const now = new Date();
                      const isOverdue = scheduledTime <= now;
                      
                      return (
                        <div key={email.id} className={`text-xs p-2 rounded border ${
                          isOverdue 
                            ? 'bg-orange-50 border-orange-200' 
                            : 'bg-green-50 border-green-200'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{email.emailData.to}</span>
                            <span className={`text-xs ${
                              isOverdue ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {isOverdue ? 'Overdue' : 'Scheduled'}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            {scheduledTime.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                    {scheduledEmailsStatus.emails.length > 5 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{scheduledEmailsStatus.emails.length - 5} more scheduled emails
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                  <span className="text-sm font-medium text-blue-800">Processing emails...</span>
                </div>
                {getEstimatedTime() && (
                  <span className="text-xs text-blue-600">ETA: {getEstimatedTime()}</span>
                )}
              </div>
              <div className="mt-2 bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${queueStatus.totalInQueue > 0 ? (queueStatus.processedCount / queueStatus.totalInQueue) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Alerts */}
          {queueStatus.hasFailedEntries && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-4 h-4 text-red-500 mr-2">⚠️</div>
                <span className="text-sm text-red-800">
                  {queueStatus.failedCount} email(s) failed to process. Please check the queue and retry.
                </span>
              </div>
            </div>
          )}

          {queueStatus.hasUnprocessedEntries && queueStatus.totalInQueue > 0 && !isProcessing && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-4 h-4 text-yellow-500 mr-2">⚠️</div>
                <span className="text-sm text-yellow-800">
                  Queue is not empty. {queueStatus.pendingCount} email(s) pending. Process queue to clear it before starting a new batch.
                </span>
              </div>
            </div>
          )}

          {/* Last Updated */}
          {queueStatus.lastUpdated && (
            <div className="mt-3 text-xs text-gray-500 text-center">
              Last updated: {new Date(queueStatus.lastUpdated).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Pagination controls and search bar */}
      <div className="flex items-center space-x-4 flex-wrap mb-2">
        <span className="text-xs">Rows per page:</span>
        <Select
          value={String(entriesPerPage)}
          onValueChange={(value) => {
            setEntriesPerPage(Math.min(50, Number(value)));
            setCustomEntries("");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[80px] h-8 text-xs">
            <SelectValue placeholder="Rows" />
          </SelectTrigger>
          <SelectContent>
            {[10, 15, 20, 30, 50].map((num) => (
              <SelectItem key={num} value={String(num)}>
                {num}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          min={1}
          max={50}
          placeholder="Custom"
          value={customEntries}
          onChange={handleCustomEntriesChange}
          className="w-[70px] h-8 text-xs"
        />
        <Input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[180px] h-8 text-xs"
        />
      </div>

      {/* Bulk select bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border p-2 rounded-md shadow bg-muted mb-2">
          <Button variant="secondary" size="sm" onClick={handleSelectAllPage}>Select All on Page</Button>
          <Button variant="secondary" size="sm" onClick={handleSelectAllGlobal}>Select All Across Pages</Button>
          <Button variant="outline" size="sm" onClick={handleClearSelection}>Clear Selection</Button>
          <span className="text-xs font-semibold ml-2">Bulk Actions:</span>
          <Select value={bulkTemplate} onValueChange={handleBulkTemplate}>
            <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue placeholder="Select Template" /></SelectTrigger>
            <SelectContent>
              {templates.length === 0 ? (
                <SelectItem value="no-templates" disabled>No templates available</SelectItem>
              ) : (
                templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Select value={bulkSender} onValueChange={handleBulkSender}>
            <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue placeholder="Select Email" /></SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.email} value={user.email}>{user.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={bulkSendMode} onValueChange={handleBulkSendMode}>
            <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue placeholder="Send Mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="send">Send Directly</SelectItem>
              <SelectItem value="draft">Create Draft</SelectItem>
            </SelectContent>
          </Select>
          {bulkSendMode === "send" && (
            <Select value={bulkScheduleType} onValueChange={handleBulkScheduleType}>
              <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue placeholder="Send Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="now">Send Now</SelectItem>
                <SelectItem value="schedule">Schedule Send</SelectItem>
              </SelectContent>
            </Select>
          )}
          {bulkSendMode === "send" && bulkScheduleType === "schedule" && (
            <Input
              type="datetime-local"
              value={bulkScheduleDate}
              onChange={handleBulkScheduleDate}
              className="w-[170px] h-8 text-xs"
            />
          )}
          {bulkSendMode === "send" && ((bulkScheduleType === "now") || (bulkScheduleType === "schedule" && bulkScheduleDate)) && (
            <Button 
              size="sm" 
              className="bg-blue-600 text-white" 
              onClick={handleBulkSend}
              disabled={!bulkTemplate || !bulkSender}
            >
              Send {selectedIds.size} Email{selectedIds.size > 1 ? 's' : ''}
            </Button>
          )}
          {bulkSendMode === "draft" && bulkTemplate && bulkSender && selectedIds.size > 0 && (
            <Button 
              size="sm" 
              className="bg-yellow-500 text-white"
              onClick={handleBulkSend}
            >
              Create {selectedIds.size} Draft{selectedIds.size > 1 ? 's' : ''}
            </Button>
          )}
        </div>
      )}

      {/* Practices table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-8 text-xs px-2 py-1">
                <Checkbox
                  checked={currentPageData.length > 0 && currentPageData.every((row) => selectedIds.has(row.email))}
                  indeterminate={
                    currentPageData.some((row) => selectedIds.has(row.email)) &&
                    !currentPageData.every((row) => selectedIds.has(row.email))
                      ? "true"
                      : undefined
                  }
                  onCheckedChange={(checked) => checked ? handleSelectAllPage() : handleClearSelection()}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="font-semibold text-gray-900 text-xs px-2 py-1">Email</TableHead>
              <TableHead className="font-semibold text-gray-900 text-xs px-2 py-1">First Name</TableHead>
              <TableHead className="font-semibold text-gray-900 text-xs px-2 py-1 hidden md:table-cell">Email Count</TableHead>
              <TableHead className="font-semibold text-gray-900 text-xs px-2 py-1">Email Template</TableHead>
              <TableHead className="font-semibold text-gray-900 text-xs px-2 py-1 hidden md:table-cell">Sender Email</TableHead>
              <TableHead className="font-semibold text-gray-900 text-xs px-2 py-1">Send Mode</TableHead>
              <TableHead className="font-semibold text-gray-900 text-xs px-2 py-1">Schedule</TableHead>
              <TableHead className="font-semibold text-gray-900 text-xs px-2 py-1">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500 text-xs">
                  No practices found
                </TableCell>
              </TableRow>
            ) : (
              currentPageData.map((practice, index) => (
                <TableRow 
                  key={`${practice.email}-${index}`}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="w-8 text-xs px-2 py-1">
                    <Checkbox
                      checked={selectedIds.has(practice.email)}
                      onCheckedChange={(checked) => handleSelect(practice.email, checked)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-gray-900 text-xs px-2 py-1">
                    {highlightMatch(practice.email)}
                  </TableCell>
                  <TableCell className="text-gray-700 text-xs px-2 py-1">
                    {highlightMatch(practice.first_name || 'N/A')}
                  </TableCell>
                  <TableCell className="text-gray-700 text-xs px-2 py-1 hidden md:table-cell">
                    {highlightMatch(emailCounts[practice.email] || 0)}
                  </TableCell>
                  <TableCell className="text-xs px-2 py-1">
                    <Select
                      value={emailTemplates[practice.email] || ''}
                      onValueChange={(value) => handleTemplateChange(practice.email, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.length === 0 ? (
                          <SelectItem value="no-templates" disabled>No templates available</SelectItem>
                        ) : (
                          templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs px-2 py-1 hidden md:table-cell">
                    <Select
                      value={senderEmails[practice.email] || ''}
                      onValueChange={(value) => handleSenderEmailChange(practice.email, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Sender Email" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.email} value={user.email}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs px-2 py-1">
                    <Select
                      value={sendModes[practice.email] || ''}
                      onValueChange={(value) => handleSendModeChange(practice.email, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="send">Send Directly</SelectItem>
                        <SelectItem value="draft">Create Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs px-2 py-1">
                    {sendModes[practice.email] === 'send' ? (
                      <div className="space-y-3">
                        {/* Mode Indicator */}
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs font-medium text-green-700">Send Directly</span>
                        </div>
                        
                        {/* Scheduling Options */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`immediate-${practice.email}`}
                              name={`schedule-${practice.email}`}
                              checked={!scheduledDates[practice.email]}
                              onChange={() => handleScheduledDateChange(practice.email, '')}
                              className="w-3 h-3 text-green-600"
                            />
                            <label htmlFor={`immediate-${practice.email}`} className="text-xs text-gray-700">
                              Send Now
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`scheduled-${practice.email}`}
                              name={`schedule-${practice.email}`}
                              checked={!!scheduledDates[practice.email]}
                              onChange={() => {
                                const now = new Date();
                                const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                                handleScheduledDateChange(practice.email, tomorrow.toISOString().slice(0, 16));
                              }}
                              className="w-3 h-3 text-green-600"
                            />
                            <label htmlFor={`scheduled-${practice.email}`} className="text-xs text-gray-700">
                              Schedule
                            </label>
                          </div>
                        </div>
                        
                        {/* Date Time Picker */}
                        {scheduledDates[practice.email] && (
                          <div className="mt-2">
                            <Input
                              type="datetime-local"
                              value={scheduledDates[practice.email]}
                              onChange={(e) => handleScheduledDateChange(practice.email, e.target.value)}
                              className="w-full text-xs border-gray-300"
                            />
                          </div>
                        )}
                      </div>
                    ) : sendModes[practice.email] === 'draft' ? (
                      <div className="space-y-3">
                        {/* Mode Indicator */}
                        <div className="flex items-center space-x-2">
                          {/* <div className="w-2 h-2 bg-orange-500 rounded-full"></div> */}
                          {/* <span className="text-xs font-medium text-orange-700">Create Draft</span> */}
                        </div>
                        
                        {/* Draft Info */}
                        <div className="bg-orange-50 border border-orange-200 rounded-md p-2">
                          <p className="text-xs text-orange-800">
                            Email will be saved as draft 
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <span className="text-xs text-gray-500">Select mode</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs px-2 py-1">
                    {emailTemplates[practice.email] && senderEmails[practice.email] && sendModes[practice.email] ? (
                      sendModes[practice.email] === 'send' ? (
                        <Button
                          onClick={() => handleSendEmail(practice.email)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1"
                        >
                          {scheduledDates[practice.email] ? 'Schedule Email' : 'Send Now'}
                        </Button>
                      ) : sendModes[practice.email] === 'draft' ? (
                        <Button
                          onClick={() => handleSendEmail(practice.email)}
                          className="w-full bg-yellow-400 hover:bg-orange-700 text-white text-xs py-1"
                        >
                          Create Draft
                        </Button>
                      ) : null
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between flex-wrap gap-2 mt-2">
        <p className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex flex-wrap gap-1 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs"
          >
            Previous
          </Button>
          {getPageNumbers().map((p, idx) => (
            <Button
              key={idx}
              variant={p === page ? "default" : "outline"}
              size="sm"
              disabled={p === "..."}
              onClick={() => typeof p === "number" && setPage(p)}
              className="text-xs"
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-xs"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Summary */}
      {practices.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Total practices: {practices.length}
        </div>
      )}
    </div>
  );
};

export default Outbound;
