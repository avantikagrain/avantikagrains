'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

export function OrderSearch({ initial, status }: { initial: string; status?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set('q', value.trim());
    if (status) params.set('status', status);
    const query = params.toString();
    router.push(query ? `/admin/orders?${query}` : '/admin/orders');
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2" role="search">
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-faint)]"
        />
        <input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Order number, name, phone, email"
          aria-label="Search orders"
          className="h-9 w-72 max-w-full rounded-[var(--radius-control)] border border-[var(--hairline-strong)] bg-[var(--bg-raised)] pl-9 pr-3 text-spec outline-none focus:border-[var(--accent)]"
        />
      </div>
      <button
        type="submit"
        className="h-9 rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-spec text-[var(--color-cream-50)] transition-colors duration-[var(--t-fast)] hover:bg-[var(--accent-bright)]"
      >
        Search
      </button>
    </form>
  );
}
