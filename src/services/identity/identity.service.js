
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const GUEST_TOKEN_KEY = 'leo-guest-token'

// Create a guest identity and save its token.
export async function createGuestSession() {
    const response = await fetch(
        `${API_BASE_URL}/api/identity/guest`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    )

    const result = await response.json()

    if (!response.ok || !result.success || !result.data?.token) {
        throw new Error(
            result.message || 'Unable to create your guest identity.'
        )
    }

    localStorage.setItem(GUEST_TOKEN_KEY, result.data.token)

    return result.data
}

// Restore an existing guest session when LEO is reopened.
export async function restoreGuestSession() {
    const token = localStorage.getItem(GUEST_TOKEN_KEY)

    if (!token) {
        return false
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/identity/guest/me`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )

        if (!response.ok) {
            throw new Error('Guest session is no longer valid.')
        }

        const result = await response.json()

        if (!result.success) {
            throw new Error('Unable to restore guest session.')
        }

        return true

    } catch (error) {
        console.warn('Guest session restoration failed:', error.message)

        localStorage.removeItem(GUEST_TOKEN_KEY)

        return false
    }
}

// Retrieve the saved token for future protected API requests.
export function getGuestToken() {
    return localStorage.getItem(GUEST_TOKEN_KEY)
}

// Clear the local guest session.
export function clearGuestSession() {
    localStorage.removeItem(GUEST_TOKEN_KEY)
}
