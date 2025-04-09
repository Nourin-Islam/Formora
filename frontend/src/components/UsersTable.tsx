import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable, ColumnFiltersState, getFilteredRowModel } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Icons } from "@/components/icons";
import { User } from "@/types/index";
import { useUserActions } from "@/hooks/useUserActions";

import { useAuth } from "@clerk/clerk-react";
import LoadingSpinner from "@/components/LoadingSpinner";

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

export function UsersTable() {
  const { getToken } = useAuth();
  const [emailFilter, setEmailFilter] = useState("");
  const [debouncedEmailFilter] = useDebounce(emailFilter, 700);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });
  const [rowSelection, setRowSelection] = useState({});
  const { handleToggleAdmin, handleToggleBlock, isUpdating, handleDeleteUser } = useUserActions();
  const queryClient = useQueryClient();

  const queryKey = ["users", pagination.pageIndex, pagination.pageSize, sorting, columnFilters];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      console.log("Fetching users with params:", pagination, sorting, columnFilters);
      const token = await getToken(); // getToken from Clerk
      if (!token) console.log("No Token found");
      if (token) console.log("Token:", token);

      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        sortBy: sorting[0]?.id || "name",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
        ...(columnFilters.find((f) => f.id === "email") && {
          email: columnFilters.find((f) => f.id === "email")?.value as string,
        }),
      });

      const response = await fetch(`http://localhost:3000/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log("Fetching users result:", response.json());
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Prefetch the next page if it exists
  useEffect(() => {
    if (data?.hasNextPage) {
      const nextPage = pagination.pageIndex + 1;
      const params = new URLSearchParams({
        page: (nextPage + 1).toString(), // Because pageIndex is 0-based
        limit: pagination.pageSize.toString(),
        sortBy: sorting[0]?.id || "name",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
        ...(columnFilters.find((f) => f.id === "email") && {
          email: columnFilters.find((f) => f.id === "email")?.value as string,
        }),
      });

      queryClient.prefetchQuery({
        queryKey: ["users", nextPage, pagination.pageSize, sorting, columnFilters],
        queryFn: async () => {
          const token = await getToken(); // getToken from Clerk
          const res = await fetch(`http://localhost:3000/api/admin/users?${params}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!res.ok) throw new Error("Failed to fetch users");
          return res.json();
        },
      });
    }
  }, [data, pagination, sorting, columnFilters, queryClient]);

  // Set column filter whenever debounced input changes
  useEffect(() => {
    table.getColumn("email")?.setFilterValue(debouncedEmailFilter);
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
    await Promise.all(selectedUserIds.map((userId) => handleToggleAdmin({ userId, isAdmin: makeAdmin })));
  };

  const handleBulkBlockToggle = async (block: boolean) => {
    const selectedUserIds = table.getSelectedRowModel().rows.map((row) => row.original.id);
    await Promise.all(selectedUserIds.map((userId) => handleToggleBlock({ userId, isBlocked: block })));
  };

  const handleBulkDeleteToggle = async () => {
    const selectedUserIds = table.getSelectedRowModel().rows.map((row) => row.original.id);
    await Promise.all(selectedUserIds.map((userId) => handleDeleteUser(userId)));
  };
  if (isLoading) return <LoadingSpinner />;
  if (isError) return <div>Error loading users</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 ">
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
              <Button variant="outline" size="sm" onClick={() => handleBulkAdminToggle(false)} disabled={table.getSelectedRowModel().rows.length === 0}>
                <Icons.shieldMinus className="h-4 w-4 mr-2" />
                Remove Admin
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove admin from selected users</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => handleBulkBlockToggle(true)} disabled={table.getSelectedRowModel().rows.length === 0}>
                <Icons.lock className="h-4 w-4 mr-2" />
                Block
              </Button>
            </TooltipTrigger>
            <TooltipContent>Block selected users</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => handleBulkBlockToggle(false)} disabled={table.getSelectedRowModel().rows.length === 0}>
                <Icons.unlock className="h-4 w-4 mr-2" />
                Unblock
              </Button>
            </TooltipTrigger>
            <TooltipContent>Unblock selected users</TooltipContent>
          </Tooltip>
          {/* delete user */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => handleBulkDeleteToggle()} disabled={table.getSelectedRowModel().rows.length === 0}>
                <Icons.trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete selected users</TooltipContent>
          </Tooltip>
        </div>

        {/* <Input placeholder="Filter emails..." value={(table.getColumn("email")?.getFilterValue() as string) ?? ""} onChange={(event) => table.getColumn("email")?.setFilterValue(event.target.value)} className="max-w-sm" /> */}
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
