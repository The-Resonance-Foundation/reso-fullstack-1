import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link"
import { HelpCircle } from "lucide-react"

const faqSections = [
  {
    title: "About The Resonance Foundation",
    items: [
      {
        question: "What is The Resonance Foundation?",
        answer: "The Resonance Foundation is a nonprofit organization dedicated to offering low-cost music education to students, fostering a love for music while helping them improve their skills. We are a student-led initiative focused on making music education accessible to everyone."
      },
      {
        question: "Who can join The Resonance Foundation as a tutor?",
        answer: "High school and college students with musical experience are welcome to apply as tutors. You should be proficient in at least one instrument or have vocal training. No prior teaching experience is required - we provide guidance and support for all our tutors."
      },
      {
        question: "What instruments do you offer tutoring for?",
        answer: "We offer tutoring in four main categories: Woodwind (flute, clarinet, saxophone, oboe, bassoon), Brass (trumpet, trombone, French horn, tuba, euphonium), String (guitar, violin, viola, cello, bass), and Vocal instruction. If you're interested in an instrument not listed, please contact us to inquire about availability."
      },
    ]
  },
  {
    title: "For Students",
    items: [
      {
        question: "Who can sign up for music tutoring?",
        answer: "Students of all ages and skill levels are welcome to sign up for tutoring. Whether you're a complete beginner or looking to improve your existing skills, we have a place for you. Our lessons are designed to accommodate students at every stage of their musical journey."
      },
      {
        question: "How do I sign up for tutoring?",
        answer: "You can sign up for tutoring by filling out our student registration form. Click the 'Become a Student' button on our website, complete the form with your information, instrument preferences, and availability. Our team will match you with an appropriate tutor and reach out to confirm your lesson schedule."
      },
      {
        question: "Is there a cost for tutoring?",
        answer: "Yes, but we keep our costs very affordable. Group lessons are $10 for 45 minutes, and individual lessons are $15 for 45 minutes. Financial aid is available for students who qualify - cost should never be a barrier to learning music. Please contact us to inquire about financial assistance."
      },
      {
        question: "Where are tutoring sessions held?",
        answer: "Tutoring sessions are held at various community locations, including libraries, community centers, and partner organizations. When you sign up, we'll work with you to find a convenient location. Some tutors may also offer virtual lessons depending on availability."
      },
      {
        question: "How long are the tutoring sessions?",
        answer: "Standard tutoring sessions are 45 minutes long. This provides enough time for warm-up, instruction, practice, and review. Session length may vary for special workshops or group events."
      },
    ]
  },
  {
    title: "For Tutors",
    items: [
      {
        question: "How can I apply to be a tutor?",
        answer: "To apply as a tutor, click the 'Become a Tutor' link and fill out our tutor application form. You'll need to provide information about your musical background, instruments you can teach, and your availability. Our team will review your application and reach out for next steps."
      },
      {
        question: "Do I need prior teaching experience to become a tutor?",
        answer: "No prior teaching experience is required! We welcome tutors who are passionate about music and eager to share their knowledge. We provide guidance, resources, and support to help you become an effective tutor. Your musical proficiency and enthusiasm are what matter most."
      },
      {
        question: "Will tutoring count as volunteer hours?",
        answer: "Yes! Tutoring with The Resonance Foundation counts as volunteer hours. We can provide documentation of your volunteer service for school requirements, college applications, or other purposes. Many of our tutors have used their experience with us to fulfill community service requirements."
      },
    ]
  },
  {
    title: "General Questions",
    items: [
      {
        question: "How can I support The Resonance Foundation?",
        answer: "There are many ways to support us! You can donate through our PayPal link, become a tutor, help spread the word on social media, or partner with us for events. Financial contributions help fund scholarships, purchase instruments, and support our community programs. Every bit of support makes a difference."
      },
      {
        question: "How can I contact The Resonance Foundation?",
        answer: "You can reach us via email at info@theresonancefoundation.org. You can also connect with us on Instagram (@resonancefoundationtx) and Facebook. We typically respond to inquiries within 1-2 business days."
      },
      {
        question: "Can I suggest new programs or instruments to include?",
        answer: "We love hearing suggestions from our community. If you have ideas for new programs, instruments, or initiatives, please email us at info@theresonancefoundation.org. We're always looking for ways to expand and improve our offerings to better serve our students."
      },
    ]
  },
]

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground">
              Find answers to common questions about The Resonance Foundation.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-12">
            {faqSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                  {section.title}
                </h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <AccordionItem 
                      key={itemIndex} 
                      value={`${sectionIndex}-${itemIndex}`}
                      className="bg-card border border-border rounded-lg px-6"
                    >
                      <AccordionTrigger className="text-left font-medium hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
            Still Have Questions?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            We are here to help! Reach out to us and we will get back to you as soon as possible.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="mailto:info@theresonancefoundation.org">
                Contact Us
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Visit Contact Page</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
