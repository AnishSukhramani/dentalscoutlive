"use client"
//TODO: Integrate Google Sheets as an alternative to Excel/CSV
//TODO: Modularize the code into components
//TODO: Row mapping: Implement a check to ensure that no 2 fields are assigened the same column. 
//TODO: When clicked the excel/csv toggle it should also clear the choose file field

import { useState } from "react";
import UploadFile from "@/components/UploadFile";
import SupabaseTable from "@/components/SupabaseTable";

export default function Home() {
  const [activeSection, setActiveSection] = useState("upload");

  const renderContent = () => {
    switch (activeSection) {
      case "upload":
        return <UploadFile />;
      case "table":
        return <SupabaseTable />;
      default:
        return <div>Select a section</div>;
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 p-4 shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-blue-600">Neurality Health</h2>
        <ul className="space-y-4">
          <li>
            <button
              className={`w-full text-left p-2 rounded hover:bg-blue-100 ${
                activeSection === "upload" ? "bg-blue-200" : ""
              }`}
              onClick={() => setActiveSection("upload")}
            >
              Upload File
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left p-2 rounded hover:bg-blue-100 ${
                activeSection === "table" ? "bg-blue-200" : ""
              }`}
              onClick={() => setActiveSection("table")}
            >
              Supabase Table
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto bg-custom">
        <div className="bg-white p-4 rounded shadow">{renderContent()}</div>
      </div>
    </div>
  );
}
