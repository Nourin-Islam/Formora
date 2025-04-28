import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, getFilteredRowModel } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";

import { FilePenIcon, Plus, Shell, Trash2, ArrowUpDown } from "lucide-react"; // Added ArrowUpDown icon

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Tag, tagFormSchema } from "@/types";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag, useBulkDeleteTags } from "@/hooks/useTags";
import SmallSkeleton from "@/components/global/SmallSkeleton";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { camelToPascal } from "@/lib/utils";
import useSEO from "@/hooks/useSEO";

export default function ManageTagsTable() {
  useSEO({
    title: "Formora: Manage Tags",
    description: "Manage your tags efficiently with Formora.",
    keywords: "manage tags, Formora, tag management",
  });
  const { t } = useTranslation("common");
  const [nameFilter, setNameFilter] = useState("");
  const [debouncedNameFilter] = useDebounce(nameFilter, 700);
  const [sorting, setSorting] = useState([{ id: "id", desc: false }]); // Changed default sorting from "name" to "id"
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [currentTag, setCurrentTag] = useState<Tag | null>(null);

  // Dialog states -
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Replace Zustand selectors with React Query
  const { data, isLoading, isError, error } = useTags({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sortBy: sorting[0]?.id,
    sortOrder: sorting[0]?.desc ? "desc" : "asc",
    name: debouncedNameFilter || undefined,
  });

  // console.log("Tags data:", data); // Log the tags data
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const bulkDeleteTags = useBulkDeleteTags();

  //   individual mutation states
  const isUpdating = createTag.isPending || updateTag.isPending || deleteTag.isPending || bulkDeleteTags.isPending;

  //   data from query
  const totalPages = data?.totalPages || 1;

  //   local state setters
  const openCreateDialog = () => {
    setCurrentTag(null);
    setIsCreateDialogOpen(true);
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
  };

  const openEditDialog = (tag: Tag) => {
    setCurrentTag(tag);
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(true);
    setIsDeleteDialogOpen(false);
  };

  const openDeleteDialog = (tag?: Tag) => {
    setCurrentTag(tag || null);
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(true);
  };

  // Close all dialogs
  const closeAllDialogs = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
  };

  const columns = useMemo<ColumnDef<Tag>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
        cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
        enableSorting: false,
      },
      {
        accessorKey: "id",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:bg-transparent">
            {t("common.tags.ID")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:bg-transparent">
            {t("common.tags.Name")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{camelToPascal(row.getValue("name"))}</div>,
      },
    ],
    [t]
  );

  const form = useForm({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: currentTag?.name || "",
    },
  });

  // Reset form when currentTag changes
  useEffect(() => {
    form.reset({
      name: currentTag?.name || "",
    });
  }, [currentTag, form]);

  const table = useReactTable({
    data: data?.tags || [],
    columns,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters: nameFilter ? [{ id: "name", value: nameFilter }] : [],
      pagination,
      rowSelection,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
  });

  const handleCreateTag = async (values: { name: string }) => {
    try {
      await createTag.mutateAsync(values);
      toast.success(t("common.tags.Tag created successfully"));
      form.reset();
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error(t("common.tags.Failed to create tag"));
    }
  };

  const handleEditClick = () => {
    const selectedTags = table.getSelectedRowModel().rows;
    if (selectedTags.length === 1) {
      openEditDialog(selectedTags[0].original);
    }
  };

  const handleUpdateTag = async (values: { name: string }) => {
    if (!currentTag) return;

    try {
      await updateTag.mutateAsync({ id: currentTag.id, values });
      toast.success(t("common.tags.Tag updated successfully"));
      form.reset();
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error(t("common.tags.Failed to update tag"));
    }
  };

  const handleDeleteTag = async () => {
    if (!currentTag) return;

    try {
      await deleteTag.mutateAsync(currentTag.id);
      toast.success(t("common.tags.Tag deleted successfully"));
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error(t("common.tags.Failed to delete tag"));
    }
  };

  const handleDeleteClick = () => {
    if (table.getSelectedRowModel().rows.length === 1) {
      openDeleteDialog(table.getSelectedRowModel().rows[0].original);
    } else {
      openDeleteDialog();
    }
  };

  const handleBulkDelete = async () => {
    const selectedTagIds = table.getSelectedRowModel().rows.map((row) => row.original.id);

    if (selectedTagIds.length === 0) {
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      await bulkDeleteTags.mutateAsync(selectedTagIds);
      toast.success(`${selectedTagIds.length} ${t("common.tags.Tags deleted successfully")}`);
      setIsDeleteDialogOpen(false);
      setRowSelection({});
    } catch (error) {
      toast.error(t("common.tags.Failed to delete some tags"));
    }
  };

  if (isLoading) return <SmallSkeleton />;

  if (isError) {
    return (
      <div className="text-red-500">
        {t("common.tags.Error loading tags:")} {error?.message}
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("common.tags.Retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {/* Create Tag Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                {t("common.tags.Create Tag")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("common.tags.Create a new tag")}</TooltipContent>
          </Tooltip>

          {/* Edit Selected Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleEditClick} disabled={table.getSelectedRowModel().rows.length !== 1}>
                <FilePenIcon className="h-4 w-4 mr-2" />
                {t("common.tags.Edit")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("common.tags.Edit selected tag")}</TooltipContent>
          </Tooltip>

          {/* Delete Selected Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleDeleteClick} disabled={table.getSelectedRowModel().rows.length === 0}>
                {isUpdating ? <Shell className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                {t("common.tags.Delete")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("common.tags.Delete selected tags")}</TooltipContent>
          </Tooltip>
        </div>

        <Input placeholder={t("common.tags.Filter tags...")} value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} className="max-w-sm" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("common.tags.No results")}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              {t("common.tags.Previous")}
            </Button>
          </PaginationItem>
          <PaginationItem>
            <span className="text-sm">
              {t("common.tags.Page")} {pagination.pageIndex + 1} {t("common.tags.of")} {totalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              {t("common.tags.Next")}
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Create Tag Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) form.reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.tags.Create New Tag")}</DialogTitle>
            <DialogDescription>{t("common.tags.Add a new tag to the system.")}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateTag)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.tags.Tag Name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("common.tags.Enter tag name")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeAllDialogs}>
                  {t("common.tags.Cancel")}
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Shell className="h-4 w-4 mr-2 animate-spin" />}
                  {t("common.tags.Create Tag")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={closeAllDialogs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.tags.Edit Tag")}</DialogTitle>
            <DialogDescription>{t("common.tags.Make changes to the tag.")}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateTag)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.tags.Tag Name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("common.tags.Enter tag name")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeAllDialogs}>
                  {t("common.tags.Cancel")}
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Shell className="h-4 w-4 mr-2 animate-spin" />}
                  {t("common.tags.Save Changes")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={closeAllDialogs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.tags.Confirm Deletion")}</DialogTitle>
            <DialogDescription>{currentTag ? `${t("common.tags.Are you sure you want to delete the tag")} "${camelToPascal(currentTag.name)}"?` : `${t("common.tags.Are you sure you want to delete")} ${table.getSelectedRowModel().rows.length} ${t("selected tags?")}`}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>
              {t("common.tags.Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (currentTag) {
                  handleDeleteTag(); // Call the delete function directly
                } else {
                  handleBulkDelete();
                }
              }}
              disabled={isUpdating}
            >
              {isUpdating && <Shell className="h-4 w-4 mr-2 animate-spin" />}
              {t("common.tags.Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
