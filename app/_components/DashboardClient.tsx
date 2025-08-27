// app/_components/DashboardClient.tsx
'use client'

import * as React from 'react'
import useSWR from 'swr'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Badge from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useParkingRealtime } from '../_hooks/useParkingRealtime'

type ApiData = {
    data: {
        plate_number: string
        image: string
        timestamp: string
        detected_region: {
            x_min: number
            y_min: number
            x_max: number
            y_max: number
        } | null
    }
    enter_vehicle: number
    exit_vehicle: number
    remaining_slot: number
}

const fetcher = (url: string) =>
    fetch(url, { cache: 'no-store' }).then((r) => {
        if (!r.ok) throw new Error('Gagal memuat data')
        return r.json() as Promise<ApiData>
    })

export default function DashboardClient() {
    const [croppedImageUrl, setCroppedImageUrl] = React.useState<string | null>(
        null
    )

    const {
        data: snap,
        error,
        isLoading,
        mutate,
    } = useSWR<ApiData>('/api/latest-record', fetcher, {
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
    })

    // Revalidate ketika ada INSERT baru dari Supabase
    useParkingRealtime({
        onInsert: () => {
            void mutate()
        },
    })

    // Fungsi untuk crop gambar di client-side
    const cropImage = React.useCallback(
        async (
            imageUrl: string,
            region: {
                x_min: number
                y_min: number
                x_max: number
                y_max: number
            }
        ) => {
            try {
                const img = new window.Image()
                img.crossOrigin = 'anonymous'

                return new Promise<string>((resolve, reject) => {
                    img.onload = () => {
                        const canvas = document.createElement('canvas')
                        const ctx = canvas.getContext('2d')
                        if (!ctx) {
                            reject(new Error('Canvas context not available'))
                            return
                        }

                        // Clamp coordinates to image bounds
                        const x = Math.max(0, Math.min(region.x_min, img.width))
                        const y = Math.max(
                            0,
                            Math.min(region.y_min, img.height)
                        )
                        const width = Math.max(
                            0,
                            Math.min(region.x_max - region.x_min, img.width - x)
                        )
                        const height = Math.max(
                            0,
                            Math.min(
                                region.y_max - region.y_min,
                                img.height - y
                            )
                        )

                        canvas.width = width
                        canvas.height = height

                        // Draw cropped portion
                        ctx.drawImage(
                            img,
                            x,
                            y,
                            width,
                            height,
                            0,
                            0,
                            width,
                            height
                        )

                        // Convert to data URL
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
                        resolve(dataUrl)
                    }

                    img.onerror = () =>
                        reject(new Error('Failed to load image'))
                    img.src = imageUrl
                })
            } catch (error) {
                console.error('Error cropping image:', error)
                return null
            }
        },
        []
    )

    // Effect untuk crop gambar ketika data berubah
    React.useEffect(() => {
        if (snap?.data.image && snap?.data.detected_region) {
            cropImage(snap.data.image, snap.data.detected_region)
                .then((croppedUrl) => {
                    if (croppedUrl) {
                        setCroppedImageUrl(croppedUrl)
                    }
                })
                .catch((error) => {
                    console.error('Failed to crop image:', error)
                    setCroppedImageUrl(null)
                })
        } else {
            setCroppedImageUrl(null)
        }
    }, [snap?.data.image, snap?.data.detected_region, cropImage])

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Memuat...</CardTitle>
                    </CardHeader>
                    <CardContent className="aspect-video" />
                </Card>
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Nomor Plat</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input value="..." readOnly />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Time Stamp</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input value="..." readOnly />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Gambar plat yang sudah di crop
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full h-32 flex items-center justify-center rounded-md">
                                ...
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (error || !snap) {
        return (
            <div className="min-h-[40vh] grid place-items-center">
                <p className="text-sm text-red-600">Error memuat data</p>
            </div>
        )
    }

    const { data, enter_vehicle, exit_vehicle, remaining_slot } = snap

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Feed / Camera Preview */}
            <div className="lg:col-span-2">
                <Card className="rounded-lg overflow-hidden shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-center">
                            DETEKSI NOMOR PLAT
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative aspect-video flex items-center justify-center">
                        {data.image ? (
                            <Image
                                src={data.image}
                                alt="Vehicle image"
                                width={640}
                                height={360}
                                priority={true}
                                className="object-contain w-full h-full"
                            />
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="200"
                                height="200"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        )}
                        <div className="absolute bottom-2 left-2">
                            <Badge variant="secondary">N</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Info Panel */}
            <div className="space-y-4">
                {/* Plate Number */}
                <Card className="rounded-lg">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            Nomor Plat
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input value={data.plate_number} readOnly />
                    </CardContent>
                </Card>

                {/* Timestamp */}
                <Card className="rounded-lg">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            Time Stamp
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input
                            value={new Date(data.timestamp).toLocaleString(
                                'id-ID',
                                {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                }
                            )}
                            readOnly
                        />
                    </CardContent>
                </Card>

                {/* Cropped Plate Image */}
                <Card className="rounded-lg">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            Gambar plat yang sudah di crop
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full h-32 flex items-center justify-center rounded-md">
                            {croppedImageUrl ? (
                                <Image
                                    // data URL base64 aman dipakai sebagai src
                                    unoptimized
                                    src={croppedImageUrl}
                                    alt="Cropped plate"
                                    className="max-h-full max-w-full object-contain"
                                    width={300}
                                    height={200}
                                />
                            ) : data.detected_region ? (
                                <p className="text-sm">Memproses gambar...</p>
                            ) : (
                                <p className="text-sm">Tidak ada gambar</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    <Card className="rounded-lg p-3 text-center">
                        <Label className="text-xs font-medium block">
                            Motor masuk
                        </Label>
                        <Badge className="mt-1 text-lg font-bold">
                            {enter_vehicle}
                        </Badge>
                    </Card>
                    <Card className="rounded-lg p-3 text-center">
                        <Label className="text-xs font-medium block">
                            Motor keluar
                        </Label>
                        <Badge className="mt-1 text-lg font-bold">
                            {exit_vehicle}
                        </Badge>
                    </Card>
                    <Card className="rounded-lg p-3 text-center">
                        <Label className="text-xs font-medium block">
                            Slot Parkir
                        </Label>
                        <Badge className="mt-1 text-lg font-bold">
                            {remaining_slot}
                        </Badge>
                    </Card>
                </div>
            </div>
        </div>
    )
}
