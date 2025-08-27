// app/admin/admin-table.client.tsx
'use client'

import * as React from 'react'
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { CroppedSupabaseThumb } from './_components/cropped-supabase-thumb'
import { createClient } from '@/lib/supabase/client'
import { ParkingRecord } from '@/types'

export default function AdminTable({
    data,
    initialQuery,
}: {
    data: ParkingRecord[]
    initialQuery?: string
}) {
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: 'id', desc: false },
    ])
    const [globalFilter, setGlobalFilter] = React.useState<string>(
        initialQuery ?? ''
    )
    const [editDialog, setEditDialog] = React.useState<{
        open: boolean
        record: ParkingRecord | null
    }>({ open: false, record: null })
    const [editPlatNomor, setEditPlatNomor] = React.useState('')
    const [isUpdating, setIsUpdating] = React.useState(false)

    const supabase = createClient()

    const handleEdit = React.useCallback(
        (record: ParkingRecord) => {
            setEditDialog({ open: true, record })
            setEditPlatNomor(record.plat_nomor)
        },
        [setEditDialog, setEditPlatNomor]
    )

    const handleCloseDialog = () => {
        setEditDialog({ open: false, record: null })
        setEditPlatNomor('')
        setIsUpdating(false)
    }

    const handleUpdatePlatNomor = async () => {
        if (!editDialog.record || !editPlatNomor.trim()) return

        setIsUpdating(true)
        try {
            const { error } = await supabase
                .from('parking_record')
                .update({ plat_nomor: editPlatNomor.trim() })
                .eq('id', editDialog.record.id)

            if (error) {
                console.error('Error updating plat nomor:', error)
                alert('Gagal mengupdate nomor plat: ' + error.message)
            } else {
                alert('Nomor plat berhasil diupdate!')
                // Update local data
                // const updatedData = data.map((item) =>
                //     item.id === editDialog.record!.id
                //         ? { ...item, plat_nomor: editPlatNomor.trim() }
                //         : item
                // )
                // Note: Untuk update real-time, sebaiknya menggunakan state management atau refetch data
                handleCloseDialog()
                // Refresh halaman untuk melihat perubahan
                window.location.reload()
            }
        } catch (error) {
            console.error('Unexpected error:', error)
            alert('Terjadi kesalahan yang tidak terduga')
        } finally {
            setIsUpdating(false)
        }
    }

    const columns = React.useMemo<ColumnDef<ParkingRecord, unknown>[]>(
        () => [
            {
                accessorKey: 'id',
                header: () => <span>No</span>,
                cell: ({ row }) => row.index + 1,
            },
            {
                accessorKey: 'plate',
                header: () => <span>Nomor plat</span>,
                // contoh custom cell
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.original.plat_nomor}
                    </span>
                ),
            },
            {
                id: 'image',
                header: () => <span>Gambar</span>,
                cell: ({ row }) => {
                    const r = row.original
                    const rect = r.detected_region
                    return (
                        <CroppedSupabaseThumb
                            bucket="detected_images"
                            path={r.image} // contoh: '2025/08/26/abc123.jpg'
                            rect={{
                                x_min: rect.x_min,
                                y_min: rect.y_min,
                                x_max: rect.x_max,
                                y_max: rect.y_max,
                            }}
                            outW={64}
                            outH={40}
                            alt={`Plat ${r.plat_nomor}`}
                            className="rounded border border-border"
                            useNextImage // aktifkan jika ingin pakai <Image unoptimized>
                        />
                    )
                },
                enableSorting: false,
                enableColumnFilter: false,
            },
            {
                accessorKey: 'timestamp',
                header: () => <span>Timestamp</span>,
                cell: ({ getValue }) => getValue<string>(),
            },
            {
                accessorKey: 'status',
                header: () => <span>Status</span>,
                cell: ({ getValue }) => getValue<string>(),
            },
            {
                id: 'actions',
                header: () => <span>Aksi</span>,
                cell: ({ row }) => (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(row.original)}
                    >
                        Edit
                    </Button>
                ),
                enableSorting: false,
                enableColumnFilter: false,
            },
        ],
        [handleEdit]
    )

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(), // sorting bawaan client-side
        getFilteredRowModel: getFilteredRowModel(), // global/column filter
        getPaginationRowModel: getPaginationRowModel(),
    })

    return (
        <>
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <input
                        value={globalFilter ?? ''}
                        onChange={(e) => table.setGlobalFilter(e.target.value)}
                        placeholder="Filter cepat di tabel…"
                        className="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                        <span className="text-sm tabular-nums">
                            Page {table.getState().pagination.pageIndex + 1} /{' '}
                            {table.getPageCount() || 1}
                        </span>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((hg) => (
                                <TableRow key={hg.id}>
                                    {hg.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-1"
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    disabled={
                                                        !header.column.getCanSort()
                                                    }
                                                    title={
                                                        header.column.getCanSort()
                                                            ? 'Sort'
                                                            : ''
                                                    }
                                                >
                                                    {flexRender(
                                                        header.column.columnDef
                                                            .header,
                                                        header.getContext()
                                                    )}
                                                    {{
                                                        asc: '↑',
                                                        desc: '↓',
                                                    }[
                                                        header.column.getIsSorted() as string
                                                    ] ?? null}
                                                </button>
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>

                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="text-center py-10"
                                    >
                                        Tidak ada data.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog
                open={editDialog.open}
                onOpenChange={(open) => {
                    if (!open) handleCloseDialog()
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Nomor Plat</DialogTitle>
                        <DialogDescription>
                            Ubah nomor plat untuk record ID:{' '}
                            {editDialog.record?.id}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="plat-nomor" className="text-right">
                                Nomor Plat
                            </Label>
                            <Input
                                id="plat-nomor"
                                value={editPlatNomor}
                                onChange={(e) =>
                                    setEditPlatNomor(e.target.value)
                                }
                                className="col-span-3"
                                placeholder="Masukkan nomor plat"
                                disabled={isUpdating}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseDialog}
                            disabled={isUpdating}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleUpdatePlatNomor}
                            disabled={isUpdating || !editPlatNomor.trim()}
                        >
                            {isUpdating ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
