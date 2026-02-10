import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserProfile } from '@/hooks/profile/useUserProfile';
import { Camera, User as UserIcon } from 'lucide-react';
import { useRef } from 'react';

interface ProfileHeaderProps {
    profile: UserProfile;
    onAvatarChange?: (file: File) => void;
    isUploadingAvatar?: boolean;
}

export default function ProfileHeader({ profile, onAvatarChange, isUploadingAvatar }: ProfileHeaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initials = profile.first_name && profile.last_name
        ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
        : (profile.full_name
            ? profile.full_name.substring(0, 2).toUpperCase()
            : (profile.email ? profile.email.substring(0, 2).toUpperCase() : 'U'));

    const fullName = profile.full_name || profile.email;
    // Assuming 'plan' comes from somewhere else or we default it. 
    // The updated UserProfile doesn't strictly have 'plan' yet unless it's in the DB but not typed.
    // For now, I'll hardcode or check if I missed it, but sticking to what I added.
    const plan = 'Free'; // Default for now until subscription hook is ready

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onAvatarChange) {
            onAvatarChange(file);
        }
    };

    return (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                        <Avatar className="h-24 w-24 border-2 border-background shadow-sm">
                            <AvatarImage src={profile.avatar_url || ''} alt={fullName || 'User'} />
                            <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-6 w-6 text-white" />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={isUploadingAvatar}
                        />
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2">
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <h2 className="text-2xl font-bold">{fullName}</h2>
                            <Badge variant="secondary" className="capitalize">
                                {plan} Plan
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">{profile.email}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
