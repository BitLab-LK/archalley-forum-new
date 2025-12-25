import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isJuryMember } from '@/lib/jury-service';

export default async function JuryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check if user is an active jury member
  const isJury = await isJuryMember(session.user.id);

  if (!isJury) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-6">
            <a href="/jury/dashboard" className="text-lg font-semibold">
              Jury Portal
            </a>
            <div className="flex gap-4 text-sm">
              <a
                href="/jury/dashboard"
                className="text-muted-foreground hover:text-foreground transition"
              >
                Dashboard
              </a>
              <a
                href="/jury/submissions"
                className="text-muted-foreground hover:text-foreground transition"
              >
                Submissions
              </a>
            </div>
          </nav>
        </div>
      </div>
      <main>{children}</main>
    </div>
  );
}
