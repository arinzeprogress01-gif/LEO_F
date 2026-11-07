
import './Welcome.css'

function Welcome({
    onContinueAsGuest,
    onSignIn,
    isStartingGuest,
    isCheckingSession,
    error
}) {
    return (
        <main className="leo-entry">
            <div className="entry-glow entry-glow-one" />
            <div className="entry-glow entry-glow-two" />

            <header className="entry-header">
                <a className="entry-brand" href="/" aria-label="LEO home">
                    <span className="entry-brand-mark">L</span>
                    <span>leo<span className="brand-period">.</span></span>
                </a>

                <span className="entry-header-label">
                    YOUR PERSONAL LANGUAGE COMPANION
                </span>
            </header>

            <section className="entry-content">
                <div className="entry-hero">
                    <div className="entry-eyebrow">
                        <span>✦</span>
                        LANGUAGE WITHOUT LIMITS
                    </div>

                    <h1>
                        Every language
                        <br />
                        opens a <span>new world.</span>
                    </h1>

                    <p className="entry-description">
                        Meet LEO — your companion for translating messages,
                        understanding new languages, and communicating with confidence.
                    </p>

                    <div className="entry-language-strip" aria-label="Languages">
                        <span>English</span>
                        <span className="language-divider">·</span>
                        <span>Français</span>
                        <span className="language-divider">·</span>
                        <span>Español</span>
                        <span className="language-divider">·</span>
                        <span>Igbo</span>
                        <span className="language-divider">·</span>
                        <span>日本語</span>
                    </div>
                </div>

                <section className="entry-panel">
                    <div className="entry-panel-heading">
                        <span className="entry-panel-icon">✧</span>
                        <div>
                            <h2>Your journey starts here.</h2>
                            <p>Choose how you want to enter LEO.</p>
                        </div>
                    </div>

                    <button
                        className="entry-guest-button"
                        onClick={onContinueAsGuest}
                        disabled={isStartingGuest || isCheckingSession}
                    >
                        <span className="entry-button-icon">↗</span>

                        <span className="entry-button-copy">
                            <strong>
                                {isCheckingSession
                                    ? 'Checking your session...'
                                    : isStartingGuest
                                        ? 'Preparing your workspace...'
                                        : 'Continue as Guest'}
                            </strong>
                            <small>No account needed. Start right away.</small>
                        </span>

                        <span className="entry-button-arrow">→</span>
                    </button>

                    <div className="entry-divider">
                        <span>OR</span>
                    </div>

                    <button
                        className="entry-signin-button"
                        onClick={onSignIn}
                    >
                        <span className="entry-signin-icon">↗</span>
                        <span>
                            <strong>Sign in to LEO</strong>
                            <small>Access your connected account</small>
                        </span>
                        <span className="coming-soon">COMING SOON</span>
                    </button>

                    {error && (
                        <div className="entry-error" role="alert">
                            {error}
                        </div>
                    )}

                    <p className="entry-privacy">
                        <span>♧</span>
                        Your language journey. Your personal space.
                    </p>
                </section>
            </section>

            <footer className="entry-footer">
                <span>© {new Date().getFullYear()} LEO</span>
                <span>Language without limits. <strong>✦</strong></span>
            </footer>
        </main>
    )
}

export default Welcome
