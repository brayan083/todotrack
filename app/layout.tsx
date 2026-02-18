import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';


export const metadata: Metadata = {
  title: 'TimeTrack',
  description: 'Productivity tracking application',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
