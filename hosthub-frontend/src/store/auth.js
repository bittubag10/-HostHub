import { create } from 'zustand'

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

function deriveUser(token) {
  if (!token) return null
  const payload = decodeJwt(token)
  if (!payload) return null
  // Backend's JWTService puts: subject = user id, claim "email", claim "roles" = Set<Roles>.toString()
  // e.g. roles: "[HOTEL_MANAGER]" or "[GUEST, HOTEL_MANAGER]"
  const rolesStr = payload.roles || ''
  return {
    id: payload.sub,
    email: payload.email,
    isHotelManager: rolesStr.includes('HOTEL_MANAGER'),
    exp: payload.exp,
  }
}

export const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: null,
  hydrated: false,

  setAccessToken: (token) => set({ accessToken: token, user: deriveUser(token) }),

  logout: () => set({ accessToken: null, user: null }),

  isAuthenticated: () => !!get().accessToken,
}))
