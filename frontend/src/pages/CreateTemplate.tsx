import React, { useState, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import axios from "axios";

export default function CreateTemplateForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("**Start writing...**");
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [accessEmails, setAccessEmails] = useState<string[]>([]);
  const [accessInput, setAccessInput] = useState("");

  // Fetch topics from DB
  useEffect(() => {
    axios
      .get("http://localhost:3000/api/topics")
      .then((res) => {
        console.log("Fetched topics:", res.data.topics);
        setTopics(res.data.topics.map((topic: { name: string }) => topic.name));
      })
      .catch((error) => {
        console.error("Error fetching topics:", error);
        // alert("Failed to fetch topics. Please try again later.");
      });
  }, []);

  const handleTagAdd = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const handleAccessAdd = () => {
    if (accessInput && !accessEmails.includes(accessInput)) {
      setAccessEmails([...accessEmails, accessInput]);
      setAccessInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const template = {
      title,
      description,
      topic,
      tags,
      accessEmails,
    };
    await axios.post("/api/templates", template);
    alert("Template created!");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
      <input className="w-full p-2 border rounded" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <MDEditor value={description} onChange={(val) => setDescription(val || "")} />

      <select value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full p-2 border rounded" required>
        <option value="">Select Topic</option>
        {topics.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* Tags input */}
      <div>
        <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag" className="p-2 border rounded mr-2" />
        <button type="button" onClick={handleTagAdd} className="px-3 py-1 bg-blue-500 text-white rounded">
          Add
        </button>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <span key={idx} className="bg-gray-200 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Access control input */}
      <div>
        <input value={accessInput} onChange={(e) => setAccessInput(e.target.value)} placeholder="Add user email" className="p-2 border rounded mr-2" />
        <button type="button" onClick={handleAccessAdd} className="px-3 py-1 bg-green-500 text-white rounded">
          Add
        </button>
        <div className="mt-2 flex flex-wrap gap-2">
          {accessEmails.map((email, idx) => (
            <span key={idx} className="bg-yellow-200 px-2 py-1 rounded">
              {email}
            </span>
          ))}
        </div>
      </div>

      <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">
        Create Template
      </button>
    </form>
  );
}
