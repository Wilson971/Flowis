import { ProfileForm } from '@/components/profile/ProfileForm';

export default function ProfilePage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Profil</h3>
                <p className="text-sm text-muted-foreground">
                    C'est ainsi que les autres vous verront sur le site.
                </p>
            </div>
            <ProfileForm />
        </div>
    );
}
