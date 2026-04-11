"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { extractError } from "@/lib/format";

interface UseApiMutationOptions {
  method?: string;
  successMessage?: string;
  onSuccess?: (data: unknown) => void;
  refresh?: boolean;
}

export function useApiMutation<TInput = unknown, TOutput = unknown>(
  url: string | ((input: TInput) => string),
  options: UseApiMutationOptions = {}
) {
  const { method = "POST", successMessage, onSuccess, refresh = true } = options;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (input?: TInput): Promise<TOutput | null> => {
      setLoading(true);
      setError(null);

      try {
        const resolvedUrl = typeof url === "function" ? url(input as TInput) : url;
        const res = await fetch(resolvedUrl, {
          method,
          headers: { "Content-Type": "application/json" },
          ...(input !== undefined && { body: JSON.stringify(input) }),
        });

        if (!res.ok) {
          const message = await extractError(res, "Request failed");
          throw new Error(message);
        }

        const data = (await res.json()) as TOutput;

        if (successMessage) toast.success(successMessage);
        if (onSuccess) onSuccess(data);
        if (refresh) router.refresh();

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url, method, successMessage, onSuccess, refresh, router]
  );

  return { mutate, loading, error };
}
