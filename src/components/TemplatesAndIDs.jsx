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
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-col gap-4 w-full">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Templates</h2>
          <Button onClick={() => setShowForm((v) => !v)}>
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
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>
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
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* TODO: IDs section placeholder */}
    </div>
  );
}

export default TemplatesAndIDs;
