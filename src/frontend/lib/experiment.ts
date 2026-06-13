import { useState, useEffect } from 'react';

/**
 * Returns the PostHog feature flag value for `flagKey`.
 * Defaults to `defaultVariant` until PostHog loads — ensures the page renders
 * immediately without a blank/loading state while flags are fetched.
 *
 * PostHog auto-captures a $feature_flag_called exposure event the moment
 * getFeatureFlag() is called, so no manual tracking is needed.
 */
export function useFeatureFlag(flagKey: string, defaultVariant = 'control'): string {
  const [variant, setVariant] = useState(defaultVariant);

  useEffect(() => {
    let live = true;

    import('posthog-js')
      .then(({ default: posthog }) => {
        // onFeatureFlags fires immediately if flags are already loaded,
        // or defers until posthog.init() completes and flags arrive.
        posthog.onFeatureFlags(() => {
          if (!live) return;
          const v = posthog.getFeatureFlag(flagKey);
          if (typeof v === 'string') setVariant(v);
        });
      })
      .catch(() => {});

    return () => {
      live = false;
    };
  }, [flagKey]);

  return variant;
}
