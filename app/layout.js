import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700', '800']
})

export const metadata = {
  title: 'MeetHalfway — Find the perfect spot',
  description: 'Find a venue where both of you have equal travel time. Two locations, one great meeting point.'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="font-sans antialiased bg-[#0A0A14] text-white">
        {children}
      </body>
    </html>
  )
}
