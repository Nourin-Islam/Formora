import { useState, useCallback, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { PlusCircle, Trash2, GripVertical, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CSS } from "@dnd-kit/utilities";
import { QuestionType } from "@/types";
import OptionInputList from "@/components/OptionInputList"; // Assuming this is a component for managing options

import { Question } from "../types";

const questionTypeLabels = {
  STRING: "Single Line Text",
  TEXT: "Multi-Line Text",
  INTEGER: "Number",
  CHECKBOX: "Checkbox",
};

interface SortableQuestionProps {
  question: Question;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function SortableQuestion({ question, onEdit, onDelete }: SortableQuestionProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card className="border-2 border-dashed hover:border-primary/50">
        <CardHeader className="p-3 flex flex-row items-center space-y-0">
          <div className="cursor-move touch-none" {...attributes} {...listeners}>
            <GripVertical className="mr-2 h-5 w-5 text-gray-400" />
          </div>
          <CardTitle className="text-base flex-1 truncate">{question.title || "Untitled Question"}</CardTitle>
          <span className="text-xs bg-slate-100 rounded-full px-2 py-1 dark:bg-slate-700">{questionTypeLabels[question.questionType as keyof typeof questionTypeLabels]}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              onEdit(question.id);
            }}
            className="h-8 w-8 ml-1"
          >
            <PencilLine className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              onDelete(question.id);
            }}
            className="h-8 w-8 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}

interface QuestionFormProps {
  questionData: Question | null;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

function QuestionForm({ questionData, onSave, onCancel }: QuestionFormProps) {
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

  const handleChange = (field: keyof Question, value: any) => {
    setQuestion((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Question Title *</Label>
        <Input id="title" value={question.title} onChange={(e) => handleChange("title", e.target.value)} placeholder="Enter question title" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={question.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Optional explanation or instructions" rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="questionType">Question Type *</Label>
        <Select value={question.questionType} onValueChange={(value) => handleChange("questionType", value as QuestionType)}>
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

      {question.questionType === QuestionType.CHECKBOX && <OptionInputList options={question.options || []} onChange={(updatedOptions) => handleChange("options", updatedOptions)} />}

      {question.questionType === QuestionType.INTEGER && (
        <div className="space-y-2">
          <Label>Default Answer (Number)</Label>
          <Input type="number" value={question.correctAnswers || ""} onChange={(e) => handleChange("correctAnswers", e.target.value ? parseInt(e.target.value) : null)} />
        </div>
      )}

      {question.questionType === QuestionType.CHECKBOX && question.options?.length > 0 && (
        <div className="space-y-2">
          <Label>Default Selected Answers</Label>
          <div className="space-y-1">
            {question.options.map((option: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`checkbox-${idx}`}
                  checked={question.correctAnswers?.includes(option)}
                  onChange={(e) => {
                    const newAnswer = e.target.checked ? [...(question.correctAnswers || []), option] : (question.correctAnswers || []).filter((ans: string) => ans !== option);
                    handleChange("correctAnswers", newAnswer);
                  }}
                />
                <Label htmlFor={`checkbox-${idx}`}>{option}</Label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch id="showInTable" checked={question.showInTable} onCheckedChange={(checked) => handleChange("showInTable", checked)} />
        <Label htmlFor="showInTable">Show in results table</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(question)}>Save Question</Button>
      </div>
    </div>
  );
}

interface QuestionManagementProps {
  templateId?: string;
  questions: Question[];
  onQuestionsUpdate: (questions: Question[]) => void;
}

export function QuestionManagement({ templateId, questions, onQuestionsUpdate }: QuestionManagementProps) {
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // This would fetch questions from the backend if templateId exists
  useEffect(() => {
    if (templateId) {
      // fetchQuestions(templateId)
    }
  }, [templateId]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const updatedQuestions = (() => {
          const oldIndex = questions.findIndex((item) => item.id === active.id);
          const newIndex = questions.findIndex((item) => item.id === over.id);

          const reordered = arrayMove(questions, oldIndex, newIndex);

          // Update positions
          return reordered.map((item, index) => ({
            ...item,
            position: index,
          }));
        })();

        onQuestionsUpdate(updatedQuestions);
      }
    },
    [questions, onQuestionsUpdate]
  );

  const handleAddQuestion: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingQuestion(null);
    setIsDialogOpen(true);
  };

  const handleEditQuestion = (id: string) => {
    const question = questions.find((q) => q.id === id);
    if (question) {
      setEditingQuestion(question);
      setIsDialogOpen(true);
    }
  };

  const handleDeleteQuestion = (id: string) => {
    const updatedQuestions = questions.filter((q) => q.id !== id).map((q, index) => ({ ...q, position: index }));
    onQuestionsUpdate(updatedQuestions);
  };

  const handleSaveQuestion = (question: Question) => {
    if (editingQuestion) {
      // Update existing question
      const updatedQuestions = questions.map((q) => (q.id === question.id ? question : q));
      onQuestionsUpdate(updatedQuestions);
    } else {
      // Add new question
      const newQuestion = {
        ...question,
        position: questions.length,
      };
      onQuestionsUpdate([...questions, newQuestion]);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Questions</h3>
        <Button
          onClick={(e) => {
            e.preventDefault();
            handleAddQuestion(e);
          }}
          size="sm"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">No questions added yet</p>
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleAddQuestion(e);
              }}
              variant="outline"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Your First Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
          <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            {questions
              .sort((a, b) => a.position - b.position)
              .map((question) => (
                <SortableQuestion key={question.id} question={question} onEdit={handleEditQuestion} onDelete={handleDeleteQuestion} />
              ))}
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
            <DialogDescription>Add, edit, and reorder questions for your template</DialogDescription>
          </DialogHeader>
          <QuestionForm questionData={editingQuestion} onSave={handleSaveQuestion} onCancel={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
