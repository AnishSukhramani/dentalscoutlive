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
import { Input } from "@/components/ui/input";
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

export default function SupabaseTable() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
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

  const cacheRef = useRef({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, data]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error, count } = await supabase.from("practices").select("*", { count: "exact" });
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
        <span key={i} className="bg-yellow-200 font-semibold">{part}</span>
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

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-red-500">Error loading data: {error.message}</p>;

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
        <Input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[250px]"
        />
      </div>

      <Table>
        <TableCaption>All Practices from Supabase</TableCaption>
        <TableHeader>
          <TableRow>
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
              <TableCell>{highlightMatch(row.practice_name)}</TableCell>
              <TableCell>{highlightMatch(row.domain_url)}</TableCell>
              <TableCell>{highlightMatch(row.owner_name)}</TableCell>
              <TableCell>{highlightMatch(row.email)}</TableCell>
              <TableCell>{highlightMatch(row.phone_number)}</TableCell>
              <TableCell>{highlightMatch(row.first_name)}</TableCell>
              <TableCell className="text-right space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Edit Practice</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {Object.keys(row).filter(key => key !== "id").map(key => (
                        <Input
                          key={key}
                          name={key}
                          placeholder={key}
                          value={formData[key] || ""}
                          onChange={handleChange}
                        />
                      ))}
                      <Button onClick={handleUpdate} className="w-full">
                        Update
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={deleteId === row.id} onOpenChange={(open) => setDeleteId(open ? row.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">Delete</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Are you sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete the entry.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => handleDelete(row.id)}>Confirm</Button>
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