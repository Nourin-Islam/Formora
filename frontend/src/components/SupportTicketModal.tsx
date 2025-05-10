import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import { createAuthenticatedApi } from "@/lib/api";
import { X } from "lucide-react";
import { toast } from "sonner";

export default function SupportTicket() {
  const { getToken } = useAuth();
  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState("Average");
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();

  const handleSubmit = async () => {
    const data = {
      summary,
      priority,
      reportedBy: user?.primaryEmailAddress?.emailAddress,
      link: window.location.href,
    };
    const { authenticatedApi } = await createAuthenticatedApi(getToken);
    try {
      await authenticatedApi.post("/support-ticket", data);
      // alert("Ticket submitted!");
      toast.success("Ticket submitted!");
      setIsOpen(false);
      setSummary("");
      setPriority("Average");
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast.error("Failed to submit ticket. Please try again.");
      // alert("Failed to submit ticket. Please try again.");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSummary("");
    setPriority("Average");
  };

  return (
    <>
      {/* Floating Help Button */}
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white h-[60px] w-[60px] rounded-full shadow-lg flex items-center justify-center transition-all text-4xl font-bold cursor-pointer" aria-label="Create support ticket">
        ?
      </button>

      {/* Modal positioned at bottom right */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-full max-w-sm z-50">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Create Support Ticket</h2>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100" aria-label="Close modal">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              <div className="mb-4">
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Summary
                </label>
                <textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Describe your issue..." className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" rows={3} />
              </div>

              <div className="mb-4">
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority Level
                </label>
                <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="High">High</option>
                  <option value="Average">Average</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <button onClick={handleSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors cursor-pointer">
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
