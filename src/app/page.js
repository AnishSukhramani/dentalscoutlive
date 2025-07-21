"use client"
//TODO: Integrate Google Sheets as an alternative to Excel/CSV
//TODO: Modularize the code into components
//TODO: Row mapping: Implement a check to ensure that no 2 fields are assigened the same column. 
//TODO: When clicked the excel/csv toggle it should also clear the choose file field
//TODO: location Counter - hard to do so maybe try later
//TODO: Add number of entries selected feature
import { useState } from "react";
import UploadFile from "@/components/UploadFile";
import SupabaseTable from "@/components/SupabaseTable";
import Outbound from "@/components/Outbound";
import TemplatesAndIDs from "@/components/TemplatesAndIDs";
import { Menu } from "lucide-react";

export default function Home() {
  const [activeSection, setActiveSection] = useState("upload");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case "upload":
        return <UploadFile />;
      case "table":
        return <SupabaseTable />;
      case "outbound":
        return <Outbound />;
      case "templates":
        return <TemplatesAndIDs />;
      default:
        return <div>Select a section</div>;
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar toggle button for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white shadow-md rounded"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <Menu />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 transform bg-gray-100 p-4 shadow-md transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:flex md:flex-col`}
      >
        <h2 className="text-2xl font-bold mb-6 text-blue-600">Neurality Health</h2>
        <ul className="space-y-4">
          <li>
            <button
              className={`w-full text-left p-2 rounded hover:bg-blue-100 transition-colors duration-200 ${
                activeSection === "upload" ? "bg-blue-200" : ""
              }`}
              onClick={() => {
                setActiveSection("upload");
                setSidebarOpen(false);
              }}
            >
              Upload File
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left p-2 rounded hover:bg-blue-100 transition-colors duration-200 ${
                activeSection === "table" ? "bg-blue-200" : ""
              }`}
              onClick={() => {
                setActiveSection("table");
                setSidebarOpen(false);
              }}
            >
              Supabase Table
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left p-2 rounded hover:bg-blue-100 transition-colors duration-200 ${
                activeSection === "outbound" ? "bg-blue-200" : ""
              }`}
              onClick={() => {
                setActiveSection("outbound");
                setSidebarOpen(false);
              }}
            >
              Outbound
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left p-2 rounded hover:bg-blue-100 transition-colors duration-200 ${
                activeSection === "templates" ? "bg-blue-200" : ""
              }`}
              onClick={() => {
                setActiveSection("templates");
                setSidebarOpen(false);
              }}
            >
              Templates and IDs
            </button>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-0 p-0 bg-gray-50 overflow-y-auto">
        <div className="max-w-auto mx-auto bg-white p-6 rounded shadow-md">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
