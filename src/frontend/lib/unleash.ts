const UNLEASH_URL = process.env.NEXT_PUBLIC_UNLEASH_FRONTEND_URL;
const UNLEASH_TOKEN = process.env.NEXT_PUBLIC_UNLEASH_FRONTEND_TOKEN;

export async function isFeatureEnabled(flagName: string): Promise<boolean> {
  if (!UNLEASH_URL || !UNLEASH_TOKEN) return true;
  try {
    const res = await fetch(UNLEASH_URL, {
      headers: { Authorization: UNLEASH_TOKEN },
      next: { revalidate: 30 },
    });
    if (!res.ok) return true;
    const data = (await res.json()) as {
      toggles: Array<{ name: string; enabled: boolean }>;
    };
    return data.toggles?.find(t => t.name === flagName)?.enabled ?? false;
  } catch {
    return true;
  }
}
