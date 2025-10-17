"use client"
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { Input } from "@/components/ui/input";
import AnimatedSearchInput from "@/components/ui/animated-search";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Trash2, Edit3 } from "lucide-react";

export default function SupabaseTable() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAllPage, setSelectAllPage] = useState(false);
  const [selectAllGlobal, setSelectAllGlobal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(15);
  const [customEntries, setCustomEntries] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalRows, setTotalRows] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({});

  const cacheRef = useRef({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, data]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error, count } = await supabase
      .from("practices")
      .select("*", { count: "exact" })
      .order('practice_name', { ascending: true })
      .order('id', { ascending: true });
    if (error) setError(error);
    else {
      cacheRef.current = data;
      setData(data);
      setFilteredData(data);
      setTotalRows(data.length);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredData(data);
      return;
    }
    const query = searchQuery.toLowerCase();
    const result = data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
    setFilteredData(result);
    setPage(1);
  };

  const highlightMatch = (text) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery})`, "gi");
    return String(text).split(regex).map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <span key={i} className="bg-foreground/10 font-heavy">{part}</span>
      ) : (
        part
      )
    );
  };

  const paginatedData = filteredData.slice((page - 1) * entriesPerPage, page * entriesPerPage);
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);

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

  const handleDelete = async (id) => {
    await supabase.from("practices").delete().eq("id", id);
    fetchData();
    setDeleteId(null);
  };

  const handleEdit = (row) => {
    setEditingRow(row);
    setFormData(row);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    await supabase.from("practices").update(formData).eq("id", formData.id);
    setEditingRow(null);
    fetchData();
  };

  const handleCustomEntriesChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setCustomEntries(value);
      const num = Math.max(1, Math.min(50, Number(value)));
      if (value !== "") setEntriesPerPage(num);
    }
  };

  const handleSelect = (id, checked) => {
    const updated = new Set(selectedIds);
    checked ? updated.add(id) : updated.delete(id);
    setSelectedIds(updated);
    setSelectAllPage(false);
    setSelectAllGlobal(false);
  };

  const handleSelectAllPage = () => {
    const updated = new Set(paginatedData.map((d) => d.id));
    setSelectedIds(updated);
    setSelectAllPage(true);
    setSelectAllGlobal(false);
  };

  const handleSelectAllGlobal = () => {
    setSelectedIds(new Set(filteredData.map((d) => d.id)));
    setSelectAllPage(false);
    setSelectAllGlobal(true);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setSelectAllPage(false);
    setSelectAllGlobal(false);
  };

  const handleCreate = async () => {
    try {
      // Ensure domain_url is not blank
      if (!createFormData.domain_url || createFormData.domain_url.trim() === '') {
        toast.error('Domain URL cannot be blank');
        return;
      }

      const { error } = await supabase.from("practices").insert(createFormData);
      if (error) {
        toast.error('Failed to create entry: ' + error.message);
      } else {
        toast.success('Entry created successfully');
        setIsCreateDialogOpen(false);
        setCreateFormData({});
        fetchData();
      }
    } catch (error) {
      toast.error('Error creating entry: ' + error.message);
    }
  };

  const handleCreateChange = (e) => {
    setCreateFormData({ ...createFormData, [e.target.name]: e.target.value });
  };

  const handleCopy = async () => {
    const selected = data.filter((row) => selectedIds.has(row.id));
    if (selected.length === 0) {
      toast.error("No rows selected to copy");
      return;
    }
    
    // Get column headers (excluding 'id' for cleaner output)
    const headers = Object.keys(selected[0]).filter(key => key !== 'id');
    
    // Create TSV content with headers
    const tsvContent = [
      headers.join('\t'), // Header row
      ...selected.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle null/undefined values and escape tabs
          return value === null || value === undefined ? '' : String(value).replace(/\t/g, ' ');
        }).join('\t')
      )
    ].join('\n');
    
    try {
      await navigator.clipboard.writeText(tsvContent);
      toast.success(`Copied ${selected.length} row(s) as TSV to clipboard`);
    } catch (e) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const exportToCsv = () => {
    const selected = data.filter((row) => selectedIds.has(row.id));
    if (selected.length === 0) return;
    const headers = Object.keys(selected[0]);
    const csv = [headers.join(",")].concat(
      selected.map((row) => headers.map((field) => `"${row[field]}"`).join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = async () => {
    const XLSX = await import("xlsx");
    const selected = data.filter((row) => selectedIds.has(row.id));
    const ws = XLSX.utils.json_to_sheet(selected);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "data.xlsx");
  };

  const handleBulkDelete = async () => {
    await supabase.from("practices").delete().in("id", Array.from(selectedIds));
    fetchData();
    setSelectedIds(new Set());
  };


  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4">Error loading data: {error.message}</p>;

  return (
    <div className="p-4 max-w-full overflow-x-auto space-y-4">
      <div className="flex items-center space-x-4 flex-wrap">
        <span>Rows per page:</span>
        <Select
          value={String(entriesPerPage)}
          onValueChange={(value) => {
            setEntriesPerPage(Math.min(50, Number(value)));
            setCustomEntries("");
          }}
        >
          <SelectTrigger className="w-[100px]">
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
          className="w-[100px]"
        />
        <AnimatedSearchInput
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[250px]"
          placeholder="Search..."
          suggestions={["Practice, domain, owner", "Email, phone", "Contact name"]}
        />
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="glass-grnbtn text-black">
              Create Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md text-white">
            <DialogHeader>
              <DialogTitle>Create New Practice Entry</DialogTitle>
              <DialogDescription className="text-[#7f7d7d]">
                Fill in the details for the new practice entry. Domain URL is required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Practice Name</label>
                <Input
                  className="text-[#b2b1b1]"
                  name="practice_name"
                  placeholder="Practice Name"
                  value={createFormData.practice_name || ""}
                  onChange={handleCreateChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Domain URL *</label>
                <Input
                  name="domain_url"
                  placeholder="Domain URL (required)"
                  value={createFormData.domain_url || ""}
                  onChange={handleCreateChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Owner Name</label>
                <Input
                  name="owner_name"
                  placeholder="Owner Name"
                  value={createFormData.owner_name || ""}
                  onChange={handleCreateChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={createFormData.email || ""}
                  onChange={handleCreateChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  name="phone_number"
                  placeholder="Phone Number"
                  value={createFormData.phone_number || ""}
                  onChange={handleCreateChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input
                  name="first_name"
                  placeholder="First Name"
                  value={createFormData.first_name || ""}
                  onChange={handleCreateChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="glassred" className="text-[#b2b1b1]" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <StatefulButton
                className="bg-green-500 glass-grnbtn hover:ring-green-500"
                onClick={async () => { await handleCreate(); }}
                type="button"
              >
                Create Entry
              </StatefulButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex gap-2 items-center border p-2 rounded-md shadow bg-foreground/5">
          <Button variant="secondary" onClick={handleSelectAllPage}>Select All on Page</Button>
          <Button variant="secondary" onClick={handleSelectAllGlobal}>Select All Across Pages</Button>
          <Button onClick={handleClearSelection}>Clear Selection</Button>
          <Button onClick={handleCopy}>Copy</Button>
          <Button onClick={exportToCsv}>Export CSV</Button>
          <Button onClick={exportToExcel}>Export Excel</Button>
          <Button disabled>Fetch</Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="text-[#b2b1b1]">
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription className="text-[#c1bfbf]">This action cannot be undone.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" className="text-[#b2b1b1]">Cancel</Button>
                <Button variant="destructive" className="text-[#b2b1b1]" onClick={handleBulkDelete}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
      

      <Table>
        <TableCaption>All Practices from Supabase</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Select</TableHead>
            <TableHead>Practice Name</TableHead>
            <TableHead>Domain URL</TableHead>
            <TableHead>Owner Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(row.id)}
                  onCheckedChange={(checked) => handleSelect(row.id, checked)}
                  className="border-black"
                />
              </TableCell>
              <TableCell>{highlightMatch(row.practice_name)}</TableCell>
              <TableCell>{highlightMatch(row.domain_url)}</TableCell>
              <TableCell>{highlightMatch(row.owner_name)}</TableCell>
              <TableCell>{highlightMatch(row.email)}</TableCell>
              <TableCell>{highlightMatch(row.phone_number)}</TableCell>
              <TableCell>{highlightMatch(row.first_name)}</TableCell>
              <TableCell className="text-right space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="text-amber-600 hover:bg-transparent transition-all duration-200"
                       onClick={() => handleEdit(row)}
                     >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader className="text-[#b2b1b1]">
                      <DialogTitle>Edit Practice</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {Object.keys(row).filter(key => key !== "id" && key !== "email_sent_count" && key !== "tags").map(key => (
                        <Input
                          className="text-[#b2b1b1]"
                          key={key}
                          name={key}
                          placeholder={key}
                          value={formData[key] || ""}
                          onChange={handleChange}
                        />
                      ))}
                      <StatefulButton
                        className="w-full bg-green-500 glass-grnbtn hover:ring-green-500"
                        onClick={async () => { await handleUpdate(); }}
                        type="button"
                      >
                        Update
                      </StatefulButton>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={deleteId === row.id} onOpenChange={(open) => setDeleteId(open ? row.id : null)}>
                  <DialogTrigger asChild>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="text-red-600 hover:bg-transparent transition-all duration-200"
                     >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader className="text-[#b2b1b1]">
                      <DialogTitle>Are you sure?</DialogTitle>
                      <DialogDescription className="text-[#c1bfbf]">
                        This action cannot be undone. This will permanently delete the entry.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" className="text-[#b2b1b1]" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" className="text-[#b2b1b1]" onClick={() => handleDelete(row.id)}>Confirm</Button>
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex flex-wrap gap-1 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
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
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}