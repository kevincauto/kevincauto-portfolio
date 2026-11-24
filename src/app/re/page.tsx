import { Suspense } from 'react'
import type { Metadata } from 'next'
import ApartmentFinder from '@/components/ApartmentFinder'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Galman Availability',
  description: 'Sort and filter available Galman Group apartments in Philadelphia and the Pennsylvania suburbs.',
}

export default function ApartmentsPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading Galman availability…</div>}>
      <ApartmentFinder />
    </Suspense>
  )
}
