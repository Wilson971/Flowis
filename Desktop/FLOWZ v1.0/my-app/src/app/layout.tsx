import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '@/styles/app.css';
import { Providers } from './providers';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Flowz v1.0',
    description: 'E-commerce management platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning className="h-full overflow-hidden">
            <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased h-full overflow-hidden`}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
