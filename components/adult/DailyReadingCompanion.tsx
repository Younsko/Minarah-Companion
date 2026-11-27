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
type PlanDuration = 30 | 60 | 90;
type PlanPassage = { day: number; juz: number; part: number; parts: number; from: { surah: number; ayah: number }; to: { surah: number; ayah: number }; verseCount: number };
type ReadingPlanData = { plans: Record<string, PlanPassage[]> };
type ActivePlan = { duration: PlanDuration; completedDays: number[] };
const GOALS = [5, 10, 15] as const;
const PLAN_DURATIONS: PlanDuration[] = [30, 60, 90];
const GOAL_KEY = 'minarah-reading-intention-minutes';
const DAYS_KEY = 'minarah-reading-days';
const BOOKMARK_KEY = 'muslim-life-quran-bookmark';
const PLAN_KEY = 'minarah-quran-reading-plan';

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
  const [planData, setPlanData] = useState<ReadingPlanData | null>(null);
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<PlanDuration>(30);
  const [showPlanChoices, setShowPlanChoices] = useState(false);
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
    try {
      const savedPlan = localState.getItem(PLAN_KEY);
      const parsed = savedPlan ? JSON.parse(savedPlan) as Partial<ActivePlan> : null;
      if (parsed && PLAN_DURATIONS.includes(parsed.duration as PlanDuration) && Array.isArray(parsed.completedDays)) {
        const completed = parsed.completedDays.filter(day => Number.isInteger(day) && day >= 1 && day <= parsed.duration!);
        const plan = { duration: parsed.duration as PlanDuration, completedDays: [...new Set(completed)] };
        setActivePlan(plan);
        setSelectedDuration(plan.duration);
      } else {
        setShowPlanChoices(true);
      }
    } catch { setShowPlanChoices(true); }
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
    const controller = new AbortController();
    fetch('/data/quran/reading-plans.json', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Reading plan metadata unavailable'); return response.json(); })
      .then(data => setPlanData(data as ReadingPlanData))
      .catch(() => { if (!controller.signal.aborted) setPlanData(null); });
    return () => controller.abort();
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
  const weekSummaryLabel = `${completedThisWeek} ${french ? 'sur 7 des derniers jours' : arabic ? 'من آخر ٧ أيام' : 'of the last 7 days'}`;
  const markedToday = completedDays[today] === true;
  const planPassages = activePlan ? planData?.plans[String(activePlan.duration)] || [] : [];
  const nextPlanPassage = activePlan ? planPassages.find(passage => !activePlan.completedDays.includes(passage.day)) || null : null;
  const completedPlanCount = activePlan?.completedDays.length || 0;
  const planComplete = !!activePlan && completedPlanCount >= activePlan.duration;

  const openBookmark = () => {
    window.dispatchEvent(new CustomEvent('navigate-to-quran', {
      detail: bookmark ? { surahNumber: bookmark.surahNumber, ayahNumber: bookmark.ayahNumber } : undefined,
    }));
  };

  const startPlan = () => {
    if (activePlan && !window.confirm(french ? 'Recommencer ce parcours effacera sa progression. Continuer ?' : arabic ? 'ستؤدي إعادة البدء إلى مسح تقدم المسار. هل تريد المتابعة؟' : 'Restarting this plan will reset its progress. Continue?')) return;
    const plan: ActivePlan = { duration: selectedDuration, completedDays: [] };
    setActivePlan(plan);
    localState.setItem(PLAN_KEY, JSON.stringify(plan));
    setShowPlanChoices(false);
  };

  const openPlanPassage = () => {
    if (!nextPlanPassage) return;
    window.dispatchEvent(new CustomEvent('navigate-to-quran', {
      detail: { surahNumber: nextPlanPassage.from.surah, ayahNumber: nextPlanPassage.from.ayah },
    }));
  };

  const toggleToday = () => {
    const isReadingDone = activePlan ? false : markedToday;
    const updated = { ...completedDays, [today]: !isReadingDone };
    const earliest = week[0];
    for (const day of Object.keys(updated)) if (day < earliest) delete updated[day];
    setCompletedDays(updated);
    localState.setItem(DAYS_KEY, JSON.stringify(updated));
    if (activePlan && nextPlanPassage) {
      const completed = new Set(activePlan.completedDays);
      if (completed.has(nextPlanPassage.day)) completed.delete(nextPlanPassage.day);
      else completed.add(nextPlanPassage.day);
      const updatedPlan = { ...activePlan, completedDays: [...completed].sort((a, b) => a - b) };
      setActivePlan(updatedPlan);
      localState.setItem(PLAN_KEY, JSON.stringify(updatedPlan));
    }
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
    planTitle: french ? 'Parcours du Coran' : arabic ? 'مسار قراءة القرآن' : 'Quran reading path',
    planDescription: french ? 'Choisis 30, 60 ou 90 jours. Les repères suivent les juz du texte intégré; les portions sont découpées par nombre de versets, pas par durée de lecture.' : arabic ? 'اختر ٣٠ أو ٦٠ أو ٩٠ يومًا. تتبع المواضع أجزاء النص المضمّن، وتُقسّم المقاطع حسب عدد الآيات لا مدة القراءة.' : 'Choose 30, 60, or 90 days. References follow the bundled juz markers; portions are split by verse count, not estimated reading time.',
    beginPlan: french ? 'Commencer le parcours' : arabic ? 'ابدأ المسار' : 'Start this path',
    changePace: french ? 'Changer de rythme' : arabic ? 'تغيير الوتيرة' : 'Change pace',
    restartPlan: french ? 'Recommencer avec ce rythme' : arabic ? 'إعادة البدء بهذه الوتيرة' : 'Restart with this pace',
    days: french ? 'jours' : arabic ? 'أيام' : 'days',
    part: french ? 'Étape' : arabic ? 'الخطوة' : 'Step',
    readPassage: french ? 'Lire ce passage' : arabic ? 'اقرأ هذا المقطع' : 'Read this passage',
    passageDone: french ? 'J’ai lu cette partie' : arabic ? 'قرأت هذا الجزء' : 'I read this part',
    todayDone: french ? 'J’ai lu aujourd’hui' : arabic ? 'قرأت اليوم' : 'I read today',
    planComplete: french ? 'Parcours terminé · tu peux le refaire à ton rythme.' : arabic ? 'اكتمل المسار · يمكنك إعادته على وتيرتك.' : 'Path complete · you can begin again whenever you like.',
    loadingPlan: french ? 'Préparation des repères de lecture…' : arabic ? 'جارٍ تجهيز مواضع القراءة…' : 'Preparing reading references…',
    planUnavailable: french ? 'Le parcours est indisponible hors connexion. Le reste de ta bibliothèque reste accessible.' : arabic ? 'المسار غير متاح دون اتصال. تبقى مكتبتك متاحة.' : 'The reading path is unavailable offline. Your library remains available.',
    ranges: french ? ['juz par jour', '½ juz par jour', '⅓ juz par jour'] : arabic ? ['جزء يوميًا', 'نصف جزء يوميًا', 'ثلث جزء يوميًا'] : ['juz a day', '½ juz a day', '⅓ juz a day'],
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

      <div className={styles.planSection}>
        <div className={styles.planHeading}>
          <strong>{labels.planTitle}</strong>
          <span>{labels.planDescription}</span>
        </div>
        {!activePlan || showPlanChoices ? <>
          <div className={styles.planChoices} role="group" aria-label={labels.planTitle}>
            {PLAN_DURATIONS.map((duration, index) => <button key={duration} type="button" aria-pressed={selectedDuration === duration} className={selectedDuration === duration ? styles.planActive : undefined} onClick={() => setSelectedDuration(duration)}>
              <strong>{duration} {labels.days}</strong><span>{labels.ranges[index]}</span>
            </button>)}
          </div>
          <button type="button" className={styles.planAction} disabled={!planData} onClick={startPlan}>
            {activePlan ? labels.restartPlan : labels.beginPlan}
          </button>
        </> : <>
          <div className={styles.planProgressHeader}>
            <span>{planComplete ? labels.planComplete : `${labels.part} ${completedPlanCount + 1}/${activePlan.duration} · ${labels.ranges[PLAN_DURATIONS.indexOf(activePlan.duration)]}`}</span>
            <strong>{completedPlanCount}/{activePlan.duration}</strong>
          </div>
          <div className={styles.planProgress}><span style={{ width: `${(completedPlanCount / activePlan.duration) * 100}%` }} /></div>
          {planComplete ? <button type="button" className={styles.planAction} onClick={() => { setSelectedDuration(activePlan.duration); setShowPlanChoices(true); }}>{labels.changePace}</button> : nextPlanPassage ? <div className={styles.passageRow}>
            <div className={styles.passageInfo}>
              <strong>{`Juz ${nextPlanPassage.juz}${nextPlanPassage.parts > 1 ? ` · ${nextPlanPassage.part}/${nextPlanPassage.parts}` : ''}`}</strong>
              <span>{`${french ? 'Sourate' : arabic ? 'سورة' : 'Surah'} ${nextPlanPassage.from.surah}, ${french ? 'verset' : arabic ? 'آية' : 'verse'} ${nextPlanPassage.from.ayah} → ${french ? 'sourate' : arabic ? 'سورة' : 'surah'} ${nextPlanPassage.to.surah}, ${french ? 'verset' : arabic ? 'آية' : 'verse'} ${nextPlanPassage.to.ayah} · ${nextPlanPassage.verseCount} ${french ? 'versets' : arabic ? 'آية' : 'verses'}`}</span>
            </div>
            <button type="button" className={styles.planAction} onClick={openPlanPassage}>{labels.readPassage}</button>
            <button type="button" className={styles.changePlanButton} onClick={() => { setSelectedDuration(activePlan.duration); setShowPlanChoices(true); }}>{labels.changePace}</button>
          </div> : <p className={styles.planMessage}>{planData ? labels.planComplete : labels.loadingPlan}</p>}
        </>}
        {activePlan && showPlanChoices && <button type="button" className={styles.changePlanButton} onClick={() => { setShowPlanChoices(false); setSelectedDuration(activePlan.duration); }}>{french ? 'Garder le parcours en cours' : arabic ? 'العودة إلى المسار الحالي' : 'Keep current path'}</button>}
        {!planData && <span className={styles.planOffline}>{labels.planUnavailable}</span>}
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
          <div className={styles.weekDots} role="img" aria-label={weekSummaryLabel}>
            {week.map(day => <span key={day} className={completedDays[day] ? styles.dayDone : styles.dayDot} title={day} />)}
          </div>
        </div>
      </div>

      <div className={styles.markRow}>
        <span className={activePlan ? styles.encouragement : (markedToday ? styles.markedMessage : styles.encouragement)}>{activePlan ? (planComplete ? labels.planComplete : labels.notStreak) : (markedToday ? labels.marked : labels.notStreak)}</span>
        <button type="button" onClick={toggleToday} aria-pressed={activePlan ? false : markedToday} className={!activePlan && markedToday ? styles.doneButton : styles.markButton} disabled={activePlan ? planComplete || !nextPlanPassage : false}>
          {!activePlan && markedToday && <Check size={15} aria-hidden="true" />}{activePlan ? (planComplete ? labels.planComplete : labels.passageDone) : labels.todayDone}
        </button>
      </div>
    </section>
  );
}
