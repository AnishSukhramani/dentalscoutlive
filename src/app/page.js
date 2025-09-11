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
import IDs from "@/components/IDs";
import Audience from "@/components/Audience";
import AgenticCall from "@/components/AgenticCall";
import { Menu } from "lucide-react";
import Glass from "@/components/Glass";

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
      case "ids":
        return <IDs />;
      case "audience":
        return <Audience />;
      case "agentic-call":
        return <AgenticCall />;
      default:
        return <div>Select a section</div>;
    }
  };

  return (
    <div className="flex h-screen text-foreground" style={{backgroundImage: "url('/background.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundAttachment: "fixed"}}>
      {/* Sidebar toggle button for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-[var(--radius-md)] glass"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <Menu />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 transform p-4 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:flex md:flex-col`}
      >
        <Glass tier="thick" className="h-full w-full p-4">
          <h2 className="text-2xl font-bold mb-6">
            <span style={{color: '#2563eb'}}>Neurality</span> Health
          </h2>
          <ul className="space-y-2">
            <li>
              <button
                className={`w-full text-left px-3 py-2 rounded-[var(--radius-md)] hover:bg-foreground/6 ${
                  activeSection === "upload" ? "bg-foreground/10" : ""
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
                className={`w-full text-left px-3 py-2 rounded-[var(--radius-md)] hover:bg-foreground/6 ${
                  activeSection === "table" ? "bg-foreground/10" : ""
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
                className={`w-full text-left px-3 py-2 rounded-[var(--radius-md)] hover:bg-foreground/6 ${
                  activeSection === "outbound" ? "bg-foreground/10" : ""
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
                className={`w-full text-left px-3 py-2 rounded-[var(--radius-md)] hover:bg-foreground/6 ${
                  activeSection === "templates" ? "bg-foreground/10" : ""
                }`}
                onClick={() => {
                  setActiveSection("templates");
                  setSidebarOpen(false);
                }}
              >
                Templates
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-3 py-2 rounded-[var(--radius-md)] hover:bg-foreground/6 ${
                  activeSection === "ids" ? "bg-foreground/10" : ""
                }`}
                onClick={() => {
                  setActiveSection("ids");
                  setSidebarOpen(false);
                }}
              >
                IDs
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-3 py-2 rounded-[var(--radius-md)] hover:bg-foreground/6 ${
                  activeSection === "audience" ? "bg-foreground/10" : ""
                }`}
                onClick={() => {
                  setActiveSection("audience");
                  setSidebarOpen(false);
                }}
              >
                Audience
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-3 py-2 rounded-[var(--radius-md)] hover:bg-foreground/6 ${
                  activeSection === "agentic-call" ? "bg-foreground/10" : ""
                }`}
                onClick={() => {
                  setActiveSection("agentic-call");
                  setSidebarOpen(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <span>Agentic Call</span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full border border-[color:var(--hairline-color)]">
                    BETA
                  </span>
                </div>
              </button>
            </li>
          </ul>
        </Glass>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-0 p-4 overflow-y-auto">
        <Glass className="max-w-auto mx-auto p-4">
          {renderContent()}
        </Glass>
      </main>
    </div>
  );
}
