import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Question, QuestionType } from "@/types";
import { OptionInputList } from "./OptionInputList";
import { useTranslation } from "react-i18next";

export function QuestionForm({ questionData, onSave, onCancel }: { questionData: Question | null; onSave: (question: Question) => void; onCancel: () => void }) {
  const [question, setQuestion] = useState<Question>(
    questionData || {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      questionType: QuestionType.STRING,
      position: 0,
      showInTable: false,
      options: [],
      correctAnswers: [],
    }
  );

  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (questionData) {
      setQuestion(questionData);
    }
  }, [questionData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!question.title.trim()) newErrors.title = t("Title is required");
    else if (question.title.length < 5) newErrors.title = t("Title must be at least 5 characters");
    else if (question.title.length > 100) newErrors.title = t("Title cannot exceed 100 characters");

    if (question.description && question.description.length > 500) {
      newErrors.description = t("Description cannot exceed 500 characters");
    }

    if (question.questionType === QuestionType.CHECKBOX) {
      if (question.options.length < 2) newErrors.options = t("At least 2 options are required");
      if (question.options.some((opt: any) => !opt.trim())) newErrors.options = t("Options cannot be empty");
      if (question.options.some((opt: any) => opt.length > 50)) newErrors.options = t("Options cannot exceed 50 characters");
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
        <Label htmlFor="title">{t("Question Title *")}</Label>
        <Input id="title" value={question.title} onChange={(e) => handleChange("title", e.target.value)} placeholder={t("Enter question title")} />
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("Description")}</Label>
        <Textarea id="description" value={question.description} onChange={(e) => handleChange("description", e.target.value)} placeholder={t("Optional explanation or instructions")} rows={3} />
        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="questionType">{t("Question Type *")}</Label>
        <Select value={question.questionType} onValueChange={(value) => handleChange("questionType", value)}>
          <SelectTrigger>
            <SelectValue placeholder={t("Select question type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={QuestionType.STRING}>{t("Single Line Text")}</SelectItem>
            <SelectItem value={QuestionType.TEXT}>{t("Multi-Line Text")}</SelectItem>
            <SelectItem value={QuestionType.INTEGER}>{t("Number")}</SelectItem>
            <SelectItem value={QuestionType.CHECKBOX}>{t("Checkbox")}</SelectItem>
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
          <Label>{t("Default Answer (Number)")}</Label>
          <Input type="number" value={(question.correctAnswers as number) || ""} onChange={(e) => handleChange("correctAnswers", e.target.value ? parseInt(e.target.value) : null)} />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch id="showInTable" checked={question.showInTable} onCheckedChange={(checked) => handleChange("showInTable", checked)} />
        <Label htmlFor="showInTable">{t("Show in results table")}</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{t("Save Question")}</Button>
      </div>
    </form>
  );
}
