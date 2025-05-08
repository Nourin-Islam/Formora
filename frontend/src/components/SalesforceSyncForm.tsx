import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";

type FormValues = {
  name: string;
  email: string;
  companyName: string;
  jobTitle: string;
};

export default function SalesforceSyncForm() {
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: user?.fullName || "",
      email: user?.emailAddresses[0]?.emailAddress || "",
      companyName: "",
      jobTitle: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => axios.post("/api/salesforce/sync", data),
    onSuccess: () => toast.success("Synced with Salesforce!"),
    onError: () => toast.error("Failed to sync with Salesforce"),
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Sync with Salesforce</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync with Salesforce</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input {...register("name", { required: true })} placeholder="Full Name" />
          <Input {...register("email", { required: true })} placeholder="Email" />
          <Input {...register("companyName", { required: true })} placeholder="Company Name" />
          <Input {...register("jobTitle", { required: true })} placeholder="Job Title" />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Syncing..." : "Submit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
