import { useState } from 'react'
import './App.css'

import {
  getCachedTranslation,
  saveCachedTranslation,
} from './utils/translationCache'

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
]

const starterText =
  'Thank you for your message. I look forward to speaking with you.'

function App() {
  const [sourceLanguage, setSourceLanguage] = useState('en')
  const [targetLanguage, setTargetLanguage] = useState('fr')
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [theme, setTheme] = useState('light')
  const [activePage, setActivePage] = useState('translate')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [savedPhrases, setSavedPhrases] = useState([])
  const [notice, setNotice] = useState('')
  const [isCopying, setIsCopying] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)

  const source = languages.find(
    (language) => language.code === sourceLanguage,
  )
  const target = languages.find(
    (language) => language.code === targetLanguage,
  )

  function showNotice(message) {
    setNotice(message)
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
};

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

  return (
    <div className={`app-shell theme-${theme}`}>
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <button
          className="brand"
          oonClick={() => {
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
              {activePage === 'translate' ? 'Translate' : 'My vocabulary'}
            </strong>
          </div>

          <div className="topbar-actions">
            <span className="service-status">
              <span className="status-dot" />
              Translation API not connected
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
                            {languages.map((language) => (
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
                      <button className="sample-button" onClick={handleSample}>
                        <span aria-hidden="true">✧</span> Try an example
                      </button>
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
                      <button
                        className="copy-button"
                        onClick={handleCopy}
                        disabled={!translatedText}
                      >
                        <span aria-hidden="true">{isCopying ? '✓' : '▢'}</span>
                        {isCopying ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </article>
                </div>

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
