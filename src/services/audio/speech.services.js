
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

let currentAudio = null
let currentAudioUrl = null

function cleanupAudio() {
    if (currentAudio) {
        currentAudio.pause()
        currentAudio.src = ''
        currentAudio = null
    }

    if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl)
        currentAudioUrl = null
    }
}

export async function speakText(text, languageCode = 'en', callbacks = {}) {
    const cleanText = text?.trim()

    if (!cleanText) {
        return {
            success: false,
            message: 'There is no text available to read.',
        }
    }

    try {
        cleanupAudio()

        const response = await fetch(`${API_BASE_URL}/api/audio/speech`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: cleanText,
                languageCode,
            }),
        })

        if (!response.ok) {
            let message = 'Unable to generate speech.'

            try {
                const error = await response.json()
                message = error.message || message
            } catch {
                // Keep the default error message.
            }

            throw new Error(message)
        }

        const audioBlob = await response.blob()

        if (!audioBlob.size) {
            throw new Error('The speech service returned empty audio.')
        }

        currentAudioUrl = URL.createObjectURL(audioBlob)
        currentAudio = new Audio(currentAudioUrl)

        currentAudio.onplay = () => callbacks.onStart?.()
        currentAudio.onended = () => {
            callbacks.onEnd?.()
            cleanupAudio()
        }

        currentAudio.onerror = () => {
            callbacks.onError?.()
            cleanupAudio()
        }

        await currentAudio.play()

        return {
            success: true,
            languageCode,
        }
    } catch (error) {
        cleanupAudio()

        return {
            success: false,
            message: error.message || 'Speech playback failed.',
        }
    }
}

export function pauseSpeech() {
    currentAudio?.pause()
}

export function resumeSpeech() {
    currentAudio?.play().catch((error) => {
        console.error('Audio resume failed:', error)
    })
}

export function stopSpeech() {
    cleanupAudio()
}
