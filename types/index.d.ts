export type DetectedRegion = {
    label: string
    x_max: number
    x_min: number
    y_max: number
    y_min: number
    confidence: number
}

export type ParkingRecord = {
    id: number
    plat_nomor: string
    image: string | null
    status: string
    timestamp: string // ISO dari DB
    detected_region: DetectedRegion
}