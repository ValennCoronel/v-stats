export const metadata = {
  title: "V-Stats API",
  description: "V-Stats Backend API Server",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
