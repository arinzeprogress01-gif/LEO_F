
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

let currentAudio = null
let currentAudioUrl = null

// Keep the latest generated audio available for downloading.
let latestAudioBlob = null
let latestAudioText = ''
let latestAudioLanguage = ''

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

// Generate speech through the existing ElevenLabs backend.
async function requestSpeechAudio(text, languageCode) {
    const cleanText = text?.trim()

    if (!cleanText) {
        throw new Error('There is no text available to read.')
    }

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

    // Retain the generated MP3 for later downloading.
    latestAudioBlob = audioBlob
    latestAudioText = cleanText
    latestAudioLanguage = languageCode

    return audioBlob
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

        const audioBlob = await requestSpeechAudio(cleanText, languageCode)

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

// Generate or reuse the latest audio, then download the MP3.
export async function downloadSpeechAudio(text, languageCode = 'en') {
    const cleanText = text?.trim()

    if (!cleanText) {
        return {
            success: false,
            message: 'There is no text available to download.',
        }
    }

    try {
        let audioBlob = latestAudioBlob

        // Reuse existing audio only when it matches this exact text
        // and language. Otherwise, generate a fresh MP3.
        if (
            !audioBlob ||
            latestAudioText !== cleanText ||
            latestAudioLanguage !== languageCode
        ) {
            audioBlob = await requestSpeechAudio(cleanText, languageCode)
        }

        const downloadUrl = URL.createObjectURL(audioBlob)
        const link = document.createElement('a')

        link.href = downloadUrl
        link.download = `leo-${languageCode}-${Date.now()}.mp3`

        document.body.appendChild(link)
        link.click()
        link.remove()

        URL.revokeObjectURL(downloadUrl)

        return {
            success: true,
        }
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Audio download failed.',
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
