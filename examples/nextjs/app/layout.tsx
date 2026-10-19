import type { ReactNode } from 'react';
import 'react-thai/styles.css';

export const metadata = { title: 'react-thai + Next.js' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body style={{ fontFamily: 'system-ui', maxWidth: 560, margin: '2rem auto' }}>
        {children}
      </body>
    </html>
  );
}
