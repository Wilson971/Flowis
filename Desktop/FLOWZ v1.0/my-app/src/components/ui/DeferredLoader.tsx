import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface DeferredLoaderProps {
    delay?: number;
    className?: string;
}

export const DeferredLoader = ({ delay = 300, className }: DeferredLoaderProps) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(true);
        }, delay);

        return () => clearTimeout(timer);
    }, [delay]);

    if (!show) return null;

    return (
        <div className={`flex items-center justify-center ${className || ''}`}>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
    );
};
