import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Bold, Italic, Underline, List, Link, ArrowDownToLine, ChevronLeft, Reply, Trash, FolderDown, MoreHorizontal, SquareArrowOutUpRight, SquarePen } from "lucide-react";

const TemplatesAndIDs = () => {
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [template, setTemplate] = useState({ name: "", subject: "", body: "" });
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Supabase table columns reference
  const tableColumns = [
    { name: "id", description: "Unique identifier for each practice entry" },
    { name: "practice_name", description: "Name of the dental practice" },
    { name: "domain_url", description: "Website URL of the practice" },
    { name: "owner_name", description: "Name of the practice owner" },
    { name: "email", description: "Contact email address" },
    { name: "phone_number", description: "Contact phone number" },
    { name: "first_name", description: "First name of the contact person" }
  ];

  // Simple formatting functions for textarea
  const formatText = (format) => {
    const textarea = document.querySelector('textarea[name="body"]');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'list':
        formattedText = `• ${selectedText}`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      case 'newline':
        formattedText = '\n';
        break;
      default:
        formattedText = selectedText;
    }
    
    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    setTemplate({ ...template, body: newValue });
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleChange = (e) => {
    setTemplate({ ...template, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        setShowForm(false);
        setTemplate({ name: "", subject: "", body: "" });
        fetchTemplates(); // Refresh templates list
      } else {
        console.error('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleEdit = (template) => {
    // Close create form if open
    setShowForm(false);
    setEditingTemplate(template);
    setTemplate({ name: template.name, subject: template.subject, body: template.body });
    setShowEditForm(true);
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        setShowEditForm(false);
        setEditingTemplate(null);
        setTemplate({ name: "", subject: "", body: "" });
        fetchTemplates(); // Refresh templates list
      } else {
        console.error('Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingTemplate(null);
    setTemplate({ name: "", subject: "", body: "" });
  };

  const handleCancel = () => {
    setShowForm(false);
    setTemplate({ name: "", subject: "", body: "" });
  };

  // Filter and sort templates
  const filteredAndSortedTemplates = templates
    .filter(template => 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy] || "";
      let bValue = b[sortBy] || "";
      
      if (sortOrder === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleCreateClick = () => {
    // Close edit form if open
    setShowEditForm(false);
    setEditingTemplate(null);
    setTemplate({ name: "", subject: "", body: "" });
    setShowForm((v) => !v);
  };

  // Sample data for preview
  const sampleEntryData = {
    id: "123",
    practice_name: "Sample Dental Practice",
    domain_url: "https://sampledental.com",
    owner_name: "Dr. John Smith",
    email: "john@sampledental.com",
    phone_number: "(555) 123-4567",
    first_name: "John"
  };

  // Function to convert markdown to HTML for preview
  const markdownToHtml = (text) => {
    if (!text) return '';
    
    let html = text;
    
    // Convert bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert underline
    html = html.replace(/__(.*?)__/g, '<u>$1</u>');
    
    // Convert links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Convert lists - first split into lines
    const lines = html.split('\n');
    const processedLines = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim().startsWith('•')) {
        // This is a list item
        if (!inList) {
          processedLines.push('<ul>');
          inList = true;
        }
        const listItem = line.replace(/•\s*(.*)/, '<li>$1</li>');
        processedLines.push(listItem);
      } else {
        // This is not a list item
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        processedLines.push(line);
      }
    }
    
    // Close any open list
    if (inList) {
      processedLines.push('</ul>');
    }
    
    // Join lines back together
    html = processedLines.join('\n');
    
    // Convert remaining line breaks to <br> tags
    html = html.replace(/\n/g, '<br>');
    
    return html;
  };

  // Function to handle Enter key in textarea to add line breaks
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      const newValue = value.substring(0, start) + '\n' + value.substring(end);
      setTemplate({ ...template, body: newValue });
      
      // Set cursor position after the new line
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 1, start + 1);
      }, 0);
    }
  };

  // Function to replace placeholders for preview
  const replacePlaceholders = (content, entryData) => {
    if (!content || !entryData) return content;
    
    let replacedContent = content;
    
    // First, handle any placeholders that might not be in our main mappings
    const allPlaceholders = replacedContent.match(/\[([^\]]+)\]/g);
    if (allPlaceholders) {
      allPlaceholders.forEach(placeholder => {
        const fieldName = placeholder.slice(1, -1); // Remove [ and ]
        // Try to find the field by converting spaces to underscores
        const fieldKey = fieldName.replace(/ /g, '_');
        const value = entryData[fieldKey] || entryData[fieldName] || '';
        replacedContent = replacedContent.split(placeholder).join(value);
      });
    }
    
    // Then handle our specific field mappings for any remaining placeholders
    const fieldMappings = {
      'first_name': ['[first_name]', '[first name]', '[firstname]'],
      'practice_name': ['[practice_name]', '[practice name]', '[practicename]'],
      'domain_url': ['[domain_url]', '[domain url]', '[domainurl]'],
      'owner_name': ['[owner_name]', '[owner name]', '[ownername]'],
      'email': ['[email]'],
      'phone_number': ['[phone_number]', '[phone number]', '[phonenumber]'],
      'id': ['[id]']
    };
    
    Object.entries(fieldMappings).forEach(([fieldName, placeholders]) => {
      const value = entryData[fieldName] || '';
      
      placeholders.forEach(placeholder => {
        if (replacedContent.includes(placeholder)) {
          // Use simple string replacement to avoid regex issues
          replacedContent = replacedContent.split(placeholder).join(value);
        }
      });
    });
    
    return replacedContent;
  };

  const handleDelete = async (templateId) => {
    try {
      const response = await fetch(`/api/templates?id=${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTemplates(); // Refresh templates list
      } else {
        console.error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Supabase Table Columns Reference */}
      <div className="glass rounded-lg shadow p-4 mb-4 border">
        <h3 className="text-lg font-semibold mb-3">Available Table Columns for Placeholders</h3>
        <p className="text-sm text-foreground/70 mb-3">
          Use these column names in square brackets as placeholders in your email templates. Multiple formats are supported:
        </p>
        <div className="text-xs text-foreground/70 mb-3">
          <p>• <code className="px-1 rounded bg-foreground/10">[first_name]</code> - Original format</p>
          <p>• <code className="px-1 rounded bg-foreground/10">[first name]</code> - With spaces</p>
          <p>• <code className="px-1 rounded bg-foreground/10">[firstname]</code> - No underscores</p>
          <p>• <code className="px-1 rounded bg-foreground/10">[owner name]</code> - Special case for owner</p>
          <p>• <code className="px-1 rounded bg-foreground/10">[phone number]</code> - Special case for phone</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {tableColumns.map((column) => (
            <div key={column.name} className="flex items-center gap-2 text-sm">
              <div className="flex flex-col gap-1">
                <code className="px-2 py-1 rounded font-mono text-xs bg-foreground/10">[{column.name}]</code>
                <code className="px-2 py-1 rounded font-mono text-xs bg-foreground/10">[{column.name.replace(/_/g, ' ')}]</code>
                <code className="px-2 py-1 rounded font-mono text-xs bg-foreground/10">[{column.name.replace(/_/g, '')}]</code>
              </div>
              <span className="text-foreground/70">{column.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-lg shadow p-4 mb-4 flex flex-col gap-4 w-full border">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Templates</h2>
          <Button onClick={handleCreateClick}>
            {showForm ? "Close" : "Create"}
          </Button>
        </div>
        {showForm && (
          <div className="flex flex-col gap-3 mt-2">
            <Input
              name="name"
              placeholder="Template Name"
              value={template.name}
              onChange={handleChange}
              className="w-full"
            />
            <Input
              name="subject"
              placeholder="Subject"
              value={template.subject}
              onChange={handleChange}
              className="w-full"
            />
                          <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
                <div className="text-xs text-gray-600 mb-2">
                  <p><strong>Formatting Guide:</strong></p>
                  <p>• <code>**text**</code> for <strong>bold</strong></p>
                  <p>• <code>*text*</code> for <em>italic</em></p>
                  <p>• <code>__text__</code> for <u>underline</u></p>
                  <p>• <code>• item</code> for bullet lists</p>
                  <p>• <code>[text](url)</code> for links</p>
                  <p>• Press Enter or use the ↵ button for new lines</p>
                </div>
                <div className="border rounded-lg">
                {/* Formatting toolbar */}
                <div className="flex gap-1 p-2 bg-foreground/5 border-b rounded-t-lg">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => formatText('bold')}
                    className="text-xs px-2 py-1"
                  >
                    B
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => formatText('italic')}
                    className="text-xs px-2 py-1"
                  >
                    I
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => formatText('underline')}
                    className="text-xs px-2 py-1"
                  >
                    U
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => formatText('list')}
                    className="text-xs px-2 py-1"
                  >
                    •
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => formatText('link')}
                    className="text-xs px-2 py-1"
                  >
                    🔗
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => formatText('newline')}
                    className="text-xs px-2 py-1"
                    title="Add new line"
                  >
                    ↵
                  </Button>
                </div>
                <textarea
                  name="body"
                  placeholder="Write your email content here... Use **bold**, *italic*, __underline__, • lists, and [links](url). Press Enter for new lines."
                  value={template.body}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full border-0 rounded-b-lg p-3 min-h-[120px] resize-y focus:ring-0 focus:outline-none font-mono text-sm"
                  style={{ whiteSpace: 'pre-wrap' }}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button onClick={handleSave}>Save</Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(!showPreview)}
                type="button"
              >
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>
            
            {/* Preview Section */}
            {showPreview && (
              <div className="mt-4 space-y-4">
                {/* Basic Preview */}
                <div className="p-4 bg-foreground/5 rounded-lg border">
                  <h4 className="font-medium mb-2">Preview with Sample Data:</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-foreground/70">Subject:</span>
                      <p className="text-sm p-2 rounded border bg-background">
                        {replacePlaceholders(template.subject, sampleEntryData)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground/70">Body:</span>
                      <div 
                        className="text-sm p-2 rounded border bg-background"
                        dangerouslySetInnerHTML={{ 
                          __html: markdownToHtml(replacePlaceholders(template.body, sampleEntryData)) 
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* iPhone Device Preview */}
                <div className="glass rounded-xl border overflow-hidden">
                  <div className="p-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      iPhone Preview (45-character line limit)
                    </h4>
                    
                    {/* iPhone Preview */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        {/* iPhone Frame - 13:6 aspect ratio (iPhone 16 Pro) */}
                        <div className="w-[150px] h-[325px] bg-black rounded-[1.5rem] p-1 shadow-xl">
                          <div className="w-full h-full bg-white rounded-[1.25rem] overflow-hidden relative">
                            {/* Dynamic Island */}
                            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-black rounded-full z-10"></div>
                            
                            {/* Status Bar */}
                            <div className="h-4 bg-black rounded-t-[1.25rem] flex items-center justify-between px-4 text-white text-xs">
                              <span>9:41</span>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-1.5 bg-white rounded-sm"></div>
                                <div className="w-1 h-1 bg-white rounded-full"></div>
                              </div>
                            </div>
                            
                            {/* Nav Bar (Back, count, compose) */}
                            <div className="bg-white px-2 py-1.5 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                  <span className="text-xs font-medium">Mailboxes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">6</span>
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5A2.121 2.121 0 0 1 19 6v8a2 2 0 0 1-2 2H7l-4 4V6a2 2 0 0 1 2-2h7"/></svg>
                                </div>
                              </div>
                            </div>
                            
                            {/* Email Content */}
                            <div className="p-0 bg-white h-full overflow-y-auto">
                              <div className="px-3 pt-2">
                                <div className="text-[10px] font-semibold text-gray-500 tracking-wide">1 NEW MESSAGE</div>
                              </div>
                              <div className="mx-3 mt-1 mb-2 rounded-md border border-gray-200 overflow-hidden">
                                <div className="p-2 text-[10px] text-gray-700 leading-snug" style={{ maxWidth: '45ch' }}>
                                  {replacePlaceholders(template.preview || 'Markus shared their impressions of 212 Opal Street. The property has prime location, a quiet atmosphere and a spacious backyard with an ocean view. However, it requires significant TLC, including repairing the stone wall and restoring the garden.', sampleEntryData)}
                                </div>
                              </div>
                              <div className="px-3">
                                {/* Email Header */}
                                <div className="mb-4">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/10">
                                      <span className="text-sm font-medium">M</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold">Markus Berget</div>
                                      <div className="text-xs text-foreground/60">To: Céline Mélard, Amy Byrne &gt;</div>
                                    </div>
                                    <div className="text-xs text-foreground/60">Just Now</div>
                                  </div>
                                  <div className="text-sm font-semibold underline">
                                    {replacePlaceholders(template.subject, sampleEntryData)}
                                  </div>
                                </div>
                                
                                {/* Email Body */}
                                <div className="text-sm leading-relaxed" style={{ maxWidth: '45ch' }}>
                                  <div 
                                    dangerouslySetInnerHTML={{ 
                                      __html: markdownToHtml(replacePlaceholders(template.body, sampleEntryData)) 
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Home Indicator */}
                        <div className="w-16 h-0.5 bg-black rounded-full mx-auto mt-1.5"></div>
                      </div>
                      <div className="mt-1.5 text-xs font-medium text-foreground/70">iPhone 16 Pro</div>
                    </div>
                    
                    {/* Device Info */}
                    <div className="mt-4 text-center">
                      <p className="text-xs text-foreground/70">
                        Live preview with 45-character line limit on iPhone
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Templates List */}
        {!loading && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-medium">Saved Templates ({filteredAndSortedTemplates.length})</h3>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 text-sm"
                />
              </div>
            </div>
            
            {templates.length === 0 ? (
              <p className="text-foreground/60 text-sm">No templates saved yet.</p>
            ) : filteredAndSortedTemplates.length === 0 ? (
              <p className="text-foreground/60 text-sm">No templates match your search.</p>
            ) : (
              <div className="space-y-3">
                {/* Sortable Header */}
                <div className="grid grid-cols-12 gap-4 p-3 bg-foreground/5 rounded-lg text-sm font-medium text-foreground/70">
                  <div 
                    className="col-span-4 cursor-pointer hover:opacity-80 flex items-center"
                    onClick={() => handleSort("name")}
                  >
                    Name
                    {sortBy === "name" && (
                      <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                  <div 
                    className="col-span-6 cursor-pointer hover:opacity-80 flex items-center"
                    onClick={() => handleSort("subject")}
                  >
                    Subject
                    {sortBy === "subject" && (
                      <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                  <div className="col-span-2 text-center">Actions</div>
                </div>
                
                {/* Templates */}
                {filteredAndSortedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="grid grid-cols-12 gap-4 p-3 bg-foreground/5 rounded-lg border hover:bg-foreground/8 transition-colors"
                  >
                    <div className="col-span-4">
                      <span 
                        className="font-medium cursor-pointer hover:opacity-80 text-sm"
                        onClick={() => handleEdit(template)}
                      >
                        {template.name}
                      </span>
                    </div>
                    <div className="col-span-6">
                      <span className="text-sm text-foreground/70 truncate block">
                        {template.subject}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                        className="text-xs hover:opacity-80"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Form */}
        {showEditForm && editingTemplate && (
          <div className="mt-4 p-4 glass rounded-lg border">
            <h3 className="text-md font-medium mb-3">Edit Template: {editingTemplate.name}</h3>
            <div className="flex flex-col gap-3">
              <Input
                name="name"
                placeholder="Template Name"
                value={template.name}
                onChange={handleChange}
                className="w-full"
              />
              <Input
                name="subject"
                placeholder="Subject"
                value={template.subject}
                onChange={handleChange}
                className="w-full"
              />
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
                <div className="text-xs text-gray-600 mb-2">
                  <p><strong>Formatting Guide:</strong></p>
                  <p>• <code>**text**</code> for <strong>bold</strong></p>
                  <p>• <code>*text*</code> for <em>italic</em></p>
                  <p>• <code>__text__</code> for <u>underline</u></p>
                  <p>• <code>• item</code> for bullet lists</p>
                  <p>• <code>[text](url)</code> for links</p>
                  <p>• Press Enter or use the ↵ button for new lines</p>
                </div>
                <div className="border rounded-lg">
                  {/* Formatting toolbar */}
                  <div className="flex gap-1 p-2 bg-foreground/5 border-b rounded-t-lg">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => formatText('bold')}
                      className="text-xs px-2 py-1"
                    >
                      B
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => formatText('italic')}
                      className="text-xs px-2 py-1"
                    >
                      I
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => formatText('underline')}
                      className="text-xs px-2 py-1"
                    >
                      U
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => formatText('list')}
                      className="text-xs px-2 py-1"
                    >
                      •
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => formatText('link')}
                      className="text-xs px-2 py-1"
                    >
                      🔗
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => formatText('newline')}
                      className="text-xs px-2 py-1"
                      title="Add new line"
                    >
                      ↵
                    </Button>
                  </div>
                  <textarea
                    name="body"
                    placeholder="Write your email content here... Use **bold**, *italic*, __underline__, • lists, and [links](url). Press Enter for new lines."
                    value={template.body}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className="w-full border-0 rounded-b-lg p-3 min-h-[120px] resize-y focus:ring-0 focus:outline-none font-mono text-sm"
                    style={{ whiteSpace: 'pre-wrap' }}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button onClick={handleUpdate}>
                  Update
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreview(!showPreview)}
                  type="button"
                >
                  {showPreview ? "Hide" : "Show"} Preview
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
              
              {/* Preview Section for Edit Form */}
              {showPreview && (
                <div className="mt-4 p-4 glass rounded-lg border">
                  <h4 className="font-medium mb-2">Preview with Sample Data:</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-foreground/70">Subject:</span>
                      <p className="text-sm bg-background p-2 rounded border">
                        {replacePlaceholders(template.subject, sampleEntryData)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground/70">Body:</span>
                      <div 
                        className="text-sm bg-background p-2 rounded border"
                        dangerouslySetInnerHTML={{ 
                          __html: markdownToHtml(replacePlaceholders(template.body, sampleEntryData)) 
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* TODO: IDs section placeholder */}
    </div>
  );
}

export default TemplatesAndIDs;
