import { useState, useCallback } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { PlusCircle, Trash2, GripVertical, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CSS } from "@dnd-kit/utilities";
import { Question, QuestionType } from "@/types";
import { QuestionForm } from "./QuestionForm.tsx";

const questionTypeLabels = {
  [QuestionType.STRING]: "Single Line Text",
  [QuestionType.TEXT]: "Multi-Line Text",
  [QuestionType.INTEGER]: "Number",
  [QuestionType.CHECKBOX]: "Checkbox",
};

function SortableQuestion({ question, onEdit, onDelete }: { question: Question; onEdit: (id: string) => void; onDelete: (id: string) => void }) {
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
          <span className="text-xs bg-slate-100 rounded-full px-2 py-1 dark:bg-slate-700">{questionTypeLabels[question.questionType]}</span>
          <Button variant="ghost" size="icon" onClick={() => onEdit(question.id)}>
            <PencilLine className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(question.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}

export function QuestionManagement({ questions, setQuestions }: { questions: Question[]; setQuestions: (questions: Question[]) => void }) {
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor));

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = questions.findIndex((q) => q.id === active.id);
        const newIndex = questions.findIndex((q) => q.id === over.id);
        const newQuestions = arrayMove(questions, oldIndex, newIndex).map((q, i) => ({ ...q, position: i }));
        setQuestions(newQuestions);
      }
    },
    [questions, setQuestions]
  );

  const handleSaveQuestion = (question: Question) => {
    if (editingQuestion) {
      setQuestions(questions.map((q) => (q.id === question.id ? question : q)));
    } else {
      setQuestions([...questions, { ...question, position: questions.length }]);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id).map((q, i) => ({ ...q, position: i })));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Questions</h3>
        <Button
          onClick={() => {
            setEditingQuestion(null);
            setIsDialogOpen(true);
          }}
        >
          <PlusCircle className="h-4 w-4 mr-2" /> Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">No questions added yet</p>
            <Button
              onClick={() => {
                setEditingQuestion(null);
                setIsDialogOpen(true);
              }}
              variant="outline"
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add Your First Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
          <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            {questions
              .sort((a, b) => a.position - b.position)
              .map((question) => (
                <SortableQuestion
                  key={question.id}
                  question={question}
                  onEdit={(id) => {
                    const q = questions.find((q) => q.id === id);
                    if (q) {
                      setEditingQuestion(q);
                      setIsDialogOpen(true);
                    }
                  }}
                  onDelete={handleDeleteQuestion}
                />
              ))}
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
            <DialogDescription>{editingQuestion ? "Update the question details" : "Configure your new question"}</DialogDescription>
          </DialogHeader>
          <QuestionForm questionData={editingQuestion} onSave={handleSaveQuestion} onCancel={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
