"use client"
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Audience() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [showCreateTag, setShowCreateTag] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectAllPages, setSelectAllPages] = useState(false);

  // Fetch contacts from Supabase
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('practices')
        .select('*')
        .order('practice_name', { ascending: true })
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching contacts:', error);
        return;
      }

      setContacts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tags from the tags API
  const fetchTags = async () => {
    try {
      setTagsLoading(true);
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        console.log('Tags API response:', data); // Debug log
        setTags(data.tags || []);
        
        // Preserve selectedTags by filtering out any that no longer exist
        setSelectedTags(prev => {
          const availableTags = data.tags || [];
          const filtered = prev.filter(tag => availableTags.includes(tag));
          console.log('Preserving selectedTags:', { prev, filtered, availableTags });
          return filtered;
        });
      } else {
        console.error('Error fetching tags:', response.statusText);
        setTags([]); // Ensure tags is always an array
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      setTags([]); // Ensure tags is always an array
    } finally {
      setTagsLoading(false);
    }
  };

  // Refresh both contacts and tags
  const refreshData = async () => {
    try {
      await fetchContacts();
      await fetchTags();
      toast.success('Data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Error refreshing data. Please try again.');
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchTags();
  }, []);

  // Handle row selection
  const handleRowSelect = (contactId) => {
    setSelectedRows(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  // Handle select all (current page only)
  const handleSelectAll = () => {
    if (isCurrentPageSelected) {
      // Deselect current page
      const currentPageIds = currentPageContacts.map(contact => contact.id);
      setSelectedRows(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      // Select current page
      const currentPageIds = currentPageContacts.map(contact => contact.id);
      setSelectedRows(prev => [...new Set([...prev, ...currentPageIds])]);
    }
    setSelectAllPages(false);
  };

  // Handle select all pages
  const handleSelectAllPages = () => {
    if (selectAllPages) {
      setSelectedRows([]);
      setSelectAllPages(false);
    } else {
      setSelectedRows(allContactIds);
      setSelectAllPages(true);
    }
  };

  // Handle tag selection for filtering
  const handleTagSelect = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Clear tag filters
  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  // Remove tag from selected contacts
  const removeTagFromSelected = async (tagName) => {
    if (selectedRows.length === 0) return;

    try {
      const selectedContacts = contacts.filter(contact => selectedRows.includes(contact.id));
      const updatePromises = selectedContacts.map(async (contact) => {
        const currentTags = contact.tags || [];
        const newTags = currentTags.filter(tag => tag !== tagName);
        
        // Update in Supabase
        const { error } = await supabase
          .from('practices')
          .update({ tags: newTags })
          .eq('id', contact.id);

        if (error) {
          console.error(`Error updating contact ${contact.id}:`, error);
          throw error;
        }

        return { ...contact, tags: newTags };
      });

      const updatedContacts = await Promise.all(updatePromises);
      
      // Update local state with the updated contacts
      const newContacts = contacts.map(contact => {
        const updatedContact = updatedContacts.find(uc => uc.id === contact.id);
        return updatedContact || contact;
      });

      setContacts(newContacts);
      setSelectedRows([]);
      toast.success(`Tag "${tagName}" removed from ${selectedRows.length} contact(s)`);
    } catch (error) {
      console.error('Error removing tag from contacts:', error);
      toast.error('Error removing tag from contacts. Please try again.');
    }
  };

  // Create new tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    const tagName = newTagName.trim();
    
    try {
      // First, add the tag to the tags.json file via API
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tagName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          toast.error('Tag already exists!');
        } else {
          toast.error(`Error creating tag: ${errorData.error}`);
        }
        return;
      }

      const result = await response.json();
      
      // Update local tags state with the new tag
      setTags(result.tags);

      // Preserve existing selectedTags when new tags are added
      // The selectedTags state will be maintained automatically

      // Add tag to selected contacts
      if (selectedRows.length > 0) {
        const selectedContacts = contacts.filter(contact => selectedRows.includes(contact.id));
        const updatePromises = selectedContacts.map(async (contact) => {
          const currentTags = contact.tags || [];
          const newTags = currentTags.includes(tagName) 
            ? currentTags 
            : [...currentTags, tagName];
          
          // Update in Supabase
          const { error } = await supabase
            .from('practices')
            .update({ tags: newTags })
            .eq('id', contact.id);

          if (error) {
            console.error(`Error updating contact ${contact.id}:`, error);
            throw error;
          }

          return { ...contact, tags: newTags };
        });

        const updatedContacts = await Promise.all(updatePromises);
        
        // Update local state with the updated contacts
        const newContacts = contacts.map(contact => {
          const updatedContact = updatedContacts.find(uc => uc.id === contact.id);
          return updatedContact || contact;
        });

        setContacts(newContacts);
      }

      setNewTagName("");
      setShowCreateTag(false);
      setSelectedRows([]);
      toast.success(`Tag "${tagName}" created successfully!`);
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Error creating tag. Please try again.');
    }
  };

  // Add existing tag to selected contacts
  const addTagToSelected = async (tagName) => {
    if (selectedRows.length === 0) return;

    try {
      const selectedContacts = contacts.filter(contact => selectedRows.includes(contact.id));
      const updatePromises = selectedContacts.map(async (contact) => {
        const currentTags = contact.tags || [];
        const newTags = currentTags.includes(tagName) 
          ? currentTags 
          : [...currentTags, tagName];
        
        // Update in Supabase
        const { error } = await supabase
          .from('practices')
          .update({ tags: newTags })
          .eq('id', contact.id);

        if (error) {
          console.error(`Error updating contact ${contact.id}:`, error);
          throw error;
        }

        return { ...contact, tags: newTags };
      });

      const updatedContacts = await Promise.all(updatePromises);
      
      // Update local state with the updated contacts
      const newContacts = contacts.map(contact => {
        const updatedContact = updatedContacts.find(uc => uc.id === contact.id);
        return updatedContact || contact;
      });

      setContacts(newContacts);
      setSelectedRows([]);
      toast.success(`Tag "${tagName}" added to ${selectedRows.length} contact(s)`);
    } catch (error) {
      console.error('Error adding tag to contacts:', error);
      toast.error('Error adding tag to contacts. Please try again.');
    }
  };

  // Filter contacts based on selected tags
  const filteredContacts = (contacts || []).filter(contact => {
    if (!selectedTags || selectedTags.length === 0) return true;
    
    const contactTags = contact.tags || [];
    return selectedTags.some(tag => contactTags.includes(tag));
  });

  // Pagination calculations
  const totalItems = filteredContacts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageContacts = filteredContacts.slice(startIndex, endIndex);

  // Get all contact IDs for cross-page selection
  const allContactIds = filteredContacts.map(contact => contact.id);
  const isAllSelected = selectAllPages || (selectedRows.length === allContactIds.length && allContactIds.length > 0);
  const isCurrentPageSelected = currentPageContacts.every(contact => selectedRows.includes(contact.id));

  // Clear selection
  const clearSelection = () => {
    setSelectedRows([]);
    setShowBulkActions(false);
    setSelectAllPages(false);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedRows.length > 0);
  }, [selectedRows]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading contacts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audience</h1>
          <p className="text-foreground/70">
            Manage practice contacts and tags
          </p>
        </div>
        <button
          onClick={refreshData}
          className="px-4 py-2 rounded-md glass"
        >
          Refresh Data
        </button>
      </div>

      {/* Tags Gallery */}
      {tagsLoading ? (
        <div className="glass p-4 rounded-lg shadow-sm border">
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading tags...</p>
          </div>
        </div>
      ) : tags && tags.length > 0 ? (
        <div className="glass p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">Tags</h3>
              {selectedTags && selectedTags.length > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {selectedTags.length} filter{selectedTags.length > 1 ? 's' : ''} active
                </span>
              )}
            </div>
            {selectedTags && selectedTags.length > 0 && (
              <button
                onClick={clearTagFilters}
                className="text-sm hover:opacity-80 text-red-600 hover:text-red-800"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="w-full mb-2">
              <p className="text-xs text-gray-600">
                💡 Click on tags to filter contacts
              </p>
            </div>
            {tags && tags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagSelect(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  selectedTags.includes(tag)
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                    : 'bg-foreground/5 hover:bg-foreground/8 hover:shadow-sm'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Bulk Actions Menu */}
      {showBulkActions && (
        <div className="bg-foreground/5 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-foreground/70">
                {selectedRows.length} contact(s) selected
                {selectAllPages && ` (across all ${totalPages} pages)`}
              </span>
              <button
                onClick={clearSelection}
                className="text-sm hover:opacity-80"
              >
                Clear Selection
              </button>
            </div>
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addTagToSelected(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-2 border rounded-md focus:outline-none focus-visible:outline-2"
              >
                <option value="">Add existing tag...</option>
                {tags && tags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    removeTagFromSelected(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-2 border rounded-md focus:outline-none focus-visible:outline-2"
              >
                <option value="">Remove tag...</option>
                {tags && tags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowCreateTag(true)}
              className="px-4 py-2 rounded-md glass hover:opacity-80 transition-opacity"
            >
              Create New Tag
            </button>
          </div>

          {/* Create Tag Modal */}
          {showCreateTag && (
            <div className="mt-4 p-4 glass rounded-lg border">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name"
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus-visible:outline-2"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                />
                <button
                  onClick={handleCreateTag}
                  className="px-4 py-2 rounded-md glass"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateTag(false);
                    setNewTagName("");
                  }}
                  className="px-4 py-2 rounded-md glass"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contacts Table */}
      <div className="glass rounded-lg shadow-sm border overflow-hidden">
        {/* Filter Status */}
        {selectedTags && selectedTags.length > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                🔍 Filtering by: {selectedTags.join(', ')} 
                <span className="ml-2 font-medium">
                  ({filteredContacts ? filteredContacts.length : 0} of {contacts ? contacts.length : 0} contacts)
                </span>
              </span>
              <button
                onClick={clearTagFilters}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isCurrentPageSelected}
                        onChange={handleSelectAll}
                        className="rounded border"
                        title="Select all on current page"
                      />
                      <span className="text-xs text-gray-600">Current page</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectAllPages}
                        onChange={handleSelectAllPages}
                        className="rounded border"
                        title="Select all across all pages"
                      />
                      <span className="text-xs text-gray-600">All pages</span>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Practice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  First Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Tags
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPageContacts && currentPageContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(contact.id)}
                      onChange={() => handleRowSelect(contact.id)}
                      className="rounded border"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {contact.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {contact.practice_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {contact.first_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {contact.phone_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags && contact.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-foreground/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {currentPageContacts && currentPageContacts.length === 0 && (
          <div className="text-center py-8 text-black">
            {selectedTags && selectedTags.length > 0 
              ? "No contacts found with the selected tags."
              : "No contacts found."
            }
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="glass p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            {/* Items per page selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>

            {/* Page info */}
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} contacts
              {selectAllPages && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  All pages selected
                </span>
              )}
            </div>

            {/* Page navigation */}
            <div className="flex items-center space-x-2">
              {/* Previous button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex space-x-1">
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              {/* Next button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>

          {/* Selection summary */}
          {selectedRows.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedRows.length} contact(s) selected
                  {selectAllPages && ` (across all ${totalPages} pages)`}
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
