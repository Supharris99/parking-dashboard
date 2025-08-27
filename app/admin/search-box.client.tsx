// app/admin/search-box.client.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { useState, useEffect, startTransition } from 'react'

export default function SearchBox() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [query, setQuery] = useState<string>(
        () => searchParams.get('q') ?? ''
    )

    // Sync input dengan URL param saat pertama kali load
    useEffect(() => {
        const currentQuery = searchParams.get('q') ?? ''
        if (currentQuery !== query) {
            setQuery(currentQuery)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams)

            if (query) {
                params.set('q', query)
            } else {
                params.delete('q')
            }

            startTransition(() => {
                router.replace(`/admin?${params.toString()}`, { scroll: false })
            })
        }, 300)

        return () => clearTimeout(timer)
    }, [query, router, searchParams])

    return (
        <div className="relative w-full sm:w-80">
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nomor plat..."
                aria-label="Cari nomor plat"
                className="pr-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
            </div>
        </div>
    )
}
