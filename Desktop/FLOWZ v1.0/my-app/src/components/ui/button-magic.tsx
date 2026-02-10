import * as React from "react";
import { cn } from "../../lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { LinkProps } from "next/link";

export type ButtonMagicProps = {
    size?: "sm" | "default" | "lg";
    showArrow?: boolean;
    showSparkles?: boolean;
    className?: string;
    children?: React.ReactNode;
} & (
        | ({ asChild?: false } & React.ButtonHTMLAttributes<HTMLButtonElement>)
        | ({ asChild: true; href: string } & Omit<LinkProps, "href"> & React.AnchorHTMLAttributes<HTMLAnchorElement>)
    );

const sizeClasses = {
    sm: "min-h-10 min-w-[120px] px-5 py-2 text-sm",
    default: "min-h-12 min-w-[140px] px-6 py-3 text-sm",
    lg: "min-h-14 min-w-[160px] px-8 py-4 text-base",
};

const baseClasses = cn(
    // Base styles
    "group relative inline-flex items-center justify-center",
    "rounded-full border-none outline-none cursor-pointer",
    "transition-all duration-200 ease-out",
    // Simple primary background
    "bg-primary",
    // Professional shadow
    "shadow-[0_4px_14px_-3px_rgba(0,0,0,0.25)]",
    // Hover effects
    "hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)]",
    "hover:brightness-110",
    // Active state
    "active:-translate-y-px active:scale-[0.98] active:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)]",
    // Disabled
    "disabled:pointer-events-none disabled:opacity-50"
);

type ContentProps = {
    children?: React.ReactNode;
    showSparkles?: boolean;
    showArrow?: boolean;
};

const ButtonContent = ({ children, showSparkles, showArrow }: ContentProps) => (
    <span className="relative z-[2] inline-flex items-center justify-center gap-2 font-semibold text-primary-foreground">
        {showSparkles && (
            <Sparkles className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" />
        )}
        {children}
        {showArrow && (
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        )}
    </span>
);

export const ButtonMagic = React.forwardRef<
    HTMLButtonElement | HTMLAnchorElement,
    ButtonMagicProps
>((props, ref) => {
    const {
        className,
        size = "default",
        showArrow = true,
        showSparkles = false,
        children,
        asChild,
        ...rest
    } = props;

    const combinedClassName = cn(baseClasses, sizeClasses[size], className);

    // If asChild is true, render as Link
    if (asChild && "href" in props) {
        const { href, ...linkProps } = rest as { href: string } & Omit<LinkProps, "href">;
        return (
            <Link
                href={href}
                className={combinedClassName}
                {...linkProps as any}
            >
                <ButtonContent showSparkles={showSparkles} showArrow={showArrow}>
                    {children}
                </ButtonContent>
            </Link>
        );
    }

    // Default: render as button
    return (
        <button
            ref={ref as React.Ref<HTMLButtonElement>}
            className={combinedClassName}
            {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
            <ButtonContent showSparkles={showSparkles} showArrow={showArrow}>
                {children}
            </ButtonContent>
        </button>
    );
});

ButtonMagic.displayName = "ButtonMagic";
