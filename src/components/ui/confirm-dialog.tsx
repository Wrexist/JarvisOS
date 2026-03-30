"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  function confirm(opts: {
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  }) {
    setState({ open: true, ...opts });
  }

  function ConfirmDialog() {
    const [loading, setLoading] = useState(false);

    return (
      <Dialog
        open={state.open}
        onOpenChange={(open) => setState((s) => ({ ...s, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{state.title}</DialogTitle>
            <DialogDescription>{state.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setState((s) => ({ ...s, open: false }))}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await state.onConfirm();
                } finally {
                  setLoading(false);
                  setState((s) => ({ ...s, open: false }));
                }
              }}
            >
              {loading ? "Deleting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return { confirm, ConfirmDialog };
}
