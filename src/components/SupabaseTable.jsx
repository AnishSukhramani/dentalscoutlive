import { useEffect, useState } from "react";
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

export default function SupabaseTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("practices").select("*");
    if (error) setError(error);
    else setData(data);
    setLoading(false);
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

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-red-500">Error loading data: {error.message}</p>;

  return (
    <div className="p-4 max-w-full overflow-x-auto">
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
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.practice_name}</TableCell>
              <TableCell>{row.domain_url}</TableCell>
              <TableCell>{row.owner_name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.phone_number}</TableCell>
              <TableCell>{row.first_name}</TableCell>
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
    </div>
  );
}
