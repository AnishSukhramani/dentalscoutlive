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
  const totalPages = Math.max(1, Math.ceil(totalRows / entriesPerPage));
  const paginatedPractices = filteredPractices.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const getPageNumbers = () => {
    const visiblePages = 6;
    let pages = [];
    if (totalPages <= visiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages = [1];
      const start = Math.max(2, page - 2);
      const end = Math.min(totalPages - 1, start + visiblePages - 1);
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const handleCustomEntriesChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setCustomEntries(value);
      const num = Math.max(1, Math.min(50, Number(value)));
      if (value !== "") setEntriesPerPage(num);
    }
  };

  // Handle email template selection for a specific practice
  const handleTemplateChange = (practiceEmail, templateValue) => {
    setEmailTemplates(prev => ({
      ...prev,
      [practiceEmail]: templateValue
    }));
  };

  // Handle sender email selection for a specific practice
  const handleSenderEmailChange = (practiceEmail, senderValue) => {
    setSenderEmails(prev => ({
      ...prev,
      [practiceEmail]: senderValue
    }));
  };

  // Handle send/draft mode selection for a specific practice
  const handleSendModeChange = (practiceEmail, modeValue) => {
    setSendModes(prev => ({
      ...prev,
      [practiceEmail]: modeValue
    }));
    
    // Clear scheduled date if switching to draft mode
    if (modeValue === 'draft') {
      setScheduledDates(prev => {
        const newDates = { ...prev };
        delete newDates[practiceEmail];
        return newDates;
      });
    }
  };

  // Handle scheduled date change for a specific practice
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
          .select('email, first_name, email_sent_count')
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

    fetchPractices();
  }, []);

  // Remove the separate fetchEmailCounts function since we're getting counts directly

  // Handle sending email to a practice
  const handleSendEmail = (practiceEmail) => {
    console.log(`Sending email to ${practiceEmail}`);
    // TODO: Implement actual email sending functionality
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
    const updated = new Set(paginatedPractices.map((d) => d.email));
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
        <div className="mt-4 md:mt-0 md:ml-8">
          <PSTISTConverter />
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
              {["1","2","3","4","5"].map((num) => (
                <SelectItem key={num} value={num}>Template {num}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={bulkSender} onValueChange={handleBulkSender}>
            <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue placeholder="Select Email" /></SelectTrigger>
            <SelectContent>
              {["user1@example.com","user2@example.com","user3@example.com"].map((email, i) => (
                <SelectItem key={email} value={email}>User {i+1}</SelectItem>
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
            <Button size="sm" className="bg-blue-600 text-white" disabled>Send</Button>
          )}
          {bulkSendMode === "draft" && bulkTemplate && bulkSender && selectedIds.size > 0 && (
            <Button size="sm" className="bg-yellow-500 text-white">
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
                  checked={paginatedPractices.length > 0 && paginatedPractices.every((row) => selectedIds.has(row.email))}
                  indeterminate={
                    paginatedPractices.some((row) => selectedIds.has(row.email)) &&
                    !paginatedPractices.every((row) => selectedIds.has(row.email))
                      ? true
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
            {paginatedPractices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500 text-xs">
                  No practices found
                </TableCell>
              </TableRow>
            ) : (
              paginatedPractices.map((practice, index) => (
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
                        <SelectItem value="1">Template 1</SelectItem>
                        <SelectItem value="2">Template 2</SelectItem>
                        <SelectItem value="3">Template 3</SelectItem>
                        <SelectItem value="4">Template 4</SelectItem>
                        <SelectItem value="5">Template 5</SelectItem>
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
                        <SelectItem value="user1@example.com">User 1</SelectItem>
                        <SelectItem value="user2@example.com">User 2</SelectItem>
                        <SelectItem value="user3@example.com">User 3</SelectItem>
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
                    {sendModes[practice.email] === 'send' ? (
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleSendEmail(practice.email)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1"
                        >
                          {scheduledDates[practice.email] ? 'Schedule Email' : 'Send Now'}
                        </Button>
                        {(!emailTemplates[practice.email] || !senderEmails[practice.email]) && (
                          <p className="text-xs text-orange-600">
                            {!emailTemplates[practice.email] && !senderEmails[practice.email] 
                              ? 'Select template and sender' 
                              : !emailTemplates[practice.email] 
                                ? 'Select template' 
                                : 'Select sender'}
                          </p>
                        )}
                      </div>
                    ) : sendModes[practice.email] === 'draft' ? (
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleSendEmail(practice.email)}
                          className="w-full bg-yellow-400 hover:bg-orange-700 text-white text-xs py-1"
                        >
                          Save Draft
                        </Button>
                        {(!emailTemplates[practice.email] || !senderEmails[practice.email]) && (
                          <p className="text-xs text-orange-600">
                            {!emailTemplates[practice.email] && !senderEmails[practice.email] 
                              ? 'Select template and sender' 
                              : !emailTemplates[practice.email] 
                                ? 'Select template' 
                                : 'Select sender'}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleSendEmail(practice.email)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Send Email
                      </Button>
                    )}
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
