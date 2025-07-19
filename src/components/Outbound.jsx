// Import necessary React hooks and components
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Import custom UI components
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Outbound Component
 * 
 * Displays a list of practices with their contact information
 * and provides functionality to send emails to each practice.
 */
const Outbound = () => {
  // State to hold the list of practices fetched from Supabase
  const [practices, setPractices] = useState([]);
  const [emailCounts, setEmailCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch practices data from Supabase when the component mounts
  useEffect(() => {
    const fetchPractices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('practices')
          .select('email, first_name, email_sent_count')
          .not('email', 'is', null);

        if (fetchError) {
          console.error('Error fetching practices:', fetchError);
          setError('Failed to load practices');
        } else {
          setPractices(data || []);
          
          // Extract email counts from the fetched data
          const counts = {};
          (data || []).forEach(practice => {
            if (practice.email) {
              counts[practice.email] = practice.email_sent_count || 0;
            }
          });
          setEmailCounts(counts);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPractices();
  }, []);

  // Remove the separate fetchEmailCounts function since we're getting counts directly

  // Handle sending email to a practice
  const handleSendEmail = (practiceEmail) => {
    console.log(`Sending email to ${practiceEmail}`);
    // TODO: Implement actual email sending functionality
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4">Outbound</h1>
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">Loading practices...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4">Outbound</h1>
        <div className="flex items-center justify-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Outbound</h1>
        <p className="text-gray-600 mt-1">
          Manage and send emails to your practice contacts
        </p>
      </div>

      {/* Practices table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-900">Email</TableHead>
              <TableHead className="font-semibold text-gray-900">First Name</TableHead>
              <TableHead className="font-semibold text-gray-900">Email Count</TableHead>
              <TableHead className="font-semibold text-gray-900">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {practices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  No practices found
                </TableCell>
              </TableRow>
            ) : (
              practices.map((practice, index) => (
                <TableRow 
                  key={`${practice.email}-${index}`}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="font-medium text-gray-900">
                    {practice.email}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {practice.first_name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {emailCounts[practice.email] || 0}
                  </TableCell>
                  <TableCell>
                    <Button 
                      onClick={() => handleSendEmail(practice.email)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Send Email
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {practices.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Total practices: {practices.length}
        </div>
      )}
    </div>
  );
};

export default Outbound;
