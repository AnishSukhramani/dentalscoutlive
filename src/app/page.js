"use client"

import Image from "next/image";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [isCsv, setIsCsv] = useState(false);
  const acceptedFileTypes = isCsv
    ? ".csv"
    : ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const handleToggleChange = (checked) => {
    setIsCsv(checked);
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-blue-500 font-bold text-xl">Neurality Health</h1>

      <div className="flex items-center space-x-2">
        <p>Excel</p>
        <Switch id="file-toggle" checked={isCsv} onCheckedChange={handleToggleChange} />
        <p>CSV</p>
      </div>

      <Input id="file-upload" type="file" accept={acceptedFileTypes} />

      <Button>Upload</Button>
    </div>
  );
}
