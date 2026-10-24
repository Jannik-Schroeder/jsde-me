import { connection } from 'next/server'
export default async function ArticlesLayout({children}: {children: React.ReactNode}) {
  await connection()
  return children
}
