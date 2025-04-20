import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Question, QuestionType } from "@/types";
import { OptionInputList } from "./OptionInputList";

export function QuestionForm({ questionData, onSave, onCancel }: { questionData: Question | null; onSave: (question: Question) => void; onCancel: () => void }) {
  const [question, setQuestion] = useState<Question>(
    questionData || {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      questionType: QuestionType.STRING,
      position: 0,
      showInTable: true,
      options: [],
      correctAnswers: [],
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (questionData) {
      setQuestion(questionData);
    }
  }, [questionData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!question.title.trim()) newErrors.title = "Title is required";
    else if (question.title.length < 5) newErrors.title = "Title must be at least 5 characters";
    else if (question.title.length > 100) newErrors.title = "Title cannot exceed 100 characters";

    if (question.description && question.description.length > 500) {
      newErrors.description = "Description cannot exceed 500 characters";
    }

    if (question.questionType === QuestionType.CHECKBOX) {
      if (question.options.length < 2) newErrors.options = "At least 2 options are required";
      if (question.options.some((opt: any) => !opt.trim())) newErrors.options = "Options cannot be empty";
      if (question.options.some((opt: any) => opt.length > 50)) newErrors.options = "Options cannot exceed 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(question);
    }
  };

  const handleChange = (field: keyof Question, value: any) => {
    setQuestion((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Question Title *</Label>
        <Input id="title" value={question.title} onChange={(e) => handleChange("title", e.target.value)} placeholder="Enter question title" />
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={question.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Optional explanation or instructions" rows={3} />
        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="questionType">Question Type *</Label>
        <Select value={question.questionType} onValueChange={(value) => handleChange("questionType", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select question type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={QuestionType.STRING}>Single Line Text</SelectItem>
            <SelectItem value={QuestionType.TEXT}>Multi-Line Text</SelectItem>
            <SelectItem value={QuestionType.INTEGER}>Number</SelectItem>
            <SelectItem value={QuestionType.CHECKBOX}>Checkbox</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {question.questionType === QuestionType.CHECKBOX && (
        <div className="space-y-2">
          <OptionInputList options={question.options} onChange={(options) => handleChange("options", options)} selectedAnswers={(question.correctAnswers as string[]) || []} onAnswerChange={(answers) => handleChange("correctAnswers", answers)} error={errors.options} />
        </div>
      )}

      {question.questionType === QuestionType.INTEGER && (
        <div className="space-y-2">
          <Label>Default Answer (Number)</Label>
          <Input type="number" value={(question.correctAnswers as number) || ""} onChange={(e) => handleChange("correctAnswers", e.target.value ? parseInt(e.target.value) : null)} />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch id="showInTable" checked={question.showInTable} onCheckedChange={(checked) => handleChange("showInTable", checked)} />
        <Label htmlFor="showInTable">Show in results table</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Question</Button>
      </div>
    </form>
  );
}
