import { useEffect, useState } from 'react'
import './App.css'

import Welcome from './components/Welcome.jsx'

import {
  createGuestSession,
  restoreGuestSession,
} from './services/identity/identity.service'

import {
  getCachedTranslation,
  saveCachedTranslation,
} from './utils/translationCache'

import {
  speakText,
  pauseSpeech,
  resumeSpeech,
  stopSpeech,
} from './services/audio/speech.services'

import {
  saveTranslationHistory,
  getTranslationHistory,
} from './services/translationHistory.service'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'



const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ig', name: 'Igbo', flag: '🌍' },
  { code: 'yo', name: 'Yoruba', flag: '🌍' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
]

const sourceLanguages = [
  { code: 'auto', name: 'Auto Detect', flag: '🌐' },
  ...languages,
]

const starterText =
  'Thank you for your message. I look forward to speaking with you.'

function App() {

  const [hasEntered, setHasEntered] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isStartingGuest, setIsStartingGuest] = useState(false)
  const [entryError, setEntryError] = useState('')
  
  useEffect(() => {
  let isMounted = true

  async function checkExistingSession() {
    try {
      const isValid = await restoreGuestSession()

      if (isMounted && isValid) {
        setHasEntered(true)
      }
    } finally {
      if (isMounted) {
        setIsCheckingSession(false)
      }
    }
  }

  checkExistingSession()

  return () => {
    isMounted = false
  }
}, [])

  
  const [sourceLanguage, setSourceLanguage] = useState('en')
  const [targetLanguage, setTargetLanguage] = useState('fr')
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('leo-theme')

    return savedTheme === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
  localStorage.setItem('leo-theme', theme)
}, [theme])

  useEffect(() => {
    if (!hasEntered) return

    let isMounted = true

    async function loadHistory() {
      setIsLoadingHistory(true)

      try {
        const history = await getTranslationHistory()

        if (isMounted) {
          setTranslationHistory(history)
        }
      } catch (error) {
        console.error('LEO history retrieval error:', error)
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false)
        }
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [hasEntered])

  
  const [activePage, setActivePage] = useState('translate')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [savedPhrases, setSavedPhrases] = useState([])
  const [translationHistory, setTranslationHistory] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [notice, setNotice] = useState('')
  const [isCopying, setIsCopying] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [speechStatus, setSpeechStatus] = useState('idle')
  const [speakingTarget, setSpeakingTarget] = useState('')

  const source = languages.find(
    (language) => language.code === sourceLanguage,
  )
  const target = languages.find(
    (language) => language.code === targetLanguage,
  )

  function showNotice(message) {
    setNotice(message)
  }

  async function persistTranslationHistory(
    source,
    translation,
    fromLanguage,
    toLanguage,
    detectedLanguage = null,
  ) {
    try {
      const saved = await saveTranslationHistory({
        sourceText: source,
        translatedText: translation,
        sourceLanguage: fromLanguage,
        targetLanguage: toLanguage,
        detectedSourceLanguage: detectedLanguage,
      })

      setTranslationHistory((current) => [
        saved,
        ...current,
      ])
    } catch (error) {
      // History failure must never interrupt translation.
      console.error('LEO history save error:', error)
    }
  }



  async function handleListen(text, languageCode, target) {
    if (!text?.trim()) {
      showNotice('There is no text available to read.')
      return
    }

    if (languageCode === 'auto') {
      showNotice('Select the source language before playing its audio.')
      return
    }

    stopSpeech()
    setSpeechStatus('loading')
    setSpeakingTarget(target)

    showNotice('Generating high-quality speech...')

    try {
      const result = await speakText(text, languageCode, {
        onStart: () => {
          setSpeechStatus('speaking')
          setSpeakingTarget(target)
          showNotice('')
        },
        onEnd: () => {
          setSpeechStatus('idle')
          setSpeakingTarget('')
        },
        onError: (error) => {
          setSpeechStatus('idle')
          setSpeakingTarget('')
          showNotice(
            error?.message || 'Speech playback encountered an error.'
          )
        },
      })

      if (!result.success) {
        setSpeechStatus('idle')
        setSpeakingTarget('')
        showNotice(result.message || 'Speech generation failed.')
      }
    } catch (error) {
      setSpeechStatus('idle')
      setSpeakingTarget('')
      showNotice(error.message || 'Speech playback failed.')
    }
  }


  function handlePauseSpeech() {
    pauseSpeech()
    setSpeechStatus('paused')
  }

  function handleResumeSpeech() {
    resumeSpeech()
    setSpeechStatus('speaking')
  }

  function handleStopSpeech() {
    stopSpeech()
    setSpeechStatus('idle')
    setSpeakingTarget('')
  }

  function handleSourceChange(value) {
    setSourceText(value)
    setTranslatedText('')
    setNotice('')
  }

  async function handleTranslate() {
    const cleanText = sourceText.trim()

    if (!cleanText) {
      showNotice('Enter a message before translating.')
      return
    }

    if (isTranslating) return

    setIsTranslating(true)
    setTranslatedText('')
    showNotice('Checking translation cache...')

    try {
      // 1. Check browser cache first
      const cachedData = await getCachedTranslation(
        cleanText,
        sourceLanguage,
        targetLanguage,
      )

      if (cachedData) {
        setTranslatedText(cachedData.translation)

        void persistTranslationHistory(
          cleanText,
          cachedData.translation,
          sourceLanguage,
          targetLanguage,
        )

        showNotice('Translation retrieved instantly from your cache.')

        return
      }

      // 2. Cache miss: request translation from backend
      showNotice('Translating your message...')

      const response = await fetch(
        `${API_BASE_URL}/api/translate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: cleanText,
            sourceLanguage,
            targetLanguage,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Translation failed. Please try again.',
        )
      }

      // 3. Display translation
      setTranslatedText(data.translation)

      // Save successful translation to MongoDB history.
      void persistTranslationHistory(
        cleanText,
        data.translation,
        sourceLanguage,
        targetLanguage,
        data.detectedSourceLanguage || null,
      )

      // 4. Save successful translation in browser
      await saveCachedTranslation(
        cleanText,
        sourceLanguage,
        targetLanguage,
        {
          translation: data.translation,
          model: data.model,
          fallbackUsed: data.fallbackUsed,
        },
      )

      if (data.fallbackUsed) {
        showNotice(
          `Translation successful using backup model: ${data.model}.`,
        )
      } else {
        showNotice('Translation completed successfully.')
      }

    } catch (error) {
      console.error('LEO translation error:', error)

      showNotice(
        error.message ||
        'Unable to reach LEO. Check your internet connection and try again.',
      )
      } finally {
      setIsTranslating(false)
    }
  }

  function handleClear() {
    setSourceText('')
    setTranslatedText('')
    setNotice('')
  }

  function handleSample() {
    handleSourceChange(starterText)
    showNotice('Sample message added.')
  }

  function handleSwapLanguages() {
    if (sourceLanguage === 'auto') return

    setSourceLanguage(targetLanguage)
    setTargetLanguage(sourceLanguage)
    setSourceText(translatedText || sourceText)
    setTranslatedText('')
    setNotice('Languages swapped.')
  }

  async function handleCopy() {
    if (!translatedText) {
      showNotice('There is no translation to copy yet.')
      return
    }

    try {
      await navigator.clipboard.writeText(translatedText)
      setIsCopying(true)
      showNotice('Translation copied to clipboard.')
      window.setTimeout(() => setIsCopying(false), 1200)
    } catch {
      showNotice('Clipboard access failed. Please copy the text manually.')
    }
  }

  function handleSavePhrase() {
    const phrase = sourceText.trim()

    if (!phrase) {
      showNotice('Enter a phrase before saving it.')
      return
    }

    const alreadySaved = savedPhrases.some(
      (item) =>
        item.text === phrase &&
        item.sourceLanguage === sourceLanguage &&
        item.targetLanguage === targetLanguage,
    )

    if (alreadySaved) {
      showNotice('This phrase is already in your saved vocabulary.')
      return
    }

    setSavedPhrases((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length}`,
        text: phrase,
        sourceLanguage,
        targetLanguage,
      },
    ])

    showNotice('Phrase saved to your vocabulary.')
  }

  function handleRemovePhrase(id) {
    setSavedPhrases((current) =>
      current.filter((phrase) => phrase.id !== id),
    )
    showNotice('Phrase removed.')
  }

  function openPage(page) {
    setActivePage(page)
    setNotice('')
    setSidebarOpen(false)
}

function handleOpenHistory(item) {
  setSourceText(item.sourceText)
  setTranslatedText(item.translatedText)
  setSourceLanguage(item.sourceLanguage)
  setTargetLanguage(item.targetLanguage)

  setActivePage('translate')
  setNotice('Previous translation restored.')
  setSidebarOpen(false)
  }
  
  async function handleContinueAsGuest() {
    if (isStartingGuest) return

    setIsStartingGuest(true)
    setEntryError('')

    try {
      await createGuestSession()
      setHasEntered(true)
    } catch (error) {
      console.error('LEO guest entry error:', error)

      setEntryError(
        error.message ||
        'Unable to enter LEO. Please check your connection and try again.'
      )
    } finally {
      setIsStartingGuest(false)
    }
  }

  function handleSignIn() {
    setEntryError('Account sign-in is coming soon. You can use LEO as a guest right now.')
  }

  // Wait until we know whether a guest session already exists.
  if (isCheckingSession) {
    return (
      <div className="leo-session-loading">
        <div className="leo-loading-spinner" />
        <span>Preparing your LEO workspace...</span>
      </div>
    )
  }

  // Only show the welcome page when there is no valid session.
  if (!hasEntered) {
    return (
      <Welcome
        onContinueAsGuest={handleContinueAsGuest}
        onSignIn={handleSignIn}
        isStartingGuest={isStartingGuest}
        isCheckingSession={isCheckingSession}
        error={entryError}
      />
    )
  }
  return (
    <div className={`app-shell theme-${theme}`}>
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <button
          className="brand"
          onClick={() => {
            openPage('translate')
            setSidebarOpen(false)
          }}
          aria-label="LEO home"
        >
          <span className="brand-mark" aria-hidden="true">
            L
          </span>
          <span className="brand-name">leo<span>.</span></span>
        </button>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="side-nav" aria-label="Main navigation">
          <button
            className={`nav-item ${activePage === 'translate' ? 'active' : ''}`}
            onClick={() => openPage('translate')}
          >
            <span className="nav-icon" aria-hidden="true">⇄</span>
            <span>Translate</span>
            <span className="nav-indicator" />
          </button>

          <button
            className={`nav-item ${activePage === 'vocabulary' ? 'active' : ''}`}
            onClick={() => openPage('vocabulary')}
          >
            <span className="nav-icon" aria-hidden="true">▤</span>
            <span>My vocabulary</span>
            <span className="nav-count">{savedPhrases.length}</span>
          </button>
          <button
            className={`nav-item ${activePage === 'history' ? 'active' : ''}`}
            onClick={() => openPage('history')}
          >
            <span className="nav-icon" aria-hidden="true">◷</span>
            <span>Translation history</span>
            <span className="nav-count">{translationHistory.length}</span>
          </button>

        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-tip">
          <span className="tip-icon" aria-hidden="true">✦</span>
          <h3>Every word opens a door.</h3>
          <p>Build your confidence, one conversation at a time.</p>
        </div>

        <div className="sidebar-footer">
          <span className="footer-avatar">L</span>
          <div className="footer-user">
            <strong>Language learner</strong>
            <span>Your personal workspace</span>
          </div>
          <span className="footer-menu" aria-hidden="true">•••</span>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      <div className="main-column">
        <header className="topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setSidebarOpen((current) => !current)}
            aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <strong>
              {activePage === 'translate'
                ? 'Translate'
                : activePage === 'history'
                  ? 'Translation history'
                  : 'My vocabulary'}
            </strong>
          </div>

          <div className="topbar-actions">
            <span className="service-status">
              <span className="status-dot" />
              SET YOUR MODE!
            </span>

            <button
              className="theme-toggle"
              onClick={() =>
                setTheme((current) =>
                  current === 'light' ? 'dark' : 'light',
                )
              }
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
            </button>
          </div>
        </header>

        <main className="page-content">
          {activePage === 'translate' ? (
            <>
              <section className="welcome-section">
                <div className="eyebrow">
                  <span className="eyebrow-sparkle">✦</span>
                  YOUR LANGUAGE COMPANION
                </div>

                <h1>
                  Find the right words.
                  <br />
                  <span>Connect with the world.</span>
                </h1>

                <p className="welcome-description">
                  Translate messages and build your language skills
                  in one calm, focused workspace.
                </p>
              </section>

              <section className="translation-section" aria-label="Translation workspace">
                <div className="section-heading">
                  <div>
                    <h2>Translation workspace</h2>
                    <p>Choose your languages and enter a message.</p>
                  </div>
                  <span className="character-limit">4,000 character limit</span>
                </div>

                <div className="translation-grid">
                  <article className="translation-card">
                    <div className="card-header">
                      <div className="language-label">
                        <span className="language-icon">{source.flag}</span>
                        <div>
                          <span className="field-label">TRANSLATE FROM</span>
                          <select
                            aria-label="Source language"
                            value={sourceLanguage}
                            onChange={(event) => {
                              setSourceLanguage(event.target.value)
                              setTranslatedText('')
                            }}
                          >
                            {sourceLanguages.map((language) => (
                              <option key={language.code} value={language.code}>
                                {language.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button className="text-button" onClick={handleClear}>
                        Clear
                      </button>
                    </div>

                    <textarea
                      className="source-input"
                      dir={sourceLanguage === 'ar' ? 'rtl' : 'auto'}
                      value={sourceText}
                      maxLength={4000}
                      onChange={(event) =>
                        handleSourceChange(event.target.value)
                      }
                      placeholder="Type or paste your message here..."
                      aria-label="Message to translate"
                    />

                    <div className="card-footer">
                      <span className="character-count">
                        {sourceText.length.toLocaleString()} / 4,000
                      </span>

                      <div className="footer-controls">
                        <button
                          className="copy-button"
                          onClick={() =>
                            handleListen(sourceText, sourceLanguage, 'source')
                          }
                          disabled={!sourceText.trim()}
                        >
                          {speakingTarget === 'source' && speechStatus === 'loading'
                            ? 'Generating...'
                            : 'Listen'}
                        </button>

                        <button className="sample-button" onClick={handleSample}>
                          <span aria-hidden="true">✧</span> Try an example
                        </button>
                      </div>
                    </div>
                  </article>

                  <div className="swap-column">
                    <button
                      className="swap-button"
                      onClick={handleSwapLanguages}
                      disabled={sourceLanguage === 'auto'}
                      title="Swap languages"
                      aria-label="Swap languages"
                    >
                      ⇄
                    </button>
                  </div>

                  <article className="output-card translation-card">
                    <div className="card-header">
                      <div className="language-label">
                        <span className="language-icon">{target.flag}</span>
                        <div>
                          <span className="field-label">TRANSLATE TO</span>
                          <select
                            aria-label="Target language"
                            value={targetLanguage}
                            onChange={(event) => {
                              setTargetLanguage(event.target.value)
                              setTranslatedText('')
                            }}
                          >
                            {languages.map((language) => (
                              <option key={language.code} value={language.code}>
                                {language.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <span className="output-ready">
                        <span className="ready-dot" />
                        Output
                      </span>
                    </div>

                    <div
                      className={`output-content ${translatedText ? 'has-output' : ''}`}
                      dir={targetLanguage === 'ar' ? 'rtl' : 'auto'}
                      aria-live="polite"
                    >
                      {translatedText || (
                        <div className="empty-output">
                          <span className="empty-output-icon" aria-hidden="true">
                            ✧
                          </span>
                          <strong>Your translation will appear here</strong>
                          <p>
                            Your translated message will be displayed in this
                            space once a translation service is connected.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="card-footer output-footer">
                      <span>{target.name} output</span>

                      <div className="footer-controls">
                        <button
                          className="copy-button"
                          onClick={() =>
                            handleListen(translatedText, targetLanguage, 'translation')
                          }
                          disabled={!translatedText}
                        >
                          {speakingTarget === 'translation' && speechStatus === 'loading'
                            ? 'Generating...'
                            : 'Listen'}
                        </button>

                        <button
                          className="copy-button"
                          onClick={handleCopy}
                          disabled={!translatedText}
                        >
                          <span aria-hidden="true">{isCopying ? '✓' : '▢'}</span>
                          {isCopying ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </article>
                </div>

                {(speechStatus === 'speaking' || speechStatus === 'paused') && (
                  <div className="translation-actions">
                    {speechStatus === 'speaking' ? (
                      <button
                        className="secondary-button"
                        onClick={handlePauseSpeech}
                      >
                        ⏸ Pause
                      </button>
                    ) : (
                      <button
                        className="secondary-button"
                        onClick={handleResumeSpeech}
                      >
                        ▶ Resume
                      </button>
                    )}

                    <button
                      className="secondary-button"
                      onClick={handleStopSpeech}
                    >
                      ■ Stop
                    </button>
                  </div>
                )}

                <div className="translation-actions">
                  <button
                    className="primary-button"
                    onClick={handleTranslate}
                    disabled={isTranslating}
                  >
                    <span aria-hidden="true">✦</span>
                    {isTranslating ? 'Translating...' : 'Translate message'}
                    {!isTranslating && (
                      <span className="button-arrow" aria-hidden="true">→</span>
                    )}
                  </button>

                  <button className="secondary-button" onClick={handleSavePhrase}>
                    <span aria-hidden="true">＋</span>
                    Save phrase
                  </button>
                </div>

                {notice && (
                  <div className="notice" role="status">
                    <span aria-hidden="true">ⓘ</span>
                    <p>{notice}</p>
                    <button
                      onClick={() => setNotice('')}
                      aria-label="Dismiss message"
                    >
                      ×
                    </button>
                  </div>
                )}
              </section>

              <section className="benefits-section">
                <div className="section-heading">
                  <div>
                    <h2>More than translation</h2>
                    <p>Tools to help you communicate with confidence.</p>
                  </div>
                </div>

                <div className="benefit-grid">
                  <article className="benefit-card">
                    <span className="benefit-icon purple">✦</span>
                    <h3>Meaning comes first</h3>
                    <p>
                      LEO is designed to help you focus on what you want
                      to say, not just individual words.
                    </p>
                  </article>

                  <article className="benefit-card">
                    <span className="benefit-icon blue">▤</span>
                    <h3>Build your vocabulary</h3>
                    <p>
                      Save useful phrases in your personal list and
                      revisit them as you learn.
                    </p>
                  </article>

                  <article className="benefit-card">
                    <span className="benefit-icon orange">↗</span>
                    <h3>Learn at your pace</h3>
                    <p>
                      Create a personal collection of messages and
                      expressions worth remembering.
                    </p>
                  </article>
                </div>
              </section>
            </>
          ) : activePage === 'history' ? (
            <section className="vocabulary-page">
              <div className="eyebrow">
                <span className="eyebrow-sparkle">✦</span>
                YOUR PREVIOUS TRANSLATIONS
              </div>

              <h1>Translation history<span>.</span></h1>

              <p className="welcome-description">
                Revisit messages you have translated in your LEO workspace.
              </p>

              <div className="vocabulary-heading">
                <div>
                  <h2>Recent translations</h2>
                  <p>{translationHistory.length} saved translations</p>
                </div>

                <button
                  className="secondary-button"
                  onClick={() => openPage('translate')}
                >
                  + New translation
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="vocabulary-empty">
                  <p>Loading your translation history...</p>
                </div>
              ) : translationHistory.length === 0 ? (
                <div className="vocabulary-empty">
                  <span className="empty-output-icon">◷</span>
                  <h3>No translation history yet</h3>
                  <p>
                    Your successful translations will appear here
                    so you can revisit them whenever you need.
                  </p>

                  <button
                    className="primary-button"
                    onClick={() => openPage('translate')}
                  >
                    Start translating →
                  </button>
                </div>
              ) : (
                <div className="saved-list">
                  {translationHistory.map((item) => {
                    const from = sourceLanguages.find(
                      (language) => language.code === item.sourceLanguage
                    )

                    const to = languages.find(
                      (language) => language.code === item.targetLanguage
                    )

                    return (
                      <article
                        className="saved-phrase"
                        key={item._id}
                      >
                        <div className="saved-phrase-main">
                          <p>{item.sourceText}</p>

                          <span>
                            {from?.name || item.sourceLanguage}
                            {' → '}
                            {to?.name || item.targetLanguage}
                          </span>

                          <p>{item.translatedText}</p>

                          <span>
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleString()
                              : 'Previously translated'}
                          </span>
                        </div>

                        <button
                          className="remove-button text-button"
                          onClick={() => handleOpenHistory(item)}
                        >
                          Open
                        </button>
                      </article>
                    )
                  })}
                </div>
              )}

              {notice && (
                <div className="notice" role="status">
                  <span aria-hidden="true">ⓘ</span>
                  <p>{notice}</p>
                  <button
                    onClick={() => setNotice('')}
                    aria-label="Dismiss message"
                  >
                    ×
                  </button>
                </div>
              )}
            </section>
          ) : (
            <section className="vocabulary-page">
              <div className="eyebrow">
                <span className="eyebrow-sparkle">✦</span>
                YOUR PERSONAL COLLECTION
              </div>

              <h1>My vocabulary<span>.</span></h1>
              <p className="welcome-description">
                Keep the phrases you want to remember close at hand.
              </p>

              <div className="vocabulary-heading">
                <div>
                  <h2>Saved phrases</h2>
                  <p>{savedPhrases.length} saved in this session</p>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => openPage('translate')}
                >
                  + Add a phrase
                </button>
              </div>

              {savedPhrases.length === 0 ? (
                <div className="vocabulary-empty">
                  <span className="empty-output-icon">▤</span>
                  <h3>Your vocabulary starts here</h3>
                  <p>
                    Return to Translate and select Save phrase to collect
                    words and messages you want to remember.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => openPage('translate')}
                  >
                    Go to translation <span aria-hidden="true">→</span>
                  </button>
                </div>
              ) : (
                <div className="saved-list">
                  {savedPhrases.map((phrase) => {
                    const from = languages.find(
                      (language) => language.code === phrase.sourceLanguage,
                    )
                    const to = languages.find(
                      (language) => language.code === phrase.targetLanguage,
                    )

                    return (
                      <article className="saved-phrase" key={phrase.id}>
                        <div className="saved-phrase-main">
                          <p>{phrase.text}</p>
                          <span>
                            {from.name} → {to.name}
                          </span>
                        </div>
                        <button
                          className="remove-button text-button"
                          onClick={() => handleRemovePhrase(phrase.id)}
                        >
                          Remove
                        </button>
                      </article>
                    )
                  })}
                </div>
              )}

              {notice && (
                <div className="notice" role="status">
                  <span aria-hidden="true">ⓘ</span>
                  <p>{notice}</p>
                  <button
                    onClick={() => setNotice('')}
                    aria-label="Dismiss message"
                  >
                    ×
                  </button>
                </div>
              )}
            </section>
          )}

          <footer className="page-footer">
            <span><strong>leo.</strong> Language without limits.</span>
            <span>Built for better conversations <span aria-hidden="true">✦</span></span>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default App
