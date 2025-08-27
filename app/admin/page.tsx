import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SearchBox from './search-box.client'
import AdminTable from './admin-table.client'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ParkingRecord } from '@/types'

type SearchParams = { q?: string }

async function retrieveData(q?: string): Promise<ParkingRecord[]> {
    const supabase = await createClient()
    let query = supabase.from('parking_record').select('*')

    if (q && q.trim()) {
        const term = `%${q.trim()}%`
        query = query.ilike('plat_nomor', term) // case-insensitive contains;
    }

    const { data, error } = await query.order('timestamp', { ascending: false })
    if (error) throw error
    return data ?? []
}

export default async function AdminPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    // Mock data
    const { q = '' } = await searchParams
    const data = await retrieveData(q)

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navbar */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                <h1 className="text-xl font-semibold">Admin</h1>

                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    asChild
                >
                    <Link href="/">
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
                            <path d="M15 19l-7-7 7-7"></path>
                        </svg>
                        Kembali
                    </Link>
                </Button>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">
                <Card className="max-w-5xl mx-auto">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle>Daftar Deteksi Plat</CardTitle>
                            <div className="relative w-full sm:w-80">
                                <SearchBox />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <AdminTable data={data} initialQuery={q} />
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
