import { useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowRight, BookOpen, CalendarDays, ChevronDown, FileText, Menu, Search, X } from 'lucide-react';

const issues = [];

const years = ['Барлық жыл', '2026', '2025', '2024', '2023'];

function LogoPlaceholder() {
  return <div className="logo-placeholder" aria-label="Логотипті кейін қосуға арналған орын">
    <span className="logo-mark">ТТ</span>
    <span className="logo-caption">ЛОГОТИП</span>
  </div>;
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="site-header">
    <div className="topline"><div className="container topline-inner">
      <span>Аудандық қоғамдық-саяси газет</span>
      <span className="topline-right">Торғай өңірінің тынысы</span>
    </div></div>
    <div className="container header-main">
      <a className="brand" href="#home" aria-label="Торғай тынысы — басты бет">
        <LogoPlaceholder />
        <span className="brand-copy"><strong>Торғай тынысы</strong><small>ЭЛЕКТРОНДЫ ГАЗЕТ МҰРАҒАТЫ</small></span>
      </a>
      <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Мәзірді ашу">{menuOpen ? <X /> : <Menu />}</button>
      <nav className={menuOpen ? 'main-nav open' : 'main-nav'}>
        <a href="#home" onClick={() => setMenuOpen(false)}>Басты бет</a>
        <a href="#archive" onClick={() => setMenuOpen(false)}>Газет мұрағаты</a>
        <a href="#about" onClick={() => setMenuOpen(false)}>Біз туралы</a>
        <a href="#contact" onClick={() => setMenuOpen(false)}>Байланыс</a>
      </nav>
    </div>
  </header>;
}

function IssueCard({ issue }) {
  return <article className="issue-card">
    <div className="cover-wrap">
      {issue.cover ? <img src={issue.cover} alt={issue.title} /> : <div className="cover-placeholder">
        <span className="cover-kicker">АУДАНДЫҚ ГАЗЕТ</span>
        <strong>Торғай<br/>тынысы</strong>
        <span className="cover-rule" />
        <span className="cover-date">{issue.date}</span>
        <span className="cover-number">№ {issue.number}</span>
      </div>}
      <span className="issue-badge">PDF</span>
    </div>
    <div className="issue-info">
      <div className="issue-meta"><span>№ {issue.number}</span><span>{issue.date}</span></div>
      <h3>{issue.title || 'Газеттің жаңа саны'}</h3>
      <div className="issue-actions">
        <a className="button button-primary" href={issue.pdf || '#'} target={issue.pdf ? '_blank' : undefined} rel="noreferrer"><BookOpen size={16}/> Оқу</a>
        <a className="icon-button" href={issue.pdf || '#'} download aria-label="PDF жүктеу"><ArrowDownToLine size={18}/></a>
      </div>
    </div>
  </article>;
}

function App() {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('Барлық жыл');
  const [showAll, setShowAll] = useState(false);
  const filtered = useMemo(() => issues.filter(issue => {
    const matchesYear = year === 'Барлық жыл' || issue.year === year;
    const matchesQuery = `${issue.number} ${issue.date} ${issue.title || ''}`.toLowerCase().includes(query.toLowerCase());
    return matchesYear && matchesQuery;
  }), [query, year]);
  const visible = showAll ? filtered : filtered.slice(0, 6);

  return <><Header />
    <main id="home">
      <section className="hero">
        <div className="hero-pattern" />
        <div className="container hero-content">
          <div className="eyebrow"><span /> ТОРҒАЙ ӨҢІРІНІҢ ҮНІ</div>
          <h1>Торғай тынысы</h1>
          <p className="hero-lead">Аудандық қоғамдық-саяси газетінің<br className="desktop-break"/> электронды мұрағаты</p>
          <p className="hero-sub">Өткен күннің шежіресі — бүгінгі ұрпаққа аманат.</p>
          <a className="button button-light" href="#archive">Газет сандарын көру <ArrowRight size={17}/></a>
          <div className="hero-stamp"><span>БАСЫЛЫМ</span><strong>ТТ</strong><span>ЭЛЕКТРОНДЫ МҰРАҒАТ</span></div>
        </div>
      </section>

      <section className="archive-section container" id="archive">
        <div className="section-heading">
          <div><div className="section-kicker">БІЗДІҢ БАСЫЛЫМДАР</div><h2>Газет мұрағаты</h2><p>Сүйікті газетіңіздің сандарын жылдар бойынша қараңыз.</p></div>
          <div className="archive-count"><FileText size={19}/><span><b>{issues.length}</b> шығарылым</span></div>
        </div>
        <div className="filters">
          <label className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Нөмірі немесе күні бойынша іздеу..."/></label>
          <label className="year-select"><CalendarDays size={17}/><select value={year} onChange={e => setYear(e.target.value)}>{years.map(y => <option key={y}>{y}</option>)}</select><ChevronDown size={16}/></label>
        </div>
        {visible.length ? <div className="issues-grid">{visible.map(issue => <IssueCard key={issue.id} issue={issue}/>)}</div> :
          <div className="empty-state"><div className="empty-icon"><BookOpen size={28}/></div><h3>Әзірге газет сандары жүктелмеген</h3><p>Жаңа PDF шығарылымдар жарияланған кезде осы бөлімде көрінеді.</p><span>Алғашқы шығарылым жақында қосылады</span></div>}
        {filtered.length > 6 && <button className="button button-outline load-more" onClick={() => setShowAll(!showAll)}>{showAll ? 'Аз көрсету' : 'Барлық сандарды көру'} <ArrowRight size={16}/></button>}
      </section>

      <section className="about-strip" id="about"><div className="container about-inner">
        <div className="about-icon"><BookOpen size={27}/></div><div><div className="section-kicker">БІЗ ТУРАЛЫ</div><h2>Торғай тарихы — ұрпаққа аманат</h2><p>«Торғай тынысы» газетінің электронды мұрағаты. Мұнда басылымның PDF форматындағы сандары жинақталып, оқырман назарына ұсынылады.</p></div>
      </div></section>
    </main>
    <footer id="contact"><div className="container footer-inner">
      <div className="footer-brand"><LogoPlaceholder/><div><strong>Торғай тынысы</strong><span>Электронды газет мұрағаты</span></div></div>
      <div className="footer-note">© {new Date().getFullYear()} «Торғай тынысы». Барлық құқықтар қорғалған.</div>
      <a className="back-top" href="#home">Жоғарыға <ArrowRight size={15}/></a>
    </div></footer>
  </>;
}

export default App;