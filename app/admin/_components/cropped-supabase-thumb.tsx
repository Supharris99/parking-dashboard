'use client'

import * as React from 'react'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'

type Rect = { x_min: number; y_min: number; x_max: number; y_max: number }

export function CroppedSupabaseThumb({
    bucket = 'detected_images',
    path,
    rect,
    outW = 64,
    outH = 40,
    alt,
    className,
    useNextImage = false,
}: {
    bucket?: string
    path: string | null
    rect: Rect
    outW?: number
    outH?: number
    alt: string
    className?: string
    useNextImage?: boolean
}) {
    const [dataUrl, setDataUrl] = React.useState<string | null>(null)
    const [errored, setErrored] = React.useState(false)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        let cancelled = false

        async function run() {
            try {
                if (!path) {
                    console.error(
                        'CroppedSupabaseThumb: No image path provided'
                    )
                    throw new Error('no image path')
                }

                setErrored(false)
                setLoading(true)

                const supabase = createClient()
                const { data: pub } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(path)

                const src = pub.publicUrl
                console.log('CroppedSupabaseThumb: Loading image from:', src)

                // Load image dengan timeout
                const img = await new Promise<HTMLImageElement>(
                    (resolve, reject) => {
                        const el = document.createElement('img') // Gunakan createElement untuk menghindari konflik
                        const timeout = setTimeout(() => {
                            reject(new Error('Image load timeout'))
                        }, 10000) // 10 second timeout

                        el.crossOrigin = 'anonymous'
                        el.onload = () => {
                            clearTimeout(timeout)
                            console.log(
                                'CroppedSupabaseThumb: Image loaded successfully',
                                {
                                    width: el.naturalWidth,
                                    height: el.naturalHeight,
                                }
                            )
                            resolve(el)
                        }
                        el.onerror = (err) => {
                            clearTimeout(timeout)
                            console.error(
                                'CroppedSupabaseThumb: Image load error:',
                                err
                            )
                            reject(new Error('Failed to load image'))
                        }
                        el.src = src
                    }
                )

                // Validasi rect coordinates
                const imgWidth = img.naturalWidth
                const imgHeight = img.naturalHeight

                if (imgWidth === 0 || imgHeight === 0) {
                    throw new Error('Invalid image dimensions')
                }

                // Clamp rect values to image bounds
                const sx = Math.max(0, Math.min(rect.x_min, imgWidth - 1))
                const sy = Math.max(0, Math.min(rect.y_min, imgHeight - 1))
                const ex = Math.max(sx + 1, Math.min(rect.x_max, imgWidth))
                const ey = Math.max(sy + 1, Math.min(rect.y_max, imgHeight))

                const sw = ex - sx
                const sh = ey - sy

                console.log('CroppedSupabaseThumb: Crop parameters:', {
                    originalSize: { width: imgWidth, height: imgHeight },
                    cropRect: { sx, sy, sw, sh },
                    outputSize: { outW, outH },
                })

                if (sw <= 0 || sh <= 0) {
                    throw new Error('Invalid crop dimensions')
                }

                // Create canvas dan crop
                const canvas = document.createElement('canvas')
                canvas.width = outW
                canvas.height = outH
                const ctx = canvas.getContext('2d')

                if (!ctx) {
                    throw new Error('Failed to get canvas context')
                }

                // Clear canvas dengan background putih
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, outW, outH)

                // Letterbox calculation
                const aspectSrc = sw / sh
                const aspectDst = outW / outH
                let dx = 0,
                    dy = 0,
                    dw = outW,
                    dh = outH

                if (aspectSrc > aspectDst) {
                    // Source wider than destination
                    dh = Math.round(outW / aspectSrc)
                    dy = Math.floor((outH - dh) / 2)
                } else if (aspectSrc < aspectDst) {
                    // Source taller than destination
                    dw = Math.round(outH * aspectSrc)
                    dx = Math.floor((outW - dw) / 2)
                }

                // Draw cropped image
                ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)

                if (cancelled) return

                // Convert to data URL dengan kualitas tinggi
                const dataURL = canvas.toDataURL('image/png', 1.0)

                if (dataURL === 'data:,') {
                    throw new Error('Canvas conversion failed')
                }

                console.log(
                    'CroppedSupabaseThumb: Successfully generated cropped image'
                )
                setDataUrl(dataURL)
                setLoading(false)
            } catch (error) {
                console.error(
                    'CroppedSupabaseThumb: Error in crop process:',
                    error
                )
                if (!cancelled) {
                    setErrored(true)
                    setLoading(false)
                }
            }
        }

        run()

        return () => {
            cancelled = true
        }
    }, [
        bucket,
        path,
        rect.x_min,
        rect.y_min,
        rect.x_max,
        rect.y_max,
        outW,
        outH,
    ])

    // Fix Tailwind class interpolation issue
    const commonClass = `object-cover rounded border border-border ${className ?? ''}`
    const sizeStyle = {
        width: `${outW}px`,
        height: `${outH}px`,
    }

    if (loading && !errored) {
        return (
            <div
                className={`bg-gray-200 animate-pulse flex items-center justify-center ${commonClass}`}
                style={sizeStyle}
            >
                <svg
                    className="w-4 h-4 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                    />
                </svg>
            </div>
        )
    }

    if (errored || !dataUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src="/placeholder.svg"
                width={outW}
                height={outH}
                alt={alt}
                className={commonClass}
                style={sizeStyle}
            />
        )
    }

    if (useNextImage) {
        return (
            <NextImage
                src={dataUrl}
                alt={alt}
                width={outW}
                height={outH}
                unoptimized
                className={commonClass}
                style={sizeStyle}
            />
        )
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={dataUrl}
            width={outW}
            height={outH}
            alt={alt}
            className={commonClass}
            style={sizeStyle}
        />
    )
}
