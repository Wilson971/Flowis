import { cn } from "../../lib/utils";
import { m } from "framer-motion";

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: string;
}

export const PageContainer = ({
    children,
    className,
    maxWidth = "max-w-7xl",
}: PageContainerProps) => {
    return (
        <div
            className={cn(
                "container mx-auto p-4 md:p-6 lg:p-8",
                maxWidth,
                className
            )}
        >
            {children}
        </div>
    );
};
