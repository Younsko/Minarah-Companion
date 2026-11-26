export interface RamadanTopic {
    id: string;
    title: { en: string; fr: string; ar: string };
    content: { en: string; fr: string; ar: string };
    category: 'faq' | 'dhikr' | 'tips';
}

export const RAMADAN_CONTENT: RamadanTopic[] = [
    {
        id: 'fasting-intention',
        category: 'tips',
        title: {
            en: 'Intention (Niyyah) for Fasting',
            fr: 'Intention (Niyyah) pour le Jeûne',
            ar: 'نية الصيام'
        },
        content: {
            en: 'The intention to fast must be made at night, before Fajr. You can say it in your heart: "I intend to fast tomorrow for the month of Ramadan for the sake of Allah."',
            fr: 'L\'intention de jeûner doit être faite la nuit, avant le Fajr. Vous pouvez le dire dans votre cœur : "J\'ai l\'intention de jeûner demain pour le mois de Ramadan pour l\'amour d\'Allah."',
            ar: 'يجب تبييت نية الصيام من الليل قبل الفجر. يكفي أن تعقد العزم في قلبك: "نويت صيام غد من شهر رمضان إيماناً واحتساباً لله تعالى".'
        }
    },
    {
        id: 'breaking-fast-dua',
        category: 'dhikr',
        title: {
            en: 'Dua for Breaking Fast',
            fr: 'Doua pour rompre le jeûne',
            ar: 'دعاء الإفطار'
        },
        content: {
            en: '"Thahaba al-zama\' wa abtallat al-\'uruq wa thabata al-ajr in sha Allah." (The thirst is gone, the veins are moistened, and the reward is confirmed, if Allah wills.)',
            fr: '"Thahaba al-zama\' wa abtallat al-\'uruq wa thabata al-ajr in sha Allah." (La soif est partie, les veines sont humidifiées et la récompense est confirmée, si Allah le veut.)',
            ar: '"ذهب الظمأ وابتلت العروق وثبت الأجر إن شاء الله".'
        }
    },
    {
        id: 'taraweeh-info',
        category: 'faq',
        title: {
            en: 'What is Taraweeh?',
            fr: 'Qu\'est-ce que le Taraweeh ?',
            ar: 'ما هي صلاة التراويح؟'
        },
        content: {
            en: 'Taraweeh are special sunnah prayers performed at night during Ramadan, after Isha prayer. They are usually performed in congregation at the mosque but can be prayed at home.',
            fr: 'Les Taraweeh sont des prières sunnah spéciales accomplies la nuit pendant le Ramadan, après la prière de Isha. Elles sont généralement accomplies en congrégation à la mosquée mais peuvent être priées à la maison.',
            ar: 'التراويح هي صلاة قيام خاصة تؤدى في ليالي رمضان بعد صلاة العشاء. تصلى عادة في جماعة في المسجد، ويمكن أداؤها في المنزل.'
        }
    },
    {
        id: 'laylatul-qadr',
        category: 'tips',
        title: {
            en: 'Seeking Laylatul Qadr',
            fr: 'Chercher la Nuit du Destin',
            ar: 'تحري ليلة القدر'
        },
        content: {
            en: 'Laylatul Qadr (The Night of Decree) is better than a thousand months. Seek it in the odd nights of the last ten days of Ramadan. Increase your Quran reading, Dua, and night prayers.',
            fr: 'Laylatul Qadr (La Nuit du Destin) est meilleure que mille mois. Cherchez-la dans les nuits impaires des dix derniers jours du Ramadan. Augmentez votre lecture du Coran, vos Douas et vos prières nocturnes.',
            ar: 'ليلة القدر خير من ألف شهر. تحروها في الليالي الوتر من العشر الأواخر من رمضان. أكثروا فيها من تلاوة القرآن والدعاء وقيام الليل.'
        }
    },
    {
        id: 'missed-fasts',
        category: 'faq',
        title: {
            en: 'What if I miss a fast?',
            fr: 'Et si je manque un jeûne ?',
            ar: 'ماذا لو فاتني صيام يوم؟'
        },
        content: {
            en: 'If you miss a fast due to a valid reason (illness, travel, menstruation), you must make it up later (Qada) before the next Ramadan. If missed without reason, sincere repentance is required.',
            fr: 'Si vous manquez un jeûne pour une raison valable (maladie, voyage, menstruations), vous devez le rattraper plus tard (Qada) avant le prochain Ramadan. S\'il est manqué sans raison, un repentir sincère est requis.',
            ar: 'من أفطر لعذر (مرض، سفر، حيض) وجب عليه القضاء قبل رمضان القادم. ومن أفطر بغير عذر وجبت عليه التوبة النصوح وقضاء اليوم.'
        }
    }
];
