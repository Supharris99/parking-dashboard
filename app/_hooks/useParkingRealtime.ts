// app/admin/_components/useParkingRealtime.ts
'use client'
import { createClient } from '@/lib/supabase/client'
import { ParkingRecord } from '@/types'
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js'
import React from 'react'

export function useParkingRealtime({
    onInsert,
}: {
    onInsert: (row: ParkingRecord) => void
}) {
    const supabase = createClient()

    React.useEffect(() => {
        const channel = supabase
            .channel('parking_record_changes')
            .on<RealtimePostgresInsertPayload<ParkingRecord>>(
                'postgres_changes',
                {
                    event: 'INSERT', // ⬅ hanya event INSERT
                    schema: 'public',
                    table: 'parking_record',
                },
                (payload) => {
                    return onInsert?.(payload.new as unknown as ParkingRecord)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onInsert])
}
