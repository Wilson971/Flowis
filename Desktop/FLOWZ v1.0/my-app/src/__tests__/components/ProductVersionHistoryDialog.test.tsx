import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductVersionHistoryDialog } from '@/features/products/components/edit/ProductVersionHistoryDialog';
import { useProductVersionManager } from '@/hooks/products/useProductVersions';

// Setup ResizeObserver mock (used by Dialog/ScrollArea in Radix)
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock the hook
vi.mock('@/hooks/products/useProductVersions', () => ({
    useProductVersionManager: vi.fn(),
    useProductVersions: vi.fn(),
    useCreateProductVersion: vi.fn(),
    useRestoreProductVersion: vi.fn(),
}));

const mockRestoreVersion = vi.fn();

const mockVersions = [
    {
        id: '1',
        product_id: 'prod-1',
        version_number: 63,
        title: 'Version 63 Title',
        field_count: 32,
        trigger_type: 'manual_save',
        created_at: '2026-02-24T19:28:00Z',
        form_data: {
            title: 'Volant Clio 3',
            short_description: '<p>Précision chirurgicale et look racing pour votre Clio 3 !</p>',
            regular_price: '', // Empty price test case
            status: 'draft',
            sku: 'VOL-CLI3',
        },
        metadata: {
            author_name: 'Marie Dupont',
            published: false
        }
    },
    {
        id: '2',
        product_id: 'prod-1',
        version_number: 62,
        title: 'Version 62 Title',
        field_count: 31,
        trigger_type: 'auto_save',
        created_at: '2026-02-24T19:20:00Z',
        form_data: {
            title: 'Volant Clio 3 (Ancien)',
            short_description: 'Texte sans HTML',
            regular_price: '150.00',
            status: 'published',
            sku: 'VOL-CLI3',
        },
        metadata: {
            author_name: 'System',
            published: true
        }
    },
];

describe('ProductVersionHistoryDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useProductVersionManager as any).mockReturnValue({
            versions: mockVersions,
            isLoading: false,
            versionCount: 2,
            restoreVersion: mockRestoreVersion,
        });
    });

    it('renders the dialog with versions', () => {
        render(
            <ProductVersionHistoryDialog
                open={true}
                onOpenChange={() => { }}
                productId="prod-1"
            />
        );
        expect(screen.getByText('Historique des versions')).toBeInTheDocument();
        expect(screen.getByText('v63')).toBeInTheDocument();
        expect(screen.getByText('v62')).toBeInTheDocument();
    });

    it('cleans HTML tags from the short description in preview', async () => {
        render(
            <ProductVersionHistoryDialog
                open={true}
                onOpenChange={() => { }}
                productId="prod-1"
            />
        );
        // Click version 63
        fireEvent.click(screen.getByText('v63'));

        // Check if stripped HTML
        await waitFor(() => {
            expect(screen.queryByText('<p>Précision chirurgicale et look racing pour votre Clio 3 !</p>')).not.toBeInTheDocument();
        });
        expect(screen.getAllByText(/Précision chirurgicale et look racing pour votre Clio 3 !/i).length).toBeGreaterThan(0);
    });

    it('displays 0.00 EUR for an empty price', async () => {
        render(
            <ProductVersionHistoryDialog
                open={true}
                onOpenChange={() => { }}
                productId="prod-1"
            />
        );
        // Click version 63 which has empty price
        fireEvent.click(screen.getByText('v63'));

        await waitFor(() => {
            expect(screen.getAllByText('0.00 EUR').length).toBeGreaterThan(0);
        });
    });

    it('displays the author from metadata', async () => {
        render(
            <ProductVersionHistoryDialog
                open={true}
                onOpenChange={() => { }}
                productId="prod-1"
            />
        );
        fireEvent.click(screen.getByText('v63'));

        await waitFor(() => {
            expect(screen.getByText(/Sauvegarde par Marie Dupont/i)).toBeInTheDocument();
        });
    });

    it('has a functional restore button with confirmation', async () => {
        render(
            <ProductVersionHistoryDialog
                open={true}
                onOpenChange={() => { }}
                productId="prod-1"
            />
        );
        // We select version v62 so that it is different from the latest version (v63 in the mock)
        // to ensure the action dock appears.
        fireEvent.click(screen.getByText('v62'));

        const restoreBtn = await screen.findByRole('button', { name: /Restaurer cette version/i });
        expect(restoreBtn).toBeInTheDocument();

        // Click to open confirmation
        fireEvent.click(restoreBtn);

        // Find and click confirm button
        const confirmBtn = await screen.findByRole('button', { name: /Confirmer/i });
        expect(confirmBtn).toBeInTheDocument();
        fireEvent.click(confirmBtn);

        expect(mockRestoreVersion).toHaveBeenCalledWith({ versionId: '2', productId: 'prod-1' });
    });
});
