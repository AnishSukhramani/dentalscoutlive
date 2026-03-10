"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus, ChevronRight, FileText, Trash2, Pause, Square, Play } from "lucide-react";
import { toast } from "sonner";

const TemplatesAndIDs = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [template, setTemplate] = useState({ name: "", subject: "", body: "" });
  const [showPreview, setShowPreview] = useState(false);
  const [addTouchpointLoading, setAddTouchpointLoading] = useState(false);
  const [createTemplateLoading, setCreateTemplateLoading] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const tableColumns = [
    { name: "id", description: "Unique identifier for each practice entry" },
    { name: "practice_name", description: "Name of the dental practice" },
    { name: "domain_url", description: "Website URL of the practice" },
    { name: "owner_name", description: "Name of the practice owner" },
    { name: "email", description: "Contact email address" },
    { name: "phone_number", description: "Contact phone number" },
    { name: "first_name", description: "First name of the contact person" }
  ];

  const sampleEntryData = {
    id: "123",
    practice_name: "Sample Dental Practice",
    domain_url: "https://sampledental.com",
    owner_name: "Dr. John Smith",
    email: "john@sampledental.com",
    phone_number: "(555) 123-4567",
    first_name: "John"
  };

  const formatText = (format) => {
    const textarea = document.querySelector('textarea[name="body"]');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let formattedText = "";
    switch (format) {
      case "bold": formattedText = `**${selectedText}**`; break;
      case "italic": formattedText = `*${selectedText}*`; break;
      case "underline": formattedText = `__${selectedText}__`; break;
      case "list": formattedText = `• ${selectedText}`; break;
      case "link": formattedText = `[${selectedText}](url)`; break;
      case "newline": formattedText = "\n"; break;
      default: formattedText = selectedText;
    }
    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    setTemplate({ ...template, body: newValue });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const markdownToHtml = (text) => {
    if (!text) return "";
    let html = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/__(.*?)__/g, "<u>$1</u>")
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    const lines = html.split("\n");
    const processedLines = [];
    let inList = false;
    for (const line of lines) {
      if (line.trim().startsWith("•")) {
        if (!inList) { processedLines.push("<ul>"); inList = true; }
        processedLines.push(line.replace(/•\s*(.*)/, "<li>$1</li>"));
      } else {
        if (inList) { processedLines.push("</ul>"); inList = false; }
        processedLines.push(line);
      }
    }
    if (inList) processedLines.push("</ul>");
    return processedLines.join("\n").replace(/\n/g, "<br>");
  };

  const replacePlaceholders = (content, entryData) => {
    if (!content || !entryData) return content;
    let replacedContent = content;
    const allPlaceholders = replacedContent.match(/\[([^\]]+)\]/g);
    if (allPlaceholders) {
      allPlaceholders.forEach((placeholder) => {
        const fieldName = placeholder.slice(1, -1);
        const fieldKey = fieldName.replace(/ /g, "_");
        const value = entryData[fieldKey] || entryData[fieldName] || "";
        replacedContent = replacedContent.split(placeholder).join(value);
      });
    }
    const fieldMappings = {
      first_name: ["[first_name]", "[first name]", "[firstname]"],
      practice_name: ["[practice_name]", "[practice name]", "[practicename]"],
      domain_url: ["[domain_url]", "[domain url]", "[domainurl]"],
      owner_name: ["[owner_name]", "[owner name]", "[ownername]"],
      email: ["[email]"],
      phone_number: ["[phone_number]", "[phone number]", "[phonenumber]"],
      id: ["[id]"]
    };
    Object.entries(fieldMappings).forEach(([fieldName, placeholders]) => {
      const value = entryData[fieldName] || "";
      placeholders.forEach((p) => {
        if (replacedContent.includes(p)) replacedContent = replacedContent.split(p).join(value);
      });
    });
    return replacedContent;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const newValue = value.substring(0, start) + "\n" + value.substring(end);
      setTemplate({ ...template, body: newValue });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 1, start + 1);
      }, 0);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    if (!selectedCampaignId) {
      setTemplates([]);
      return;
    }
    try {
      setTemplatesLoading(true);
      const res = await fetch(`/api/templates?campaign_id=${selectedCampaignId}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [selectedCampaignId]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
  const touchpoints = selectedCampaign?.touchpoints || [];

  // Map touchpoint template_id -> email_template
  const templateByTouchpointId = {};
  templates.forEach((t) => {
    if (t.template_id) templateByTouchpointId[t.template_id] = t;
  });

  const handleCreateTemplateForTouchpoint = async (tp, idx) => {
    if (!selectedCampaignId) return;
    setCreateTemplateLoading(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tp.touch_key || `Touchpoint ${idx + 1}`,
          subject: "",
          body: "",
          campaign_id: selectedCampaignId,
          template_id: tp.template_id
        })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Template created");
        fetchTemplates();
        handleEdit(data);
      } else {
        toast.error("Failed to create template");
      }
    } catch (e) {
      toast.error("Failed to create template");
    } finally {
      setCreateTemplateLoading(false);
    }
  };

  const handleAddTouchpoint = async () => {
    if (!selectedCampaignId) {
      toast.error("Select a campaign first");
      return;
    }
    setAddTouchpointLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${selectedCampaignId}/touchpoints`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Touchpoint and template added");
        fetchCampaigns();
        fetchTemplates();
      } else {
        toast.error("Failed to add touchpoint");
      }
    } catch (e) {
      toast.error("Failed to add touchpoint");
    } finally {
      setAddTouchpointLoading(false);
    }
  };

  const handleEdit = (t) => {
    setEditingTemplate(t);
    setTemplate({ name: t.name || "", subject: t.subject || "", body: t.body || "" });
    setShowEditForm(true);
  };

  const handleUpdate = async () => {
    if (!editingTemplate) return;
    try {
      const res = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template)
      });
      if (res.ok) {
        toast.success("Template updated");
        setShowEditForm(false);
        setEditingTemplate(null);
        setTemplate({ name: "", subject: "", body: "" });
        fetchTemplates();
      } else {
        toast.error("Failed to update template");
      }
    } catch (e) {
      toast.error("Failed to update template");
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingTemplate(null);
    setTemplate({ name: "", subject: "", body: "" });
  };

  const handleDelete = async (templateId) => {
    if (!confirm("Delete this template?")) return;
    try {
      const res = await fetch(`/api/templates?id=${templateId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Template deleted");
        fetchTemplates();
        fetchCampaigns();
      } else {
        toast.error("Failed to delete template");
      }
    } catch (e) {
      toast.error("Failed to delete template");
    }
  };

  const handleChange = (e) => {
    setTemplate({ ...template, [e.target.name]: e.target.value });
  };

  const handleCampaignStatus = async (newStatus) => {
    if (!selectedCampaignId) return;
    setStatusSubmitting(true);
    try {
      const res = await fetch(`/api/campaigns/${selectedCampaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(
          newStatus === "paused" ? "Campaign paused" : newStatus === "stopped" ? "Campaign stopped" : "Campaign resumed"
        );
        fetchCampaigns();
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed to update status");
      }
    } catch (e) {
      toast.error("Failed to update status");
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleScheduledDateChange = async (tpIndex, newDate) => {
    if (!selectedCampaignId || !selectedCampaign) return;
    const updated = [...touchpoints];
    if (!updated[tpIndex]) return;
    updated[tpIndex] = { ...updated[tpIndex], scheduled_date: newDate || null };
    try {
      const res = await fetch(`/api/campaigns/${selectedCampaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ touchpoints: updated })
      });
      if (res.ok) {
        toast.success("Scheduled date updated");
        fetchCampaigns();
      } else {
        toast.error("Failed to update date");
      }
    } catch (e) {
      toast.error("Failed to update date");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Placeholders reference */}
      <div className="glass rounded-lg shadow p-4 mb-4 border">
        <h3 className="text-lg font-semibold mb-3">Available Placeholders</h3>
        <p className="text-sm text-foreground/70 mb-2">
          Use <code className="px-1 rounded bg-foreground/10">[first_name]</code>,{" "}
          <code className="px-1 rounded bg-foreground/10">[practice_name]</code>,{" "}
          <code className="px-1 rounded bg-foreground/10">[domain_url]</code>, etc.
        </p>
        <div className="flex flex-wrap gap-2">
          {tableColumns.map((col) => (
            <code key={col.name} className="px-2 py-1 rounded text-xs bg-foreground/10">
              [{col.name}]
            </code>
          ))}
        </div>
      </div>

      <div className="glass rounded-lg shadow p-4 border flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Templates (Campaign-centric)</h2>

        <div className="flex flex-col md:flex-row gap-4 min-h-[400px]">
          {/* Campaign list */}
          <div className="flex flex-col gap-2 md:w-64 shrink-0">
            <h3 className="text-sm font-medium text-foreground/70">Campaigns</h3>
            {campaignsLoading ? (
              <p className="text-sm text-foreground/60">Loading...</p>
            ) : campaigns.length === 0 ? (
              <p className="text-sm text-foreground/60">No campaigns yet. Create one in Campaign Metrics.</p>
            ) : (
              <div className="space-y-1">
                {campaigns.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCampaignId(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      selectedCampaignId === c.id
                        ? "bg-foreground/15 font-medium"
                        : "hover:bg-foreground/10"
                    }`}
                  >
                    <ChevronRight size={14} className={selectedCampaignId === c.id ? "opacity-100" : "opacity-50"} />
                    <span className="truncate flex-1">{c.name}</span>
                    {(c.status || "active") !== "active" && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                          (c.status || "active") === "paused"
                            ? "bg-amber-500/20 text-amber-600"
                            : "bg-red-500/20 text-red-600"
                        }`}
                      >
                        {(c.status || "active")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Touchpoints + templates */}
          <div className="flex-1 min-w-0">
            {!selectedCampaignId ? (
              <div className="flex items-center justify-center h-48 text-foreground/60 text-sm">
                Select a campaign to view templates
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-medium text-foreground/70">
                    {selectedCampaign?.name} – Touchpoints
                  </h3>
                  <div className="flex items-center gap-2">
                    {(selectedCampaign?.status || "active") === "active" && (
                      <Button size="sm" variant="outline" onClick={() => handleCampaignStatus("paused")} disabled={statusSubmitting} title="Pause">
                        <Pause size={14} />
                      </Button>
                    )}
                    {(selectedCampaign?.status || "active") === "paused" && (
                      <Button size="sm" variant="outline" onClick={() => handleCampaignStatus("active")} disabled={statusSubmitting} title="Resume">
                        <Play size={14} />
                      </Button>
                    )}
                    {(selectedCampaign?.status || "active") !== "stopped" && (
                      <Button size="sm" variant="outline" onClick={() => handleCampaignStatus("stopped")} disabled={statusSubmitting} className="text-red-600 hover:text-red-700" title="Stop permanently">
                        <Square size={14} />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleAddTouchpoint}
                      disabled={addTouchpointLoading}
                    >
                      <Plus size={14} className="mr-1" />
                      Add touchpoint
                    </Button>
                  </div>
                </div>
                {templatesLoading ? (
                  <p className="text-sm text-foreground/60">Loading templates...</p>
                ) : touchpoints.length === 0 ? (
                  <p className="text-sm text-foreground/60">No touchpoints. Click + to add.</p>
                ) : (
                  <div className="space-y-2">
                    {touchpoints.map((tp, idx) => {
                      const templateForTp = templateByTouchpointId[tp.template_id];
                      const label = tp.touch_key || `Touchpoint ${idx + 1}`;
                      const isFirstTouchpoint = idx === 0;
                      return (
                        <div
                          key={tp.template_id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-foreground/5 hover:bg-foreground/8 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileText size={18} className="text-foreground/60 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm">{label}</div>
                              <div className="text-xs text-foreground/60 truncate">
                                {templateForTp
                                  ? templateForTp.subject || "(No subject)"
                                  : "No template linked"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {isFirstTouchpoint ? (
                              <span className="text-xs text-foreground/50 px-2 py-1 rounded bg-foreground/10">
                                Manual
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-foreground/70 whitespace-nowrap">Send on:</label>
                                <Input
                                  type="date"
                                  value={tp.scheduled_date || ""}
                                  onChange={(e) => handleScheduledDateChange(idx, e.target.value || null)}
                                  className="h-9 w-auto min-w-[140px] bg-foreground/5 text-foreground [color-scheme:light]"
                                />
                              </div>
                            )}
                            {templateForTp ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(templateForTp)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(templateForTp.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCreateTemplateForTouchpoint(tp, idx)}
                              >
                                Create template
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Edit form */}
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
                <label className="block text-sm font-medium mb-2">Email Body</label>
                <div className="text-xs text-foreground/70 mb-2">
                  <code>**bold**</code> <code>*italic*</code> <code>• list</code> <code>[link](url)</code>
                </div>
                <div className="border rounded-lg">
                  <div className="flex gap-1 p-2 bg-foreground/5 border-b rounded-t-lg">
                    {["bold", "italic", "underline", "list", "link", "newline"].map((f) => (
                      <Button
                        key={f}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => formatText(f)}
                        className="text-xs px-2 py-1"
                      >
                        {f === "bold" ? "B" : f === "italic" ? "I" : f === "underline" ? "U" : f === "list" ? "•" : f === "link" ? "🔗" : "↵"}
                      </Button>
                    ))}
                  </div>
                  <textarea
                    name="body"
                    placeholder="Write your email content..."
                    value={template.body}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className="w-full border-0 rounded-b-lg p-3 min-h-[120px] resize-y focus:ring-0 focus:outline-none font-mono text-sm"
                    style={{ whiteSpace: "pre-wrap" }}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button onClick={handleUpdate}>Update</Button>
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)} type="button">
                  {showPreview ? "Hide" : "Show"} Preview
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              </div>
              {showPreview && (
                <div className="mt-4 p-4 glass rounded-lg border">
                  <h4 className="font-medium mb-2">Preview</h4>
                  <p className="text-sm font-medium text-foreground/70">Subject:</p>
                  <p className="text-sm p-2 rounded border mb-2">
                    {replacePlaceholders(template.subject, sampleEntryData)}
                  </p>
                  <p className="text-sm font-medium text-foreground/70">Body:</p>
                  <div
                    className="text-sm p-2 rounded border"
                    dangerouslySetInnerHTML={{
                      __html: markdownToHtml(replacePlaceholders(template.body, sampleEntryData))
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesAndIDs;
