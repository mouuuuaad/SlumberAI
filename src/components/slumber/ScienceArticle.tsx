
'use client';

import type { ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ArticleSection {
  id: string;
  title: string;
  content: string;
}

export interface ArticleProps {
  title: string;
  icon?: ReactNode;
  sections: ArticleSection[];
  defaultOpen?: boolean; // To control if the article card's content is visible by default
}

export default function ScienceArticle({ title, icon, sections, defaultOpen = false }: ArticleProps) {
  return (
    <Card className="w-full shadow-xl glassmorphic overflow-hidden">
      <CardHeader className="bg-card/70">
        <CardTitle className="text-xl sm:text-2xl font-semibold text-primary flex items-center gap-3"> {/* Changed text-foreground to text-primary */}
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <Accordion type="single" collapsible className="w-full" defaultValue={defaultOpen && sections.length > 0 ? sections[0].id : undefined}>
          {sections.map((section, index) => (
            <AccordionItem value={section.id} key={section.id} className="border-b-border/30 last:border-b-0">
              <AccordionTrigger className="text-base sm:text-lg font-normal py-3 hover:no-underline text-left text-foreground/90">
                {section.title}
              </AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base text-muted-foreground whitespace-pre-line pt-2 pb-4">
                {section.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
