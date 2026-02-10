import { cn } from "@/lib/utils"
import { Children, cloneElement, ReactElement, isValidElement } from "react"
import { ButtonProps } from "@/components/ui/button"

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: "horizontal" | "vertical"
}

export function ButtonGroup({
    className,
    orientation = "horizontal",
    children,
    ...props
}: ButtonGroupProps) {
    return (
        <div
            className={cn(
                "flex",
                orientation === "vertical" ? "flex-col" : "flex-row",
                className
            )}
            {...props}
        >
            {Children.map(children, (child, index) => {
                if (!isValidElement<ButtonProps>(child)) return child

                const isFirst = index === 0
                const isLast = index === Children.count(children) - 1

                return cloneElement(child, {
                    className: cn(
                        child.props.className,
                        orientation === "horizontal" && {
                            "rounded-r-none border-r-0": isFirst,
                            "rounded-l-none rounded-r-none border-r-0": !isFirst && !isLast,
                            "rounded-l-none": isLast,
                        },
                        orientation === "vertical" && {
                            "rounded-b-none border-b-0": isFirst,
                            "rounded-t-none rounded-b-none border-b-0": !isFirst && !isLast,
                            "rounded-t-none": isLast,
                        }
                    ),
                })
            })}
        </div>
    )
}
