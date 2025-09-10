import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const AgenticCall = () => {
  const [practices, setPractices] = useState([]);
  const [filteredPractices, setFilteredPractices] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(15);

  // Fetch practices data from Supabase
  useEffect(() => {
    const fetchPractices = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('practices')
          .select('id, email, practice_name, owner_name, phone_number, first_name, tags')
          .not('email', 'is', null)
          .order('practice_name', { ascending: true })
          .order('id', { ascending: true });

        if (fetchError) {
          console.error('Error fetching practices:', fetchError);
          setError('Failed to load practices');
        } else {
          setPractices(data || []);
          setFilteredPractices(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPractices();
  }, []);

  // Fetch tags from the shared tags system
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (response.ok) {
          const data = await response.json();
          setTags(data.tags || []);
        } else {
          console.error('Error fetching tags:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    fetchTags();
  }, []);

  // Filter practices based on search query and selected tags
  useEffect(() => {
    let result = practices;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(practice =>
        practice.practice_name?.toLowerCase().includes(query) ||
        practice.owner_name?.toLowerCase().includes(query) ||
        practice.email?.toLowerCase().includes(query) ||
        practice.phone_number?.toLowerCase().includes(query) ||
        practice.first_name?.toLowerCase().includes(query)
      );
    }
    
    // Apply tag filter
    if (selectedTags.length > 0) {
      result = result.filter(practice =>
        practice.tags && Array.isArray(practice.tags) &&
        selectedTags.some(tag => practice.tags.includes(tag))
      );
    }
    
    setFilteredPractices(result);
    setPage(1); // Reset to first page when filtering
  }, [searchQuery, selectedTags, practices]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPractices.length / entriesPerPage);
  const currentPageData = filteredPractices.slice(
    (page - 1) * entriesPerPage,
    page * entriesPerPage
  );

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleTagSelect = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  const handleSelect = (id, checked) => {
    const updated = new Set(selectedIds);
    checked ? updated.add(id) : updated.delete(id);
    setSelectedIds(updated);
  };

  const handleSelectAllPage = () => {
    const updated = new Set(currentPageData.map((d) => d.id));
    setSelectedIds(updated);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Export selected practices to Google Sheet
  const handleExportToGoogleSheet = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one practice to export');
      return;
    }

    try {
      // Get selected practices data
      const selectedPractices = practices.filter(practice => selectedIds.has(practice.id));
      
      // Prepare data for export
      const exportData = selectedPractices.map(practice => ({
        id: practice.id,
        practice_name: practice.practice_name || '',
        owner_name: practice.owner_name || '',
        first_name: practice.first_name || '',
        phone_number: practice.phone_number || '',
        email: practice.email || '',
        tags: practice.tags && Array.isArray(practice.tags) ? practice.tags.join(', ') : '',
        export_timestamp: new Date().toISOString()
      }));

      // Call the export API
      const response = await fetch('/api/export-to-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: exportData,
          sheetName: `Agentic_Call_Export_${new Date().toISOString().split('T')[0]}`,
          headers: ['ID', 'Practice Name', 'Owner Name', 'Contact Name', 'Phone', 'Email', 'Tags', 'Export Date']
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully exported ${selectedIds.size} practices to Google Sheet!`);
        console.log('Export result:', result);
      } else {
        const error = await response.json();
        toast.error(`Export failed: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export to Google Sheet. Please try again.');
    }
  };

  const highlightMatch = (text) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery})`, "gi");
    return String(text).split(regex).map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <span key={i} className="bg-foreground/10 font-semibold">{part}</span>
      ) : (
        part
      )
    );
  };

  const getPageNumbers = () => {
    const visiblePages = 5;
    let pages = [];
    if (totalPages <= visiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages = [1];
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, start + visiblePages - 3);
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4">Error: {error}</div>;

  return (
    <div className="p-4 space-y-4 min-h-screen">
      {/* Futuristic Header */}
      <div className="relative">
        <div className="relative glass rounded-lg p-6 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 glass rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse bg-foreground/60"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Agentic Call
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-1 text-xs font-bold rounded-full border">
                    BETA
                  </span>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-transparent rounded-full" style={{animation: 'wave-green 3.6s ease-in-out infinite'}}></div>
                    <div className="w-1 h-1 bg-transparent rounded-full" style={{animationDelay: '1.2s', animation: 'wave-green 3.6s ease-in-out infinite'}}></div>
                    <div className="w-1 h-1 bg-transparent rounded-full" style={{animationDelay: '2.4s', animation: 'wave-green 3.6s ease-in-out infinite'}}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono">
                {filteredPractices.length} practices found
              </div>
              <div className="text-xs font-mono">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative">
        <div className="relative glass rounded-lg p-4 border">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input
                type="text"
                placeholder="Search practices..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full md:w-80 pl-10"
              />
            </div>
            
            {/* Tags Gallery */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium font-mono">Filter by tags:</span>
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagSelect(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 border ${
                      selectedTags.includes(tag)
                        ? 'bg-foreground/10'
                        : 'bg-foreground/5 hover:bg-foreground/8'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {selectedTags.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearTagFilters}
                    className="text-xs"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selection Actions */}
      {selectedIds.size > 0 && (
        <div className="relative">
          <div className="relative glass rounded-lg p-4 border">
            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full animate-pulse bg-foreground/60"></div>
                <span className="text-sm font-bold font-mono">
                  {selectedIds.size} practice(s) selected
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllPage}
                className="text-xs"
              >
                Select All on Page
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
                className="text-xs"
              >
                Clear Selection
              </Button>
              <Button
                size="sm"
                onClick={handleExportToGoogleSheet}
                className="text-xs font-bold"
              >
                Call ({selectedIds.size}) number(s)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Practices Table */}
      <div className="relative">
        <div className="relative glass rounded-lg overflow-hidden border">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={currentPageData.length > 0 && currentPageData.every((row) => selectedIds.has(row.id))}
                      indeterminate={
                        currentPageData.some((row) => selectedIds.has(row.id)) &&
                        !currentPageData.every((row) => selectedIds.has(row.id))
                          ? "true"
                          : undefined
                      }
                      onCheckedChange={(checked) => checked ? handleSelectAllPage() : handleClearSelection()}
                      aria-label="Select all"
                      className=""
                    />
                  </TableHead>
                  <TableHead className="font-bold font-mono text-sm">Practice</TableHead>
                  <TableHead className="font-bold font-mono text-sm">Contact</TableHead>
                  <TableHead className="font-bold font-mono text-sm">Phone</TableHead>
                  <TableHead className="font-bold font-mono text-sm">Email</TableHead>
                  <TableHead className="font-bold font-mono text-sm">Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageData.map((practice, index) => (
                  <TableRow 
                    key={practice.id} 
                    className={`transition-colors duration-200 border-b ${
                      index % 2 === 0 ? 'bg-foreground/5' : 'bg-foreground/10'
                    }`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(practice.id)}
                        onCheckedChange={(checked) => handleSelect(practice.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {highlightMatch(practice.practice_name || 'N/A')}
                        </div>
                        <div className="text-sm text-foreground/70">
                          {highlightMatch(practice.owner_name || 'N/A')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {highlightMatch(practice.first_name || 'N/A')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">
                        {highlightMatch(practice.phone_number || 'N/A')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {highlightMatch(practice.email || 'N/A')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {practice.tags && Array.isArray(practice.tags) ? (
                          practice.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-foreground/10 text-xs rounded-full border font-bold"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-foreground/60 text-xs font-mono">No tags</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="relative">
          <div className="relative glass rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div className="text-sm font-mono">
                Page {page} of {totalPages} ({filteredPractices.length} total practices)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className={`disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgenticCall;
