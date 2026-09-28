export const metadata = {
  title: 'Thainexsweetie - ร้านขนมหวาน',
  description: 'ระบบสั่งอาหารร้านขนมหวาน Thainexsweetie',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body style={{ margin: 0, fontFamily: 'sans-serif', backgroundColor: '#fff5f5' }}>
        {children}
      </body>
    </html>
  )
}
