/**
 * Custom Hook for resolving signed URLs for arrays of image paths efficiently.
 */

import { useEffect, useState } from "react";
import { violationsService } from "@/services/api/violations-service";

export function useSignedUrls(imagePaths: (string | null | undefined)[]) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const pathKey = imagePaths
    .filter((p): p is string => Boolean(p))
    .sort()
    .join("|");

  useEffect(() => {
    const pathsToFetch = Array.from(
      new Set(
        imagePaths.filter((p): p is string => Boolean(p) && !signedUrls[p]),
      ),
    );

    if (pathsToFetch.length === 0) return;

    let isCancelled = false;

    (async () => {
      const resolvedEntries: [string, string][] = [];
      for (const path of pathsToFetch) {
        if (/^https?:\/\//i.test(path)) {
          resolvedEntries.push([path, path]);
        } else {
          const url = await violationsService.getSignedImageUrl(path);
          if (url) resolvedEntries.push([path, url]);
        }
      }

      if (!isCancelled && resolvedEntries.length > 0) {
        setSignedUrls((prev) => ({
          ...prev,
          ...Object.fromEntries(resolvedEntries),
        }));
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [pathKey]);

  /**
   * Manually ensures that all paths in a list have signed URLs generated.
   */
  const ensureSignedUrls = async (paths: (string | null | undefined)[]) => {
    const validPaths = paths.filter((p): p is string => Boolean(p));
    const currentUrls = { ...signedUrls };
    const missingPaths = validPaths.filter((p) => !currentUrls[p]);

    if (missingPaths.length === 0) return currentUrls;

    for (const path of missingPaths) {
      if (/^https?:\/\//i.test(path)) {
        currentUrls[path] = path;
      } else {
        const url = await violationsService.getSignedImageUrl(path);
        if (url) currentUrls[path] = url;
      }
    }

    setSignedUrls(currentUrls);
    return currentUrls;
  };

  return { signedUrls, ensureSignedUrls };
}
