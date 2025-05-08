import { useForm } from "react-hook-form";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createAuthenticatedApi } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormValues = {
  name: string;
  email: string;
  companyName: string;
  jobTitle: string;
};

export default function SalesforceSyncForm() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false); // State to control dialog visibility

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      name: user?.fullName || "",
      email: user?.emailAddresses[0]?.emailAddress || "",
      companyName: "",
      jobTitle: "",
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      return authenticatedApi.post("/salesforce/sync", data);
    },
    onSuccess: () => {
      toast.success("Synced with Salesforce!");
      setOpen(false); // Close the dialog on success
      reset(); // Optional: Reset form fields
    },
    onError: (error: any) => {
      const errorMessage = error.data?.message || error.response?.data?.message || "Failed to sync with Salesforce";
      toast.error(errorMessage);
      setOpen(false); // Close the dialog on success
      reset();
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Sync with Salesforce</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync with Salesforce</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Read-only Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...register("name")} readOnly className="bg-gray-100 cursor-not-allowed" placeholder="Full Name" />
          </div>

          {/* Read-only Email field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...register("email")} readOnly className="bg-gray-100 cursor-not-allowed" placeholder="Email" />
          </div>

          {/* Editable Company Name with validation */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              {...register("companyName", {
                required: "Company name is required",
                minLength: {
                  value: 2,
                  message: "Company name must be at least 2 characters",
                },
              })}
              className={cn(errors.companyName && "border-red-500")}
              placeholder="Company Name"
            />
            {errors.companyName && <p className="text-sm text-red-500">{errors.companyName.message}</p>}
          </div>

          {/* Editable Job Title with validation */}
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title *</Label>
            <Input
              id="jobTitle"
              {...register("jobTitle", {
                required: "Job title is required",
                minLength: {
                  value: 2,
                  message: "Job title must be at least 2 characters",
                },
              })}
              className={cn(errors.jobTitle && "border-red-500")}
              placeholder="Job Title"
            />
            {errors.jobTitle && <p className="text-sm text-red-500">{errors.jobTitle.message}</p>}
          </div>

          <Button type="submit" disabled={mutation.isPending || !isDirty || !isValid} className="w-full">
            {mutation.isPending ? "Syncing..." : "Submit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
