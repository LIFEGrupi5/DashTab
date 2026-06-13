// Public API helpers — no auth, no credentials, no Zustand store.
// Used exclusively by anonymous customer-facing pages (e.g. /r/[id]/recommend).

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

export type RecommendedItem = {
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
};

export type RecommendationResponse = {
  message: string | null;
  items: RecommendedItem[];
};

export async function recommend(
  restaurantId: string,
  query: string,
): Promise<RecommendationResponse> {
  const res = await fetch(
    `${BASE_URL}/public/restaurants/${restaurantId}/recommend`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Request failed (${res.status})`);
  }

  return res.json();
}
