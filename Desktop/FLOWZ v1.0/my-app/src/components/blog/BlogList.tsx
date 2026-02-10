/**
 * BlogList - Grille des articles de blog
 *
 * Navigation:
 * - Clic sur article -> /app/blog/editor/:id (Éditeur Standalone)
 * - Nouvel article IA -> /app/blog/flowriter (FloWriter)
 * - Nouvel article manuel -> /app/blog/editor/new (Éditeur Standalone vide)
 */
import { useBlogPosts } from '@/hooks/blog/useBlogPosts';
import { useSelectedStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Plus, Edit, Trash2, Calendar, Sparkles, FileEdit, ChevronDown, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BlogPost } from '@/types/blog';

export function BlogList() {
    const router = useRouter();
    const { selectedStore } = useSelectedStore();
    const { posts, isLoading, deletePost, createPost } = useBlogPosts(selectedStore?.id);

    const handleCreateWithAI = () => {
        router.push('/app/blog/flowriter');
    };

    const handleCreateManual = () => {
        router.push('/app/blog/editor/new');
    };

    const handleEditArticle = (articleId: string) => {
        router.push(`/app/blog/editor/${articleId}`);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-medium">Aucun article</h3>
                <p className="text-muted-foreground mb-4">Commencez par créer votre premier article.</p>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nouvel article
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleCreateWithAI}>
                            <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                            Générer avec IA (FloWriter)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCreateManual}>
                            <FileEdit className="mr-2 h-4 w-4" />
                            Créer manuellement
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with create button */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Articles ({posts.length})</h2>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nouvel article
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleCreateWithAI}>
                            <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                            Générer avec IA (FloWriter)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCreateManual}>
                            <FileEdit className="mr-2 h-4 w-4" />
                            Créer manuellement
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post: BlogPost) => (
                    <Card
                        key={post.id}
                        className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => handleEditArticle(post.id)}
                    >
                        {post.cover_image_url && (
                            <div className="h-48 w-full overflow-hidden rounded-t-lg bg-muted">
                                <img
                                    src={post.cover_image_url}
                                    alt={post.title}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                            </div>
                        )}
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                    {post.status === 'published' ? 'Publié' : post.status === 'scheduled' ? 'Planifié' : 'Brouillon'}
                                </Badge>
                                {post.ai_generated && (
                                    <Badge variant="outline" className="gap-1">
                                        <Sparkles className="h-3 w-3 text-amber-500" />
                                        IA
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="line-clamp-2 mt-2 leading-tight group-hover:text-primary transition-colors">
                                {post.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex-grow">
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {post.excerpt || "Pas d'extrait..."}
                            </p>
                            {post.published_at && (
                                <span className="text-xs text-muted-foreground flex items-center mt-2">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDistanceToNow(new Date(post.published_at), { addSuffix: true, locale: fr })}
                                </span>
                            )}
                        </CardContent>
                        <CardFooter className="p-4 border-t bg-muted/20 flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditArticle(post.id);
                                }}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Éditer
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Open preview
                                }}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Supprimer cet article ?')) deletePost.mutate(post.id);
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
