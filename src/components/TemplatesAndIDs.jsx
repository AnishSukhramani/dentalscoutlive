import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const TemplatesAndIDs = () => {
  const [showForm, setShowForm] = useState(false);
  const [template, setTemplate] = useState({ name: "", subject: "", body: "" });

  const handleChange = (e) => {
    setTemplate({ ...template, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // TODO: Save logic (task 17)
    setShowForm(false);
    setTemplate({ name: "", subject: "", body: "" });
  };

  const handleCancel = () => {
    setShowForm(false);
    setTemplate({ name: "", subject: "", body: "" });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-col gap-4 w-full">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Templates</h2>
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close" : "Create"}
          </Button>
        </div>
        {showForm && (
          <div className="flex flex-col gap-3 mt-2">
            <Input
              name="name"
              placeholder="Template Name"
              value={template.name}
              onChange={handleChange}
              className="w-full"
            />
            <Input
              name="subject"
              placeholder="Subject"
              value={template.subject}
              onChange={handleChange}
              className="w-full"
            />
            <textarea
              name="body"
              placeholder="Body"
              value={template.body}
              onChange={handleChange}
              className="w-full border rounded p-2 min-h-[80px]"
            />
            <div className="flex gap-2 mt-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
      {/* TODO: List templates here (task 18) */}
      {/* TODO: IDs section placeholder */}
    </div>
  );
}

export default TemplatesAndIDs;
