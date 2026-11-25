import { Link } from 'react-router-dom';

export default function Logo({ light = false, size = 28 }) {
  return (
    <Link to="/" className={light ? 'logo light' : 'logo'}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={light ? '#9FD8C6' : '#1F6F5C'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 4v5h-5" />
        <path d="M12 8v8M8.5 11.5 12 8l3.5 3.5" />
      </svg>
      ReviveHub
    </Link>
  );
}
