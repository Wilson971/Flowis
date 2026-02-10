import * as React from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const MotionTableRow = motion(TableRow);

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    searchPlaceholder?: string;
    enableColumnVisibility?: boolean;
    enablePagination?: boolean;
    pageSize?: number;
    getRowClassName?: (row: TData) => string;
    /** Rendu d'un overlay sur la ligne (pour animations de génération) */
    renderRowOverlay?: (row: TData) => React.ReactNode;
    /** Vérifie si une ligne est en cours de génération (affiche skeleton) */
    isRowGenerating?: (row: TData) => boolean;
    onTableReady?: (table: ReturnType<typeof useReactTable<TData>>) => void;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Search...",
    enableColumnVisibility = true,
    enablePagination = true,
    pageSize = 10,
    getRowClassName,
    renderRowOverlay,
    isRowGenerating,
    onTableReady,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        initialState: {
            pagination: {
                pageSize,
            },
        },
    });

    React.useEffect(() => {
        if (onTableReady) {
            onTableReady(table);
        }
    }, [table, onTableReady]);

    return (
        <div className="w-full space-y-4">
            {/* Search and Column Visibility */}
            {searchKey && (
                <div className="flex items-center justify-between">
                    <Input
                        placeholder={searchPlaceholder}
                        value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn(searchKey)?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                    {enableColumnVisibility && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="ml-auto">
                                    Colonnes <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => {
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(!!value)
                                                }
                                            >
                                                {column.id}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            )}

            {/* Table wrapper - borders handled by parent or Tailwind classes */}
            <div className="">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                const isGenerating = isRowGenerating?.(row.original) ?? false;

                                return (
                                    <MotionTableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className={cn(
                                            "relative group/row border-b border-border/50",
                                            getRowClassName?.(row.original)
                                        )}
                                        initial={false}
                                        whileHover={{
                                            backgroundColor: "var(--sidebar-accent)",
                                            x: 4,
                                            boxShadow: "inset 4px 0 0 0 var(--primary)",
                                            transition: { duration: 0.2, ease: "easeOut" }
                                        }}
                                    >
                                        {isGenerating ? (
                                            // Afficher skeleton pendant la génération
                                            <>
                                                {/* Checkbox skeleton */}
                                                <TableCell>
                                                    <Skeleton className="h-4 w-4 rounded" />
                                                </TableCell>
                                                {/* Image skeleton */}
                                                <TableCell>
                                                    <Skeleton className="h-12 w-12 rounded-full" />
                                                </TableCell>
                                                {/* Titre skeleton */}
                                                <TableCell>
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-[200px]" />
                                                        <Skeleton className="h-3 w-[140px]" />
                                                    </div>
                                                </TableCell>
                                                {/* Autres colonnes en skeleton */}
                                                {row.getVisibleCells().slice(3).map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        <Skeleton className="h-4 w-16" />
                                                    </TableCell>
                                                ))}
                                            </>
                                        ) : (
                                            // Afficher le contenu normal
                                            row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))
                                        )}
                                        {/* Overlay de génération (si non skeleton) */}
                                        {!isGenerating && renderRowOverlay?.(row.original)}
                                    </MotionTableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    Aucun résultat.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {enablePagination && (
                <div className="flex items-center justify-end space-x-2">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} sur{" "}
                        {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Précédent
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Suivant
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
