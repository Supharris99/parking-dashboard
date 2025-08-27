import { Button } from '@/components/ui/button'
import Link from 'next/link'
import DashboardClient from './_components/DashboardClient'

export default async function Home() {
    return (
        <div className="min-h-screen p-4">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">
                    SISTEM PARKIR POLITEKNIK NEGERI PADANG
                </h1>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/admin">Admin Panel</Link>
                </Button>
            </header>

            <DashboardClient />
        </div>
    )
}
