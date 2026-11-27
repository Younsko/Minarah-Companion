'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan';
import tzLookup from '@photostructure/tz-lookup';
import { useLocation } from '@/lib/location-context';
import { localState } from '@/lib/local-state';
import { useI18n } from '@/lib/i18n-context';
import PrayerChecklist from './PrayerChecklist';
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
type Config = { method: Method | ''; fajr: number; isha: number; madhab: 'Shafi' | 'Hanafi'; adjustments: Record<string, number>; timeZone: string; timeZoneMode: 'auto' | 'manual'; mawaqitUrl: string; mawaqitConsent: boolean };
type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
type PlaceResult = { lat: number; lon: number; label: string };
const DEFAULTS: Config = { method: '', fajr: 18, isha: 17, madhab: 'Shafi', adjustments: {}, timeZone: getDefaultTimeZone(), timeZoneMode: 'auto', mawaqitUrl: '', mawaqitConsent: false };
const PRAYERS = [['fajr','Fajr'],['dhuhr','Dhuhr'],['asr','Asr'],['maghrib','Maghrib'],['isha','Isha']] as const;
const methodIsValid = (value: unknown): value is Method => METHODS.some(([method]) => method === value);

function normalizeConfig(value: unknown): Config {
  if (!value || typeof value !== 'object') return DEFAULTS;
  const candidate = value as Partial<Config>;
  const adjustments: Record<string, number> = {};
  for (const [key] of PRAYERS) {
    const amount = candidate.adjustments?.[key];
    if (typeof amount === 'number' && Number.isFinite(amount)) adjustments[key] = Math.max(-30, Math.min(30, amount));
  }
  const timeZone = isValidTimeZone(candidate.timeZone) ? candidate.timeZone! : DEFAULTS.timeZone;
  return {
    method: methodIsValid(candidate.method) ? candidate.method : '',
    fajr: typeof candidate.fajr === 'number' && Number.isFinite(candidate.fajr) ? Math.max(0, Math.min(30, candidate.fajr)) : DEFAULTS.fajr,
    isha: typeof candidate.isha === 'number' && Number.isFinite(candidate.isha) ? Math.max(0, Math.min(30, candidate.isha)) : DEFAULTS.isha,
    madhab: candidate.madhab === 'Hanafi' ? 'Hanafi' : 'Shafi',
    adjustments,
    timeZone,
    timeZoneMode: candidate.timeZoneMode === 'manual' || candidate.timeZoneMode === 'auto' ? candidate.timeZoneMode : timeZone === DEFAULTS.timeZone ? 'auto' : 'manual',
    mawaqitUrl: typeof candidate.mawaqitUrl === 'string' ? candidate.mawaqitUrl.slice(0, 2048) : '',
    mawaqitConsent: false,
  };
}

function resultLabel(properties: Record<string, unknown>) {
  const first = [properties.name, properties.housenumber, properties.street].filter((part): part is string => typeof part === 'string' && !!part.trim());
  const rest = [properties.postcode, properties.city, properties.town, properties.village, properties.state, properties.country]
    .filter((part): part is string => typeof part === 'string' && !!part.trim());
  return [...new Set([...first, ...rest])].join(', ');
}

function countdown(target: Date, now: Date) {
  const totalSeconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function PrayerTimesPanel() {
  const { language } = useI18n();
  const { coords, city, requestLocation, setManualLocation, error: locationError } = useLocation();
  const [config, setConfig] = useState<Config>(DEFAULTS);
  const [lat, setLat] = useState(''); const [lng, setLng] = useState(''); const [place, setPlace] = useState('');
  const [addressQuery, setAddressQuery] = useState('');
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [addressError, setAddressError] = useState('');
  const [searching, setSearching] = useState(false);
  const [timeZoneDraft, setTimeZoneDraft] = useState(DEFAULTS.timeZone);
  const [editing, setEditing] = useState(false);
  const [now, setNow] = useState(new Date());
  const [frameConsent, setFrameConsent] = useState(false);
  useEffect(() => {
    try { const saved = localState.getItem('minarah-prayer-config'); if (saved) setConfig(normalizeConfig(JSON.parse(saved))); } catch { /* Keep defaults if corrupt. */ }
    const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { if (coords) { setLat(String(coords.lat)); setLng(String(coords.lng)); setPlace(city || ''); } }, [coords, city]);
  const save = (patch: Partial<Config>) => setConfig(current => { const next = { ...current, ...patch }; localState.setItem('minarah-prayer-config', JSON.stringify(next)); return next; });
  const detectedTimeZone = useMemo(() => {
    if (!coords) return config.timeZone;
    try { return tzLookup(coords.lat, coords.lng); }
    catch { return config.timeZone; }
  }, [coords, config.timeZone]);
  const activeTimeZone = config.timeZoneMode === 'auto' ? detectedTimeZone : config.timeZone;
  const dateInPrayerZone = calendarDateInTimeZone(now, activeTimeZone);
  const prayerDayKey = `${dateInPrayerZone.getFullYear()}-${dateInPrayerZone.getMonth() + 1}-${dateInPrayerZone.getDate()}`;
  const calculations = useMemo(() => {
    if (!coords || !config.method) return null;
    const params = CalculationMethod[config.method]();
    if (config.method === 'Other') { params.fajrAngle = config.fajr; params.ishaAngle = config.isha; }
    params.madhab = config.madhab === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;
    const [year, month, day] = prayerDayKey.split('-').map(Number);
    const prayerDate = new Date(year, month - 1, day);
    const timings = new PrayerTimes(new Coordinates(coords.lat, coords.lng), prayerDate, params);
    const addAdjustment = (key: string, date: Date) => new Date(date.getTime() + (config.adjustments[key] || 0) * 60_000);
    const labels = Object.fromEntries(PRAYERS.map(([key]) => [key, addAdjustment(key, timings[key])])) as Record<PrayerKey, Date>;
    const nextDate = new Date(prayerDate.getFullYear(), prayerDate.getMonth(), prayerDate.getDate() + 1);
    const tomorrow = new PrayerTimes(new Coordinates(coords.lat, coords.lng), nextDate, params);
    const candidates = [...PRAYERS.map(([key]) => ({ key, date: labels[key] })), { key: 'fajr' as const, date: addAdjustment('fajr', tomorrow.fajr) }];
    return { timings, params, labels, candidates };
  }, [coords, config, prayerDayKey, activeTimeZone]);
  const saveManual = () => setManualLocation(Number(lat), Number(lng), place.trim() || 'Lieu personnalisé');
  const searchAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = addressQuery.trim();
    if (query.length < 3) { setAddressError(t('Saisis au moins 3 caractères.','Enter at least 3 characters.','أدخل ثلاثة أحرف على الأقل.')); return; }
    setSearching(true); setAddressError(''); setPlaces([]);
    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=${language === 'ar' ? 'en' : language}`);
      if (!response.ok) throw new Error('search');
      const data = await response.json() as { features?: Array<{ geometry?: { coordinates?: [number, number] }; properties?: Record<string, unknown> }> };
      const results = (data.features || []).flatMap(feature => {
        const coordinates = feature.geometry?.coordinates;
        const properties = feature.properties || {};
        const label = resultLabel(properties);
        if (!coordinates || !label || !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) return [];
        return [{ lat: coordinates[1], lon: coordinates[0], label }];
      });
      setPlaces(results);
      if (!results.length) setAddressError(t('Aucun résultat. Essaie avec la ville et le pays.','No results. Try adding the city and country.','لا توجد نتائج. أضف المدينة والبلد.'));
    } catch { setAddressError(t('Recherche indisponible. Vérifie ta connexion ou saisis les coordonnées.','Search is unavailable. Check your connection or enter coordinates.','البحث غير متاح. تحقق من الاتصال أو أدخل الإحداثيات.')); }
    finally { setSearching(false); }
  };
  const choosePlace = (result: PlaceResult) => { setLat(String(result.lat)); setLng(String(result.lon)); setPlace(result.label); setAddressQuery(result.label); setPlaces([]); setManualLocation(result.lat, result.lon, result.label); };
  const safeMawaqitUrl = (() => { try { const url = new URL(config.mawaqitUrl); return url.protocol === 'https:' && (url.hostname === 'mawaqit.net' || url.hostname.endsWith('.mawaqit.net')) ? url.toString() : null; } catch { return null; } })();
  const t = (fr: string, en: string, ar: string) => language === 'fr' ? fr : language === 'ar' ? ar : en;
  const locale = language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-SA' : 'en-US';
  const prayerNames: Record<PrayerKey, string> = language === 'ar' ? { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' } : { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
  const nextPrayer = calculations?.candidates.find(item => item.date.getTime() > now.getTime()) || calculations?.candidates[calculations.candidates.length - 1];
  const nextPrayerKey = nextPrayer?.key;

  return <section className={styles.panel} aria-label={t('Horaires de prière','Prayer times','مواقيت الصلاة')}>
    <header className={styles.header}>
      <div className={styles.heading}><p className={styles.eyebrow}>{t('CALCUL LOCAL','CALCULATED ON THIS DEVICE','حساب محلي')}</p><h2>{t('Horaires de prière','Prayer times','مواقيت الصلاة')}</h2><p className={styles.city}>{city || t('Lieu non défini','Location not set','لم يتم تحديد الموقع')}</p></div>
      <button className={styles.configure} type="button" onClick={() => setEditing(!editing)}>{editing ? t('Fermer','Close','إغلاق') : t('Régler','Settings','إعداد')}</button>
    </header>
    {!calculations ? <p className={styles.notice}>{!coords ? t('Définis ton lieu pour afficher les horaires.','Set your location to show prayer times.','حدد موقعك لإظهار أوقات الصلاة.') : t('Choisis une méthode de calcul.','Choose a calculation method.','اختر طريقة الحساب.')}</p> : <>
      <div className={styles.nextPrayer} aria-live="off">
        <span className={styles.nextLabel}>{t('PROCHAINE PRIÈRE','NEXT PRAYER','الصلاة القادمة')}</span>
        <strong>{prayerNames[nextPrayerKey!]}</strong>
        <span className={styles.nextTime}>{nextPrayer && formatPrayerTime(nextPrayer.date, activeTimeZone, locale)}</span>
        <span className={styles.countdown}>{nextPrayer && countdown(nextPrayer.date, now)}</span>
      </div>
      <p className={styles.method}>{METHODS.find(([key]) => key === config.method)?.[1]} · Fajr {calculations.params.fajrAngle}° · Isha {calculations.params.ishaAngle}° · {config.madhab} · {activeTimeZone}</p>
    </>}
    <PrayerChecklist timeZone={activeTimeZone} prayerTimes={calculations ? Object.fromEntries(PRAYERS.map(([key]) => [key, formatPrayerTime(calculations.labels[key], activeTimeZone, locale)])) as Record<PrayerKey, string> : undefined} nextPrayer={nextPrayerKey} />
    {editing && <div className={styles.settings}>
      <div className={styles.settingsTitle}><div><strong>{t('Lieu et calcul','Location and calculation','الموقع والحساب')}</strong><p>{t('Le lieu et la méthode restent enregistrés sur cet appareil.','Your location and method stay saved on this device.','يظل موقعك وطريقة الحساب محفوظين على جهازك.')}</p></div></div>
      <form className={styles.addressSearch} onSubmit={searchAddress}>
        <label>{t('Rechercher une adresse ou une ville','Search an address or city','ابحث عن عنوان أو مدينة')}<div className={styles.searchRow}><input autoComplete="street-address" value={addressQuery} onChange={e => setAddressQuery(e.target.value)} placeholder={t('Adresse, code postal, ville…','Address, postal code, city…','العنوان، الرمز البريدي، المدينة…')}/><button type="submit" disabled={searching}>{searching ? '…' : t('Rechercher','Search','بحث')}</button></div></label>
        <small>{t('La recherche est envoyée à Photon (Komoot). Les résultats cartographiques © OpenStreetMap.','Search is sent to Photon (Komoot). Map data © OpenStreetMap.','يتم إرسال البحث إلى Photon (Komoot). بيانات الخريطة © OpenStreetMap.')}</small>
        {addressError && <p className={styles.formMessage} role="status">{addressError}</p>}
        {places.length > 0 && <div className={styles.results} role="listbox" aria-label={t('Résultats de recherche','Search results','نتائج البحث')}>{places.map((result, index) => <button type="button" role="option" aria-selected="false" key={`${result.lat}-${result.lon}-${index}`} onClick={() => choosePlace(result)}>{result.label}</button>)}</div>}
      </form>
      {config.method === 'Other' && <div className={styles.row}><label>Angle Fajr<input type="number" min="0" max="30" step="0.1" value={config.fajr} onChange={e => save({ fajr: Number(e.target.value) })}/></label><label>Angle Isha<input type="number" min="0" max="30" step="0.1" value={config.isha} onChange={e => save({ isha: Number(e.target.value) })}/></label></div>}
      <label>{t('Méthode de calcul','Calculation method','طريقة الحساب')}<select value={config.method} onChange={e => save({ method: e.target.value as Method | '' })}><option value="">{t('Choisir…','Choose…','اختر…')}</option>{METHODS.map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <p className={styles.angleHint}>{t('Les angles Fajr et Isha suivent la méthode choisie. Sélectionne « Angles personnalisés » pour les régler séparément.','Fajr and Isha angles follow the selected method. Choose “Custom angles” to set them separately.','تتبع زوايا الفجر والعشاء الطريقة المحددة. اختر «زوايا مخصصة» لتعيينها بشكل منفصل.')}</p>
      <label>{t('Jurisprudence pour Asr','Asr madhab','مذهب العصر')}<select value={config.madhab} onChange={e => save({ madhab: e.target.value as Config['madhab'] })}><option value="Shafi">Shafi, Maliki, Hanbali</option><option value="Hanafi">Hanafi</option></select></label>
      <div className={styles.timeZoneField}>
        <label>{t('Fuseau horaire du lieu','Location time zone','المنطقة الزمنية للموقع')}</label>
        {config.timeZoneMode === 'auto' ? <><output className={styles.zoneValue}>{activeTimeZone}</output><small>{t('Détecté localement depuis les coordonnées.','Detected locally from the coordinates.','تم تحديده محليًا من الإحداثيات.')}</small><button type="button" onClick={() => { setTimeZoneDraft(activeTimeZone); save({ timeZone: activeTimeZone, timeZoneMode: 'manual' }); }}>{t('Personnaliser le fuseau','Customize time zone','تخصيص المنطقة الزمنية')}</button></> : <><input value={timeZoneDraft} placeholder="Europe/Paris" onChange={e => setTimeZoneDraft(e.target.value)}/><small>{t('Réglage manuel actif. Nom IANA, par exemple Europe/Paris.','Manual setting active. IANA name, for example Europe/Paris.','الإعداد اليدوي نشط. اسم IANA، مثل Europe/Paris.')}</small><div className={styles.timeZoneActions}><button type="button" disabled={!isValidTimeZone(timeZoneDraft)} onClick={() => save({ timeZone: timeZoneDraft, timeZoneMode: 'manual' })}>{t('Appliquer','Apply','تطبيق')}</button><button type="button" disabled={!coords} onClick={() => save({ timeZoneMode: 'auto' })}>{t('Détecter automatiquement','Detect automatically','تحديد تلقائي')}</button></div></>}
      </div>
      <p className={styles.subheading}>{t('Corrections (minutes)','Adjustments (minutes)','التعديلات (بالدقائق)')}</p><div className={styles.adjustments}>{PRAYERS.map(([key,label]) => <label key={key}>{label}<input type="number" min="-30" max="30" value={config.adjustments[key] || 0} onChange={e => save({ adjustments: { ...config.adjustments, [key]: Number(e.target.value) } })}/></label>)}</div>
      <div className={styles.row}><label>Latitude<input type="number" min="-90" max="90" step="0.0001" value={lat} onChange={e => setLat(e.target.value)}/></label><label>Longitude<input type="number" min="-180" max="180" step="0.0001" value={lng} onChange={e => setLng(e.target.value)}/></label></div><label>{t('Nom du lieu','Place name','اسم الموقع')}<input value={place} onChange={e => setPlace(e.target.value)} /></label><button type="button" onClick={saveManual}>{t('Enregistrer ces coordonnées','Save these coordinates','حفظ هذه الإحداثيات')}</button><button type="button" onClick={requestLocation}>{t('Utiliser le GPS (avec autorisation)','Use GPS (with permission)','استخدام GPS (بإذن)')}</button>{locationError && <p role="status">{locationError}</p>}
      <div className={styles.mawaqit}><strong>Mawaqit</strong><p>{t('Colle le lien du widget officiel de ta mosquée. Aucune coordonnée ne lui est transmise.','Paste your mosque’s official widget link. No coordinates are sent.','أدخل رابط أداة المسجد الرسمية. لا يتم إرسال إحداثيات.')}</p><input type="url" placeholder="https://mawaqit.net/..." value={config.mawaqitUrl} onChange={e => save({ mawaqitUrl: e.target.value, mawaqitConsent: false })}/><label className={styles.consent}><input type="checkbox" checked={frameConsent} onChange={e => setFrameConsent(e.target.checked)}/>{t('Autoriser le chargement du widget externe','Allow the external widget to load','السماح بتحميل الأداة الخارجية')}</label>{frameConsent && safeMawaqitUrl && <iframe title="Mawaqit" src={safeMawaqitUrl} loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups" className={styles.frame}/>}</div>
    </div>}
  </section>;
}

