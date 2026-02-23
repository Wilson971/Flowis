import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const ProductsTableSkeleton = () => {
    return (
        <Card className="overflow-hidden border border-border mt-4">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        {Array.from({ length: 9 }).map((_, colIndex) => (
                            <TableHead key={colIndex}>
                                <Skeleton className="h-4 w-20 bg-muted/50" />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 8 }).map((_, rowIndex) => (
                        <TableRow key={rowIndex}>
                            <TableCell className="w-[50px]">
                                <Skeleton className="h-4 w-4 bg-muted/60 rounded" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-12 w-12 bg-muted/60 rounded-lg" />
                            </TableCell>
                            <TableCell className="max-w-[250px]">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full bg-muted/60" />
                                    <Skeleton className="h-3 w-1/2 bg-muted/60" />
                                </div>
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-5 w-24 bg-muted/60 rounded-full" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-16 bg-muted/60 ml-auto" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-5 w-20 bg-muted/60 rounded" />
                            </TableCell>
                            <TableCell>
                                <div className="flex justify-center">
                                    <Skeleton className="h-8 w-8 bg-muted/60 rounded-full" />
                                </div>
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-5 w-16 bg-muted/60 rounded" />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 bg-muted/60 rounded-md" />
                                    <Skeleton className="h-8 w-8 bg-muted/60 rounded-md" />
                                    <Skeleton className="h-8 w-8 bg-muted/60 rounded-md" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
};
