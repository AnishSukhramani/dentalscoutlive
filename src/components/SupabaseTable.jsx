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

export default function SupabaseTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("practices").select("*");
      if (error) {
        console.error("Error fetching data:", error);
        setError(error);
      } else {
        setData(data);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-red-500">Error loading data: {error.message}</p>;

  return (
    <div className="p-4">
      <Table>
        <TableCaption>All Practices from Supabase</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Practice Name</TableHead>
            <TableHead>Domain URL</TableHead>
            <TableHead>Owner Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>First Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.practice_name}</TableCell>
              <TableCell>{row.domain_url}</TableCell>
              <TableCell>{row.owner_name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.phone_number}</TableCell>
              <TableCell>{row.first_name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
