'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiClientError } from '@/lib/api-client';
import {
  assignReservationTable,
  cancelReservation,
  checkInReservation,
  completeReservation,
  confirmReservation,
  createCafeTable,
  createReservation,
  deleteCafeTable,
  getReservationSettings,
  listCafeTables,
  listReservations,
  markNoShow,
  updateCafeTable,
  updateReservationSettings,
  type CafeTable,
  type DayHours,
  type Reservation,
  type ReservationSettings,
} from '@/services/reservations';

const statuses = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked in' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No show' },
] as const;

const weekdayLabels: Array<{ key: string; label: string }> = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const emptyWeeklyHours = (): Record<string, DayHours> =>
  Object.fromEntries(weekdayLabels.map(({ key }) => [key, { open: '08:00', close: '22:00' }]));

function todayISODate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

type NewBookingFormState = {
  fullName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guestCount: number;
  notes: string;
  tableId: string;
  status: 'pending' | 'confirmed';
  notifyGuest: boolean;
};

function emptyNewBookingForm(): NewBookingFormState {
  return {
    fullName: '',
    email: '',
    phone: '',
    date: todayISODate(),
    time: '',
    guestCount: 2,
    notes: '',
    tableId: '',
    status: 'confirmed',
    notifyGuest: true,
  };
}

type TableFormState = {
  code: string;
  name: string;
  capacity: number;
  sortOrder: number;
  isActive: boolean;
};

function emptyTableForm(): TableFormState {
  return {
    code: '',
    name: '',
    capacity: 2,
    sortOrder: 0,
    isActive: true,
  };
}

function nextActions(status: string): Array<'confirm' | 'check_in' | 'complete' | 'cancel' | 'no_show'> {
  switch (status) {
    case 'pending':
      return ['confirm', 'cancel'];
    case 'confirmed':
      return ['check_in', 'cancel', 'no_show'];
    case 'checked_in':
      return ['complete', 'cancel'];
    default:
      return [];
  }
}

function canAssignTable(status: string): boolean {
  return status === 'pending' || status === 'confirmed' || status === 'checked_in';
}

function tableLabel(table: CafeTable): string {
  return `${table.code} · ${table.name} (${table.capacity})`;
}

export function ReservationsManager() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'bookings' | 'tables' | 'settings'>('bookings');
  const [date, setDate] = useState(todayISODate());
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [newBooking, setNewBooking] = useState<NewBookingFormState>(emptyNewBookingForm);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tableForm, setTableForm] = useState<TableFormState>(emptyTableForm);

  const [minGuests, setMinGuests] = useState(1);
  const [maxGuests, setMaxGuests] = useState(10);
  const [minAdvanceMinutes, setMinAdvanceMinutes] = useState(60);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(30);
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState(30);
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [bufferMinutes, setBufferMinutes] = useState(15);
  const [cancelCutoffMinutes, setCancelCutoffMinutes] = useState(120);
  const [timezone, setTimezone] = useState('Asia/Tashkent');
  const [weeklyHours, setWeeklyHours] = useState<Record<string, DayHours>>(emptyWeeklyHours);

  const listQuery = useQuery({
    queryKey: ['admin-reservations', date, status],
    queryFn: () => listReservations({ date: date || undefined, status: status || undefined, limit: 50 }),
    enabled: tab === 'bookings',
  });

  const settingsQuery = useQuery({
    queryKey: ['admin-reservation-settings'],
    queryFn: () => getReservationSettings(),
    enabled: tab === 'settings',
  });

  const tablesQuery = useQuery({
    queryKey: ['admin-cafe-tables'],
    queryFn: () => listCafeTables(),
    enabled: tab === 'bookings' || tab === 'tables',
  });

  useEffect(() => {
    if (!settingsQuery.data || settingsHydrated) {
      return;
    }
    hydrateSettingsForm(settingsQuery.data, {
      setMinGuests,
      setMaxGuests,
      setMinAdvanceMinutes,
      setMaxAdvanceDays,
      setSlotIntervalMinutes,
      setDurationMinutes,
      setBufferMinutes,
      setCancelCutoffMinutes,
      setTimezone,
      setWeeklyHours,
    });
    setSettingsHydrated(true);
  }, [settingsQuery.data, settingsHydrated]);

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: 'confirm' | 'check_in' | 'complete' | 'cancel' | 'no_show';
    }) => {
      switch (action) {
        case 'confirm':
          return confirmReservation(id);
        case 'check_in':
          return checkInReservation(id);
        case 'complete':
          return completeReservation(id);
        case 'cancel':
          return cancelReservation(id, 'Cancelled by admin');
        case 'no_show':
          return markNoShow(id);
      }
    },
    onSuccess: async () => {
      setError(null);
      setMessage('Reservation updated.');
      await queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Action failed.');
    },
  });

  const settingsMutation = useMutation({
    mutationFn: () =>
      updateReservationSettings({
        minGuests,
        maxGuests,
        minAdvanceMinutes,
        maxAdvanceDays,
        slotIntervalMinutes,
        durationMinutes,
        bufferMinutes,
        cancelCutoffMinutes,
        timezone,
        weeklyHours,
      }),
    onSuccess: async () => {
      setError(null);
      setMessage('Reservation settings updated.');
      setSettingsHydrated(false);
      await queryClient.invalidateQueries({ queryKey: ['admin-reservation-settings'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Settings update failed.');
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, tableId }: { id: string; tableId: string }) =>
      assignReservationTable(id, tableId),
    onSuccess: async () => {
      setError(null);
      setMessage('Table assigned.');
      await queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Table assignment failed.');
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createReservation({
        fullName: newBooking.fullName.trim(),
        email: newBooking.email.trim(),
        phone: newBooking.phone.trim(),
        date: newBooking.date,
        time: newBooking.time,
        guestCount: newBooking.guestCount,
        notes: newBooking.notes.trim() || undefined,
        tableId: newBooking.tableId || undefined,
        status: newBooking.status,
        notifyGuest: newBooking.notifyGuest,
      }),
    onSuccess: async (created) => {
      setError(null);
      setMessage(`Booking ${created.reservationNumber} created.`);
      setShowNewBooking(false);
      setNewBooking(emptyNewBookingForm());
      setDate(created.date);
      await queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Unable to create booking.');
    },
  });

  const tableMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: tableForm.name.trim(),
        capacity: tableForm.capacity,
        sortOrder: tableForm.sortOrder,
        isActive: tableForm.isActive,
      };
      if (editingTableId) {
        return updateCafeTable(editingTableId, payload);
      }
      return createCafeTable({
        ...payload,
        code: tableForm.code.trim(),
      });
    },
    onSuccess: async () => {
      setError(null);
      setMessage(editingTableId ? 'Table updated.' : 'Table created.');
      setEditingTableId(null);
      setTableForm(emptyTableForm());
      await queryClient.invalidateQueries({ queryKey: ['admin-cafe-tables'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Unable to save table.');
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: (id: string) => deleteCafeTable(id),
    onSuccess: async () => {
      setError(null);
      setMessage('Table deleted.');
      if (editingTableId) {
        setEditingTableId(null);
        setTableForm(emptyTableForm());
      }
      await queryClient.invalidateQueries({ queryKey: ['admin-cafe-tables'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Unable to delete table.');
    },
  });

  const tables = tablesQuery.data ?? [];
  const activeTables = tables.filter((table) => table.isActive);
  const pending =
    actionMutation.isPending ||
    assignMutation.isPending ||
    createMutation.isPending ||
    tableMutation.isPending ||
    deleteTableMutation.isPending;
  const suitableNewBookingTables = activeTables.filter(
    (table) => table.capacity >= newBooking.guestCount,
  );

  return (
    <div>
      <PageHeader
        title="Reservations"
        description="Review bookings, manage cafe tables, and configure booking rules."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ['bookings', 'Bookings'],
            ['tables', 'Tables'],
            ['settings', 'Settings'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              setError(null);
              setMessage(null);
              if (value === 'settings') {
                setSettingsHydrated(false);
              }
            }}
            className={`rounded-[12px] px-4 py-2 text-sm ${
              tab === value
                ? 'bg-primary text-white'
                : 'border border-border bg-surface text-text hover:bg-surface-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message ? (
        <p className="mb-4 rounded-[12px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {tab === 'bookings' ? (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-text-secondary">Date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-[12px] border border-border bg-surface px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-text-secondary">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="rounded-[12px] border border-border bg-surface px-3 py-2"
              >
                {statuses.map((item) => (
                  <option key={item.value || 'all'} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setShowNewBooking((open) => !open);
                setError(null);
                if (!showNewBooking) {
                  setNewBooking(emptyNewBookingForm());
                }
              }}
              className="rounded-[12px] bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover"
            >
              {showNewBooking ? 'Close form' : 'New booking'}
            </button>
          </div>

          {showNewBooking ? (
            <form
              className="mb-6 grid max-w-3xl gap-4 rounded-[16px] border border-border bg-surface p-4"
              onSubmit={(event) => {
                event.preventDefault();
                createMutation.mutate();
              }}
            >
              <p className="text-sm font-medium text-text">New booking</p>
              <p className="text-xs text-text-muted">
                Walk-in or phone reservation. Min-advance is skipped so “now” is allowed.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-text-secondary">Full name</span>
                  <input
                    required
                    value={newBooking.fullName}
                    onChange={(event) =>
                      setNewBooking((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-text-secondary">Email</span>
                  <input
                    type="email"
                    required
                    value={newBooking.email}
                    onChange={(event) =>
                      setNewBooking((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-text-secondary">Phone</span>
                  <input
                    required
                    value={newBooking.phone}
                    onChange={(event) =>
                      setNewBooking((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-text-secondary">Date</span>
                  <input
                    type="date"
                    required
                    value={newBooking.date}
                    onChange={(event) =>
                      setNewBooking((prev) => ({ ...prev, date: event.target.value }))
                    }
                    className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-text-secondary">Time (HH:MM)</span>
                  <input
                    type="time"
                    required
                    value={newBooking.time}
                    onChange={(event) =>
                      setNewBooking((prev) => ({ ...prev, time: event.target.value }))
                    }
                    className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-text-secondary">Guests</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newBooking.guestCount}
                    onChange={(event) =>
                      setNewBooking((prev) => ({
                        ...prev,
                        guestCount: Number(event.target.value) || 1,
                        tableId: '',
                      }))
                    }
                    className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-text-secondary">Status</span>
                  <select
                    value={newBooking.status}
                    onChange={(event) =>
                      setNewBooking((prev) => ({
                        ...prev,
                        status: event.target.value as 'pending' | 'confirmed',
                      }))
                    }
                    className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-text-secondary">Table (optional)</span>
                  <select
                    value={newBooking.tableId}
                    onChange={(event) =>
                      setNewBooking((prev) => ({ ...prev, tableId: event.target.value }))
                    }
                    className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
                  >
                    <option value="">No table assigned</option>
                    {suitableNewBookingTables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {tableLabel(table)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-text-secondary">Notes</span>
                  <textarea
                    rows={2}
                    value={newBooking.notes}
                    onChange={(event) =>
                      setNewBooking((prev) => ({ ...prev, notes: event.target.value }))
                    }
                    className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={newBooking.notifyGuest}
                    onChange={(event) =>
                      setNewBooking((prev) => ({ ...prev, notifyGuest: event.target.checked }))
                    }
                    className="size-4 rounded border-border"
                  />
                  <span className="text-text-secondary">Email guest</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-[12px] bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-60"
                >
                  {createMutation.isPending ? 'Creating…' : 'Create booking'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewBooking(false);
                    setNewBooking(emptyNewBookingForm());
                  }}
                  className="rounded-[12px] border border-border bg-surface px-4 py-2 text-sm text-text hover:bg-surface-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {listQuery.isLoading ? <p className="text-sm text-text-secondary">Loading reservations…</p> : null}
          {listQuery.isError ? (
            <p className="text-sm text-red-700" role="alert">
              {listQuery.error instanceof ApiClientError
                ? listQuery.error.message
                : 'Unable to load reservations.'}
            </p>
          ) : null}

          {!listQuery.isLoading && (listQuery.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-text-secondary">No reservations match these filters.</p>
          ) : null}

          <div className="space-y-3">
            {(listQuery.data?.items ?? []).map((item) => (
              <ReservationRow
                key={item.id}
                reservation={item}
                tables={tables}
                pending={pending}
                onAction={(action) => actionMutation.mutate({ id: item.id, action })}
                onAssign={(tableId) => assignMutation.mutate({ id: item.id, tableId })}
              />
            ))}
          </div>
        </>
      ) : null}

      {tab === 'tables' ? (
        <div className="space-y-6">
          <form
            className="grid max-w-3xl gap-4 rounded-[16px] border border-border bg-surface p-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              tableMutation.mutate();
            }}
          >
            <p className="text-sm font-medium text-text md:col-span-2">
              {editingTableId ? 'Edit table' : 'Create table'}
            </p>
            <p className="text-xs text-text-muted md:col-span-2">
              Active tables add to bookable capacity. Deactivate to hide from assignment without deleting.
            </p>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Code</span>
              <input
                required={!editingTableId}
                disabled={Boolean(editingTableId)}
                value={tableForm.code}
                onChange={(event) => setTableForm((prev) => ({ ...prev, code: event.target.value }))}
                placeholder="T6"
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2 disabled:opacity-60"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Name</span>
              <input
                required
                value={tableForm.name}
                onChange={(event) => setTableForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Capacity</span>
              <input
                type="number"
                min={1}
                required
                value={tableForm.capacity}
                onChange={(event) =>
                  setTableForm((prev) => ({ ...prev, capacity: Number(event.target.value) || 1 }))
                }
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Sort order</span>
              <input
                type="number"
                value={tableForm.sortOrder}
                onChange={(event) =>
                  setTableForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 0 }))
                }
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={tableForm.isActive}
                onChange={(event) =>
                  setTableForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
                className="size-4 rounded border-border"
              />
              <span className="text-text-secondary">Active (counts toward capacity & assignment)</span>
            </label>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={tableMutation.isPending}
                className="rounded-[12px] bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {editingTableId
                  ? tableMutation.isPending
                    ? 'Saving…'
                    : 'Save table'
                  : tableMutation.isPending
                    ? 'Creating…'
                    : 'Create table'}
              </button>
              {editingTableId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTableId(null);
                    setTableForm(emptyTableForm());
                  }}
                  className="rounded-[12px] border border-border bg-surface px-4 py-2 text-sm text-text hover:bg-surface-secondary"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>

          {tablesQuery.isLoading ? <p className="text-sm text-text-secondary">Loading tables…</p> : null}
          {tablesQuery.isError ? (
            <p className="text-sm text-red-700" role="alert">
              {tablesQuery.error instanceof ApiClientError
                ? tablesQuery.error.message
                : 'Unable to load tables.'}
            </p>
          ) : null}
          {!tablesQuery.isLoading && tables.length === 0 ? (
            <p className="text-sm text-text-secondary">No cafe tables yet.</p>
          ) : null}

          <div className="space-y-3">
            {tables.map((table) => (
              <article
                key={table.id}
                className="flex flex-col gap-3 rounded-[16px] border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-text">
                    {table.code} · {table.name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    Capacity {table.capacity} · sort {table.sortOrder} ·{' '}
                    {table.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setEditingTableId(table.id);
                      setTableForm({
                        code: table.code,
                        name: table.name,
                        capacity: table.capacity,
                        sortOrder: table.sortOrder,
                        isActive: table.isActive,
                      });
                    }}
                    className="rounded-[12px] border border-border px-3 py-2 text-sm text-text hover:bg-surface-secondary disabled:opacity-60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(`Delete table ${table.code}? This cannot be undone in the UI.`)) {
                        deleteTableMutation.mutate(table.id);
                      }
                    }}
                    className="rounded-[12px] border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'settings' ? (
        <div className="space-y-6">
          {settingsQuery.isLoading ? (
            <p className="text-sm text-text-secondary">Loading settings…</p>
          ) : null}
          {settingsQuery.error ? (
            <p className="text-sm text-red-700" role="alert">
              {settingsQuery.error instanceof ApiClientError
                ? settingsQuery.error.message
                : 'Unable to load settings.'}
            </p>
          ) : null}

          <form
            className="grid max-w-3xl gap-4 rounded-[16px] border border-border bg-surface p-4"
            onSubmit={(event) => {
              event.preventDefault();
              settingsMutation.mutate();
            }}
          >
            <p className="text-sm font-medium text-text">Booking settings</p>
            <p className="text-xs text-text-muted">
              Hours use cafe timezone. Close at 00:00 means midnight after open (overnight service).
            </p>

            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Timezone (IANA)</span>
              <input
                type="text"
                required
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Min guests" min={1} value={minGuests} onChange={setMinGuests} />
              <NumberField label="Max guests" min={1} value={maxGuests} onChange={setMaxGuests} />
              <NumberField
                label="Min advance (minutes)"
                min={0}
                value={minAdvanceMinutes}
                onChange={setMinAdvanceMinutes}
              />
              <NumberField
                label="Max advance (days)"
                min={1}
                value={maxAdvanceDays}
                onChange={setMaxAdvanceDays}
              />
              <NumberField
                label="Slot interval (minutes)"
                min={5}
                value={slotIntervalMinutes}
                onChange={setSlotIntervalMinutes}
              />
              <NumberField
                label="Duration (minutes)"
                min={15}
                value={durationMinutes}
                onChange={setDurationMinutes}
              />
              <NumberField
                label="Buffer (minutes)"
                min={0}
                value={bufferMinutes}
                onChange={setBufferMinutes}
              />
              <NumberField
                label="Cancel cutoff (minutes)"
                min={0}
                value={cancelCutoffMinutes}
                onChange={setCancelCutoffMinutes}
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-text">Weekly hours</p>
              {weekdayLabels.map(({ key, label }) => (
                <div key={key} className="grid grid-cols-[7rem_1fr_1fr] items-end gap-3">
                  <span className="pb-2 text-sm text-text-secondary">{label}</span>
                  <label className="space-y-1 text-sm">
                    <span className="text-text-muted">Open</span>
                    <input
                      type="time"
                      required
                      value={weeklyHours[key]?.open ?? '08:00'}
                      onChange={(event) =>
                        setWeeklyHours((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], open: event.target.value, close: prev[key]?.close ?? '22:00' },
                        }))
                      }
                      className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-text-muted">Close</span>
                    <input
                      type="time"
                      required
                      value={weeklyHours[key]?.close ?? '22:00'}
                      onChange={(event) =>
                        setWeeklyHours((prev) => ({
                          ...prev,
                          [key]: { open: prev[key]?.open ?? '08:00', close: event.target.value },
                        }))
                      }
                      className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
                    />
                  </label>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={settingsMutation.isPending || settingsQuery.isLoading}
              className="w-fit rounded-[12px] bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-60"
            >
              Save settings
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function hydrateSettingsForm(
  data: ReservationSettings,
  setters: {
    setMinGuests: (value: number) => void;
    setMaxGuests: (value: number) => void;
    setMinAdvanceMinutes: (value: number) => void;
    setMaxAdvanceDays: (value: number) => void;
    setSlotIntervalMinutes: (value: number) => void;
    setDurationMinutes: (value: number) => void;
    setBufferMinutes: (value: number) => void;
    setCancelCutoffMinutes: (value: number) => void;
    setTimezone: (value: string) => void;
    setWeeklyHours: (value: Record<string, DayHours>) => void;
  },
) {
  setters.setMinGuests(data.minGuests);
  setters.setMaxGuests(data.maxGuests);
  setters.setMinAdvanceMinutes(data.minAdvanceMinutes);
  setters.setMaxAdvanceDays(data.maxAdvanceDays);
  setters.setSlotIntervalMinutes(data.slotIntervalMinutes);
  setters.setDurationMinutes(data.durationMinutes);
  setters.setBufferMinutes(data.bufferMinutes);
  setters.setCancelCutoffMinutes(data.cancelCutoffMinutes);
  setters.setTimezone(data.timezone);
  setters.setWeeklyHours({ ...emptyWeeklyHours(), ...data.weeklyHours });
}

function NumberField({
  label,
  min,
  value,
  onChange,
}: {
  label: string;
  min: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-text-secondary">{label}</span>
      <input
        type="number"
        min={min}
        required
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || min)}
        className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
      />
    </label>
  );
}

function ReservationRow({
  reservation,
  tables,
  pending,
  onAction,
  onAssign,
}: {
  reservation: Reservation;
  tables: CafeTable[];
  pending: boolean;
  onAction: (action: 'confirm' | 'check_in' | 'complete' | 'cancel' | 'no_show') => void;
  onAssign: (tableId: string) => void;
}) {
  const actions = nextActions(reservation.status);
  const assignable = canAssignTable(reservation.status);
  const currentTable = tables.find((table) => table.id === reservation.tableId);
  const [selectedTableId, setSelectedTableId] = useState(reservation.tableId ?? '');
  const suitableTables = tables.filter(
    (table) => table.isActive && table.capacity >= reservation.guestCount,
  );

  useEffect(() => {
    setSelectedTableId(reservation.tableId ?? '');
  }, [reservation.tableId]);

  return (
    <article className="rounded-[16px] border border-border bg-surface p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-text">
            {reservation.guestFullName}{' '}
            <span className="text-sm font-normal text-text-secondary">
              · {reservation.reservationNumber}
            </span>
          </p>
          <p className="text-sm text-text-secondary">
            {reservation.date} at {reservation.time} · {reservation.guestCount} guests ·{' '}
            <span className="capitalize">{reservation.status.replace('_', ' ')}</span>
          </p>
          <p className="text-sm text-text-muted">
            {reservation.guestEmail} · {reservation.guestPhone}
          </p>
          <p className="text-sm text-text-secondary">
            Table:{' '}
            {currentTable ? tableLabel(currentTable) : reservation.tableId ? 'Assigned' : 'Unassigned'}
          </p>
          {reservation.notes ? (
            <p className="pt-1 text-sm text-text-secondary">{reservation.notes}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          {assignable ? (
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-[12rem] flex-col gap-1 text-sm">
                <span className="text-text-secondary">Assign table</span>
                <select
                  value={selectedTableId}
                  onChange={(event) => setSelectedTableId(event.target.value)}
                  className="rounded-[12px] border border-border bg-background px-3 py-2"
                >
                  <option value="">Select table</option>
                  {suitableTables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {tableLabel(table)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={pending || !selectedTableId || selectedTableId === (reservation.tableId ?? '')}
                onClick={() => onAssign(selectedTableId)}
                className="rounded-[12px] bg-primary px-3 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-60"
              >
                Assign
              </button>
            </div>
          ) : null}

          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={pending}
                  onClick={() => onAction(action)}
                  className="rounded-[12px] border border-border px-3 py-2 text-sm text-text hover:bg-surface-secondary disabled:opacity-60"
                >
                  {actionLabel(action)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function actionLabel(action: 'confirm' | 'check_in' | 'complete' | 'cancel' | 'no_show'): string {
  switch (action) {
    case 'confirm':
      return 'Confirm';
    case 'check_in':
      return 'Check in';
    case 'complete':
      return 'Complete';
    case 'cancel':
      return 'Cancel';
    case 'no_show':
      return 'No show';
  }
}
