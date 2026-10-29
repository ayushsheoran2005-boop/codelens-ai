import { useEffect, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  Activity, AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck,
  Braces, Check, ChevronDown, ChevronRight, CircleHelp, Clock3,
  Code2, Copy, FileCode2, FileSearch, Filter, Github, History, Info,
  LayoutDashboard, LoaderCircle, LockKeyhole, LogOut, Menu, MoreHorizontal, PanelLeftClose,
  Plus, Search, Settings, ShieldAlert, ShieldCheck, SlidersHorizontal, Sparkles,
  Terminal, Trash2, Upload, X, Zap,
} from 'lucide-react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from './auth'
import { analyzeCode, analyzeRepository, listReviews, loadReview, removeReview as deleteReviewFromApi } from './services/api'
import {
  SAMPLE_CODE,
  type Finding, type Review, type Severity,
} from './services/reviews'

function Brand({ compact = false }: { compact?: boolean }) {
  return <Link className={`brand ${compact ? 'brand-compact' : ''}`} to="/" aria-label="CodeLens AI home">
    <span className="brand-mark"><Braces size={19} strokeWidth={2.2} /><i /></span>
    {!compact && <span>CodeLens<span className="brand-ai"> AI</span></span>}
  </Link>
}

function Landing() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  return <div className="landing">
    <header className="site-nav">
      <div className="nav-inner">
        <Brand />
        <button className="icon-btn mobile-menu" aria-label="Toggle navigation" onClick={() => setMobileOpen(!mobileOpen)}><Menu size={19} /></button>
        <nav className={mobileOpen ? 'nav-links open' : 'nav-links'}>
          <a href="#product" onClick={() => setMobileOpen(false)}>Product</a>
          <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#workflow" onClick={() => setMobileOpen(false)}>How it works</a>
          <a href="#footer" onClick={() => setMobileOpen(false)}>Documentation</a>
        </nav>
        <div className="nav-actions">
          <Link className="nav-signin" to="/auth">Sign in</Link>
          <button className="button button-primary button-small" onClick={() => navigate('/review')}>Get started <ArrowRight size={14} /></button>
        </div>
      </div>
    </header>

    <main>
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> AI-POWERED CODE INTELLIGENCE</div>
          <h1>Find bugs before<br />they find <em>production.</em></h1>
          <p>Review code, uncover potential vulnerabilities, and understand every issue with AI-powered analysis built for developers.</p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => navigate('/review')}>Start reviewing code <ArrowRight size={16} /></button>
            <a className="button button-quiet" href="#features">Explore features <ArrowDown size={15} /></a>
          </div>
          <div className="hero-note"><span className="note-rule" /> Built for developers. Designed for better code.</div>
        </div>
        <ReviewPreview />
        <div className="hero-meta"><span><span className="status-dot" /> READY FOR YOUR NEXT REVIEW</span><span>01 — CODE INTELLIGENCE</span></div>
      </section>

      <section className="trust-strip wrap" aria-label="Product principles">
        <span>BUILT FOR THE WAY YOU WORK</span>
        <div><Code2 size={15} /> Clear findings</div><div><ShieldCheck size={15} /> Security-minded</div><div><Terminal size={15} /> Developer-first</div>
      </section>

      <section id="features" className="section wrap">
        <div className="section-heading">
          <div><div className="eyebrow">LESS NOISE. MORE SIGNAL.</div><h2>Code review, with<br /><em>the context you need.</em></h2></div>
          <p>Spend less time parsing warnings and more time making confident changes. Every finding is designed to be understood and acted on.</p>
        </div>
        <div className="features-grid">
          <Feature icon={<FileSearch />} index="01" title="Intelligent code review" text="Surface potential logic errors, code smells, and risky patterns with file and line-level context." />
          <Feature icon={<ShieldAlert />} index="02" title="Security issue detection" text="Identify suspicious patterns with static checks and AI-assisted review—not a wall of noise." />
          <Feature icon={<Sparkles />} index="03" title="Fixes you can inspect" text="Understand why an issue matters, then compare a suggested change before you apply it." />
          <Feature icon={<Github />} index="04" title="Repository-ready workflow" text="Bring your code into one focused workspace. GitHub connection setup is clearly shown when unavailable." />
        </div>
      </section>

      <section id="product" className="product-band">
        <div className="wrap product-layout">
          <div>
            <div className="eyebrow">A BETTER KIND OF CODE REVIEW</div>
            <h2>Find the issue.<br /><em>Understand the why.</em></h2>
            <p>CodeLens puts a useful explanation next to the exact code that needs attention. No mysterious scores. No claims you can’t verify.</p>
            <div className="product-points">
              <span><Check size={15} /> Clear file and line references</span>
              <span><Check size={15} /> Actionable explanations</span>
              <span><Check size={15} /> Readable code comparisons</span>
              <span><Check size={15} /> Focus on practical findings</span>
            </div>
            <button className="text-link" onClick={() => navigate('/review')}>Explore the review workspace <ArrowRight size={15} /></button>
          </div>
          <div className="diff-card">
            <div className="diff-top"><span><FileCode2 size={14} /> user_repository.py</span><span className="diff-chip">SUGGESTED CHANGE</span></div>
            <pre><code><span className="diff-dim"> 8  </span><span className="diff-normal">cursor.execute(</span>{'\n'}<span className="diff-del"> 9  - "SELECT * FROM users WHERE id = " + user_id</span>{'\n'}<span className="diff-add"> 9  + "SELECT id, email FROM users WHERE id = ?",</span>{'\n'}<span className="diff-add">10  + (user_id,)</span>{'\n'}<span className="diff-dim">11  </span><span className="diff-normal">)</span></code></pre>
            <div className="diff-foot"><span><Info size={14} /> Review suggestions before applying</span><span>PYTHON</span></div>
          </div>
        </div>
      </section>

      <section id="workflow" className="section wrap workflow-section">
        <div className="eyebrow">THREE STEPS. ONE CLEARER REVIEW.</div>
        <h2>From code to <em>clarity.</em></h2>
        <div className="steps">
          <Step number="01" title="Submit your code" text="Paste a snippet or provide a supported repository URL." />
          <Step number="02" title="Analyze" text="Static checks and AI review inspect your submitted code." />
          <Step number="03" title="Review & fix" text="Explore findings, understand the risk, and inspect fixes." />
        </div>
      </section>

      <section className="final-cta wrap">
        <div><div className="eyebrow">YOUR NEXT REVIEW STARTS HERE</div><h2>Write better code.<br /><em>Catch issues earlier.</em></h2><p>Bring your code into CodeLens AI and make your next review more useful.</p></div>
        <button className="button button-primary" onClick={() => navigate('/review')}>Start your first review <ArrowRight size={15} /></button>
      </section>
    </main>
    <footer id="footer" className="site-footer">
      <div className="wrap footer-inner"><Brand /><p>Find bugs. Understand code. Ship with confidence.</p><div className="footer-links"><a href="#product">Product</a><a href="#features">Features</a><a href="#footer">GitHub</a><a href="#footer">Documentation</a><a href="#footer">Privacy</a><a href="#footer">Terms</a></div><div className="footer-bottom"><span>© 2026 CodeLens AI</span><span>MADE FOR PEOPLE WHO SHIP CODE</span></div></div>
    </footer>
  </div>
}

function ReviewPreview() {
  return <div className="preview-shell">
    <div className="preview-topbar"><div className="window-dots"><i /><i /><i /></div><div className="preview-breadcrumb"><span>reviews</span><ChevronRight size={12} /><strong>user_repository.py</strong></div><span className="preview-label">PREVIEW</span></div>
    <div className="preview-body">
      <div className="preview-editor">
        <div className="editor-file"><FileCode2 size={13} /> user_repository.py <span>×</span></div>
        <div className="code-lines">
          {[
            ['1', 'import sqlite3'], ['2', ''], ['3', 'def get_user(user_id):'], ['4', '    connection = sqlite3.connect("app.db")'],
            ['5', '    cursor = connection.cursor()'], ['6', ''], ['7', '    # Find the requested account'], ['8', '    query = "SELECT * FROM users WHERE id = " + user_id'],
            ['9', '    cursor.execute(query)'], ['10', '    user = cursor.fetchone()'], ['11', ''], ['12', '    return user'],
          ].map(([n, line]) => <div key={n} className={`code-line ${n === '8' ? 'line-issue' : ''}`}><span className="line-no">{n}</span><code>{line || ' '}</code></div>)}
          <span className="code-highlight"><span className="highlight-marker" /> Potentially unsafe query</span>
        </div>
        <div className="editor-status"><span>PYTHON</span><span>UTF-8</span><span>Ln 8, Col 55</span></div>
      </div>
      <div className="preview-issues">
        <div className="issue-panel-head"><span>FINDINGS</span><span className="issue-count">1 issue</span></div>
        <div className="preview-issue-title"><span className="severity-dot critical" /> <b>Potential SQL injection</b><span>⋯</span></div>
        <div className="preview-location">user_repository.py <span>:</span> 8</div>
        <p>User-controlled input is concatenated directly into a SQL query. Parameterized queries can help prevent injection.</p>
        <div className="fix-label"><Check size={12} /> SUGGESTED FIX</div>
        <pre className="preview-fix"><span>cursor.execute(</span>{'\n'}<b>"SELECT * FROM users</b>{'\n'}<b>WHERE id = ?", (user_id,)</b>{'\n'}<span>)</span></pre>
        <button className="preview-action">View suggested change <ArrowRight size={12} /></button>
      </div>
    </div>
    <div className="preview-footer"><span><span className="status-dot" /> Review ready</span><span><LockKeyhole size={11} /> Your code stays yours</span></div>
  </div>
}

function Feature({ icon, index, title, text }: { icon: React.ReactNode; index: string; title: string; text: string }) {
  return <article className="feature-item"><div className="feature-top"><span className="feature-icon">{icon}</span><span>{index}</span></div><h3>{title}</h3><p>{text}</p><ArrowUpRight className="feature-arrow" size={16} /></article>
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return <article className="step"><span className="step-number">{number}</span><div className="step-connector" /><h3>{title}</h3><p>{text}</p></article>
}

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/review', label: 'New code review', icon: Plus },
  { to: '/history', label: 'Review history', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand"><Brand /><button className="icon-btn collapse-btn" aria-label="Collapse sidebar" onClick={() => setCollapsed(!collapsed)}><PanelLeftClose size={16} /></button><button className="icon-btn close-mobile" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={17} /></button></div>
      <div className="workspace-switch"><span className="workspace-avatar">A</span><span className="workspace-name"><b>Personal workspace</b><small>Free plan</small></span><ChevronDown size={14} /></div>
      <nav className="side-nav" aria-label="Main navigation">
        <div className="side-label">WORKSPACE</div>
        {navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `side-link ${isActive && (to !== '/dashboard' || location.pathname === '/dashboard') ? 'active' : ''}`}><Icon size={16} /><span>{label}</span></NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <button className="side-link help-link" onClick={() => window.open('mailto:hello@codelens.ai')}><CircleHelp size={16} /><span>Help & feedback</span><ArrowUpRight size={13} /></button>
        <div className="profile-row"><span className="profile-avatar">{(user?.email?.slice(0, 2) || 'CL').toUpperCase()}</span><span className="profile-copy"><b>{user?.email || 'Account'}</b><small>Personal account</small></span><button className="icon-btn signout-button" aria-label="Sign out" title="Sign out" onClick={async () => { try { await signOut(); navigate('/') } catch (error) { window.alert(error instanceof Error ? error.message : 'Sign out failed.') } }}><LogOut size={15} /></button></div>
      </div>
    </aside>
    {mobileOpen && <button className="mobile-backdrop" aria-label="Close sidebar" onClick={() => setMobileOpen(false)} />}
    <div className="main-column">
      <header className="app-topbar">
        <button className="icon-btn topbar-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={18} /></button>
        <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={13} /><b>{pageLabel(location.pathname)}</b></div>
        <div className="topbar-actions"><span className="demo-pill"><span /> PRIVATE WORKSPACE</span><button className="icon-btn" aria-label="Search reviews" onClick={() => navigate('/history')}><Search size={16} /></button><button className="icon-btn topbar-help" aria-label="Help" onClick={() => window.open('mailto:hello@codelens.ai')}><CircleHelp size={16} /></button></div>
      </header>
      <main className="app-content">{children}</main>
    </div>
  </div>
}

function pageLabel(path: string) {
  if (path.startsWith('/review')) return 'New code review'
  if (path === '/history') return 'Review history'
  if (path === '/settings') return 'Settings'
  return 'Overview'
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-header-action">{action}</div>}</div>
}

function Dashboard() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('All languages')
  useEffect(() => {
    if (!session?.access_token) return
    let active = true
    listReviews(session.access_token).then((result) => { if (active) setReviews(result) })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Review history could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [session?.access_token])
  const filtered = reviews.filter((review) => review.name.toLowerCase().includes(query.toLowerCase()) && (language === 'All languages' || review.language === language))
  const totalIssues = reviews.reduce((sum, review) => sum + review.issues.length, 0)
  const critical = reviews.reduce((sum, review) => sum + review.issues.filter((issue) => issue.severity === 'critical').length, 0)
  function removeReview(id: string) {
    const token = session?.access_token
    if (!window.confirm('Delete this review from your account history?') || !token) return
    void removeReviewRequest(id, token)
  }
  async function removeReviewRequest(id: string, token: string) {
    try {
      await deleteReviewFromApi(id, token)
      setReviews((current) => current.filter((review) => review.id !== id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This review could not be deleted.')
    }
  }
  return <div className="page">
    <PageHeader eyebrow="PERSONAL WORKSPACE" title="Your Code Workspace" description="A clear view of your code reviews and the issues that matter." action={<button className="button button-primary" onClick={() => navigate('/review')}><Plus size={16} /> New review</button>} />
    <div className="demo-notice"><LockKeyhole size={15} /><span><b>Private workspace</b> — reviews are stored in Supabase and scoped to your signed-in account.</span></div>
    {error && <div className="error-banner"><AlertTriangle size={15} />{error}</div>}
    <div className="metrics-grid">
      <Metric icon={<FileSearch />} label="Total reviews" value={reviews.length.toString()} note="Saved to your account" />
      <Metric icon={<AlertTriangle />} label="Issues found" value={totalIssues.toString()} note="Across saved reviews" />
      <Metric icon={<ShieldAlert />} label="Critical issues" value={critical.toString()} note="Review suggested changes" />
      <Metric icon={<Activity />} label="Recent activity" value={reviews.length ? formatDate(reviews[0].createdAt) : '—'} note={reviews.length ? 'Most recent review' : 'No activity yet'} />
    </div>
    <section className="panel recent-panel">
      <div className="panel-heading"><div><h2>Recent reviews</h2><p>Your latest code analysis sessions</p></div><Link to="/history" className="text-link small-link">View history <ArrowRight size={14} /></Link></div>
      <div className="table-controls"><label className="search-control"><Search size={15} /><input placeholder="Search reviews..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="select-control"><Filter size={14} /><select value={language} onChange={(event) => setLanguage(event.target.value)}><option>All languages</option>{[...new Set(reviews.map((review) => review.language))].map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={13} /></label></div>
      {loading ? <LoadingState text="Loading your private review history…" /> : filtered.length > 0 ? <ReviewTable reviews={filtered.slice(0, 5)} onDelete={removeReview} /> : <EmptyState icon={<FileSearch size={19} />} title={query || language !== 'All languages' ? 'No matching reviews' : 'Your review history starts here'} text={query || language !== 'All languages' ? 'Try adjusting your search or language filter.' : 'Run a code review to see findings and activity in this workspace.'} action={!reviews.length && <button className="button button-secondary button-small" onClick={() => navigate('/review')}><Plus size={14} /> Start a review</button>} />}
    </section>
    <div className="bottom-hint"><LockKeyhole size={13} /> Supabase row-level security scopes stored reviews to your account.</div>
  </div>
}

function LoadingState({ text }: { text: string }) {
  return <div className="loading-findings"><LoaderCircle className="spin" size={20} /><p>{text}</p></div>
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <div className="metric-card"><div className="metric-top">{icon}<span>{label}</span></div><strong>{value}</strong><small>{note}</small></div>
}

function ReviewTable({ reviews, onDelete }: { reviews: Review[]; onDelete?: (id: string) => void }) {
  const navigate = useNavigate()
  return <div className="table-scroll"><table className="reviews-table"><thead><tr><th>REVIEW NAME</th><th>LANGUAGE</th><th>ISSUES</th><th>REVIEW DATE</th><th>STATUS</th><th /></tr></thead><tbody>{reviews.map((review) => <tr key={review.id} onClick={() => navigate(`/review/${review.id}`)} tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && navigate(`/review/${review.id}`)}><td><span className="review-file-icon"><FileCode2 size={15} /></span><b>{review.name}</b></td><td><span className="language-label">{review.language}</span></td><td><IssueCount count={review.issues.length} /></td><td className="muted-cell">{formatDate(review.createdAt)}</td><td><span className={`status-badge ${review.status === 'Complete' ? 'complete' : review.status === 'No issues' ? 'no-issues' : 'failed'}`}><span />{review.status}</span></td><td><button className="icon-btn row-action" aria-label={`Delete ${review.name}`} onClick={(event) => { event.stopPropagation(); if (onDelete) onDelete(review.id); else navigate(`/review/${review.id}`) }}><MoreHorizontal size={16} /></button></td></tr>)}</tbody></table></div>
}

function IssueCount({ count }: { count: number }) {
  return <span className="issue-count-cell">{count ? <><span className="tiny-severity" />{count}</> : <span className="muted-cell">0</span>}</span>
}

function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{text}</p>{action}</div>
}

function ReviewWorkspace() {
  const params = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [code, setCode] = useState(SAMPLE_CODE)
  const [language, setLanguage] = useState('Python')
  const [mode, setMode] = useState<'code' | 'repository'>('code')
  const [repoUrl, setRepoUrl] = useState('')
  const [review, setReview] = useState<Review | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [severityFilter, setSeverityFilter] = useState('All severities')
  const [status, setStatus] = useState<'idle' | 'validating' | 'analyzing' | 'complete' | 'failed'>('idle')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showFix, setShowFix] = useState(false)
  const [panel, setPanel] = useState<'findings' | 'fix'>('findings')
  const editorLanguage = { Python: 'python', JavaScript: 'javascript', TypeScript: 'typescript' }[language]
  const isRepository = mode === 'repository'
  const currentReview = review

  useEffect(() => {
    if (!params.id) return
    if (!session?.access_token) return
    let active = true
    loadReview(params.id, session.access_token).then((saved) => {
      if (!active) return
      setReview(saved)
      setCode(saved.code)
      setLanguage(saved.language)
      setStatus('complete')
      setSelectedId(saved.issues[0]?.id ?? '')
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : 'This review could not be loaded.')
    })
    return () => { active = false }
  }, [params.id, session?.access_token])

  const findings = currentReview?.issues ?? []
  const selected = findings.find((finding) => finding.id === selectedId) ?? findings[0]
  const filteredFindings = findings.filter((finding) => severityFilter === 'All severities' || finding.severity === severityFilter.toLowerCase())

  async function runAnalysis() {
    setError('')
    if (!session?.access_token) {
      setError('Sign in before starting an analysis.')
      setStatus('failed')
      return
    }
    if (isRepository && !repoUrl.trim()) {
      setError('Enter a public GitHub repository URL before starting an analysis.')
      setStatus('idle')
      return
    }
    if (!isRepository && !code.trim()) {
      setError('Add some code before starting a review.')
      setStatus('idle')
      return
    }
    if (!isRepository && new Blob([code]).size > 80000) {
      setError('Code exceeds the 80 KB limit. Reduce the sample and retry.')
      setStatus('failed')
      return
    }
    setStatus('validating')
    try {
      setStatus('analyzing')
      const result = isRepository
        ? await analyzeRepository(repoUrl, language, session.access_token)
        : await analyzeCode(code, language, session.access_token)
      setReview(result)
      setCode(result.code)
      setLanguage(result.language)
      setRepoUrl('')
      setSelectedId(result.issues[0]?.id ?? '')
      setStatus('complete')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The analysis could not be completed. Please retry.')
      setStatus('failed')
    }
  }

  async function copyFix() {
    try {
      if (!selected?.suggestedCode) {
        setError('No corrected code was returned for this finding.')
        return
      }
      await navigator.clipboard.writeText(selected.suggestedCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Clipboard access is unavailable in this browser. Select and copy the suggested code manually.')
    }
  }

  function checkRepository() {
    void runAnalysis()
  }

  function applyFix() {
    if (!selected?.suggestedCode || currentReview?.source === 'github') return
    setCode(selected.suggestedCode)
    setReview(null)
    setStatus('idle')
    setShowFix(false)
  }

  return <div className="page review-page">
    <div className="workspace-titlebar"><div><button className="back-link" onClick={() => navigate('/dashboard')}><ArrowLeft size={14} /> Workspace</button><h1>{params.id ? 'Review details' : 'New code review'}</h1></div><div className="review-title-actions"><span className="demo-pill"><span /> GEMINI ANALYSIS</span><button className="icon-btn" aria-label="More review options"><MoreHorizontal size={17} /></button></div></div>
    <div className="review-disclaimer"><Info size={14} /><span>Code is sent to the configured CodeLens API and Gemini for analysis, and saved in your private Supabase history. Findings and suggested fixes are AI-generated and require human review.</span></div>
    {error && <div className="error-banner"><AlertTriangle size={15} />{error}<button className="icon-btn" aria-label="Dismiss error" onClick={() => setError('')}><X size={14} /></button></div>}
    <div className="review-toolbar">
      <div className="input-modes"><button className={mode === 'code' ? 'active' : ''} onClick={() => setMode('code')}><Code2 size={14} /> Code</button><button className={mode === 'repository' ? 'active' : ''} onClick={() => setMode('repository')}><Github size={14} /> Repository</button></div>
      <div className="toolbar-right"><span className="editor-language-label">LANGUAGE</span><label className="language-select"><select value={language} onChange={(event) => setLanguage(event.target.value)}><option>Python</option><option>JavaScript</option><option>TypeScript</option></select><ChevronDown size={13} /></label><button className="toolbar-button" onClick={() => { setCode(SAMPLE_CODE); setReview(null); setStatus('idle') }}><Upload size={14} /> Load sample</button><button className="toolbar-button clear-button" onClick={() => { setCode(''); setReview(null); setStatus('idle') }}><Trash2 size={14} /> Clear</button></div>
    </div>
    <div className="review-workspace">
      <section className="editor-pane">
        {isRepository ? <div className="repo-entry"><div className="repo-icon"><Github size={20} /></div><h2>Analyze a public repository</h2><p>Fetch up to 8 supported source files (60 KB combined) from a public GitHub repository. Private repositories are not supported.</p><label>GITHUB REPOSITORY URL<input type="url" value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} placeholder="https://github.com/owner/repository" /></label><button className="button button-secondary button-small" onClick={checkRepository} disabled={status === 'validating' || status === 'analyzing'}>{status === 'analyzing' ? 'Analyzing…' : 'Analyze repository'} <ArrowRight size={14} /></button><div className="setup-notice"><Info size={14} /> Only public GitHub repositories are fetched. Code is sent to Gemini.</div></div> : <>
          <div className="editor-pane-head"><span><FileCode2 size={14} /> {params.id ? review?.name ?? 'Loading review…' : `untitled.${language === 'Python' ? 'py' : language === 'JavaScript' ? 'js' : 'ts'}`} <i className="unsaved-dot" /></span><span className="editor-pane-actions"><button title="Paste code" onClick={async () => { try { setCode(await navigator.clipboard.readText()) } catch { setError('Clipboard access is unavailable. Paste directly into the editor instead.') } }}><Copy size={13} /> Paste</button><button title="Open sample code" onClick={() => setCode(SAMPLE_CODE)}>Sample</button></span></div>
          <div className="monaco-wrap"><Editor height="100%" language={editorLanguage} value={code} onChange={(value) => { setCode(value ?? ''); setReview(null); if (status === 'complete') setStatus('idle') }} theme="codelens-dark" beforeMount={(monaco) => { monaco.editor.defineTheme('codelens-dark', { base: 'vs-dark', inherit: true, rules: [{ token: 'comment', foreground: '907a78', fontStyle: 'italic' }, { token: 'keyword', foreground: 'd98a9c' }, { token: 'string', foreground: 'd6a77a' }], colors: { 'editor.background': '#1b0e08', 'editor.foreground': '#f8e5ee', 'editorLineNumber.foreground': '#715f58', 'editorLineNumber.activeForeground': '#d3b9c3', 'editor.lineHighlightBackground': '#2d1914', 'editor.selectionBackground': '#7b0d1e66', 'editorCursor.foreground': '#f8e5ee', 'editorGutter.background': '#1b0e08' } }) }} options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: 'JetBrains Mono, Consolas, monospace', lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'off', padding: { top: 16, bottom: 20 }, renderLineHighlight: 'line', tabSize: 4, automaticLayout: true, readOnly: Boolean(params.id && review), scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 } }} /></div>
          <div className="editor-pane-footer"><span>Ln {code.split('\n').length} <i /> UTF-8 <i /> {language.toUpperCase()}</span><span><LockKeyhole size={12} /> ACCOUNT-SCOPED</span></div>
        </>}
        <div className="editor-actions"><div className="analysis-status">{status === 'analyzing' || status === 'validating' ? <><LoaderCircle className="spin" size={14} />{status === 'validating' ? 'Validating input…' : 'Waiting for Gemini analysis…'}</> : status === 'complete' ? <><Check size={14} /> Review complete</> : status === 'failed' ? <><AlertTriangle size={14} /> Check failed</> : <><span className="status-dot" /> Ready to review</>}</div><button className="button button-primary analyze-button" onClick={runAnalysis} disabled={status === 'validating' || status === 'analyzing' || isRepository}><Sparkles size={14} />{status === 'analyzing' || status === 'validating' ? 'Analyzing…' : 'Analyze code'}</button></div>
      </section>
      <section className="findings-pane">
        <div className="findings-tabs"><button className={panel === 'findings' ? 'active' : ''} onClick={() => setPanel('findings')}><AlertTriangle size={14} /> Findings {findings.length > 0 && <span className="tab-count">{findings.length}</span>}</button><button className={panel === 'fix' ? 'active' : ''} onClick={() => setPanel('fix')}><Braces size={14} /> Suggested fix</button></div>
        {panel === 'findings' ? <>
          <div className="findings-toolbar"><div><b>Analysis findings</b><small>{status === 'complete' ? findings.length ? `${findings.length} potential issue${findings.length === 1 ? '' : 's'} found` : 'No potential issues found' : 'Run a review to see findings'}</small></div><label className="severity-filter"><SlidersHorizontal size={13} /><select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}><option>All severities</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select><ChevronDown size={12} /></label></div>
          {status === 'analyzing' || status === 'validating' ? <div className="loading-findings"><LoaderCircle className="spin" size={20} /><b>Analyzing your code</b><p>Waiting for Gemini to review the submitted source.</p></div> : !currentReview ? <EmptyState icon={<FileSearch size={19} />} title="Ready when you are" text="Submit code to Gemini for review and save the results to your private history." /> : findings.length === 0 ? <EmptyState icon={<BadgeCheck size={19} />} title="No findings returned" text="Gemini returned no findings for this source. This does not guarantee the code is safe." /> : filteredFindings.length === 0 ? <EmptyState icon={<Filter size={18} />} title="No findings at this severity" text="Choose another severity filter to see more results." /> : <div className="finding-list">{filteredFindings.map((finding) => <FindingCard key={finding.id} finding={finding} selected={finding.id === selected?.id} onClick={() => { setSelectedId(finding.id); setShowFix(false) }} />)}</div>}
        </> : <FixPanel finding={selected} code={code} copied={copied} allowApply={currentReview?.source !== 'github'} onCopy={copyFix} onShow={() => setShowFix(true)} />}
        {selected && panel === 'findings' && <FindingDetail finding={selected} onShowFix={() => setPanel('fix')} />}
        <div className="findings-foot"><Info size={12} /><span>Local demo checks are not a substitute for a full review.</span></div>
      </section>
    </div>
    {showFix && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowFix(false)}><div className="confirm-dialog"><div className="modal-icon"><Braces size={18} /></div><button className="icon-btn modal-close" aria-label="Close" onClick={() => setShowFix(false)}><X size={16} /></button><h2>Use suggested example?</h2><p>This replaces the editor contents with a fixed sample. The suggested code has not been tested or verified.</p><div className="modal-actions"><button className="button button-quiet" onClick={() => setShowFix(false)}>Cancel</button><button className="button button-primary button-small" onClick={applyFix}>Replace editor code</button></div></div></div>}
    <div className="review-mobile-bottom"><span><span className="status-dot" /> LOCAL CHECKS</span><button className="button button-primary button-small" disabled={status === 'analyzing' || status === 'validating'} onClick={runAnalysis}><Sparkles size={13} /> Analyze</button></div>
  </div>
}

function FindingCard({ finding, selected, onClick }: { finding: Finding; selected: boolean; onClick: () => void }) {
  return <button className={`finding-card ${selected ? 'selected' : ''}`} onClick={onClick}><div className="finding-card-top"><SeverityBadge severity={finding.severity} /><span>{finding.file ? `${finding.file}:${finding.line}` : `LINE ${finding.line}`}</span></div><b>{finding.title}</b><p>{finding.explanation}</p><span className="finding-open">View details <ChevronRight size={13} /></span></button>
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const Icon = severity === 'critical' ? ShieldAlert : severity === 'high' ? AlertTriangle : severity === 'medium' ? Info : Check
  return <span className={`severity-badge ${severity}`}><Icon size={12} />{severity}</span>
}

function FindingDetail({ finding, onShowFix }: { finding: Finding; onShowFix: () => void }) {
  return <div className="finding-detail"><div className="detail-title"><div><div className="eyebrow">SELECTED FINDING</div><h3>{finding.title}</h3></div><SeverityBadge severity={finding.severity} /></div><div className="detail-location"><FileCode2 size={13} /> {finding.file || 'Current source'} <span>:</span> line {finding.line}</div><p>{finding.explanation}</p><div className="why-box"><b><Info size={13} /> Why this matters</b><span>AI findings are approximate. Confirm the surrounding code, input source, and runtime behavior before deciding whether this is an issue.</span></div><div className="suggestion-block"><span>RECOMMENDED NEXT STEP</span><p>{finding.suggestion}</p></div><button className="button button-secondary button-small full-button" onClick={onShowFix}>Inspect suggested fix <ArrowRight size={13} /></button></div>
}

function FixPanel({ finding, code, copied, allowApply, onCopy, onShow }: { finding?: Finding; code: string; copied: boolean; allowApply: boolean; onCopy: () => void; onShow: () => void }) {
  const suggestedCode = finding?.suggestedCode
  return <div className="fix-panel">
    <div className="fix-panel-title"><span className="eyebrow">SUGGESTED CHANGE</span><h3>{finding?.title ?? 'Review a suggested fix'}</h3><p>AI-generated suggestion. It has not been tested or verified.</p></div>
    {finding && <div className="suggestion-block"><span>RECOMMENDED NEXT STEP</span><p>{finding.suggestion}</p></div>}
    {suggestedCode ? <div className="fix-code-box"><div className="fix-code-head"><span><FileCode2 size={13} /> suggested-source</span><button onClick={onCopy}>{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy'}</button></div><pre><code>{suggestedCode.split('\n').slice(0, 200).map((line, index) => <span key={index}><i>{String(index + 1).padStart(2, '0')}</i>{line || ' '}{'\n'}</span>)}</code></pre></div> : <div className="empty-fix-code"><Info size={15} /><span>The analysis did not provide a corrected full-file example for this finding. Review the recommendation above and edit the source manually.</span></div>}
    {suggestedCode && allowApply && <><div className="fix-warning"><Info size={14} /><span>Applying this code replaces your current editor contents. Review it carefully first.</span></div><button className="button button-secondary button-small full-button" onClick={onShow} disabled={!code.trim()}>Compare / replace editor code</button></>}
    {suggestedCode && !allowApply && <div className="fix-warning"><Info size={14} /><span>For repository reviews, copy a file-specific suggestion and edit the file in your repository. Whole repository patches are not applied here.</span></div>}
  </div>
}

function HistoryPage() {
  const { session } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('All languages')
  const [dateRange, setDateRange] = useState('Any time')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  async function refresh() {
    if (!session?.access_token) return
    setLoading(true)
    try { setReviews(await listReviews(session.access_token)); setError('') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Review history could not be loaded.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void refresh() }, [session?.access_token])
  const filtered = useMemo(() => reviews.filter((review) => {
    if (!review.name.toLowerCase().includes(query.toLowerCase())) return false
    if (language !== 'All languages' && review.language !== language) return false
    if (dateRange === 'Any time') return true
    const days = dateRange === 'Last 7 days' ? 7 : 30
    return Date.now() - new Date(review.createdAt).getTime() <= days * 24 * 60 * 60 * 1000
  }), [reviews, query, language, dateRange])
  function remove(id: string) {
    const token = session?.access_token
    if (!window.confirm('Delete this review from your account history?') || !token) return
    void removeFromHistory(id, token)
  }
  async function removeFromHistory(id: string, token: string) {
    try {
      await deleteReviewFromApi(id, token)
      setReviews((current) => current.filter((review) => review.id !== id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This review could not be deleted.')
    }
  }
  return <div className="page"><PageHeader eyebrow="PRIVATE HISTORY" title="Review history" description="Find and reopen your previous code review sessions." action={<button className="button button-primary" onClick={() => navigate('/review')}><Plus size={15} /> New review</button>} /><div className="demo-notice"><LockKeyhole size={15} /><span>Your review history is stored in Supabase and scoped to your signed-in account.</span></div>{error && <div className="error-banner"><AlertTriangle size={15} />{error}</div>}<section className="panel history-panel"><div className="panel-heading"><div><h2>All reviews</h2><p>{filtered.length} {filtered.length === 1 ? 'review' : 'reviews'} in this account</p></div><button className="icon-btn" aria-label="Refresh history" onClick={() => void refresh()}><Activity size={15} /></button></div><div className="table-controls"><label className="search-control"><Search size={15} /><input placeholder="Search reviews..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="select-control"><Filter size={14} /><select value={language} onChange={(event) => setLanguage(event.target.value)}><option>All languages</option>{[...new Set(reviews.map((review) => review.language))].map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={13} /></label><label className="date-filter"><Clock3 size={14} /><select aria-label="Filter by date" value={dateRange} onChange={(event) => setDateRange(event.target.value)}><option>Any time</option><option>Last 7 days</option><option>Last 30 days</option></select><ChevronDown size={13} /></label></div>{loading ? <LoadingState text="Loading your private review history…" /> : filtered.length ? <ReviewTable reviews={filtered} onDelete={remove} /> : <EmptyState icon={<History size={19} />} title={reviews.length ? 'No matching reviews' : 'No reviews yet'} text={reviews.length ? 'Try adjusting your search or language filter.' : 'Completed reviews will appear here.'} action={!reviews.length && <button className="button button-secondary button-small" onClick={() => navigate('/review')}><Plus size={14} /> Start a review</button>} />}</section></div>
}

function SettingsPage() {
  const { user } = useAuth()
  const [appearance, setAppearance] = useState('Dark')
  const [detail, setDetail] = useState('Balanced')
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  useEffect(() => {
    try {
      const savedPreferences = sessionStorage.getItem('codelens.preferences')
      if (!savedPreferences) return
      const parsed: unknown = JSON.parse(savedPreferences)
      if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid preferences')
      const preferences = parsed as { appearance?: unknown; detail?: unknown }
      if (preferences.appearance === 'Dark' || preferences.appearance === 'Dim') setAppearance(preferences.appearance)
      if (preferences.detail === 'Concise' || preferences.detail === 'Balanced' || preferences.detail === 'Detailed') setDetail(preferences.detail)
    } catch {
      setSaveError('Saved preferences could not be loaded.')
    }
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = appearance.toLowerCase()
  }, [appearance])
  return <div className="page settings-page"><PageHeader eyebrow="PREFERENCES" title="Settings" description="Manage your workspace preferences and integrations." /><div className="demo-notice"><Info size={15} /><span>Theme and analysis preferences are local to this device; account authentication and review history use Supabase.</span></div>
    <section className="settings-section"><div className="settings-section-title"><div className="settings-icon"><Settings size={17} /></div><div><h2>Account</h2><p>Your personal workspace identity</p></div></div><div className="settings-card"><div className="settings-row"><div><b>Email address</b><small>Authenticated with Supabase</small></div><span className="settings-value">{user?.email}</span></div><div className="settings-row"><div><b>Account ID</b><small>Your Supabase user identifier</small></div><span className="settings-value account-id">{user?.id}</span></div></div></section>
    <section className="settings-section"><div className="settings-section-title"><div className="settings-icon"><Zap size={17} /></div><div><h2>Appearance</h2><p>Choose how CodeLens looks on this device</p></div></div><div className="settings-card"><div className="settings-row"><div><b>Theme</b><small>Select your preferred interface theme</small></div><select className="settings-select" value={appearance} onChange={(event) => setAppearance(event.target.value)}><option>Dark</option><option>Dim</option></select></div></div></section>
    <section className="settings-section"><div className="settings-section-title"><div className="settings-icon"><Github size={17} /></div><div><h2>GitHub repositories</h2><p>Public repository source analysis</p></div></div><div className="settings-card integration-card"><div className="integration-mark"><Github size={19} /></div><div className="integration-copy"><b>Public repository analysis</b><p>Public repositories can be analyzed without connecting a GitHub account. Private repositories are unsupported.</p></div><span className="connection-badge"><span /> Public only</span><Link className="button button-secondary button-small" to="/review">Open review</Link></div></section>
    <section className="settings-section"><div className="settings-section-title"><div className="settings-icon"><Sparkles size={17} /></div><div><h2>Analysis preferences</h2><p>Control the level of detail in future reviews</p></div></div><div className="settings-card"><div className="settings-row"><div><b>Review detail</b><small>Choose the preferred level of finding detail</small></div><select className="settings-select" value={detail} onChange={(event) => setDetail(event.target.value)}><option>Concise</option><option>Balanced</option><option>Detailed</option></select></div>    <div className="settings-row"><div><b>Data handling</b><small>Review source is sent to Gemini and stored in your private Supabase history.</small></div><span className="settings-value"><LockKeyhole size={14} /> Account-scoped</span></div></div></section>
    <div className="settings-save"><span>{saveError || (saved && <><Check size={14} /> Preferences saved for this session</>)}</span><button className="button button-primary button-small" onClick={() => { try { sessionStorage.setItem('codelens.preferences', JSON.stringify({ appearance, detail })); setSaved(true); setSaveError('') } catch { setSaveError('Preferences could not be saved in this browser.') } }}>Save preferences <Check size={14} /></button></div>
  </div>
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function AuthPage() {
  const { configured, ready, authError, user, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const requestedPath = query.get('returnTo') || '/dashboard'
  const returnTo = requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/dashboard'
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (ready && user) navigate(returnTo, { replace: true })
  }, [ready, user, returnTo, navigate])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)
    try {
      if (mode === 'sign-in') {
        await signIn(email, password)
        navigate(returnTo, { replace: true })
      } else {
        const hasSession = await signUp(email, password)
        if (hasSession) navigate(returnTo, { replace: true })
        else setMessage('Check your email and open the confirmation link in this same browser. You will be signed in after confirmation.')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="auth-page">
    <div className="auth-top"><Brand /><Link to="/">Back to home <ArrowLeft size={13} /></Link></div>
    <section className="auth-card">
      <div className="auth-mark"><LockKeyhole size={19} /></div>
      <div className="eyebrow">YOUR PRIVATE WORKSPACE</div>
      <h1>{mode === 'sign-in' ? 'Welcome back.' : 'Create your account.'}</h1>
      <p className="auth-description">Sign in to analyze code and access your private review history.</p>
      {!configured && <div className="error-banner"><Info size={15} />Supabase sign-in is disabled because this frontend build is missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Set both in Vercel Project Settings &gt; Environment Variables, then redeploy. Use the base Supabase Project URL (no /rest/v1/) and the publishable/anon key.</div>}
      {authError && !error && <div className="error-banner"><AlertTriangle size={15} />{authError}</div>}
      {error && <div className="error-banner"><AlertTriangle size={15} />{error}</div>}
      {message && <div className="demo-notice"><Info size={15} />{message}</div>}
      <form className="auth-form" onSubmit={submit}>
        <label>Email address<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label>Password<input type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>
        <button className="button button-primary auth-submit" type="submit" disabled={!configured || busy}>{busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'} <ArrowRight size={14} /></button>
      </form>
      <div className="auth-switch">{mode === 'sign-in' ? 'New to CodeLens?' : 'Already have an account?'} <button onClick={() => { setError(''); setMessage(''); setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in') }}>{mode === 'sign-in' ? 'Create account' : 'Sign in'}</button></div>
      <div className="auth-privacy"><LockKeyhole size={12} /> Reviews are private to your account through Supabase row-level security.</div>
    </section>
  </main>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { configured, ready, session } = useAuth()
  const location = useLocation()
  if (!configured) return <AuthPage />
  if (!ready) return <main className="auth-page"><LoadingState text="Restoring your secure session…" /></main>
  if (!session) return <Navigate to={`/auth?returnTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />
  return children
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/dashboard" element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
    <Route path="/review" element={<ProtectedRoute><AppShell><ReviewWorkspace /></AppShell></ProtectedRoute>} />
    <Route path="/review/:id" element={<ProtectedRoute><AppShell><ReviewWorkspace /></AppShell></ProtectedRoute>} />
    <Route path="/history" element={<ProtectedRoute><AppShell><HistoryPage /></AppShell></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><AppShell><SettingsPage /></AppShell></ProtectedRoute>} />
    <Route path="*" element={<Landing />} />
  </Routes>
}
