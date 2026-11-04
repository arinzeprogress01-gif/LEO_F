
const languageLocales = {
    en: 'en-US',
    fr: 'fr-FR',
    es: 'es-ES',
    de: 'de-DE',
    pt: 'pt-PT',
    ig: 'ig-NG',
    yo: 'yo-NG',
}

export function isSpeechSupported() {
    return (
        typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        'SpeechSynthesisUtterance' in window
    )
}

export function getAvailableVoices(languageCode) {
    if (!isSpeechSupported()) return []

    return window.speechSynthesis
        .getVoices()
        .filter((voice) =>
            voice.lang.toLowerCase().startsWith(languageCode.toLowerCase()),
        )
}

export function speakText(
    text,
    languageCode = 'en',
    callbacks = {},
) {
    if (!isSpeechSupported()) {
        return {
            success: false,
            message: 'Speech playback is not supported in this browser.',
        }
    }

    const cleanText = text?.trim()

    if (!cleanText) {
        return { success: false, message: 'There is no text to read.' }
    }

    const locale = languageLocales[languageCode]

    if (!locale) {
        return {
            success: false,
            message: 'This language is not configured for speech playback.',
        }
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(cleanText)
    const voices = getAvailableVoices(languageCode)

    utterance.lang = locale

    if (voices.length > 0) {
        utterance.voice = voices[0]
    }

    utterance.rate = 0.95
    utterance.pitch = 1

    utterance.onstart = () => callbacks.onStart?.()
    utterance.onend = () => callbacks.onEnd?.()
    utterance.onerror = (event) => callbacks.onError?.(event)

    window.speechSynthesis.speak(utterance)

    return { success: true }
}

export function pauseSpeech() {
    if (isSpeechSupported()) {
        window.speechSynthesis.pause()
    }
}

export function resumeSpeech() {
    if (isSpeechSupported()) {
        window.speechSynthesis.resume()
    }
}

export function stopSpeech() {
    if (isSpeechSupported()) {
        window.speechSynthesis.cancel()
    }
}
