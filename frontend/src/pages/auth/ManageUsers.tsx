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
import { Icons } from "@/components/global/icons";
import LoadingSpinner from "@/components/global/LoadingSpinner";
import { User } from "@/types";
import { useUsers, useUpdateUserAdmin, useUpdateUserBlock, useDeleteUser } from "@/hooks/useUsers";

export const columns: ColumnDef<User>[] = [
  {
    id: "select",
    header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
    cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "isAdmin",
    header: "Role",
    cell: ({ row }) => <Badge variant={row.getValue("isAdmin") ? "default" : "secondary"}>{row.getValue("isAdmin") ? "Admin" : "User"}</Badge>,
  },
  {
    accessorKey: "isBlocked",
    header: "Status",
    cell: ({ row }) => <Badge variant={row.getValue("isBlocked") ? "destructive" : "default"}>{row.getValue("isBlocked") ? "Blocked" : "Active"}</Badge>,
  },
];

export default function ManageUsersTable() {
  // State for table controls
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

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-red-500">{error?.message}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
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
                {isUpdating ? <Icons.spinner className="h-4 w-4 mr-2 animate-spin" /> : <Icons.shieldPlus className="h-4 w-4 mr-2" />}
                Make Admin
              </Button>
            </TooltipTrigger>
            <TooltipContent>Make selected users admin</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => handleBulkAdminToggle(false)} disabled={table.getSelectedRowModel().rows.length === 0 || isUpdating}>
                {isUpdating ? <Icons.spinner className="h-4 w-4 mr-2 animate-spin" /> : <Icons.shieldMinus className="h-4 w-4 mr-2" />}
                Remove Admin
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove admin from selected users</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => handleBulkBlockToggle(true)} disabled={table.getSelectedRowModel().rows.length === 0 || isUpdating}>
                {isUpdating ? <Icons.spinner className="h-4 w-4 mr-2 animate-spin" /> : <Icons.lock className="h-4 w-4 mr-2" />}
                Block
              </Button>
            </TooltipTrigger>
            <TooltipContent>Block selected users</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => handleBulkBlockToggle(false)} disabled={table.getSelectedRowModel().rows.length === 0 || isUpdating}>
                {isUpdating ? <Icons.spinner className="h-4 w-4 mr-2 animate-spin" /> : <Icons.unlock className="h-4 w-4 mr-2" />}
                Unblock
              </Button>
            </TooltipTrigger>
            <TooltipContent>Unblock selected users</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleBulkDelete} disabled={table.getSelectedRowModel().rows.length === 0 || isUpdating}>
                {isUpdating ? <Icons.spinner className="h-4 w-4 mr-2 animate-spin" /> : <Icons.trash className="h-4 w-4 mr-2" />}
                Delete
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete selected users</TooltipContent>
          </Tooltip>
        </div>

        <Input placeholder="Filter emails..." value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} className="max-w-sm" />
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
                  No results.
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
              Previous
            </Button>
          </PaginationItem>
          <PaginationItem>
            <span className="text-sm">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
          </PaginationItem>
          <PaginationItem>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
