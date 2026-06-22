import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { faq } from "@/content"

export function FaqList() {
  return (
    <div className="space-y-10">
      {faq.sections.map((section, sectionIndex) => (
        <div key={section.title}>
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
            {section.title}
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {section.items.map((item, itemIndex) => (
              <AccordionItem
                key={item.question}
                value={`${sectionIndex}-${itemIndex}`}
                className="border-border"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  )
}
