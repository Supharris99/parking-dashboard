// app/api/latest-record/route.ts
import { createClient } from '@/lib/supabase/client'
import { ParkingRecord } from '@/types'
import { NextRequest } from 'next/server'

type ParkingStatus = 'IN' | 'OUT'
const BUCKET_NAME = process.env.SUPABASE_BUCKET ?? 'detected_images'
const CAPACITY = Number(process.env.PARKING_CAPACITY ?? 60)
const TZ = 'Asia/Jakarta' // target perhitungan harian

function getTodayRangeInUTC() {
    // Tgl hari ini berdasarkan Asia/Jakarta, lalu konversi ke UTC ISO
    const now = new Date()
    // Normalisasi ke Asia/Jakarta secara manual (tanpa lib): ambil jam Jakarta
    // Cara stabil: buat tanggal string "YYYY-MM-DD" di Jakarta, lalu buat ISO di UTC
    const jakartaNow = new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now) // "YYYY-MM-DD"

    const startLocal = new Date(`${jakartaNow}T00:00:00+07:00`)
    const endLocal = new Date(`${jakartaNow}T23:59:59.999+07:00`)

    return {
        startUTC: startLocal.toISOString(),
        endUTC: endLocal.toISOString(),
        localDate: jakartaNow,
    }
}

async function getPublicOrSignedUrl(
    supabase: ReturnType<typeof createClient>,
    pathOrUrl?: string | null
) {
    if (!pathOrUrl) return null
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl

    // 1) coba public URL
    const { data: pub } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(pathOrUrl)
    if (pub?.publicUrl) return pub.publicUrl

    // 2) fallback: signed url 1 menit
    const { data: signed, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(pathOrUrl, 60)
    if (error) {
        console.error('createSignedUrl error:', error.message)
        return null
    }
    return signed?.signedUrl ?? null
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_: NextRequest) {
    const supabase = createClient()

    // 1) Ambil record terbaru
    const { data: latestData, error: latestErr } = await supabase
        .from('parking_record') // ⚠️ pastikan SINGULAR sesuai skema
        .select('*')
        .order('id', { ascending: false })
        .limit(1)

    if (latestErr) {
        return Response.json({ error: latestErr.message }, { status: 500 })
    }

    const latest: ParkingRecord | undefined = latestData?.[0]

    // 2) Hitung IN/OUT untuk hari ini (Asia/Jakarta)
    const { startUTC, endUTC } = getTodayRangeInUTC()

    const countByStatus = async (status: ParkingStatus) => {
        const { count, error } = await supabase
            .from('parking_record')
            .select('id', { count: 'exact', head: true })
            .eq('status', status)
            .gte('timestamp', startUTC)
            .lte('timestamp', endUTC)

        if (error) {
            console.error('count error:', status, error.message)
            return 0
        }
        return count ?? 0
    }

    const [enter_vehicle, exit_vehicle] = await Promise.all([
        countByStatus('IN'),
        countByStatus('OUT'),
    ])

    // 3) Remaining slot (kapasitas - (IN - OUT)), dijepit 0..CAPACITY
    const used = Math.max(0, enter_vehicle - exit_vehicle)
    const remaining_slot = Math.max(0, Math.min(CAPACITY - used, CAPACITY))

    // 4) Siapkan URL image
    let imageUrl: string | null = null
    if (latest?.image) {
        imageUrl = await getPublicOrSignedUrl(supabase, latest.image)
    }

    return Response.json({
        data: {
            plate_number: latest?.plat_nomor ?? '',
            image: imageUrl ?? latest?.image ?? '',
            timestamp: latest?.timestamp ?? '',
            detected_region: latest?.detected_region ?? null,
        },
        enter_vehicle,
        exit_vehicle,
        remaining_slot,
    })
}
