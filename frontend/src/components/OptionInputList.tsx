import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OptionInputList({ options, onChange, selectedAnswers = [], onAnswerChange }: { options: string[]; onChange: (options: string[]) => void; selectedAnswers?: string[]; onAnswerChange?: (answers: string[]) => void }) {
  const [newOption, setNewOption] = useState("");

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      onChange([...options, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeOption = (option: string) => {
    const filtered = options.filter((opt) => opt !== option);
    onChange(filtered);
    if (onAnswerChange) {
      onAnswerChange(selectedAnswers.filter((ans) => ans !== option));
    }
  };

  const toggleAnswer = (option: string) => {
    if (!onAnswerChange) return;
    if (selectedAnswers.includes(option)) {
      onAnswerChange(selectedAnswers.filter((a) => a !== option));
    } else {
      onAnswerChange([...selectedAnswers, option]);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Options</Label>
      <div className="flex space-x-2">
        <Input value={newOption} onChange={(e) => setNewOption(e.target.value)} placeholder="Add option" />
        <Button onClick={addOption} type="button">
          Add
        </Button>
      </div>
      <div className="space-y-1">
        {options.map((opt) => (
          <div key={opt} className="flex items-center justify-between bg-muted p-2 rounded">
            <div className="flex items-center gap-2">
              {onAnswerChange && <input type="checkbox" checked={selectedAnswers.includes(opt)} onChange={() => toggleAnswer(opt)} />}
              <span>{opt}</span>
            </div>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeOption(opt)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
