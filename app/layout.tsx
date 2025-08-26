import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CRM Luis Ka',
  description: 'Embudo Ahorro/GMM — Grupo Tres Hermosillo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}

