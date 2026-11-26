'use client';

import { useEffect, useState } from 'react';
import styles from './DynamicTimeline.module.css';
import { Sun, Moon, Sunrise, Sunset } from 'lucide-react';

interface TimelineEvent {
    time: string;
    name: string;
    type: 'prayer' | 'action';
    icon?: React.ReactNode;
    description?: string;
}

interface StaticPrayerTimes {
    date: string;
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
}

export default function DynamicTimeline() {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [timings, setTimings] = useState<StaticPrayerTimes | null>(null);

    useEffect(() => {
        // Horaires statiques ou mock
        const data: StaticPrayerTimes = {
            date: '28 Nov 2025',
            fajr: '05:30',
            sunrise: '06:50',
            dhuhr: '12:15',
            asr: '15:30',
            maghrib: '18:10',
            isha: '19:30',
        };
        setTimings(data);

        const timeline: TimelineEvent[] = [
            { time: data.fajr, name: 'Fajr', type: 'prayer', icon: <Sunrise size={18} /> },
            { time: '06:00', name: 'Morning Adhkar', type: 'action', description: 'Start your day with remembrance.' },
            { time: data.sunrise, name: 'Sunrise', type: 'prayer', icon: <Sun size={18} /> },
            { time: data.dhuhr, name: 'Dhuhr', type: 'prayer', icon: <Sun size={18} /> },
            { time: data.asr, name: 'Asr', type: 'prayer', icon: <Sun size={18} /> },
            { time: data.maghrib, name: 'Maghrib', type: 'prayer', icon: <Sunset size={18} /> },
            { time: '19:00', name: 'Evening Adhkar', type: 'action', description: 'Protection for the night.' },
            { time: data.isha, name: 'Isha', type: 'prayer', icon: <Moon size={18} /> },
            { time: '22:00', name: 'Sleep Sunnah', type: 'action', description: 'Wudu, 3 Quls, Ayat al-Kursi.' },
        ];

        timeline.sort((a, b) => a.time.localeCompare(b.time));
        setEvents(timeline);
    }, []);

    if (!timings) return <div className={styles.loading}>Loading schedule...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.date}>{timings.date}</div>
            <div className={styles.scrollContainer}>
                <div className={styles.track}>
                    {events.map((event, index) => (
                        <div key={index} className={`${styles.card} ${styles[event.type]}`}>
                            <div className={styles.time}>{event.time.split(' ')[0]}</div>
                            <div className={styles.iconWrapper}>
                                {event.icon || <div className={styles.dot} />}
                            </div>
                            <div className={styles.info}>
                                <h4>{event.name}</h4>
                                {event.description && <p>{event.description}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
