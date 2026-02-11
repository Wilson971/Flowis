import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * Skeleton Component
 *
 * Shimmer-based loading placeholder with shape variants.
 * Uses a moving gradient instead of simple pulse for a more polished feel.
 *
 * @example
 * <Skeleton className="h-4 w-[200px]" />
 * <Skeleton shape="circle" className="h-12 w-12" />
 * <Skeleton shape="card" className="h-[200px]" />
 */

const skeletonVariants = cva(
    "bg-muted relative overflow-hidden isolate",
    {
        variants: {
            shape: {
                default: "rounded-lg",
                text: "rounded h-4",
                circle: "rounded-full",
                card: "rounded-xl",
            },
        },
        defaultVariants: {
            shape: "default",
        },
    }
);

export interface SkeletonProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> { }

function Skeleton({ className, shape, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(skeletonVariants({ shape }), className)}
            {...props}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-shimmer" />
        </div>
    );
}

export { Skeleton, skeletonVariants };
