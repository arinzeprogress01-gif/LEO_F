const languageLocales = {
    en: 'en-US',
    fr: 'fr-FR',
    es: 'es-ES',
    de: 'de-DE',
    pt: 'pt-PT',
    ig: 'ig-NG',
    yo: 'yo-NG',
    ar: 'ar-SA',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ko: 'ko-KR',
    it: 'it-IT',
    hi: 'hi-IN',
}

export function getSpeechLocale(languageCode) {
    return languageLocales[languageCode] || null
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

    const locale = getSpeechLocale(languageCode)

    if (!locale) return []

    const voices = window.speechSynthesis.getVoices()

    return voices.filter((voice) =>
        voice.lang.toLowerCase().replace('_', '-') 
            .startsWith(locale.toLowerCase().split('-')[0])
    )
}

function getBestVoice(languageCode) {
    if (!isSpeechSupported()) return null

    const locale = getSpeechLocale(languageCode)

    if (!locale) return null

    const voices = window.speechSynthesis.getVoices()

    // Prefer an exact locale match.
    const exactMatch = voices.find(
        (voice) => voice.lang.toLowerCase() === locale.toLowerCase()
    )

    if (exactMatch) return exactMatch

    // Otherwise use a voice matching the language.
    const languageMatch = voices.find(
        (voice) =>
            voice.lang.toLowerCase().split('-')[0] === languageCode.toLowerCase()
    )

    return languageMatch || null
}

export function speakText(text, languageCode = 'en', callbacks = {}) {
    if (!isSpeechSupported()) {
        return {
            success: false,
            message: 'Speech playback is not supported in this browser.',
        }
    }

    const cleanText = text?.trim()

    if (!cleanText) {
        return {
            success: false,
            message: 'There is no text to read.',
        }
    }

    const locale = getSpeechLocale(languageCode)

    if (!locale) {
        return {
            success: false,
            message: 'This language is not configured for speech playback.',
        }
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(cleanText)

    utterance.lang = locale
    utterance.rate = 0.95
    utterance.pitch = 1

    const voice = getBestVoice(languageCode)

    if (voice) {
        utterance.voice = voice
    }

    utterance.onstart = () => callbacks.onStart?.()
    utterance.onend = () => callbacks.onEnd?.()
    utterance.onerror = (event) => callbacks.onError?.(event)

    window.speechSynthesis.speak(utterance)

    return {
        success: true,
        voiceAvailable: Boolean(voice),
        locale,
    }
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