import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, getFilteredRowModel, SortingState, ColumnFiltersState } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Shell, Trash2, LockKeyholeOpen, LockKeyhole, ShieldCheck, ShieldMinus } from "lucide-react";
import { User } from "@/types";
import { useUsers, useUpdateUserAdmin, useUpdateUserBlock, useDeleteUser } from "@/hooks/useUsers";
import SmallSkeleton from "@/components/global/SmallSkeleton";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

export default function ManageUsersTable() {
  // State for table controls
  const { t } = useTranslation();
  const [emailFilter, setEmailFilter] = useState("");
  const [debouncedEmailFilter] = useDebounce(emailFilter, 700);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });
  const [rowSelection, setRowSelection] = useState({});

  // Hooks for data fetching and mutations
  const { data, isLoading, isError, error } = useUsers({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sortBy: sorting[0]?.id,
    sortOrder: sorting[0]?.desc ? "desc" : "asc",
    email: debouncedEmailFilter || undefined,
  });

  const updateAdmin = useUpdateUserAdmin();
  const updateBlock = useUpdateUserBlock();
  const deleteUser = useDeleteUser();

  // Combined loading state
  const isUpdating = updateAdmin.isPending || updateBlock.isPending || deleteUser.isPending;

  // Set column filter whenever debounced input changes
  useEffect(() => {
    setColumnFilters([{ id: "email", value: debouncedEmailFilter }]);
  }, [debouncedEmailFilter]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
        cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: t("Name"),
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
      },
      {
        accessorKey: "email",
        header: t("Email"),
      },
      {
        accessorKey: "isAdmin",
        header: t("Role"),
        cell: ({ row }) => <Badge variant={row.getValue("isAdmin") ? "default" : "secondary"}>{row.getValue("isAdmin") ? t("Admin") : t("User")}</Badge>,
      },
      {
        accessorKey: "isBlocked",
        header: t("Status"),
        cell: ({ row }) => <Badge variant={row.getValue("isBlocked") ? "destructive" : "default"}>{row.getValue("isBlocked") ? t("Blocked") : t("Active")}</Badge>,
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: data?.users || [],
    columns,
    pageCount: data?.totalPages || 1,
    state: {
      sorting,
      columnFilters,
      pagination,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
  });

  const handleBulkAdminToggle = async (makeAdmin: boolean) => {
    const selectedUserIds = table.getSelectedRowModel().rows.map((row) => row.original.id);
    await Promise.all(selectedUserIds.map((userId) => updateAdmin.mutateAsync({ userId, isAdmin: makeAdmin })));
  };

  const handleBulkBlockToggle = async (block: boolean) => {
    const selectedUserIds = table.getSelectedRowModel().rows.map((row) => row.original.id);
    await Promise.all(selectedUserIds.map((userId) => updateBlock.mutateAsync({ userId, isBlocked: block })));
  };

  const handleBulkDelete = async () => {
    const selectedUserIds = table.getSelectedRowModel().rows.map((row) => row.original.id);
    await Promise.all(selectedUserIds.map((userId) => deleteUser.mutateAsync(userId)));
  };

  if (isLoading) return <SmallSkeleton />;

  if (isError) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-red-500">{error?.message}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          {t("Retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => handleBulkAdminToggle(true)} disabled={table.getSelectedRowModel().rows.length === 0 || isUpdating}>
                {isUpdating ? <Shell className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                {t("Make Admin")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("Make selected users admin")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => handleBulkAdminToggle(false)} disabled={table.getSelectedRowModel().rows.length === 0 || isUpdating}>
                {isUpdating ? <Shell className="h-4 w-4 mr-2 animate-spin" /> : <ShieldMinus className="h-4 w-4 mr-2" />}
                {t("Remove Admin")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("Remove admin from selected users")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => handleBulkBlockToggle(true)} disabled={table.getSelectedRowModel().rows.length === 0 || isUpdating}>
                {isUpdating ? <Shell className="h-4 w-4 mr-2 animate-spin" /> : <LockKeyhole className="h-4 w-4 mr-2" />}
                {t("Block")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("Block selected users")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => handleBulkBlockToggle(false)} disabled={table.getSelectedRowModel().rows.length === 0 || isUpdating}>
                {isUpdating ? <Shell className="h-4 w-4 mr-2 animate-spin" /> : <LockKeyholeOpen className="h-4 w-4 mr-2" />}
                {t("Unblock")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("Unblock selected users")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleBulkDelete} disabled={table.getSelectedRowModel().rows.length === 0 || isUpdating}>
                {isUpdating ? <Shell className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                {t("Delete")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("Delete selected users")}</TooltipContent>
          </Tooltip>
        </div>

        <Input placeholder={t("Filter emails...")} value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} className="max-w-sm" />
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
                  {t("No results.")}
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
              {t("Previous")}
            </Button>
          </PaginationItem>
          <PaginationItem>
            <span className="text-sm">
              {t("Page")} {table.getState().pagination.pageIndex + 1} {t("of")} {table.getPageCount()}
            </span>
          </PaginationItem>
          <PaginationItem>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              {t("Next")}
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
