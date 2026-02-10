import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";

type GenerateSelectionModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const GenerateSelectionModal = ({
    open,
    onOpenChange,
}: GenerateSelectionModalProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Générer du contenu</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-muted-foreground">
                        Fonctionnalité en cours de développement. Bientôt disponible !
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
