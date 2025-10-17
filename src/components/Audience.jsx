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
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [showCreateTag, setShowCreateTag] = useState(false);

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

  // Fetch tags from the tags.json file via API
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

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.length === contacts.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(contacts.map(contact => contact.id));
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
  const filteredContacts = contacts.filter(contact => {
    if (selectedTags.length === 0) return true;
    
    const contactTags = contact.tags || [];
    return selectedTags.some(tag => contactTags.includes(tag));
  });

  // Clear selection
  const clearSelection = () => {
    setSelectedRows([]);
    setShowBulkActions(false);
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
      {tags.length > 0 && (
        <div className="glass p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Tags</h3>
            {selectedTags.length > 0 && (
              <button
                onClick={clearTagFilters}
                className="text-sm hover:opacity-80"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagSelect(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-foreground/5 hover:bg-foreground/8'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Actions Menu */}
      {showBulkActions && (
        <div className="bg-foreground/5 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-foreground/70">
                {selectedRows.length} contact(s) selected
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
                {tags.map(tag => (
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
                {tags.map(tag => (
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === filteredContacts.length && filteredContacts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border"
                  />
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
              {filteredContacts.map((contact) => (
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
        
        {filteredContacts.length === 0 && (
          <div className="text-center py-8 text-black">
            {selectedTags.length > 0 
              ? "No contacts found with the selected tags."
              : "No contacts found."
            }
          </div>
        )}
      </div>
    </div>
  );
}
