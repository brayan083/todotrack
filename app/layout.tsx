import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';


export const metadata: Metadata = {
  title: 'TodoTrack',
  description: 'Productivity tracking application',
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
