import { PageSkeleton } from '@/components/page-skeleton'
import {Suspense} from 'react'
import {AdminContainer} from '@/modules/admin-pages'
export default function AdminPage(){return <Suspense fallback={<PageSkeleton variant="table" />}><AdminContainer section="content"/></Suspense>}
