import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { createAuthenticatedApi } from "@/lib/api";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// shadcnUI components
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Trash2, Edit } from "lucide-react";
import { useCommentsWebSocket } from "../hooks/useCommentsWebSocket";

// Types
interface Comment {
  id: number;
  templateId: number;
  userId: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

type CommentsProps = {
  templateId: number;
};

// Form validation schema
const commentFormSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment too long"),
});

export function Comments({ templateId }: CommentsProps) {
  const { getToken, userId } = useAuth();
  const { comments, isConnected, requestingUser } = useCommentsWebSocket(templateId);

  // const [requestingUser, setRequestingUser] = useState<RequestingUser | null>(null);
  const queryClient = useQueryClient();
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Cleanup function for pointer-events
  useEffect(() => {
    // When dialog is closed, ensure body is interactive
    if (!isDialogOpen) {
      const cleanup = () => {
        document.body.style.removeProperty("pointer-events");
        // Additional cleanup for any other styles that might be interfering
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("padding-right");

        // Remove any other dialog-related classes that might be added
        const dialogBackdrops = document.querySelectorAll("[data-dialog-backdrop]");
        dialogBackdrops.forEach((el) => el.remove());
      };

      // Run cleanup after a short delay to ensure dialog closing animations complete
      setTimeout(cleanup, 100);
    }

    return () => {
      // Cleanup when component unmounts
      document.body.style.removeProperty("pointer-events");
    };
  }, [isDialogOpen]);

  // Fetch comments
  // const { data, isLoading } = useQuery<CommentsResponse>({
  //   queryKey: ["comments", templateId, userId],
  //   queryFn: async () => {
  //     const { authenticatedApi } = await createAuthenticatedApi(getToken);
  //     if (userId) {
  //       const { data } = await authenticatedApi.get<CommentsResponse>(`/interact/templates/${templateId}/comments-for-user`);
  //       setRequestingUser(data.requestingUser);
  //       return data;
  //     } else {
  //       const { data } = await publicApi.get<CommentsResponse>(`/interact/templates/${templateId}/comments`);
  //       return data;
  //     }
  //   },
  //   enabled: typeof userId !== "undefined",
  // });

  // Create comment form
  const createForm = useForm<z.infer<typeof commentFormSchema>>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: "",
    },
  });

  // Edit comment form
  const editForm = useForm<z.infer<typeof commentFormSchema>>({
    resolver: zodResolver(commentFormSchema),
  });

  // Create comment mutation
  const createComment = useMutation({
    mutationFn: async (values: z.infer<typeof commentFormSchema>) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const { data } = await authenticatedApi.post(`/interact/templates/${templateId}/comments`, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", templateId] });
      createForm.reset();
      toast.success("Comment added successfully");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  // Update comment mutation
  const updateComment = useMutation({
    mutationFn: async (values: z.infer<typeof commentFormSchema>) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const { data } = await authenticatedApi.put(`/interact/comments/${editingCommentId}`, values);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", templateId] });
      setEditingCommentId(null);
      setIsDialogOpen(false);
      toast.success("Comment updated successfully");
    },
    onError: () => {
      toast.error("Failed to update comment");
    },
  });

  // Delete comment mutation
  const deleteComment = useMutation({
    mutationFn: async (commentId: number) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      await authenticatedApi.delete(`/interact/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", templateId] });
      toast.success("Comment deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });

  // Handle edit click
  const handleEditClick = (comment: Comment) => {
    editForm.reset({ content: comment.content });
    setEditingCommentId(comment.id);
    setIsDialogOpen(true);
  };

  // Check if user can edit/delete comment
  const canModifyComment = (commentUserId: number) => {
    if (!userId) return false;
    return requestingUser?.userId === commentUserId.toString() || requestingUser?.isAdmin;
  };

  // Handle dialog close
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingCommentId(null);
    }
  };

  if (!isConnected) {
    return <div>Connecting to live comments...</div>;
  }

  return (
    <Card className="mt-6" id="comments">
      <CardHeader>
        <CardTitle>Comments ({comments?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Create comment form */}
        {userId && (
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((values) => createComment.mutate(values))} className="space-y-4 mb-6">
              <FormField
                control={createForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea placeholder="Add a comment..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="cursor-pointer" type="submit" disabled={createComment.isPending}>
                {createComment.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </form>
          </Form>
        )}

        {/* Comments list */}
        {comments && comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" alt={comment.user.name} />
                  <AvatarFallback>
                    {comment.user.name
                      .split(" ")
                      .map((n: any) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{comment.user.name}</p>
                      <p className="text-sm text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</p>
                    </div>

                    {canModifyComment(comment.userId) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(comment)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteComment.mutate(comment.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <p className="mt-2 whitespace-pre-line">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        )}

        {/* Edit comment dialog */}
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Comment</DialogTitle>
              <DialogDescription>Make changes to your comment here. Click save when you're done.</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((values) => updateComment.mutate(values))} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Edit your comment..." className="min-h-[100px]" aria-label="Comment content" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => handleDialogOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateComment.isPending}>
                    {updateComment.isPending ? "Updating..." : "Update Comment"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
