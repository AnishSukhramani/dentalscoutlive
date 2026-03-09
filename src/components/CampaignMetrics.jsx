"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CampaignMetrics = () => {
  const [repliedContacts, setRepliedContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [newCampaignName, setNewCampaignName] = useState("");
  const [editCampaignName, setEditCampaignName] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [addTouchpointSubmitting, setAddTouchpointSubmitting] = useState(false);

  const [campaignMetrics, setCampaignMetrics] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);

  const fetchRepliedContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("practices")
        .select("id, first_name, email, email_sent_count, reply_meta, tags")
        .contains("reply_meta", { has_replied: true })
        .order("reply_meta->last_reply_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching replied contacts:", fetchError);
        setError("Failed to load campaign metrics");
        setRepliedContacts([]);
      } else {
        setRepliedContacts(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred");
      setRepliedContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const res = await fetch("/api/campaigns");
      const json = await res.json();
      if (res.ok) {
        setCampaigns(json.campaigns || []);
        if (!json.campaigns?.some((c) => c.id === selectedCampaignId)) {
          setSelectedCampaignId("");
          setEditCampaignName("");
        }
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepliedContacts();
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      const c = campaigns.find((x) => x.id === selectedCampaignId);
      setEditCampaignName(c?.name ?? "");
    } else {
      setEditCampaignName("");
    }
  }, [selectedCampaignId, campaigns]);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!selectedCampaignId) {
        setCampaignMetrics([]);
        setMetricsError(null);
        return;
      }
      setMetricsLoading(true);
      setMetricsError(null);
      try {
        const res = await fetch(`/api/campaigns/${selectedCampaignId}/metrics`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load campaign metrics");
        }
        setCampaignMetrics(json.rows || []);
      } catch (err) {
        console.error("Error fetching campaign metrics:", err);
        setMetricsError("Failed to load campaign metrics");
        setCampaignMetrics([]);
      } finally {
        setMetricsLoading(false);
      }
    };

    fetchMetrics();
  }, [selectedCampaignId]);

  const syncReplies = async () => {
    try {
      const res = await fetch("/api/syncReplies", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          `Synced: ${json.updatedPractices ?? 0} updated, ${json.checkedMessages ?? 0} messages checked`
        );
        fetchRepliedContacts();
      } else {
        toast.error(json.error || "Sync failed");
      }
    } catch (e) {
      toast.error("Sync failed");
    }
  };

  const handleCreateCampaign = async () => {
    const name = newCampaignName.trim();
    if (!name) {
      toast.error("Enter a campaign name");
      return;
    }
    setCreateSubmitting(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Campaign created");
        setNewCampaignName("");
        fetchCampaigns();
        setSelectedCampaignId(json.id);
        setEditCampaignName(json.name);
      } else {
        toast.error(json.error || "Failed to create campaign");
      }
    } catch (e) {
      toast.error("Failed to create campaign");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleUpdateCampaign = async () => {
    if (!selectedCampaignId) return;
    const name = editCampaignName.trim();
    if (!name) {
      toast.error("Enter a campaign name");
      return;
    }
    setUpdateSubmitting(true);
    try {
      const res = await fetch(`/api/campaigns/${selectedCampaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Campaign updated");
        fetchCampaigns();
      } else {
        toast.error(json.error || "Failed to update campaign");
      }
    } catch (e) {
      toast.error("Failed to update campaign");
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const handleAddTouchpoint = async () => {
    if (!selectedCampaignId || !selectedCampaign) return;
    const current = selectedCampaign.touchpoints || [];
    const n = current.length;
    const newTouchpoint = {
      touch_key: `tp${n + 1}`,
      template_id: crypto.randomUUID(),
      touch_tag_id: `camp:${selectedCampaignId}:tp${n + 1}`,
    };
    setAddTouchpointSubmitting(true);
    try {
      const res = await fetch(`/api/campaigns/${selectedCampaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ touchpoints: [...current, newTouchpoint] }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Touchpoint added");
        fetchCampaigns();
      } else {
        toast.error(json.error || "Failed to add touchpoint");
      }
    } catch (e) {
      toast.error("Failed to add touchpoint");
    } finally {
      setAddTouchpointSubmitting(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!selectedCampaignId) return;
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/campaigns/${selectedCampaignId}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        toast.success("Campaign deleted");
        setSelectedCampaignId("");
        setEditCampaignName("");
        fetchCampaigns();
      } else {
        toast.error(json.error || "Failed to delete campaign");
      }
    } catch (e) {
      toast.error("Failed to delete campaign");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const selectedCampaign = selectedCampaignId
    ? campaigns.find((c) => c.id === selectedCampaignId)
    : null;

  const formatTouchpointLabel = (touchKey) => {
    if (!touchKey) return "";
    if (touchKey.startsWith("tp")) {
      const n = parseInt(touchKey.slice(2), 10);
      if (!Number.isNaN(n)) {
        return `Touchpoint ${n}`;
      }
    }
    return touchKey;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Campaign Metrics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Contacts who replied to outbound emails
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={syncReplies}>
          Sync Replies
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {repliedContacts.length === 0
            ? "No replied contacts yet. Run Sync Replies after recipients reply to your emails."
            : `Total replied contacts: ${repliedContacts.length}`}
        </p>
      )}

      {/* Compact campaign CRUD */}
      <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline-color)] p-3 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Campaigns
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[140px] space-y-1">
            <label className="text-xs text-muted-foreground block">Create campaign</label>
            <div className="flex gap-2">
              <Input
                placeholder="Campaign name"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                className="max-w-[200px]"
              />
              <Button
                size="sm"
                onClick={handleCreateCampaign}
                disabled={createSubmitting || !newCampaignName.trim()}
              >
                {createSubmitting ? "Creating…" : "Create"}
              </Button>
            </div>
          </div>
          <div className="min-w-[140px] space-y-1">
            <label className="text-xs text-muted-foreground block">View campaign</label>
            <Select
              value={selectedCampaignId || "__none__"}
              onValueChange={(v) => setSelectedCampaignId(v === "__none__" ? "" : v)}
              disabled={campaignsLoading}
            >
              <SelectTrigger className="max-w-[220px] w-full h-9 text-sm">
                <SelectValue placeholder="Select a campaign…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select a campaign…</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedCampaign && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {(selectedCampaign.touchpoints || []).length} touchpoint
                  {(selectedCampaign.touchpoints || []).length === 1 ? "" : "s"}{" "}
                  existing
                </span>
                <Button
                  size="sm"
                  onClick={handleAddTouchpoint}
                  disabled={addTouchpointSubmitting}
                  className="px-3 h-8"
                >
                  {addTouchpointSubmitting ? "Adding…" : "Add touchpoint"}
                </Button>
              </div>
              <div className="flex-1 min-w-[140px] space-y-1">
                {/* <label className="text-xs text-muted-foreground block">
                  Rename
                </label> */}
                <div className="flex gap-2 justify-end">
                  <Input
                    value={editCampaignName}
                    onChange={(e) => setEditCampaignName(e.target.value)}
                    className="max-w-[180px]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUpdateCampaign}
                    disabled={
                      updateSubmitting ||
                      editCampaignName.trim() === selectedCampaign.name
                    }
                  >
                    {updateSubmitting ? "Saving…" : "Update"}
                  </Button>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/50 hover:bg-destructive/10 flex items-center justify-center"
                onClick={handleDeleteCampaign}
                disabled={deleteSubmitting}
                aria-label="Delete campaign"
                title="Delete campaign"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedCampaignId && (
        <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline-color)] p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Campaign details
          </p>

          {metricsLoading ? (
            <p className="text-sm text-muted-foreground">Loading campaign metrics…</p>
          ) : metricsError ? (
            <p className="text-sm text-destructive">{metricsError}</p>
          ) : campaignMetrics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No contacts have been sent emails in this campaign yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-1 pr-2 font-medium">Email</th>
                    <th className="py-1 pr-2 font-medium">Name</th>
                    <th className="py-1 pr-2 font-medium">Status</th>
                    <th className="py-1 pr-2 font-medium">Reply touchpoint</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignMetrics.map((row) => {
                    const status = row.has_replied ? "Replied" : "Sent";
                    const labels = row.reply_touchpoint_labels;
                    const replyTouchpoints =
                      labels && labels.length > 0
                        ? labels.join(", ")
                        : "—";

                    return (
                      <tr key={row.practice_id} className="border-b last:border-0">
                        <td className="py-1 pr-2">{row.email}</td>
                        <td className="py-1 pr-2">
                          {row.first_name || row.practice_name || "N/A"}
                        </td>
                        <td className="py-1 pr-2">{status}</td>
                        <td className="py-1 pr-2">{replyTouchpoints}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignMetrics;
