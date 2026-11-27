'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, Clock3 } from 'lucide-react';
import tzLookup from '@photostructure/tz-lookup';
import { localState } from '@/lib/local-state';
import { useI18n } from '@/lib/i18n-context';
import { useLocation } from '@/lib/location-context';
import { calendarDayKeyInTimeZone, isValidTimeZone } from '@/lib/prayer-date.mjs';
import styles from './DailyReadingCompanion.module.css';

type ReadingBookmark = { surahNumber: number; surahName: string; ayahNumber: number };
type PrayerConfig = { timeZone?: string; timeZoneMode?: 'auto' | 'manual' };
const GOALS = [5, 10, 15] as const;
const GOAL_KEY = 'minarah-reading-intention-minutes';
const DAYS_KEY = 'minarah-reading-days';
const BOOKMARK_KEY = 'muslim-life-quran-bookmark';

function shiftDay(dayKey: string, offset: number) {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10);
}

function safeBookmark(raw: string | null): ReadingBookmark | null {
  try {
    const value = raw ? JSON.parse(raw) as Partial<ReadingBookmark> : null;
    if (!value || !Number.isInteger(value.surahNumber) || !Number.isInteger(value.ayahNumber) || value.surahNumber! < 1 || value.surahNumber! > 114 || value.ayahNumber! < 1) return null;
    return { surahNumber: value.surahNumber!, surahName: typeof value.surahName === 'string' ? value.surahName : `Sourate ${value.surahNumber}`, ayahNumber: value.ayahNumber! };
  } catch { return null; }
}

export default function DailyReadingCompanion() {
  const { language } = useI18n();
  const { coords } = useLocation();
  const [bookmark, setBookmark] = useState<ReadingBookmark | null>(null);
  const [goal, setGoal] = useState<number>(10);
  const [completedDays, setCompletedDays] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(() => new Date());
  const [manualTimeZone, setManualTimeZone] = useState<string | null>(null);
  const french = language === 'fr';
  const arabic = language === 'ar';

  useEffect(() => {
    setBookmark(safeBookmark(localState.getItem(BOOKMARK_KEY)));
    const storedGoal = Number(localState.getItem(GOAL_KEY));
    if (GOALS.includes(storedGoal as typeof GOALS[number])) setGoal(storedGoal);
    try {
      const rawDays = localState.getItem(DAYS_KEY);
      const parsed = rawDays ? JSON.parse(rawDays) as Record<string, boolean> : {};
      setCompletedDays(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
    } catch { setCompletedDays({}); }
    const updateTimeZone = () => {
      try {
        const config = JSON.parse(localState.getItem('minarah-prayer-config') || '{}') as PrayerConfig;
        setManualTimeZone(config.timeZoneMode === 'manual' && isValidTimeZone(config.timeZone) ? config.timeZone! : null);
      } catch { setManualTimeZone(null); }
    };
    updateTimeZone();
    window.addEventListener('minarah-prayer-config-updated', updateTimeZone);
    return () => window.removeEventListener('minarah-prayer-config-updated', updateTimeZone);
  }, []);

  useEffect(() => {
    const updateBookmark = () => setBookmark(safeBookmark(localState.getItem(BOOKMARK_KEY)));
    window.addEventListener('storage', updateBookmark);
    window.addEventListener('minarah-reading-progress-updated', updateBookmark);
    return () => {
      window.removeEventListener('storage', updateBookmark);
      window.removeEventListener('minarah-reading-progress-updated', updateBookmark);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const timeZone = useMemo(() => {
    if (manualTimeZone) return manualTimeZone;
    if (coords) {
      try { return tzLookup(coords.lat, coords.lng); }
      catch { /* Use the device's zone when lookup fails. */ }
    }
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }, [coords, manualTimeZone]);
  const today = calendarDayKeyInTimeZone(now, timeZone);
  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => shiftDay(today, index - 6)), [today]);
  const completedThisWeek = week.filter(day => completedDays[day]).length;
  const markedToday = completedDays[today] === true;

  const openBookmark = () => {
    window.dispatchEvent(new CustomEvent('navigate-to-quran', {
      detail: bookmark ? { surahNumber: bookmark.surahNumber, ayahNumber: bookmark.ayahNumber } : undefined,
    }));
  };

  const toggleToday = () => {
    const updated = { ...completedDays, [today]: !markedToday };
    const earliest = week[0];
    for (const day of Object.keys(updated)) if (day < earliest) delete updated[day];
    setCompletedDays(updated);
    localState.setItem(DAYS_KEY, JSON.stringify(updated));
  };

  const labels = {
    title: french ? 'Mon rythme de lecture' : arabic ? 'وتيرة قراءتي' : 'My reading rhythm',
    intro: french ? 'Une petite intention, à ton rythme. Ta lecture reste enregistrée sur cet appareil.' : arabic ? 'نية بسيطة، على وتيرتك. تبقى قراءتك محفوظة على هذا الجهاز.' : 'A small intention, at your pace. Your reading stays saved on this device.',
    goal: french ? 'Mon intention quotidienne' : arabic ? 'نيتي اليومية' : 'My daily intention',
    min: french ? 'min' : arabic ? 'د' : 'min',
    resume: french ? 'Reprendre ma lecture' : arabic ? 'متابعة قراءتي' : 'Resume reading',
    start: french ? 'Ouvrir le Coran' : arabic ? 'افتح القرآن' : 'Open Quran',
    lastRead: french ? 'Dernier repère' : arabic ? 'آخر موضع' : 'Last position',
    thisWeek: french ? 'Moments de lecture · 7 derniers jours' : arabic ? 'جلسات القراءة · آخر ٧ أيام' : 'Reading moments · last 7 days',
    done: french ? 'J’ai lu aujourd’hui' : arabic ? 'قرأت اليوم' : 'I read today',
    marked: french ? 'Moment de lecture noté' : arabic ? 'تم تسجيل القراءة' : 'Reading moment marked',
    noBookmark: french ? 'Ton repère apparaîtra ici après ta première lecture.' : arabic ? 'سيظهر موضعك هنا بعد قراءتك الأولى.' : 'Your reading position will appear here after your first session.',
    notStreak: french ? 'Pas de série à tenir, juste un repère pour t’aider à revenir.' : arabic ? 'لا توجد سلسلة للحفاظ عليها، فقط تذكير لطيف للعودة.' : 'No streak to maintain, just a gentle way to find your way back.',
  };

  return (
    <section className={styles.companion} aria-labelledby="reading-companion-title" dir={arabic ? 'rtl' : 'ltr'}>
      <div className={styles.header}>
        <div className={styles.icon}><BookOpen size={19} aria-hidden="true" /></div>
        <div className={styles.heading}>
          <h3 id="reading-companion-title">{labels.title}</h3>
          <p>{labels.intro}</p>
        </div>
      </div>

      <div className={styles.resumeRow}>
        <div className={styles.bookmark}>
          <span className={styles.eyebrow}>{labels.lastRead}</span>
          <strong>{bookmark ? `${bookmark.surahName} · ${french ? 'verset' : arabic ? 'آية' : 'verse'} ${bookmark.ayahNumber}` : labels.noBookmark}</strong>
        </div>
        <button type="button" className={styles.resumeButton} onClick={openBookmark}>
          <span>{bookmark ? labels.resume : labels.start}</span>
        </button>
      </div>

      <div className={styles.footer}>
        <div className={styles.goalBlock}>
          <span className={styles.eyebrow}><Clock3 size={14} aria-hidden="true" />{labels.goal}</span>
          <div className={styles.goalChoices} role="group" aria-label={labels.goal}>
            {GOALS.map(minutes => <button key={minutes} type="button" aria-pressed={goal === minutes} className={goal === minutes ? styles.goalActive : undefined} onClick={() => { setGoal(minutes); localState.setItem(GOAL_KEY, String(minutes)); }}>{minutes} {labels.min}</button>)}
          </div>
        </div>

        <div className={styles.weekBlock}>
          <div className={styles.weekHeading}><span className={styles.eyebrow}>{labels.thisWeek}</span><strong>{completedThisWeek}/7</strong></div>
          <div className={styles.weekDots} role="img" aria-label={`${completedThisWeek} ${french ? 'sur 7 des derniers jours' : arabic ? 'من آخر ٧ أيام' : 'of the last 7 days'}`}>
            {week.map(day => <span key={day} className={completedDays[day] ? styles.dayDone : styles.dayDot} title={day} />)}
          </div>
        </div>
      </div>

      <div className={styles.markRow}>
        <span className={markedToday ? styles.markedMessage : styles.encouragement}>{markedToday ? labels.marked : labels.notStreak}</span>
        <button type="button" onClick={toggleToday} aria-pressed={markedToday} className={markedToday ? styles.doneButton : styles.markButton}>
          {markedToday && <Check size={15} aria-hidden="true" />}{labels.done}
        </button>
      </div>
    </section>
  );
}
