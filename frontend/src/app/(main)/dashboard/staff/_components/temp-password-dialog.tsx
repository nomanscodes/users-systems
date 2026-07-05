'use client';

import { useState } from 'react';
import { CheckCircle2, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { InviteStaffResponse } from '@/features/staff/types/staff.dto';

interface TempPasswordDialogProps {
  open: boolean;
  data: InviteStaffResponse | null;
  onClose: () => void;
}

export function TempPasswordDialog({ open, data, onClose }: TempPasswordDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!data?.temporaryPassword) return;
    await navigator.clipboard.writeText(data.temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return null;

  return (
    // Prevent closing by clicking outside — user must explicitly click "Done"
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* No close button — intentional. Staff must copy password before closing. */}
        <div className="flex flex-col items-center gap-5 py-2 text-center">
          {/* Success Icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/50">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>

          {/* Headline */}
          <div>
            <h2 className="text-lg font-semibold">Staff member invited!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {data.firstName} {data.lastName} ({data.email}) has been added to your school.
            </p>
          </div>

          {/* Temporary Password Block */}
          <div className="w-full space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-left">
              Temporary Password
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3">
              <code className="flex-1 text-left font-mono text-sm font-semibold tracking-wider">
                {data.temporaryPassword}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 shrink-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Warning */}
          <div className="w-full rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-left">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              ⚠️ <span className="font-medium">This password is shown only once.</span> Please share it with{' '}
              <strong>{data.firstName}</strong> securely before closing.
            </p>
          </div>

          {/* Done Button */}
          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
