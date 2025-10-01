export default function Footer() {
  return (
    <footer className="footer">
      <div className="section-inner">
        <div className="footerbar">
          <img src="/supersize-inverted.png" alt="Supersize" className="supersize-logo" />
          <a
            href="https://x.com/supersizegg"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-x"
            aria-label="Follow on X"
            title="Follow on X"
          >
            <svg viewBox="0 0 1200 1227" aria-hidden="true" className="btn-x__icon">
              <path
                d="M714.163 519.284L1160.89 0H1028.21L667.137 417.233L378.216 0H0L466.392 681.03L0 1226.28H132.679L515.354 784.064L823.784 1226.28H1202.01L714.137 519.284H714.163ZM565.438 723.513L520.625 659.815L180.53 159.51H325.87L594.258 550.277L639.071 613.974L993.607 1066.89H848.267L565.438 723.539V723.513Z"
                fill="currentColor"
              />
            </svg>
            <span className="btn-x__label">Follow</span>
          </a>
          <p className="footerbar__right">&copy; 2025 Supersize, Inc.</p>
        </div>
      </div>
    </footer>
  );
}
