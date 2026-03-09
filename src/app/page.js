"use client"
//TODO: Integrate Google Sheets as an alternative to Excel/CSV
//TODO: Modularize the code into components
//TODO: Row mapping: Implement a check to ensure that no 2 fields are assigened the same column. 
//TODO: When clicked the excel/csv toggle it should also clear the choose file field
//TODO: location Counter - hard to do so maybe try later
//TODO: Add number of entries selected feature
import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadFile from "@/components/UploadFile";
import SupabaseTable from "@/components/SupabaseTable";
import Outbound from "@/components/Outbound";
import TemplatesAndIDs from "@/components/TemplatesAndIDs";
import IDs from "@/components/IDs";
import Audience from "@/components/Audience";
import AgenticCall from "@/components/AgenticCall";
import CampaignMetrics from "@/components/CampaignMetrics";
import { Menu, FileUp, Table2, Rocket, LayoutTemplate, IdCard, Users, PhoneCall, BarChart2, LogOut } from "lucide-react";
import Glass from "@/components/Glass";
import FloatingDock from "@/components/ui/floating-dock";

export default function Home() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("upload");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

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
      case "campaign-metrics":
        return <CampaignMetrics />;
      default:
        return <div>Select a section</div>;
    }
  };

  return (
    <div className="flex h-screen text-foreground" style={{backgroundImage: "url('/whitebg.jpg')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundAttachment: "fixed"}}>
      {/* Sidebar toggle button for mobile (disabled in favor of dock) */}
      {/* {!sidebarOpen && (
        <div className="md:hidden fixed top-3 left-3 z-[100] pointer-events-none">
          <button
            className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] glass pointer-events-auto"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
        </div>
      )} */}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 transform p-4 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:flex md:flex-col`}
      >
        <Glass tier="thick" className="h-full w-full p-4 flex flex-col">
          <h2 className="text-2xl font-heavy mb-6 whitespace-nowrap shrink-0">
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
            <li>
              <button
                className={`w-full text-left px-3 py-2 rounded-[var(--radius-md)] hover:bg-foreground/6 ${
                  activeSection === "campaign-metrics" ? "bg-foreground/10" : ""
                }`}
                onClick={() => {
                  setActiveSection("campaign-metrics");
                  setSidebarOpen(false);
                }}
              >
                Campaign Metrics
              </button>
            </li>
          </ul>
          <div className="mt-auto pt-6 border-t border-[color:var(--hairline-color)]">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] hover:bg-foreground/6 text-foreground/80"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </Glass>
      </aside>
      {/* Mobile overlay to close sidebar on outside click */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-[45] bg-black/10"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-0 p-4 overflow-y-auto scrollbar-none pb-24 md:pb-0">
        <Glass className="h-full overflow-y-auto scrollbar-none max-w-auto mx-auto p-4">
          {renderContent()}
        </Glass>
      </main>
      {/* Fixed bottom full-width dock wrapper (mobile-only; hidden when sidebar is visible) */}
      <div className="fixed bottom-4 inset-x-0 px-4 z-40 md:hidden">
        <FloatingDock
          items={[
            { title: "Upload", icon: <FileUp size={22} />, href: "#", onClick: () => setActiveSection("upload") },
            { title: "Table", icon: <Table2 size={22} />, href: "#", onClick: () => setActiveSection("table") },
            { title: "Outbound", icon: <Rocket size={22} />, href: "#", onClick: () => setActiveSection("outbound") },
            { title: "Templates", icon: <LayoutTemplate size={22} />, href: "#", onClick: () => setActiveSection("templates") },
            { title: "IDs", icon: <IdCard size={22} />, href: "#", onClick: () => setActiveSection("ids") },
            { title: "Audience", icon: <Users size={22} />, href: "#", onClick: () => setActiveSection("audience") },
            { title: "Agentic Call", icon: <PhoneCall size={22} />, href: "#", onClick: () => setActiveSection("agentic-call") },
            { title: "Campaign Metrics", icon: <BarChart2 size={22} />, href: "#", onClick: () => setActiveSection("campaign-metrics") },
          ]}
          desktopClassName=""
          mobileClassName=""
        />
      </div>
    </div>
  );
}
