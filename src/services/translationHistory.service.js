
import { getGuestToken } from "./identity/identity.service";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Save one successful translation to MongoDB.
export async function saveTranslationHistory(translation) {
    const token = getGuestToken();

    if (!token) {
        throw new Error("Guest session is unavailable.");
    }

    const response = await fetch(`${API_BASE_URL}/api/translations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(translation),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(
            data.message || "Unable to save translation history."
        );
    }

    return data.data;
}

// Retrieve the current guest's translation history.
export async function getTranslationHistory() {
    const token = getGuestToken();

    if (!token) {
        throw new Error("Guest session is unavailable.");
    }

    const response = await fetch(`${API_BASE_URL}/api/translations`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(
            data.message || "Unable to retrieve translation history."
        );
    }

    return data.data;
}
