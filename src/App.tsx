import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Landing from '@/pages/Landing'
import Pricing from '@/pages/Pricing'
import Onboarding from '@/pages/Onboarding'
import Deals from '@/pages/Deals'
import NewDeal from '@/pages/NewDeal'
import DealRoom from '@/pages/DealRoom'
import Starter from '@/pages/Starter'
import Thanks from '@/pages/Thanks'
import Admin from '@/pages/Admin'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/deals/new" element={<NewDeal />} />
          <Route path="/deals/:id" element={<DealRoom />} />
          <Route path="/starter" element={<Starter />} />
          <Route path="/thanks" element={<Thanks />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
