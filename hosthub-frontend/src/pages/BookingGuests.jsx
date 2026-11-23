import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import ErrorBanner from '../components/ErrorBanner'
import {
  CheckCircle2,
  Users,
  ShieldCheck,
  CreditCard,
  Plus,
  Trash2,
  Lock,
  ArrowRight,
  Clock
} from 'lucide-react'

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
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* 3-Step Progress Stepper */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="flex items-center justify-center gap-2 text-brand font-semibold">
            <span className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-[10px]">
              ✓
            </span>
            <span>1. Dates & Suite</span>
          </div>

          <div className="flex items-center justify-center gap-2 text-brand font-bold border-b-2 border-brand pb-1">
            <span className="w-5 h-5 rounded-full bg-brand-100 text-brand flex items-center justify-center text-[10px] font-mono">
              2
            </span>
            <span>2. Guest Details</span>
          </div>

          <div className="flex items-center justify-center gap-2 text-zinc-400 font-medium">
            <span className="w-5 h-5 rounded-full bg-stone-100 text-zinc-400 flex items-center justify-center text-[10px] font-mono">
              3
            </span>
            <span>3. Stripe Payment</span>
          </div>
        </div>
      </div>

      {error && <ErrorBanner error={error} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Column: Guest Registration Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-brand font-mono tracking-wider">
                Booking Reference #{bookingId}
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-1">
                Who will be staying?
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                Please enter the names of all guests checking in. Primary guest ID is verified at arrival.
              </p>
            </div>

            <div className="space-y-4">
              {guests.map((g, i) => (
                <div
                  key={i}
                  className="bg-stone-50 border border-zinc-200/80 rounded-2xl p-4 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200/50 pb-2">
                    <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 font-mono">
                      <Users className="w-3.5 h-3.5 text-brand" />
                      Guest {i + 1}
                    </span>
                    {guests.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGuestRow(i)}
                        className="text-zinc-400 hover:text-rose-600 transition-colors text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                        Full Name
                      </label>
                      <input
                        required
                        placeholder="As shown on passport / ID"
                        value={g.name}
                        onChange={(e) => updateGuest(i, 'name', e.target.value)}
                        className="input text-xs"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                        Gender
                      </label>
                      <select
                        value={g.gender}
                        onChange={(e) => updateGuest(i, 'gender', e.target.value)}
                        className="input text-xs cursor-pointer"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required
                        placeholder="Age"
                        value={g.age}
                        onChange={(e) => updateGuest(i, 'age', e.target.value)}
                        className="input text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addGuestRow}
                className="inline-flex items-center gap-2 text-xs font-semibold text-brand hover:text-brand-800 transition-colors py-1"
              >
                <Plus className="w-4 h-4" />
                Add Another Guest
              </button>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-zinc-100 flex flex-wrap items-center gap-3">
              <button
                onClick={saveGuests}
                disabled={savingGuests}
                className={`text-xs px-5 py-2.5 rounded-xl font-medium transition-all ${
                  saved
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'btn-secondary'
                }`}
              >
                {savingGuests ? 'Saving…' : saved ? 'Guests Saved ✓' : 'Save Guest Details'}
              </button>

              <button
                onClick={payNow}
                disabled={payingNow || !saved}
                className="btn-primary text-xs px-6 py-2.5 rounded-xl ml-auto"
              >
                {payingNow ? (
                  'Connecting to Stripe…'
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Proceed to Stripe Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {!saved && (
              <p className="text-[11px] text-zinc-400 text-center font-mono">
                * Please save guest details before continuing to secure Stripe checkout.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Live Booking Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-display text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3">
              Booking Overview
            </h3>

            <div className="space-y-2 text-xs text-zinc-600">
              <div className="flex justify-between">
                <span>Hold Status</span>
                <span className="font-medium text-amber-600 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" /> 15 min lock
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment Protection</span>
                <span className="font-medium text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Stripe Secure
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100">
              <button
                onClick={cancelBooking}
                className="w-full text-xs text-zinc-500 hover:text-rose-600 transition-colors text-center py-1"
              >
                Cancel and release hold
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
