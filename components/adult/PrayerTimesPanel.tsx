'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan';
import { useLocation } from '@/lib/location-context';
import { localState } from '@/lib/local-state';
import { useI18n } from '@/lib/i18n-context';
import styles from './PrayerTimesPanel.module.css';
import { calendarDateInTimeZone, formatPrayerTime, getDefaultTimeZone, isValidTimeZone } from '@/lib/prayer-date.mjs';

const METHODS = [
  ['MuslimWorldLeague', 'Muslim World League'], ['Egyptian', 'Egyptian General Authority'],
  ['Karachi', 'University of Islamic Sciences, Karachi'], ['UmmAlQura', 'Umm al-Qura'],
  ['Dubai', 'Dubai'], ['MoonsightingCommittee', 'Moonsighting Committee'],
  ['NorthAmerica', 'ISNA / North America'], ['Kuwait', 'Kuwait'], ['Qatar', 'Qatar'],
  ['Singapore', 'Singapore'], ['Tehran', 'Tehran'], ['Turkey', 'Turkey'], ['Other', 'Angles personnalisés'],
] as const;
type Method = typeof METHODS[number][0];
type Config = { method: Method | ''; fajr: number; isha: number; madhab: 'Shafi' | 'Hanafi'; adjustments: Record<string, number>; timeZone: string; mawaqitUrl: string; mawaqitConsent: boolean };
const DEFAULTS: Config = { method: '', fajr: 18, isha: 17, madhab: 'Shafi', adjustments: {}, timeZone: getDefaultTimeZone(), mawaqitUrl: '', mawaqitConsent: false };
const PRAYERS = [['fajr','Fajr'],['sunrise','Lever du soleil'],['dhuhr','Dhuhr'],['asr','Asr'],['maghrib','Maghrib'],['isha','Isha']] as const;
const methodIsValid = (value: unknown): value is Method => METHODS.some(([method]) => method === value);
function normalizeConfig(value: unknown): Config {
  if (!value || typeof value !== 'object') return DEFAULTS;
  const candidate = value as Partial<Config>;
  const adjustments: Record<string, number> = {};
  for (const [key] of PRAYERS) {
    const amount = candidate.adjustments?.[key];
    if (typeof amount === 'number' && Number.isFinite(amount)) adjustments[key] = Math.max(-30, Math.min(30, amount));
  }
  return {
    method: methodIsValid(candidate.method) ? candidate.method : '',
    fajr: typeof candidate.fajr === 'number' && Number.isFinite(candidate.fajr) ? Math.max(0, Math.min(30, candidate.fajr)) : DEFAULTS.fajr,
    isha: typeof candidate.isha === 'number' && Number.isFinite(candidate.isha) ? Math.max(0, Math.min(30, candidate.isha)) : DEFAULTS.isha,
    madhab: candidate.madhab === 'Hanafi' ? 'Hanafi' : 'Shafi',
    adjustments,
    timeZone: isValidTimeZone(candidate.timeZone) ? candidate.timeZone! : getDefaultTimeZone(),
    mawaqitUrl: typeof candidate.mawaqitUrl === 'string' ? candidate.mawaqitUrl.slice(0, 2048) : '',
    mawaqitConsent: false,
  };
}

export default function PrayerTimesPanel() {
  const { language } = useI18n();
  const { coords, city, requestLocation, setManualLocation, error: locationError } = useLocation();
  const [config, setConfig] = useState<Config>(DEFAULTS);
  const [lat, setLat] = useState(''); const [lng, setLng] = useState(''); const [place, setPlace] = useState('');
  const [timeZoneDraft, setTimeZoneDraft] = useState(DEFAULTS.timeZone);
  const [editing, setEditing] = useState(false);
  const [now, setNow] = useState(new Date());
  const [frameConsent, setFrameConsent] = useState(false);
  useEffect(() => {
    try { const saved = localState.getItem('minarah-prayer-config'); if (saved) setConfig(normalizeConfig(JSON.parse(saved))); } catch { /* Keep defaults if corrupt. */ }
    const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { if (coords) { setLat(String(coords.lat)); setLng(String(coords.lng)); setPlace(city || ''); } }, [coords, city]);
  useEffect(() => { setTimeZoneDraft(config.timeZone); }, [config.timeZone]);
  const save = (patch: Partial<Config>) => setConfig(current => { const next = { ...current, ...patch }; localState.setItem('minarah-prayer-config', JSON.stringify(next)); return next; });
  const calculations = useMemo(() => {
    if (!coords || !config.method) return null;
    const params = CalculationMethod[config.method]();
    if (config.method === 'Other') { params.fajrAngle = config.fajr; params.ishaAngle = config.isha; }
    params.madhab = config.madhab === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;
    const prayerDate = calendarDateInTimeZone(now, config.timeZone);
    const timings = new PrayerTimes(new Coordinates(coords.lat, coords.lng), prayerDate, params);
    return { timings, params };
  }, [coords, config, now]);
  const saveManual = () => setManualLocation(Number(lat), Number(lng), place.trim() || 'Lieu personnalisé');
  const safeMawaqitUrl = (() => { try { const url = new URL(config.mawaqitUrl); return url.protocol === 'https:' && (url.hostname === 'mawaqit.net' || url.hostname.endsWith('.mawaqit.net')) ? url.toString() : null; } catch { return null; } })();
  const t = (fr: string, en: string, ar: string) => language === 'fr' ? fr : language === 'ar' ? ar : en;
  return <section className={styles.panel} aria-label={t('Horaires de prière','Prayer times','مواقيت الصلاة')}>
    <header className={styles.header}><div><p className={styles.eyebrow}>{t('CALCUL SUR CET APPAREIL','CALCULATED ON THIS DEVICE','حساب على هذا الجهاز')}</p><h2>{t('Horaires de prière','Prayer times','مواقيت الصلاة')}</h2><p>{city || t('Lieu non défini','Location not set','لم يتم تحديد الموقع')}</p></div><button type="button" onClick={() => setEditing(!editing)}>{editing ? t('Fermer','Close','إغلاق') : t('Régler','Configure','إعداد')}</button></header>
    {!coords || !config.method ? <p className={styles.notice}>{!coords ? t('Choisis un lieu ou autorise la géolocalisation.','Choose a location or allow geolocation.','اختر موقعًا أو اسمح بتحديد الموقع.') : t('Choisis une méthode de calcul pour afficher les horaires.','Choose a calculation method to show prayer times.','اختر طريقة الحساب لعرض المواقيت.')}</p> : <div className={styles.times}>{PRAYERS.map(([key,label]) => { const date = calculations?.timings[key as keyof PrayerTimes]; const adjusted = date instanceof Date ? new Date(date.getTime() + (config.adjustments[key] || 0) * 60_000) : null; return <div key={key} className={styles.time}><span>{t(label, label, ({Fajr:'الفجر', 'Lever du soleil':'الشروق', Dhuhr:'الظهر', Asr:'العصر', Maghrib:'المغرب', Isha:'العشاء'} as Record<string,string>)[label])}</span><strong>{adjusted ? formatPrayerTime(adjusted, config.timeZone, language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-SA' : 'en-US') : '—'}</strong></div>; })}</div>}
    {calculations && <p className={styles.method}>{METHODS.find(([key]) => key === config.method)?.[1]} · {t('Fajr','Fajr','الفجر')} {calculations.params.fajrAngle}° · {t('Isha','Isha','العشاء')} {calculations.params.ishaAngle}° · {config.madhab}</p>}
    {editing && <div className={styles.settings}>
      <label>{t('Méthode de calcul','Calculation method','طريقة الحساب')}<select value={config.method} onChange={e => save({ method: e.target.value as Method | '' })}><option value="">{t('Choisir…','Choose…','اختر…')}</option>{METHODS.map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      {config.method === 'Other' && <div className={styles.row}><label>Angle Fajr<input type="number" min="0" max="30" step="0.1" value={config.fajr} onChange={e => save({ fajr: Number(e.target.value) })}/></label><label>Angle Isha<input type="number" min="0" max="30" step="0.1" value={config.isha} onChange={e => save({ isha: Number(e.target.value) })}/></label></div>}
      <label>{t('Jurisprudence pour Asr','Asr madhab','مذهب العصر')}<select value={config.madhab} onChange={e => save({ madhab: e.target.value as Config['madhab'] })}><option value="Shafi">Shafi, Maliki, Hanbali</option><option value="Hanafi">Hanafi</option></select></label>
      <label>{t('Fuseau horaire du lieu','Location time zone','المنطقة الزمنية للموقع')}<input value={timeZoneDraft} placeholder="Europe/Paris" onChange={e => setTimeZoneDraft(e.target.value)}/><small>{t('Nom IANA, par exemple Europe/Paris ou America/Montreal.','IANA name, for example Europe/Paris or America/Montreal.','اسم IANA، مثل Europe/Paris أو America/Montreal.')}</small></label><button type="button" disabled={!isValidTimeZone(timeZoneDraft)} onClick={() => save({ timeZone: timeZoneDraft })}>{t('Appliquer le fuseau','Apply time zone','تطبيق المنطقة الزمنية')}</button>
      <p className={styles.subheading}>{t('Corrections (minutes)','Adjustments (minutes)','التعديلات (بالدقائق)')}</p><div className={styles.adjustments}>{PRAYERS.filter(([key]) => key !== 'sunrise').map(([key,label]) => <label key={key}>{label}<input type="number" min="-30" max="30" value={config.adjustments[key] || 0} onChange={e => save({ adjustments: { ...config.adjustments, [key]: Number(e.target.value) } })}/></label>)}</div>
      <div className={styles.row}><label>Latitude<input type="number" min="-90" max="90" step="0.0001" value={lat} onChange={e => setLat(e.target.value)}/></label><label>Longitude<input type="number" min="-180" max="180" step="0.0001" value={lng} onChange={e => setLng(e.target.value)}/></label></div><label>{t('Nom du lieu','Place name','اسم الموقع')}<input value={place} onChange={e => setPlace(e.target.value)} /></label><button type="button" onClick={saveManual}>{t('Enregistrer ce lieu','Save this location','حفظ الموقع')}</button><button type="button" onClick={requestLocation}>{t('Utiliser le GPS (avec autorisation)','Use GPS (with permission)','استخدام GPS (بإذن)')}</button>{locationError && <p role="status">{locationError}</p>}
      <div className={styles.mawaqit}><strong>Mawaqit</strong><p>{t('Colle le lien du widget officiel de ta mosquée. Aucune coordonnée ne lui est transmise.','Paste your mosque’s official widget link. No coordinates are sent.','أدخل رابط أداة المسجد الرسمية. لا يتم إرسال إحداثيات.')}</p><input type="url" placeholder="https://mawaqit.net/..." value={config.mawaqitUrl} onChange={e => save({ mawaqitUrl: e.target.value, mawaqitConsent: false })}/><label className={styles.consent}><input type="checkbox" checked={frameConsent} onChange={e => setFrameConsent(e.target.checked)}/>{t('Autoriser le chargement du widget externe','Allow the external widget to load','السماح بتحميل الأداة الخارجية')}</label>{frameConsent && safeMawaqitUrl && <iframe title="Mawaqit" src={safeMawaqitUrl} loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups" className={styles.frame}/>}</div>
    </div>}
  </section>;
}
