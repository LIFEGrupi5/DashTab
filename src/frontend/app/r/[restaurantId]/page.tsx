import { isFeatureEnabled } from '@/lib/unleash';
import RecommendClient from './_components/RecommendClient';

export default async function Page({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const enabled = await isFeatureEnabled('menu-recommendations');

  if (!enabled) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3 px-6">
          <h1 className="text-2xl font-bold text-stone-300">Coming Soon</h1>
          <p className="text-stone-500 text-sm">AI menu recommendations are not yet available for this restaurant.</p>
        </div>
      </div>
    );
  }

  return <RecommendClient params={params} />;
}
