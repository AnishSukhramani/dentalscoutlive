"use client"
//TODO: Integrate Google Sheets as an alternative to Excel/CSV
//TODO: Modularize the code into components
//TODO: Row mapping: Implement a check to ensure that no 2 fields are assigened the same column. 
//TODO: When clicked the excel/csv toggle it should also clear the choose file field

import SupabaseTable from "@/components/SupabaseTable";
import UploadFile from "@/components/UploadFile";

export default function Home() {
  return (
    <div className="space-y-4 p-4 bg-custom overflow-x-hidden">
      <h1 className="text-blue-500 font-bold text-xl">Neurality Health</h1>
      <UploadFile />
      <SupabaseTable/>
    </div>
  );
}
