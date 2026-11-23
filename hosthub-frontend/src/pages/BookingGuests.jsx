import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import ErrorBanner from '../components/ErrorBanner'

const emptyGuest = () => ({ name: '', gender: 'MALE', age: '' })

export default function BookingGuests() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [guests, setGuests] = useState([emptyGuest()])
  const [error, setError] = useState(null)
  const [savingGuests, setSavingGuests] = useState(false)
  const [payingNow, setPayingNow] = useState(false)
  const [saved, setSaved] = useState(false)

  const updateGuest = (i, field, value) => {
    const next = [...guests]
    next[i] = { ...next[i], [field]: value }
    setGuests(next)
  }

  const addGuestRow = () => setGuests([...guests, emptyGuest()])
  const removeGuestRow = (i) => setGuests(guests.filter((_, idx) => idx !== i))

  const saveGuests = async () => {
    setError(null)
    setSavingGuests(true)
    try {
      const payload = guests.map((g) => ({ ...g, age: Number(g.age) }))
      await api.post(`/bookings/${bookingId}/addGuests`, payload)
      setSaved(true)
    } catch (err) {
      setError(err)
    } finally {
      setSavingGuests(false)
    }
  }

  const payNow = async () => {
    setError(null)
    setPayingNow(true)
    try {
      const res = await api.post(`/bookings/${bookingId}/payments`)
      window.location.href = res.data.sessionUrl
    } catch (err) {
      setError(err)
      setPayingNow(false)
    }
  }

  const cancelBooking = async () => {
    try {
      await api.post(`/bookings/${bookingId}/cancel`)
      navigate('/my-bookings')
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <p className="text-xs uppercase tracking-[0.3em] text-brass font-mono mb-2">Booking #{bookingId}</p>
      <h1 className="font-display text-3xl text-ivory mb-8">Who's staying?</h1>

      {error && <div className="mb-5"><ErrorBanner error={error} /></div>}

      <div className="space-y-4">
        {guests.map((g, i) => (
          <div key={i} className="bg-surface border border-brass/15 rounded-lg p-4 grid grid-cols-12 gap-3 items-end">
            <div className="col-span-5">
              <label className="text-[10px] uppercase tracking-widest text-muted">Full name</label>
              <input
                required
                value={g.name}
                onChange={(e) => updateGuest(i, 'name', e.target.value)}
                className="mt-1 w-full bg-surface-raised border border-brass/10 rounded-md px-3 py-2 text-ivory focus:outline-none focus:border-brass"
              />
            </div>
            <div className="col-span-3">
              <label className="text-[10px] uppercase tracking-widest text-muted">Gender</label>
              <select
                value={g.gender}
                onChange={(e) => updateGuest(i, 'gender', e.target.value)}
                className="mt-1 w-full bg-surface-raised border border-brass/10 rounded-md px-3 py-2 text-ivory focus:outline-none focus:border-brass"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-muted">Age</label>
              <input
                type="number"
                min={1}
                max={80}
                required
                value={g.age}
                onChange={(e) => updateGuest(i, 'age', e.target.value)}
                className="mt-1 w-full bg-surface-raised border border-brass/10 rounded-md px-3 py-2 text-ivory focus:outline-none focus:border-brass"
              />
            </div>
            <div className="col-span-2">
              {guests.length > 1 && (
                <button type="button" onClick={() => removeGuestRow(i)} className="text-danger text-xs hover:underline">
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}

        <button type="button" onClick={addGuestRow} className="text-brass-light text-sm hover:underline">
          + Add another guest
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mt-8">
        <button
          onClick={saveGuests}
          disabled={savingGuests}
          className="bg-surface-raised border border-brass/30 text-ivory px-5 py-2.5 rounded-md hover:border-brass disabled:opacity-50"
        >
          {savingGuests ? 'Saving…' : saved ? 'Guests saved ✓' : 'Save guests'}
        </button>
        <button
          onClick={payNow}
          disabled={payingNow || !saved}
          className="bg-brass text-ink font-medium px-5 py-2.5 rounded-md hover:bg-brass-light disabled:opacity-50"
        >
          {payingNow ? 'Redirecting to payment…' : 'Proceed to payment'}
        </button>
        <button onClick={cancelBooking} className="text-danger text-sm ml-auto hover:underline">
          Cancel booking
        </button>
      </div>
      {!saved && <p className="text-xs text-muted mt-3">Save guest details before proceeding to payment.</p>}
    </div>
  )
}
