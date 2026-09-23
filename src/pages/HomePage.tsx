import { Hero } from './home/Hero';
import { TickerStrip } from './home/TickerStrip';
import { Rooms } from './home/Rooms';
import { LearningPath } from './home/LearningPath';
import { LessonShowcase } from './home/LessonShowcase';
import { HonestyBand, FinalCta } from './home/Bands';
import { useEngineSnapshot } from './home/useEngineSnapshot';

export function HomePage() {
  const snapshot = useEngineSnapshot();
  return (
    <>
      <Hero />
      <TickerStrip rows={snapshot?.ticker ?? null} />
      <Rooms snapshot={snapshot} />
      <LearningPath />
      <LessonShowcase />
      <HonestyBand />
      <FinalCta />
    </>
  );
}
