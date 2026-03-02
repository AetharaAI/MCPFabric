import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Home } from '@/pages/Home';
import { Registry } from '@/pages/Registry';
import { Observatory } from '@/pages/Observatory';
import { Console } from '@/pages/Console';
import { Playground } from '@/pages/Playground';
import { ApiKeys } from '@/pages/ApiKeys';
import { Docs } from '@/pages/Docs';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/registry" element={<Registry />} />
          <Route path="/registry/:toolId" element={<Registry />} />
          <Route path="/observatory" element={<Observatory />} />
          <Route path="/console" element={<Console />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/api-keys" element={<ApiKeys />} />
          <Route path="/docs" element={<Docs />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
