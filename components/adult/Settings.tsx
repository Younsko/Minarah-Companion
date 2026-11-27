'use client';
import { localState } from '@/lib/local-state';

import { useState, useEffect } from 'react';
import styles from './Settings.module.css';
import { X, Volume2, Bell, Check, Download, Upload } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import { RECITERS, getDefaultReciter, setDefaultReciter } from '@/lib/reciters';
import CustomSelect from '@/components/CustomSelect';

interface SettingsProps {
    onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
    const { language } = useI18n();

    // Reciter state
    const [defaultReciterState, setDefaultReciterState] = useState(RECITERS[0].id);

    // Notifications state
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationTime, setNotificationTime] = useState('08:00');
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

    // Save feedback
    const [showSaved, setShowSaved] = useState(false);
    const [backupError, setBackupError] = useState('');

    useEffect(() => {
        // Load reciter preference
        setDefaultReciterState(getDefaultReciter());

        // Load notification preferences
        if (typeof window !== 'undefined') {
            setNotificationsEnabled(localState.getItem('muslim-life-notifications') === 'true');
            setNotificationTime(localState.getItem('muslim-life-notification-time') || '08:00');

            // Check notification permission
            if ('Notification' in window) {
                setNotificationPermission(Notification.permission);
            }
        }
    }, []);

    const showSavedFeedback = () => {
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    };

    const handleReciterChange = (reciterId: string) => {
        setDefaultReciterState(reciterId);
        setDefaultReciter(reciterId);
        // Dispatch event for QuranBrowser to pick up
        window.dispatchEvent(new CustomEvent('reciter-changed', { detail: reciterId }));
        showSavedFeedback();
    };

    const handleNotificationToggle = async () => {
        if (!notificationsEnabled) {
            // Enable notifications
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                setNotificationPermission(permission);

                if (permission === 'granted') {
                    setNotificationsEnabled(true);
                    localState.setItem('muslim-life-notifications', 'true');
                    showSavedFeedback();
                }
            }
        } else {
            // Disable notifications
            setNotificationsEnabled(false);
            localState.setItem('muslim-life-notifications', 'false');
            showSavedFeedback();
        }
    };

    const handleTimeChange = (time: string) => {
        setNotificationTime(time);
        localState.setItem('muslim-life-notification-time', time);
        showSavedFeedback();
    };

    const getNotificationStatusText = () => {
        if (notificationPermission === 'denied') {
            return language === 'fr'
                ? 'Bloquées dans le navigateur'
                : language === 'ar'
                    ? 'محظورة في المتصفح'
                    : 'Blocked in browser';
        }
        if (notificationsEnabled) {
            return language === 'fr'
                ? `Actives à ${notificationTime}`
                : language === 'ar'
                    ? `مفعلة في ${notificationTime}`
                    : `Active at ${notificationTime}`;
        }
        return language === 'fr'
            ? 'Désactivées'
            : language === 'ar'
                ? 'معطلة'
                : 'Disabled';
    };

    const exportBackup = () => {
        const blob = new Blob([localState.exportBackup()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = 'minarah-sauvegarde.json'; link.click();
        URL.revokeObjectURL(url); setBackupError('');
    };
    const importBackup = async (file?: File) => {
        if (!file) return;
        try { localState.importBackup(await file.text()); setBackupError(''); window.location.reload(); }
        catch (error) { setBackupError(error instanceof Error ? error.message : 'Fichier invalide.'); }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <header className={styles.modalHeader}>
                    <h2>{language === 'fr' ? 'Paramètres' : language === 'ar' ? 'الإعدادات' : 'Settings'}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </header>

                {/* Content */}
                <div className={styles.modalBody}>
                    {/* Reciter Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <Volume2 size={18} className={styles.sectionIcon} />
                            <span>{language === 'fr' ? 'Récitateur par défaut' : language === 'ar' ? 'القارئ الافتراضي' : 'Default Reciter'}</span>
                        </div>
                        <CustomSelect
                            options={RECITERS}
                            value={defaultReciterState}
                            onChange={handleReciterChange}
                        />
                    </div>

                    {/* Notifications Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <Bell size={18} className={styles.sectionIcon} />
                            <span>{language === 'fr' ? 'Notifications quotidiennes' : language === 'ar' ? 'الإشعارات اليومية' : 'Daily Notifications'}</span>
                        </div>

                        <div className={styles.notificationRow}>
                            <div className={styles.notificationInfo}>
                                <span className={styles.notificationStatus}>{getNotificationStatusText()}</span>
                                <span className={styles.notificationHint}>
                                    {language === 'fr' ? 'Verset et invocation du jour' : language === 'ar' ? 'آية ودعاء اليوم' : 'Daily verse and dua'}
                                </span>
                            </div>
                            <button
                                onClick={handleNotificationToggle}
                                className={`${styles.toggle} ${notificationsEnabled ? styles.toggleActive : ''}`}
                                disabled={notificationPermission === 'denied'}
                            >
                                <span className={styles.toggleKnob} />
                            </button>
                        </div>

                        {notificationsEnabled && (
                            <div className={styles.timeRow}>
                                <label>{language === 'fr' ? 'Heure' : language === 'ar' ? 'الوقت' : 'Time'}</label>
                                <input
                                    type="time"
                                    value={notificationTime}
                                    onChange={(e) => handleTimeChange(e.target.value)}
                                    className={styles.timeInput}
                                />
                            </div>
                        )}
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}><span>{language === 'fr' ? 'Sauvegarde locale' : language === 'ar' ? 'نسخة احتياطية محلية' : 'Local backup'}</span></div>
                        <p>{language === 'fr' ? 'Les réglages et progressions restent sur cet appareil. Exporte-les pour les transférer ou les sauvegarder.' : language === 'ar' ? 'تبقى الإعدادات والتقدم على هذا الجهاز.' : 'Settings and progress stay on this device. Export them to transfer or back them up.'}</p>
                        <div className={styles.backupActions}>
                            <button type="button" onClick={exportBackup} className={styles.backupAction}>
                                <Download size={17} aria-hidden="true" />
                                <span>{language === 'fr' ? 'Exporter' : language === 'ar' ? 'تصدير' : 'Export'}</span>
                            </button>
                            <label className={styles.backupAction}>
                                <Upload size={17} aria-hidden="true" />
                                <span>{language === 'fr' ? 'Importer' : language === 'ar' ? 'استيراد' : 'Import'}</span>
                                <input type="file" accept="application/json,.json" onChange={e => void importBackup(e.target.files?.[0])} />
                            </label>
                        </div>
                        {backupError && <p role="alert">{backupError}</p>}
                    </div>
                </div>

                {/* Footer */}
                <footer className={styles.modalFooter}>
                    <span className={styles.localNote}>
                        💾 {language === 'fr' ? 'Stocké localement' : language === 'ar' ? 'مخزن محليًا' : 'Stored locally'}
                    </span>
                    {showSaved && (
                        <span className={styles.savedBadge}>
                            <Check size={14} />
                            {language === 'fr' ? 'Enregistré' : language === 'ar' ? 'تم الحفظ' : 'Saved'}
                        </span>
                    )}
                </footer>
            </div>
        </div>
    );
}
