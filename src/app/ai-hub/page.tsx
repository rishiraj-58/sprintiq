import { AIHubChatInterface } from './AIHubChatInterface';
import { requireAuth } from '@/lib/auth';

export default async function AIHubPage() {
  const user = await requireAuth();
  
  return (
    <div className="p-4">
      <AIHubChatInterface userId={user.id} />
    </div>
  );
}
