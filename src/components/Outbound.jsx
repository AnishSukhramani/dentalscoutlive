import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const Outbound = () => {
  const [practices, setPractices] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('practices')
        .select('email, first_name');

      if (error) {
        console.error('Error fetching data:', error);
      } else {
        setPractices(data);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Outbound</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {practices.map((practice, index) => (
            <TableRow key={index}>
              <TableCell>{practice.email}</TableCell>
              <TableCell>{practice.first_name}</TableCell>
              <TableCell>
                <Button onClick={() => console.log(`Sending email to ${practice.email}`)}>
                  Send Email
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Outbound;
