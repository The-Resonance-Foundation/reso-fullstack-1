import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { About } from "@/components/about"
import { Programs } from "@/components/programs"
import { Impact } from "@/components/impact"
import { GetInvolved } from "@/components/get-involved"
import { Donate } from "@/components/donate"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <About />
      <Programs />
      <Impact />
      <GetInvolved />
      <Donate />
      <Contact />
      <Footer />
    </main>
  )
}
