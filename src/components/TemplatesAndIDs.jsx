import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const TemplatesAndIDs = () => {
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [template, setTemplate] = useState({ name: "", subject: "", body: "" });
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

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
      <div className="bg-blue-50 rounded-lg shadow p-4 mb-4 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Available Table Columns for Placeholders</h3>
                 <p className="text-sm text-blue-700 mb-3">
           Use these column names in square brackets as placeholders in your email templates. Multiple formats are supported:
         </p>
         <div className="text-xs text-blue-600 mb-3">
           <p>• <code className="bg-blue-100 px-1 rounded">[first_name]</code> - Original format</p>
           <p>• <code className="bg-green-100 px-1 rounded">[first name]</code> - With spaces</p>
           <p>• <code className="bg-yellow-100 px-1 rounded">[firstname]</code> - No underscores</p>
           <p>• <code className="bg-purple-100 px-1 rounded">[owner name]</code> - Special case for owner</p>
           <p>• <code className="bg-purple-100 px-1 rounded">[phone number]</code> - Special case for phone</p>
         </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
           {tableColumns.map((column) => (
             <div key={column.name} className="flex items-center gap-2 text-sm">
               <div className="flex flex-col gap-1">
                 <code className="bg-blue-100 px-2 py-1 rounded font-mono text-xs">[{column.name}]</code>
                 <code className="bg-green-100 px-2 py-1 rounded font-mono text-xs">[{column.name.replace(/_/g, ' ')}]</code>
                 <code className="bg-yellow-100 px-2 py-1 rounded font-mono text-xs">[{column.name.replace(/_/g, '')}]</code>
               </div>
               <span className="text-gray-700">{column.description}</span>
             </div>
           ))}
         </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-col gap-4 w-full">
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
            <textarea
              name="body"
              placeholder="Body"
              value={template.body}
              onChange={handleChange}
              className="w-full border rounded p-2 min-h-[80px]"
            />
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
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium text-gray-800 mb-2">Preview with Sample Data:</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Subject:</span>
                    <p className="text-sm bg-white p-2 rounded border">
                      {replacePlaceholders(template.subject, sampleEntryData)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Body:</span>
                    <p className="text-sm bg-white p-2 rounded border whitespace-pre-wrap">
                      {replacePlaceholders(template.body, sampleEntryData)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Templates List */}
        {!loading && (
          <div className="mt-4">
            <h3 className="text-md font-medium mb-3">Saved Templates</h3>
            {templates.length === 0 ? (
              <p className="text-gray-500 text-sm">No templates saved yet.</p>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <span 
                      className="font-medium cursor-pointer hover:text-blue-600"
                      onClick={() => handleEdit(template)}
                    >
                      {template.name}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Form */}
        {showEditForm && editingTemplate && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-md font-medium mb-3 text-blue-800">Edit Template: {editingTemplate.name}</h3>
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
              <textarea
                name="body"
                placeholder="Body"
                value={template.body}
                onChange={handleChange}
                className="w-full border rounded p-2 min-h-[80px]"
              />
              <div className="flex gap-2 mt-2">
                <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">
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
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Preview with Sample Data:</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-blue-600">Subject:</span>
                      <p className="text-sm bg-white p-2 rounded border">
                        {replacePlaceholders(template.subject, sampleEntryData)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-600">Body:</span>
                      <p className="text-sm bg-white p-2 rounded border whitespace-pre-wrap">
                        {replacePlaceholders(template.body, sampleEntryData)}
                      </p>
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
