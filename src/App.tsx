import Footer from "./components/Footer";
import Games from "./components/Games";
import Hero from "./components/Hero";
import Partners from "./components/Partners";
import Thesis from "./components/Thesis";

export default function App() {
  return (
    <>
      <Hero />
      <main className="page">
        <Thesis />
        <Games />
        <Partners />
      </main>
      <Footer />
    </>
  );
}
