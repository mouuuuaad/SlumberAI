
// This file was previously src/app/sleep-science/page.tsx and has been moved.
// Content is not yet translated.
import Header from '@/components/slumber/Header';
import ScienceArticle, { type ArticleProps } from '@/components/slumber/ScienceArticle';
import { Brain } from 'lucide-react';
import {useTranslations} from 'next-intl'; 
import NextLink from 'next/link';


const articlesData: ArticleProps[] = [ 
  {
    title: 'Understanding Sleep Cycles: REM vs. Deep Sleep',
    icon: <Brain className="h-6 w-6 text-primary" />,
    sections: [
      {
        id: 'what-is-sleep-cycle',
        title: 'What is a Sleep Cycle?',
        content:
          "Sleep isn't a monolithic state. Instead, we cycle through different stages of sleep throughout the night. A complete sleep cycle typically lasts about 90-110 minutes and is repeated several times. Each cycle consists of two main types of sleep: Non-Rapid Eye Movement (NREM) sleep and Rapid Eye Movement (REM) sleep.",
      },
      {
        id: 'nrem-sleep',
        title: 'NREM Sleep: The Body\'s Restorer',
        content:
          'NREM sleep is divided into three stages:\nN1 (Light Sleep): The transition phase between wakefulness and sleep. You might experience muscle twitches. Easy to wake up.\nN2 (Deeper Light Sleep): Heart rate and body temperature decrease. Brain waves slow down. This stage makes up the bulk of your sleep.\nN3 (Deep Sleep/Slow-Wave Sleep): The most restorative stage. Crucial for physical recovery, growth hormone release, immune system function, and memory consolidation. Hardest to wake from; waking up here can cause grogginess (sleep inertia).',
      },
      {
        id: 'rem-sleep',
        title: 'REM Sleep: The Mind\'s Playground',
        content:
          'REM sleep typically occurs after NREM stages. Characterized by:\n- Rapid eye movements (hence the name).\n- Increased brain activity, similar to wakefulness.\n- Vivid dreaming.\n- Temporary muscle paralysis (atonia) to prevent acting out dreams.\nREM sleep is vital for cognitive functions like learning, memory consolidation (especially procedural and spatial memory), and emotional regulation. Cycles get longer as the night progresses, with more REM sleep in the latter half.',
      },
      {
        id: 'why-both-matter',
        title: 'Why Do Both Matter?',
        content:
          "A healthy night's sleep involves cycling through all stages. Both deep sleep and REM sleep are essential for overall well-being. Disruptions to these cycles (e.g., due to stress, noise, or sleep disorders) can impact how rested you feel and your daytime functioning. Aiming for 4-6 full cycles per night is generally recommended for adults.",
      },
    ],
  },
  {
    title: 'The Impact of Sleep Debt: Are You Running on Empty?',
    icon: <Brain className="h-6 w-6 text-primary" />,
    sections: [
      {
        id: 'what-is-sleep-debt',
        title: 'What is Sleep Debt?',
        content:
          "Sleep debt, also known as sleep deficit, is the cumulative effect of not getting enough sleep. Think of it like a bank account: if you consistently 'withdraw' more sleep hours than you 'deposit,' you accrue debt. This isn't just about one bad night; it's the difference between the amount of sleep you need and the amount you actually get over days, weeks, or even months.",
      },
      {
        id: 'short-term-effects',
        title: 'Short-Term Effects of Sleep Debt',
        content:
          'Even a small sleep debt can have immediate consequences:\n- Reduced alertness and concentration.\n- Impaired memory and cognitive function.\n- Slower reaction times (dangerous for driving!).\n- Mood swings, irritability, and increased stress.\n- Decreased immune function, making you more susceptible to illness.',
      },
      {
        id: 'long-term-consequences',
        title: 'Long-Term Consequences of Sleep Debt',
        content:
          'Chronic sleep debt can lead to serious health problems:\n- Increased risk of obesity, diabetes, and cardiovascular disease.\n- Weakened immune system.\n- Higher risk of mental health disorders like depression and anxiety.\n- Accelerated aging.\n- Reduced overall quality of life and performance.',
      },
      {
        id: 'catching-up-on-sleep',
        title: '"Catching Up" on Sleep',
        content:
          "While you can't fully erase significant sleep debt with just one long weekend sleep-in, consistently prioritizing sufficient sleep can help. Naps can offer temporary relief for alertness, but they aren't a substitute for adequate nightly sleep. The best strategy is to establish a regular sleep schedule and aim for the recommended amount of sleep for your age group each night.",
      },
    ],
  },
  {
    title: 'Circadian Rhythms: Your Body\'s Internal Clock & Light',
    icon: <Brain className="h-6 w-6 text-primary" />,
    sections: [
      {
        id: 'what-are-circadian-rhythms',
        title: 'What are Circadian Rhythms?',
        content:
          "Circadian rhythms are natural, internal processes that regulate the sleep-wake cycle and repeat roughly every 24 hours. These rhythms are controlled by a 'master clock' in your brain, specifically in the suprachiasmatic nucleus (SCN) located in the hypothalamus. This internal clock influences hormone release, body temperature, eating habits, digestion, and, most notably, sleepiness and alertness.",
      },
      {
        id: 'influence-of-light',
        title: 'The Influence of Light',
        content:
          'Light is the primary external cue that synchronizes our circadian rhythms with the environment. Specialized cells in our eyes detect light and send signals to the SCN. \n- Morning Light: Exposure to bright light in the morning helps reinforce the natural wake cycle, suppresses melatonin (the sleep hormone), and boosts alertness.\n- Evening Light: As natural light fades, the SCN signals the pineal gland to produce melatonin, promoting sleepiness.',
      },
      {
        id: 'blue-light-modern-life',
        title: 'Blue Light and Modern Life',
        content:
          "Modern life exposes us to artificial light, especially blue light emitted from screens (phones, tablets, computers, TVs), well into the evening. This can disrupt our circadian rhythms by:\n- Suppressing melatonin production.\n- Delaying sleep onset.\n- Reducing sleep quality.\n- Shifting our internal clock, making it harder to wake up in the morning.",
      },
      {
        id: 'managing-light',
        title: 'Managing Light for Better Sleep',
        content:
          'To support healthy circadian rhythms:\n- Maximize bright light exposure during the day, especially in the morning.\n- Dim lights in the evening as you prepare for bed.\n- Limit screen time at least 1-2 hours before sleep, or use blue light filters/night mode settings.\n- Keep your bedroom dark for sleep. Consider blackout curtains if needed.\n- Maintain a consistent sleep-wake schedule, even on weekends, to help regulate your internal clock.',
      },
    ],
  },
];

export default function SleepSciencePage() {
  const t = useTranslations('SleepSciencePage'); 
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header /> 
      <main className="flex-grow container mx-auto px-4 py-10 md:py-16">
        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-3 flex items-center justify-center gap-3">
            <Brain className="h-8 w-8 sm:h-10 sm:w-10" />
            {t('title')}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="space-y-8">
          {articlesData.map((article, index) => (
            <ScienceArticle
              key={index}
              title={article.title} // These titles and contents are currently hardcoded in English
              icon={article.icon}
              sections={article.sections}
              defaultOpen={index === 0}
            />
          ))}
        </div>
      </main>
      <footer className="py-8 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/30">
        <p>
          <NextLink href="/" className="hover:text-primary transition-colors">{t('backToMainLink')}</NextLink>
        </p>
      </footer>
    </div>
  );
}
