import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function OptionInputList({ options, onChange, selectedAnswers = [], onAnswerChange, error }: { options: string[]; onChange: (options: string[]) => void; selectedAnswers?: string[]; onAnswerChange?: (answers: string[]) => void; error?: string }) {
  const [newOption, setNewOption] = useState("");
  const { t } = useTranslation();
  const addOption = () => {
    if (!newOption.trim()) return;
    if (options.includes(newOption.trim())) return;
    onChange([...options, newOption.trim()]);
    setNewOption("");
  };

  const removeOption = (option: string) => {
    const newOptions = options.filter((opt) => opt !== option);
    onChange(newOptions);
    if (onAnswerChange) {
      onAnswerChange(selectedAnswers.filter((ans) => ans !== option));
    }
  };

  const toggleAnswer = (option: string) => {
    if (!onAnswerChange) return;
    const newAnswers = selectedAnswers.includes(option) ? selectedAnswers.filter((a) => a !== option) : [...selectedAnswers, option];
    onAnswerChange(newAnswers);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addOption();
    }
  };

  return (
    <div className="space-y-2">
      <Label>{t("Options *")}</Label>
      <div className="flex space-x-2">
        <Input value={newOption} onChange={(e) => setNewOption(e.target.value)} onKeyDown={handleKeyDown} placeholder={t("Add option")} />
        <Button type="button" onClick={addOption}>
          {t("Add")}
        </Button>
      </div>

      <div className="space-y-1">
        {options.map((option) => (
          <div key={option} className="flex items-center justify-between bg-muted p-2 rounded">
            <div className="flex items-center gap-2">
              {onAnswerChange && <input type="checkbox" checked={selectedAnswers.includes(option)} onChange={() => toggleAnswer(option)} className="h-4 w-4" />}
              <span>{option}</span>
            </div>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeOption(option)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
