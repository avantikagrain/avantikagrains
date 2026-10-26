'use client';

import { useEffect, useState } from 'react';

export interface SessionAddress {
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
}

export interface SessionProfile {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  emailVerified: boolean;
  addresses: SessionAddress[];
}

export type SessionState =
  | { status: 'loading'; profile: null }
  | { status: 'authenticated'; profile: SessionProfile }
  | { status: 'anonymous'; profile: null };

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'loading', profile: null });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch('/api/v1/auth/me', {
          signal: controller.signal,
          credentials: 'include',
        });

        if (!response.ok) {
          setState({ status: 'anonymous', profile: null });
          return;
        }

        const payload = await response.json();
        setState({ status: 'authenticated', profile: payload.data as SessionProfile });
      } catch {
        if (controller.signal.aborted) return;
        setState({ status: 'anonymous', profile: null });
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  return state;
}
