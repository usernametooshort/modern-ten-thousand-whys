
export const CASES = {
    NOM: 'Nominative',
    AKK: 'Accusative',
    DAT: 'Dative',
    GEN: 'Genitive'
};

export const GENDERS = {
    MASC: 'masc',
    FEM: 'fem',
    NEUT: 'neut',
    PL: 'pl'
};

export const ARTICLES = {
    DEF: 'definite',
    INDEF: 'indefinite',
    NONE: 'none'
};

export const K1_GRAMMAR_TABLE = {
    title: "Konjunktiv I Endings",
    headers: ["Person", "Endung", "Beispiel (sagen)", "Sein (Irreg.)"],
    rows: [
        { person: "ich", end: "-e", ex: "sage", sein: "sei" },
        { person: "du", end: "-est", ex: "sagest", sein: "seiest" },
        { person: "er/sie/es", end: "-e", ex: "sage", sein: "sei" },
        { person: "wir", end: "-en", ex: "sagen", sein: "seien" },
        { person: "ihr", end: "-et", ex: "saget", sein: "seiet" },
        { person: "sie/Sie", end: "-en", ex: "sagen", sein: "seien" }
    ],
    note: "Use K1 for indirect speech. If K1 matches Indikativ (common in Plural), substitute with KII or 'würde'."
};

const NOUNS = [
    // People & Professions
    { word: 'Mann', gender: 'masc', meaning: 'Man', tags: ['person'] },
    { word: 'Frau', gender: 'fem', meaning: 'Woman', tags: ['person'] },
    { word: 'Kind', gender: 'neut', meaning: 'Child', tags: ['person'] },
    { word: 'Kinder', gender: 'pl', meaning: 'Children', tags: ['person'] }, // Plural form handling might need tweaks if strictly mapped, but keeping as is for now
    { word: 'Lehrer', gender: 'masc', meaning: 'Teacher (m)', tags: ['person'] },
    { word: 'Lehrerin', gender: 'fem', meaning: 'Teacher (f)', tags: ['person'] },
    { word: 'Arzt', gender: 'masc', meaning: 'Doctor (m)', tags: ['person'] },
    { word: 'Ärztin', gender: 'fem', meaning: 'Doctor (f)', tags: ['person'] },
    { word: 'Schüler', gender: 'masc', meaning: 'Student (m)', tags: ['person'] },
    { word: 'Student', gender: 'masc', meaning: 'Uni Student', tags: ['person'] },
    { word: 'Gast', gender: 'masc', meaning: 'Guest', tags: ['person'] },
    { word: 'Freund', gender: 'masc', meaning: 'Friend (m)', tags: ['person'] },
    { word: 'Freundin', gender: 'fem', meaning: 'Friend (f)', tags: ['person'] },
    { word: 'Nachbar', gender: 'masc', meaning: 'Neighbor (m)', tags: ['person'] },
    { word: 'Chef', gender: 'masc', meaning: 'Boss', tags: ['person'] },

    // Family
    { word: 'Vater', gender: 'masc', meaning: 'Father', tags: ['person'] },
    { word: 'Mutter', gender: 'fem', meaning: 'Mother', tags: ['person'] },
    { word: 'Bruder', gender: 'masc', meaning: 'Brother', tags: ['person'] },
    { word: 'Schwester', gender: 'fem', meaning: 'Sister', tags: ['person'] },
    { word: 'Eltern', gender: 'pl', meaning: 'Parents', tags: ['person'] },
    { word: 'Onkel', gender: 'masc', meaning: 'Uncle', tags: ['person'] },
    { word: 'Tante', gender: 'fem', meaning: 'Aunt', tags: ['person'] },

    // Animals
    { word: 'Hund', gender: 'masc', meaning: 'Dog', tags: ['animal'] },
    { word: 'Katze', gender: 'fem', meaning: 'Cat', tags: ['animal'] },
    { word: 'Maus', gender: 'fem', meaning: 'Mouse', tags: ['animal'] },
    { word: 'Vogel', gender: 'masc', meaning: 'Bird', tags: ['animal'] },
    { word: 'Pferd', gender: 'neut', meaning: 'Horse', tags: ['animal'] },
    { word: 'Kuh', gender: 'fem', meaning: 'Cow', tags: ['animal'] },
    { word: 'Schwein', gender: 'neut', meaning: 'Pig', tags: ['animal'] },
    { word: 'Bär', gender: 'masc', meaning: 'Bear', tags: ['animal'] },
    { word: 'Löwe', gender: 'masc', meaning: 'Lion', tags: ['animal'] },
    { word: 'Fisch', gender: 'masc', meaning: 'Fish', tags: ['animal'] },

    // Objects - Furniture & House
    { word: 'Tisch', gender: 'masc', meaning: 'Table', tags: ['object', 'furniture'] },
    { word: 'Stuhl', gender: 'masc', meaning: 'Chair', tags: ['object', 'furniture'] },
    { word: 'Lampe', gender: 'fem', meaning: 'Lamp', tags: ['object', 'furniture'] },
    { word: 'Bett', gender: 'neut', meaning: 'Bed', tags: ['object', 'furniture'] },
    { word: 'Schrank', gender: 'masc', meaning: 'Cabinet/Closet', tags: ['object', 'furniture'] },
    { word: 'Sofa', gender: 'neut', meaning: 'Sofa', tags: ['object', 'furniture'] },
    { word: 'Teppich', gender: 'masc', meaning: 'Carpet', tags: ['object', 'furniture'] },
    { word: 'Fenster', gender: 'neut', meaning: 'Window', tags: ['object', 'building'] },
    { word: 'Tür', gender: 'fem', meaning: 'Door', tags: ['object', 'building'] },
    { word: 'Küche', gender: 'fem', meaning: 'Kitchen', tags: ['object', 'building'] },

    // Objects - Everyday
    { word: 'Buch', gender: 'neut', meaning: 'Book', tags: ['object'] },
    { word: 'Stift', gender: 'masc', meaning: 'Pen', tags: ['object'] },
    { word: 'Tasche', gender: 'fem', meaning: 'Bag', tags: ['object'] },
    { word: 'Brille', gender: 'fem', meaning: 'Glasses', tags: ['object'] },
    { word: 'Schlüssel', gender: 'masc', meaning: 'Key', tags: ['object'] },
    { word: 'Handy', gender: 'neut', meaning: 'Mobile Phone', tags: ['object'] },
    { word: 'Computer', gender: 'masc', meaning: 'Computer', tags: ['object'] },
    { word: 'Uhr', gender: 'fem', meaning: 'Clock/Watch', tags: ['object'] },
    { word: 'Bild', gender: 'neut', meaning: 'Picture', tags: ['object'] },
    { word: 'Flasche', gender: 'fem', meaning: 'Bottle', tags: ['object'] },

    // Food & Drink
    { word: 'Apfel', gender: 'masc', meaning: 'Apple', tags: ['food'] },
    { word: 'Banane', gender: 'fem', meaning: 'Banana', tags: ['food'] },
    { word: 'Orange', gender: 'fem', meaning: 'Orange', tags: ['food'] },
    { word: 'Brot', gender: 'neut', meaning: 'Bread', tags: ['food'] },
    { word: 'Käse', gender: 'masc', meaning: 'Cheese', tags: ['food'] },
    { word: 'Wurst', gender: 'fem', meaning: 'Sausage', tags: ['food'] },
    { word: 'Ei', gender: 'neut', meaning: 'Egg', tags: ['food'] },
    { word: 'Kuchen', gender: 'masc', meaning: 'Cake', tags: ['food'] },
    { word: 'Suppe', gender: 'fem', meaning: 'Soup', tags: ['food'] },
    { word: 'Salat', gender: 'masc', meaning: 'Salad', tags: ['food'] },
    { word: 'Fleisch', gender: 'neut', meaning: 'Meat', tags: ['food'] },
    { word: 'Wasser', gender: 'neut', meaning: 'Water', tags: ['food'] },
    { word: 'Kaffee', gender: 'masc', meaning: 'Coffee', tags: ['food'] },
    { word: 'Tee', gender: 'masc', meaning: 'Tea', tags: ['food'] },
    { word: 'Bier', gender: 'neut', meaning: 'Beer', tags: ['food'] },
    { word: 'Wein', gender: 'masc', meaning: 'Wine', tags: ['food'] },

    // Clothing
    { word: 'Hemd', gender: 'neut', meaning: 'Shirt', tags: ['object', 'clothing'] },
    { word: 'Hose', gender: 'fem', meaning: 'Trousers', tags: ['object', 'clothing'] },
    { word: 'Kleid', gender: 'neut', meaning: 'Dress', tags: ['object', 'clothing'] },
    { word: 'Schuh', gender: 'masc', meaning: 'Shoe', tags: ['object', 'clothing'] },
    { word: 'Jacke', gender: 'fem', meaning: 'Jacket', tags: ['object', 'clothing'] },
    { word: 'Mantel', gender: 'masc', meaning: 'Coat', tags: ['object', 'clothing'] },
    { word: 'Hut', gender: 'masc', meaning: 'Hat', tags: ['object', 'clothing'] },

    // Vehicles
    { word: 'Auto', gender: 'neut', meaning: 'Car', tags: ['vehicle'] },
    { word: 'Bus', gender: 'masc', meaning: 'Bus', tags: ['vehicle'] },
    { word: 'Zug', gender: 'masc', meaning: 'Train', tags: ['vehicle'] },
    { word: 'Fahrrad', gender: 'neut', meaning: 'Bicycle', tags: ['vehicle'] },
    { word: 'Schiff', gender: 'neut', meaning: 'Ship', tags: ['vehicle'] },
    { word: 'Flugzeug', gender: 'neut', meaning: 'Airplane', tags: ['vehicle'] },

    // Places & Buildings
    { word: 'Haus', gender: 'neut', meaning: 'House', tags: ['building'] },
    { word: 'Schule', gender: 'fem', meaning: 'School', tags: ['building'] },
    { word: 'Park', gender: 'masc', meaning: 'Park', tags: ['place'] },
    { word: 'Stadt', gender: 'fem', meaning: 'City', tags: ['place'] },
    { word: 'Land', gender: 'neut', meaning: 'Country', tags: ['place'] },
    { word: 'Bahnhof', gender: 'masc', meaning: 'Train Station', tags: ['building'] },
    { word: 'Flughafen', gender: 'masc', meaning: 'Airport', tags: ['building'] },
    { word: 'Hotel', gender: 'neut', meaning: 'Hotel', tags: ['building'] },
    { word: 'Supermarkt', gender: 'masc', meaning: 'Supermarket', tags: ['building'] },

    // Nature
    { word: 'Baum', gender: 'masc', meaning: 'Tree', tags: ['plant'] },
    { word: 'Blume', gender: 'fem', meaning: 'Flower', tags: ['plant'] },
    { word: 'Wald', gender: 'masc', meaning: 'Forest', tags: ['place'] },
    { word: 'Berg', gender: 'masc', meaning: 'Mountain', tags: ['place'] },
    { word: 'See', gender: 'masc', meaning: 'Lake', tags: ['place'] },
    { word: 'Meer', gender: 'neut', meaning: 'Sea/Ocean', tags: ['place'] },
    { word: 'Sonne', gender: 'fem', meaning: 'Sun', tags: ['nature'] },
    { word: 'Mond', gender: 'masc', meaning: 'Moon', tags: ['nature'] },

    // Abstract
    { word: 'Zeit', gender: 'fem', meaning: 'Time', tags: ['abstract'] },
    { word: 'Idee', gender: 'fem', meaning: 'Idea', tags: ['abstract'] },
    { word: 'Problem', gender: 'neut', meaning: 'Problem', tags: ['abstract'] },
    { word: 'Frage', gender: 'fem', meaning: 'Question', tags: ['abstract'] },
    { word: 'Antwort', gender: 'fem', meaning: 'Answer', tags: ['abstract'] },
    { word: 'Arbeit', gender: 'fem', meaning: 'Work', tags: ['abstract'] },
    { word: 'Geld', gender: 'neut', meaning: 'Money', tags: ['object'] }
];

const ADJECTIVES = [
    // Universal-ish
    { word: 'gut', meaning: 'good', tags: ['all'] },
    { word: 'schlecht', meaning: 'bad', tags: ['all'] },
    { word: 'groß', meaning: 'big/tall', tags: ['all'] },
    { word: 'klein', meaning: 'small', tags: ['all'] },
    { word: 'schön', meaning: 'beautiful', tags: ['all'] },
    { word: 'alt', meaning: 'old', tags: ['all'] },

    // Specific
    { word: 'neu', meaning: 'new', tags: ['object', 'vehicle', 'building', 'furniture', 'plant'] },
    { word: 'jung', meaning: 'young', tags: ['person', 'animal'] },
    { word: 'schnell', meaning: 'fast', tags: ['person', 'animal', 'vehicle'] },
    { word: 'langsam', meaning: 'slow', tags: ['person', 'animal', 'vehicle'] },
    { word: 'lecker', meaning: 'tasty', tags: ['food'] },
    { word: 'frisch', meaning: 'fresh', tags: ['food', 'plant'] },
    { word: 'rot', meaning: 'red', tags: ['object', 'vehicle', 'plant', 'food', 'furniture'] },
    { word: 'blau', meaning: 'blue', tags: ['object', 'vehicle', 'plant', 'furniture'] },
    { word: 'grün', meaning: 'green', tags: ['object', 'vehicle', 'plant', 'furniture'] },
    { word: 'teuer', meaning: 'expensive', tags: ['object', 'vehicle', 'furniture', 'food', 'building'] },
    { word: 'nett', meaning: 'nice', tags: ['person'] },
    { word: 'klug', meaning: 'smart', tags: ['person', 'animal'] },
    { word: 'heiß', meaning: 'hot', tags: ['food'] },
    { word: 'kalt', meaning: 'cold', tags: ['food'] }
];

export const GRAMMAR_TABLE = {
    // Definite Articles (Weak Endings)
    [ARTICLES.DEF]: {
        [CASES.NOM]: {
            [GENDERS.MASC]: { art: 'der', adj: 'e' },
            [GENDERS.FEM]: { art: 'die', adj: 'e' },
            [GENDERS.NEUT]: { art: 'das', adj: 'e' },
            [GENDERS.PL]: { art: 'die', adj: 'en' }
        },
        [CASES.AKK]: {
            [GENDERS.MASC]: { art: 'den', adj: 'en' },
            [GENDERS.FEM]: { art: 'die', adj: 'e' },
            [GENDERS.NEUT]: { art: 'das', adj: 'e' },
            [GENDERS.PL]: { art: 'die', adj: 'en' }
        },
        [CASES.DAT]: {
            [GENDERS.MASC]: { art: 'dem', adj: 'en' },
            [GENDERS.FEM]: { art: 'der', adj: 'en' },
            [GENDERS.NEUT]: { art: 'dem', adj: 'en' },
            [GENDERS.PL]: { art: 'den', adj: 'en' }
        },
        [CASES.GEN]: {
            [GENDERS.MASC]: { art: 'des', adj: 'en' },
            [GENDERS.FEM]: { art: 'der', adj: 'en' },
            [GENDERS.NEUT]: { art: 'des', adj: 'en' },
            [GENDERS.PL]: { art: 'der', adj: 'en' }
        }
    },
    // Indefinite Articles (Mixed Endings)
    [ARTICLES.INDEF]: {
        [CASES.NOM]: {
            [GENDERS.MASC]: { art: 'ein', adj: 'er' },
            [GENDERS.FEM]: { art: 'eine', adj: 'e' },
            [GENDERS.NEUT]: { art: 'ein', adj: 'es' },
            [GENDERS.PL]: { art: 'keine', adj: 'en' } // Mixed plural is always with kein/mein
        },
        [CASES.AKK]: {
            [GENDERS.MASC]: { art: 'einen', adj: 'en' },
            [GENDERS.FEM]: { art: 'eine', adj: 'e' },
            [GENDERS.NEUT]: { art: 'ein', adj: 'es' },
            [GENDERS.PL]: { art: 'keine', adj: 'en' }
        },
        [CASES.DAT]: {
            [GENDERS.MASC]: { art: 'einem', adj: 'en' },
            [GENDERS.FEM]: { art: 'einer', adj: 'en' },
            [GENDERS.NEUT]: { art: 'einem', adj: 'en' },
            [GENDERS.PL]: { art: 'keinen', adj: 'en' }
        },
        [CASES.GEN]: {
            [GENDERS.MASC]: { art: 'eines', adj: 'en' },
            [GENDERS.FEM]: { art: 'einer', adj: 'en' },
            [GENDERS.NEUT]: { art: 'eines', adj: 'en' },
            [GENDERS.PL]: { art: 'keiner', adj: 'en' }
        }
    },
    // No Articles (Strong Endings)
    [ARTICLES.NONE]: {
        [CASES.NOM]: {
            [GENDERS.MASC]: { art: '', adj: 'er' },
            [GENDERS.FEM]: { art: '', adj: 'e' },
            [GENDERS.NEUT]: { art: '', adj: 'es' },
            [GENDERS.PL]: { art: '', adj: 'e' }
        },
        [CASES.AKK]: {
            [GENDERS.MASC]: { art: '', adj: 'en' },
            [GENDERS.FEM]: { art: '', adj: 'e' },
            [GENDERS.NEUT]: { art: '', adj: 'es' },
            [GENDERS.PL]: { art: '', adj: 'e' }
        },
        [CASES.DAT]: {
            [GENDERS.MASC]: { art: '', adj: 'em' },
            [GENDERS.FEM]: { art: '', adj: 'er' },
            [GENDERS.NEUT]: { art: '', adj: 'em' },
            [GENDERS.PL]: { art: '', adj: 'en' }
        },
        [CASES.GEN]: {
            [GENDERS.MASC]: { art: '', adj: 'en' }, // Strong Genitive M/N usually takes -en if noun takes -s
            [GENDERS.FEM]: { art: '', adj: 'er' },
            [GENDERS.NEUT]: { art: '', adj: 'en' },
            [GENDERS.PL]: { art: '', adj: 'er' }
        }
    }
};

// Sentence Contexts (Templates)
// excludedTags: Don't use this context if noun has this tag
// requiredTags: Only use if noun has this tag
const CONTEXTS = [
    // Singular only contexts
    { text: "Das ist", case: CASES.NOM, number: 'sg', meaningKey: "ctx_that_is" },
    { text: "Hier steht", case: CASES.NOM, number: 'sg', meaningKey: "ctx_here_stands", excludedTags: ['vehicle'] },

    // Plural only contexts
    { text: "Das sind", case: CASES.NOM, number: 'pl', meaningKey: "ctx_these_are" },
    { text: "Hier stehen", case: CASES.NOM, number: 'pl', meaningKey: "ctx_here_stand", excludedTags: ['vehicle'] },

    // Neutral (can be sg or pl)
    { text: "Ich sehe", case: CASES.AKK, number: 'any', meaningKey: "ctx_i_see" },
    { text: "Er kauft", case: CASES.AKK, number: 'any', meaningKey: "ctx_he_buys", excludedTags: ['person'] },
    { text: "Wir haben", case: CASES.AKK, number: 'any', meaningKey: "ctx_we_have", excludedTags: ['person'] }, // "We have a child" is okay, but "We have a woman" is weird. Let's strict it.
    { text: "Ich spiele mit", case: CASES.DAT, number: 'any', meaningKey: "ctx_i_play", requiredTags: ['person', 'animal'] }, // Play with toy? Toy not in list.
    { text: "Das Geschenk ist von", case: CASES.DAT, number: 'any', meaningKey: "ctx_gift_from", requiredTags: ['person'] },
    { text: "Wegen", case: CASES.GEN, number: 'any', meaningKey: "ctx_because_of" },
    { text: "Trotz", case: CASES.GEN, number: 'any', meaningKey: "ctx_despite" },

    // New Contexts for Variety
    { text: "Er sucht", case: CASES.AKK, number: 'any', meaningKey: "ctx_he_searches", excludedTags: ['person'] },
    { text: "Sie braucht", case: CASES.AKK, number: 'any', meaningKey: "ctx_she_needs" },
    { text: "Wir danken", case: CASES.DAT, number: 'any', meaningKey: "ctx_we_thank", requiredTags: ['person'] },
    { text: "Er wohnt bei", case: CASES.DAT, number: 'any', meaningKey: "ctx_he_lives_with", requiredTags: ['person'] },
    { text: "Innerhalb", case: CASES.GEN, number: 'sg', meaningKey: "ctx_inside", requiredTags: ['building', 'vehicle'] }
];

export const VERBS = [
    // AUXILIARY & MODALS
    { infinitive: 'sein', ind_ich: 'bin', konj_er: 'sei', meaning: 'to be' },
    { infinitive: 'haben', ind_ich: 'habe', konj_er: 'habe', meaning: 'to have' },
    { infinitive: 'werden', ind_ich: 'werde', konj_er: 'werde', meaning: 'become' },
    { infinitive: 'können', ind_ich: 'kann', konj_er: 'könne', meaning: 'can' },
    { infinitive: 'müssen', ind_ich: 'muss', konj_er: 'müsse', meaning: 'must' },
    { infinitive: 'sollen', ind_ich: 'soll', konj_er: 'solle', meaning: 'should' },
    { infinitive: 'wollen', ind_ich: 'will', konj_er: 'wolle', meaning: 'want' },
    { infinitive: 'dürfen', ind_ich: 'darf', konj_er: 'dürfe', meaning: 'may' },
    { infinitive: 'mögen', ind_ich: 'mag', konj_er: 'möge', meaning: 'like' },

    // COMMON ACTION VERBS (Regular/Weak)
    { infinitive: 'sagen', ind_ich: 'sage', konj_er: 'sage', meaning: 'say' },
    { infinitive: 'machen', ind_ich: 'mache', konj_er: 'mache', meaning: 'make' },
    { infinitive: 'spielen', ind_ich: 'spiele', konj_er: 'spiele', meaning: 'play' },
    { infinitive: 'lernen', ind_ich: 'lerne', konj_er: 'lerne', meaning: 'learn' },
    { infinitive: 'kaufen', ind_ich: 'kaufe', konj_er: 'kaufe', meaning: 'buy' },
    { infinitive: 'hören', ind_ich: 'höre', konj_er: 'höre', meaning: 'hear' },
    { infinitive: 'lachen', ind_ich: 'lache', konj_er: 'lache', meaning: 'laugh' },
    { infinitive: 'fragen', ind_ich: 'frage', konj_er: 'frage', meaning: 'ask' },
    { infinitive: 'antworten', ind_ich: 'antworte', konj_er: 'antworte', meaning: 'answer' },
    { infinitive: 'suchen', ind_ich: 'suche', konj_er: 'suche', meaning: 'search' },
    { infinitive: 'brauchen', ind_ich: 'brauche', konj_er: 'brauche', meaning: 'need' },
    { infinitive: 'lieben', ind_ich: 'liebe', konj_er: 'liebe', meaning: 'love' },
    { infinitive: 'leben', ind_ich: 'lebe', konj_er: 'lebe', meaning: 'live' },
    { infinitive: 'wohnen', ind_ich: 'wohne', konj_er: 'wohne', meaning: 'reside' },
    { infinitive: 'kochen', ind_ich: 'koche', konj_er: 'koche', meaning: 'cook' },
    { infinitive: 'weinen', ind_ich: 'weine', konj_er: 'weine', meaning: 'cry' },
    { infinitive: 'tanzen', ind_ich: 'tanze', konj_er: 'tanze', meaning: 'dance' },
    { infinitive: 'reisen', ind_ich: 'reise', konj_er: 'reise', meaning: 'travel' },
    { infinitive: 'malen', ind_ich: 'male', konj_er: 'male', meaning: 'paint' },
    { infinitive: 'holen', ind_ich: 'hole', konj_er: 'hole', meaning: 'fetch' },
    { infinitive: 'bringen', ind_ich: 'bringe', konj_er: 'bringe', meaning: 'bring' },
    { infinitive: 'denken', ind_ich: 'denke', konj_er: 'denke', meaning: 'think' },
    { infinitive: 'danken', ind_ich: 'danke', konj_er: 'danke', meaning: 'thank' },
    { infinitive: 'öffnen', ind_ich: 'öffne', konj_er: 'öffne', meaning: 'open' },
    { infinitive: 'zeigen', ind_ich: 'zeige', konj_er: 'zeige', meaning: 'show' },
    { infinitive: 'glauben', ind_ich: 'glaube', konj_er: 'glaube', meaning: 'believe' },
    { infinitive: 'hoffen', ind_ich: 'hoffe', konj_er: 'hoffe', meaning: 'hope' },
    { infinitive: 'fühlen', ind_ich: 'fühle', konj_er: 'fühle', meaning: 'feel' },
    { infinitive: 'folgen', ind_ich: 'folge', konj_er: 'folge', meaning: 'follow' },
    { infinitive: 'setzen', ind_ich: 'setze', konj_er: 'setze', meaning: 'set/put' },
    { infinitive: 'stellen', ind_ich: 'stelle', konj_er: 'stelle', meaning: 'place (standing)' },
    { infinitive: 'legen', ind_ich: 'lege', konj_er: 'lege', meaning: 'lay (flat)' },
    { infinitive: 'warten', ind_ich: 'warte', konj_er: 'warte', meaning: 'wait' },
    { infinitive: 'arbeiten', ind_ich: 'arbeite', konj_er: 'arbeite', meaning: 'work' },
    { infinitive: 'studieren', ind_ich: 'studiere', konj_er: 'studiere', meaning: 'study' },
    { infinitive: 'feiern', ind_ich: 'feiere', konj_er: 'feiere', meaning: 'celebrate' },
    { infinitive: 'schenken', ind_ich: 'schenke', konj_er: 'schenke', meaning: 'gift' },
    { infinitive: 'schicken', ind_ich: 'schicke', konj_er: 'schicke', meaning: 'send' },
    { infinitive: 'verkaufen', ind_ich: 'verkaufe', konj_er: 'verkaufe', meaning: 'sell' },
    { infinitive: 'erklären', ind_ich: 'erkläre', konj_er: 'erkläre', meaning: 'explain' },
    { infinitive: 'erzählen', ind_ich: 'erzähle', konj_er: 'erzähle', meaning: 'tell' },
    { infinitive: 'versuchen', ind_ich: 'versuche', konj_er: 'versuche', meaning: 'try' },
    { infinitive: 'besuchen', ind_ich: 'besuche', konj_er: 'besuche', meaning: 'visit' },

    // IRREGULAR / STRONG VERBS
    // Note: K1 is usually stems from Indikativ stem, but strong verbs can have vowel changes in Indikativ.
    // K1 usually NO vowel change compared to Infinitive (mostly).
    { infinitive: 'fahren', ind_ich: 'fahre', konj_er: 'fahre', meaning: 'drive' },
    { infinitive: 'sehen', ind_ich: 'sehe', konj_er: 'sehe', meaning: 'see' },
    { infinitive: 'laufen', ind_ich: 'laufe', konj_er: 'laufe', meaning: 'run' },
    { infinitive: 'geben', ind_ich: 'gebe', konj_er: 'gebe', meaning: 'give' },
    { infinitive: 'kommen', ind_ich: 'komme', konj_er: 'komme', meaning: 'come' },
    { infinitive: 'wissen', ind_ich: 'weiß', konj_er: 'wisse', meaning: 'know' }, // Special K1
    { infinitive: 'essen', ind_ich: 'esse', konj_er: 'esse', meaning: 'eat' },
    { infinitive: 'schlafen', ind_ich: 'schlafe', konj_er: 'schlafe', meaning: 'sleep' },
    { infinitive: 'lesen', ind_ich: 'lese', konj_er: 'lese', meaning: 'read' },
    { infinitive: 'nehmen', ind_ich: 'nehme', konj_er: 'nehme', meaning: 'take' },
    { infinitive: 'sprechen', ind_ich: 'spreche', konj_er: 'spreche', meaning: 'speak' },
    { infinitive: 'treffen', ind_ich: 'treffe', konj_er: 'treffe', meaning: 'meet' },
    { infinitive: 'tragen', ind_ich: 'trage', konj_er: 'trage', meaning: 'carry/wear' },
    { infinitive: 'waschen', ind_ich: 'wasche', konj_er: 'wasche', meaning: 'wash' },
    { infinitive: 'fallen', ind_ich: 'falle', konj_er: 'falle', meaning: 'fall' },
    { infinitive: 'lassen', ind_ich: 'lasse', konj_er: 'lasse', meaning: 'let' },
    { infinitive: 'halten', ind_ich: 'halte', konj_er: 'halte', meaning: 'hold' },
    { infinitive: 'heißen', ind_ich: 'heiße', konj_er: 'heiße', meaning: 'be called' },
    { infinitive: 'stehen', ind_ich: 'stehe', konj_er: 'stehe', meaning: 'stand' },
    { infinitive: 'verstehen', ind_ich: 'verstehe', konj_er: 'verstehe', meaning: 'understand' },
    { infinitive: 'gehen', ind_ich: 'gehe', konj_er: 'gehe', meaning: 'go' },
    { infinitive: 'bleiben', ind_ich: 'bleibe', konj_er: 'bleibe', meaning: 'stay' },
    { infinitive: 'schreiben', ind_ich: 'schreibe', konj_er: 'schreibe', meaning: 'write' },
    { infinitive: 'trinken', ind_ich: 'trinke', konj_er: 'trinke', meaning: 'drink' },
    { infinitive: 'singen', ind_ich: 'singe', konj_er: 'singe', meaning: 'sing' },
    { infinitive: 'schwimmen', ind_ich: 'schwimme', konj_er: 'schwimme', meaning: 'swim' },
    { infinitive: 'finden', ind_ich: 'finde', konj_er: 'finde', meaning: 'find' },
    { infinitive: 'fliegen', ind_ich: 'fliege', konj_er: 'fliege', meaning: 'fly' },
    { infinitive: 'ziehen', ind_ich: 'ziehe', konj_er: 'ziehe', meaning: 'pull/move' },
    { infinitive: 'liegen', ind_ich: 'liege', konj_er: 'liege', meaning: 'lie' },
    { infinitive: 'sitzen', ind_ich: 'sitze', konj_er: 'sitze', meaning: 'sit' },
    { infinitive: 'beginnen', ind_ich: 'beginne', konj_er: 'beginne', meaning: 'begin' },
    { infinitive: 'gewinnen', ind_ich: 'gewinne', konj_er: 'gewinne', meaning: 'win' },
    { infinitive: 'verlieren', ind_ich: 'verliere', konj_er: 'verliere', meaning: 'lose' },
    { infinitive: 'bieten', ind_ich: 'biete', konj_er: 'biete', meaning: 'offer' },
    { infinitive: 'schließen', ind_ich: 'schließe', konj_er: 'schließe', meaning: 'close' },
    { infinitive: 'tun', ind_ich: 'tue', konj_er: 'tue', meaning: 'do' },
    { infinitive: 'rufen', ind_ich: 'rufe', konj_er: 'rufe', meaning: 'call' }
];

export const RUMOR_TEMPLATES = [
    { text: "Ich ___ (adj).", type: 'adj' },
    { text: "Ich ___ (noun).", type: 'noun_akk' }
];

export const K1_LEVELS = {
    1: [ // Level 1: The Basics (Structure) - 3rd Person Singular (Unique Forms)
        { direct: "Der Zeuge sieht den Unfall.", indirect: "er sehe den Unfall", pronoun: "er", verb: "sehen", k1: "sehe", ind: "sieht", hint: "Standard: Stem + e (er sehe)" },
        { direct: "Der Bus fährt zu schnell.", indirect: "der Bus fahre zu schnell", pronoun: "er", verb: "fahren", k1: "fahre", ind: "fährt", hint: "Standard: No Umlaut (a -> a)" },
        { direct: "Er kommt heute.", indirect: "er komme heute", pronoun: "er", verb: "kommen", k1: "komme", ind: "kommt", hint: "Standard: Stem + e (er komme)" },
        { direct: "Die Lehrerin gibt Aufgaben.", indirect: "sie gebe Aufgaben", pronoun: "sie", verb: "geben", k1: "gebe", ind: "gibt", hint: "Standard: Stem + e (sie gebe)" },
        { direct: "Das Kind läuft weg.", indirect: "es laufe weg", pronoun: "es", verb: "laufen", k1: "laufe", ind: "läuft", hint: "Standard: No Umlaut (au -> au)" },
        { direct: "Er trägt eine Brille.", indirect: "er trage eine Brille", pronoun: "er", verb: "tragen", k1: "trage", ind: "trägt", hint: "Standard: No Umlaut (a -> a)" },
        { direct: "Sie liest das Buch.", indirect: "sie lese das Buch", pronoun: "sie", verb: "lesen", k1: "lese", ind: "liest", hint: "Standard: Stem + e (sie lese)" },
        { direct: "Er hält das Lenkrad.", indirect: "er halte das Lenkrad", pronoun: "er", verb: "halten", k1: "halte", ind: "hält", hint: "Standard: No Umlaut (a -> a)" },
        { direct: "Es regnet stark.", indirect: "es regne stark", pronoun: "es", verb: "regnen", k1: "regne", ind: "regnet", hint: "Standard: Stem + e" },
        { direct: "Er vergisst den Schlüssel.", indirect: "er vergesse den Schlüssel", pronoun: "er", verb: "vergessen", k1: "vergesse", ind: "vergisst", hint: "Standard: Stem + e (vergesse)" }
    ],
    2: [ // Level 2: The Exception (Sein)
        { direct: "Er ist krank.", indirect: "er sei krank", pronoun: "er", verb: "sein", k1: "sei", ind: "ist", hint: "Sein (Irregular): er sei" },
        { direct: "Wir sind Freunde.", indirect: "sie seien Freunde", pronoun: "sie", verb: "sein", k1: "seien", ind: "sind", hint: "Sein Plural: sie seien" },
        { direct: "Sie sind müde.", indirect: "sie seien müde", pronoun: "sie", verb: "sein", k1: "seien", ind: "sind", hint: "Sein Plural: sie seien" },
        { direct: "Das Wetter ist gut.", indirect: "das Wetter sei gut", pronoun: "es", verb: "sein", k1: "sei", ind: "ist", hint: "Sein: es sei" },
        { direct: "Ich bin da.", indirect: "er sei da", pronoun: "er", verb: "sein", k1: "sei", ind: "ist/bin", hint: "Sein: er sei" },
        { direct: "Die Kinder sind glücklich.", indirect: "die Kinder seien glücklich", pronoun: "sie", verb: "sein", k1: "seien", ind: "sind", hint: "Sein Plural: sie seien" },
        { direct: "Es ist zu spät.", indirect: "es sei zu spät", pronoun: "es", verb: "sein", k1: "sei", ind: "ist", hint: "Sein: es sei" },
        { direct: "Ihr seid eingeladen.", indirect: "sie seien eingeladen", pronoun: "sie", verb: "sein", k1: "seien", ind: "seid", hint: "Sein Plural: sie seien" }
    ],
    3: [ // Level 3: The Collision (Ersatzform K2/Würden)
        // Rule: If K1 == Indikativ, use K2. If K2 == Indikativ Präteritum, use Würden.
        { direct: "Wir gehen nach Hause.", indirect: "sie gingen nach Hause", pronoun: "sie", verb: "gehen", k1: "gingen", ind: "gehen", hint: "Collision: K1(gehen)==Ind -> Use K2 (gingen)" },
        { direct: "Die Eltern haben keine Zeit.", indirect: "die Eltern hätten keine Zeit", pronoun: "sie", verb: "haben", k1: "hätten", ind: "haben", hint: "Collision: K1(haben)==Ind -> Use K2 (hätten)" },
        { direct: "Sie kommen morgen.", indirect: "sie kämen morgen", pronoun: "sie", verb: "kommen", k1: "kämen", ind: "kommen", hint: "Collision: K1(kommen)==Ind -> Use K2 (kämen)" },
        { direct: "Wir lernen Deutsch.", indirect: "sie würden Deutsch lernen", pronoun: "sie", verb: "lernen", k1: "würden lernen", ind: "lernen", hint: "Weak Verb: K1=Ind, K2=Prät -> Use 'würden'" },
        { direct: "Sie brauchen Hilfe.", indirect: "sie würden Hilfe brauchen", pronoun: "sie", verb: "brauchen", k1: "würden brauchen", ind: "brauchen", hint: "Weak Verb: K1=Ind -> Use 'würden'" },
        { direct: "Die Kinder dürfen spielen.", indirect: "die Kinder dürften spielen", pronoun: "sie", verb: "dürfen", k1: "dürften", ind: "dürfen", hint: "Modal: K1(dürfen)==Ind -> Use K2 (dürften)" },
        { direct: "Wir müssen warten.", indirect: "sie müssten warten", pronoun: "sie", verb: "müssen", k1: "müssten", ind: "müssen", hint: "Modal: K1(müssen)==Ind -> Use K2 (müssten)" },
        { direct: "Sie sehen das Problem.", indirect: "sie sähen das Problem", pronoun: "sie", verb: "sehen", k1: "sähen", ind: "sehen", hint: "Strong Verb: K1==Ind -> Use K2 (sähen)" },
        { direct: "Wir fahren weg.", indirect: "sie würden wegfahren", pronoun: "sie", verb: "fahren", k1: "würden fahren", ind: "fahren", hint: "Weak-ish: K2 fuhren? Prefer Würden." },
        { direct: "Sie fragen viel.", indirect: "sie würden viel fragen", pronoun: "sie", verb: "fragen", k1: "würden fragen", ind: "fragen", hint: "Weak Verb -> 'würden'" }
    ],
    4: [ // Level 4: Time Travel (Past & Future)
        // Rule: All Past (Perfekt/Prät) -> K1 Perfect (sei/habe + P.II)
        // Rule: Future -> K1 Future (werde + Inf)
        { direct: "Ich war dort.", indirect: "er sei dort gewesen", pronoun: "er", verb: "sein", k1: "sei gewesen", ind: "war", hint: "Past -> K1 Perfect: sei gewesen" },
        { direct: "Jemand hat angerufen.", indirect: "jemand habe angerufen", pronoun: "es", verb: "anrufen", k1: "habe angerufen", ind: "hat angerufen", hint: "Perfect -> K1 Perfect: habe + P.II" },
        { direct: "Der Unfall passierte gestern.", indirect: "der Unfall sei gestern passiert", pronoun: "er", verb: "passieren", k1: "sei passiert", ind: "passierte", hint: "Past (Movement) -> sei passiert" },
        { direct: "Ich werde kommen.", indirect: "er werde kommen", pronoun: "er", verb: "kommen", k1: "werde kommen", ind: "werde kommen", hint: "Future: werde + Infinitiv" },
        { direct: "Es wird regnen.", indirect: "es werde regnen", pronoun: "es", verb: "regnen", k1: "werde regnen", ind: "wird regnen", hint: "Future: werde + Infinitiv" },
        { direct: "Wir haben gegessen.", indirect: "sie hätten gegessen", pronoun: "sie", verb: "essen", k1: "hätten gegessen", ind: "haben gegessen", hint: "Collision in Aux: haben->hätten + P.II" },
        { direct: "Er sah den Täter.", indirect: "er habe den Täter gesehen", pronoun: "er", verb: "sehen", k1: "habe gesehen", ind: "sah", hint: "Präteritum -> habe gesehen" },
        { direct: "Sie sind abgefahren.", indirect: "sie seien abgefahren", pronoun: "sie", verb: "abfahren", k1: "seien abgefahren", ind: "sind abgefahren", hint: "Plural Sein -> seien + P.II" },
        { direct: "Er war betrunken.", indirect: "er sei betrunken gewesen", pronoun: "er", verb: "sein", k1: "sei gewesen", ind: "war", hint: "Past -> sei gewesen" },
        { direct: "Die Polizei sperrte ab.", indirect: "die Polizei habe abgesperrt", pronoun: "sie", verb: "absperren", k1: "habe abgesperrt", ind: "sperrte", hint: "Präteritum -> habe abgesperrt" }
    ],
    5: [ // Level 5: Orders (Imperative -> Sollen/Mögen)
        { direct: "Mach die Tür zu!", indirect: "er solle die Tür zumachen", pronoun: "er", verb: "zumachen", k1: "solle zumachen", ind: "mach", hint: "Imperative (Order) -> sollen" },
        { direct: "Seid leise!", indirect: "sie sollten leise sein", pronoun: "sie", verb: "sein", k1: "sollten sein", ind: "seid", hint: "Order (Plural) -> sollen -> sollten (collision)" },
        { direct: "Komm sofort her!", indirect: "er solle sofort herkommen", pronoun: "er", verb: "herkommen", k1: "solle herkommen", ind: "komm", hint: "Imperative -> sollen" },
        { direct: "Nimm die Tabletten!", indirect: "er solle die Tabletten nehmen", pronoun: "er", verb: "nehmen", k1: "solle nehmen", ind: "nimm", hint: "Advice/Order -> sollen" },
        { direct: "Fahr nicht so schnell!", indirect: "er solle nicht so schnell fahren", pronoun: "er", verb: "fahren", k1: "solle fahren", ind: "fahr", hint: "Negative Order -> sollen" },
        { direct: "Rufen Sie an!", indirect: "er solle anrufen", pronoun: "er", verb: "anrufen", k1: "solle anrufen", ind: "rufen Sie", hint: "Polite Request -> sollen/möge" },
        { direct: "Geht nach Hause!", indirect: "sie sollten nach Hause gehen", pronoun: "sie", verb: "gehen", k1: "sollten gehen", ind: "geht", hint: "Order (Plural) -> sollten" },
        { direct: "Warte hier!", indirect: "er solle hier warten", pronoun: "er", verb: "warten", k1: "solle warten", ind: "warte", hint: "Order -> sollen" },
        { direct: "Seien Sie vorsichtig!", indirect: "er solle vorsichtig sein", pronoun: "er", verb: "sein", k1: "solle sein", ind: "seien Sie", hint: "Polite -> sollen" },
        { direct: "Hört auf!", indirect: "sie sollten aufhören", pronoun: "sie", verb: "aufhören", k1: "sollten aufhören", ind: "hört auf", hint: "Order -> sollten" }
    ]
};

export class GrammarEngine {
    constructor() {
        this.currentQuestion = null;
        this.mode = 'adjective'; // 'adjective' or 'article_drill'
        this.retryCount = 0;
    }

    setMode(mode) {
        this.mode = mode;
    }

    generateQuestion(filters, level = 1) {
        this.retryCount = 0;
        // If filters are provided, use them. Otherwise (or if strictly in progression mode), use level.
        // For this implementation, we will merge them: Level defines the MAX complexity, filters can restrict it further if manually set.
        // But the user asked for "Upgrade by difficulty", so let's prefer Level constraints if filters are "all on" or "default".
        for (let i = 0; i < 50; i++) {
            const result = this._generateQuestionAttempt(filters, level);
            if (result) return result;
        }
        return this._generateQuestionAttempt(filters, level); // Last attempt
    }

    _generateQuestionAttempt(filters, level) {
        if (this.retryCount > 20) {
            console.warn("Failed to generate valid question after 20 retries. Forcing fallback.");
            // Emergency fallback: Simple singular Nom def structure
            const noun = NOUNS[0]; // Mann
            const context = CONTEXTS[0]; // Das ist
            const adj = ADJECTIVES[0]; // gut
            const rule = GRAMMAR_TABLE[ARTICLES.DEF][CASES.NOM][noun.gender];
            this.currentQuestion = {
                mode: 'adjective',
                noun: noun,
                adj: adj,
                context: context,
                artType: ARTICLES.DEF,
                caseType: CASES.NOM,
                answerArt: rule.art,
                answerAdjSuffix: rule.adj,
                fullAdj: adj.word + rule.adj
            };
            return this.currentQuestion;
        }
        this.retryCount++;

        if (this.mode === 'konjunktiv_i') {
            // New 5-Level System logic
            let targetLvl = Math.min(level, 5);
            if (targetLvl < 1) targetLvl = 1;

            const baseScenarios = K1_LEVELS[targetLvl] || K1_LEVELS[1];

            // Random speaker flavor
            const speakers = ["Villager", "Die Frau", "Der Lehrer", "Das Kind", "Der Polizist"];
            const randomSpeakerName = speakers[Math.floor(Math.random() * speakers.length)];
            const baseScenario = baseScenarios[Math.floor(Math.random() * baseScenarios.length)];

            // Determine Intro Pronoun based on Speaker Name
            let introPronoun = "Er";
            if (randomSpeakerName.toLowerCase().includes("frau") || randomSpeakerName.toLowerCase().includes("lehrerin")) {
                introPronoun = "Sie";
            } else if (randomSpeakerName.toLowerCase().includes("kind") || randomSpeakerName.toLowerCase().includes("mädchen")) {
                introPronoun = "Es";
            } else {
                // Default Er (Villager, Lehrer, Polizist, etc)
                introPronoun = "Er";
            }

            // Construct Prompt
            const prompt = `${randomSpeakerName}: "${baseScenario.direct}"`;

            // Pronoun for "Er/Sie sagt, [pronoun] ..."
            // Use the explicit pronoun from data if available, or fallback to 'er'
            const targetPronoun = baseScenario.pronoun || 'er';

            return {
                mode: 'konjunktiv_i',
                prompt: prompt,
                verb: {
                    infinitive: baseScenario.verb,
                    ind_ich: baseScenario.ind,
                    konj_er: baseScenario.k1,
                    explanation: baseScenario.hint,
                    speakerPronoun: targetPronoun, // The subject of the K1 clause (e.g. "er" in "er fahre")
                    introPronoun: introPronoun     // The reporter (e.g. "Sie" in "Sie sagt")
                },
                level: targetLvl,
                context: { text: "Hör zu...", meaningKey: "k1_hint" },
                answerKey: baseScenario.k1,
                fullAnswer: `${introPronoun} sagt, ${targetPronoun} ${baseScenario.k1}...` // Corrected Full Answer
            };
        }

        if (this.mode === 'article_drill') {
            const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]; // Get noun here for article_drill
            const rule = GRAMMAR_TABLE[ARTICLES.DEF][CASES.NOM][noun.gender];

            this.currentQuestion = {
                mode: 'article_drill',
                noun: noun,
                answer: rule.art
            };
            return this.currentQuestion;
        }

        // --- Difficulty Logic ---
        // Level 1: Nom, Def
        // Level 2: + Akk, + Indef
        // Level 3: + Dat, + None
        // Level 4: + Gen
        // Level 5: All (Balanced)
        // Level 6: All (Hard Mode - Preferred Gen/Dat)

        const levelAllowedCases = [CASES.NOM];
        if (level >= 2) levelAllowedCases.push(CASES.AKK);
        if (level >= 3) levelAllowedCases.push(CASES.DAT);
        if (level >= 4) levelAllowedCases.push(CASES.GEN);

        const levelAllowedArts = [ARTICLES.DEF];
        if (level >= 2) levelAllowedArts.push(ARTICLES.INDEF);
        if (level >= 3) levelAllowedArts.push(ARTICLES.NONE);
        // ------------------------

        // 1. Select Noun
        let noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];

        if (this.mode === 'konjunktiv_i') {
            // K1 Logic: "Rumor Mill"
            // Select a Verb
            const verb = VERBS[Math.floor(Math.random() * VERBS.length)];

            // Construct Sentence
            // Template: "Villager: Ich [verb_ind_ich] ... " -> "Du: Er sagt, er [verb_konj_er] ... "

            let prompt = "";
            let answer = verb.konj_er;
            let fullAnswer = `Er sagt er ${verb.konj_er}`; // Simplified expectation for speech check

            if (verb.infinitive === 'sein') {
                // Ich bin ... (Adjective or Noun)
                // Use Adjectives from generic list
                const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
                prompt = `Villager: "Ich ${verb.ind_ich} ${adj.word}."`;
            } else if (verb.infinitive === 'haben') {
                // Ich habe ... (Noun Akk)
                // Just pick a noun that makes sense logically? Or just random.
                prompt = `Villager: "Ich ${verb.ind_ich} ${noun.tags.includes('pl') ? 'eine' : 'einen'} ${noun.word}."`; // Simplified article
            } else {
                // Modal or Regular: Ich muss ... 
                // Simple complement
                prompt = `Villager: "Ich ${verb.ind_ich} das."`; // Generic object
            }

            this.currentQuestion = {
                mode: 'konjunktiv_i',
                prompt: prompt,
                verb: verb,
                answerKey: verb.konj_er, // Critical word
                fullAnswer: fullAnswer
            };
            return this.currentQuestion;
        }

        if (this.mode === 'article_drill') {
            const rule = GRAMMAR_TABLE[ARTICLES.DEF][CASES.NOM][noun.gender];

            this.currentQuestion = {
                mode: 'article_drill',
                noun: noun,
                answer: rule.art
            };
            return this.currentQuestion;
        }

        // 2. Filter Adjectives based on Noun Tags
        let validAdjectives = ADJECTIVES.filter(adj => {
            if (adj.tags.includes('all')) return true;
            // Check if ANY of noun's tags are in adj's tags
            return noun.tags.some(t => adj.tags.includes(t));
        });

        // Safety: If no valid adjectives, use ANY adjective with 'all' tag
        if (validAdjectives.length === 0) {
            validAdjectives = ADJECTIVES.filter(adj => adj.tags.includes('all'));
        }

        const adj = validAdjectives[Math.floor(Math.random() * validAdjectives.length)];

        // 3. Select Context based on Case, Number, and Tags
        const allowedCases = [];
        // Intersect filters with levelAllowedCases
        if (filters.nom && levelAllowedCases.includes(CASES.NOM)) allowedCases.push(CASES.NOM);
        if (filters.akk && levelAllowedCases.includes(CASES.AKK)) allowedCases.push(CASES.AKK);
        if (filters.dat && levelAllowedCases.includes(CASES.DAT)) allowedCases.push(CASES.DAT);
        if (filters.gen && levelAllowedCases.includes(CASES.GEN)) allowedCases.push(CASES.GEN);

        // Fallback: If intersection is empty (e.g. user selected ONLY Genitive but is Level 1),
        // we force at least one allowed case from the level.
        if (allowedCases.length === 0) {
            if (levelAllowedCases.includes(CASES.NOM)) allowedCases.push(CASES.NOM);
            else allowedCases.push(levelAllowedCases[0]);
        }

        // WEIGHTED SELECTION FOR HIGHER LEVELS
        // At Level 5+, we want to see LESS Nominative and MORE Genitive/Dative.
        let caseWeights = {};
        allowedCases.forEach(c => caseWeights[c] = 1); // Default weight 1

        if (level >= 5) {
            if (caseWeights[CASES.NOM]) caseWeights[CASES.NOM] = 0.3; // Reduce Nom drastically
            if (caseWeights[CASES.AKK]) caseWeights[CASES.AKK] = 0.8; // Reduce Akk slightly
            if (caseWeights[CASES.DAT]) caseWeights[CASES.DAT] = 1.5; // Boost Dat
            if (caseWeights[CASES.GEN]) caseWeights[CASES.GEN] = 2.0; // Boost Gen significantly
        }

        const isPlural = noun.gender === 'pl';
        const validContexts = CONTEXTS.filter(c => {
            if (!allowedCases.includes(c.case)) return false;
            if (c.number === 'sg' && isPlural) return false;
            if (c.number === 'pl' && !isPlural) return false;

            // Tag filtering
            if (c.excludedTags && noun.tags.some(t => c.excludedTags.includes(t))) return false;
            if (c.requiredTags && !noun.tags.some(t => c.requiredTags.includes(t))) return false;

            return true;
        });

        if (validContexts.length === 0) {
            // Retry with a different noun if current noun restricts all available contexts in allowed cases
            return this._generateQuestionAttempt(filters, level);
        }

        // Weighted Random Selection for Contexts
        let weightedContexts = [];
        validContexts.forEach(ctx => {
            const w = caseWeights[ctx.case] || 1;
            // Add multiple copies based on weight (simple implementation)
            // Or just accumulate weight. Let's use accumulation for better precision.
        });

        // Simple Weighted Random:
        let totalWeight = 0;
        validContexts.forEach(ctx => {
            totalWeight += (caseWeights[ctx.case] || 1);
        });

        let randomVal = Math.random() * totalWeight;
        let context = validContexts[validContexts.length - 1];

        for (let i = 0; i < validContexts.length; i++) {
            const w = caseWeights[validContexts[i].case] || 1;
            if (randomVal < w) {
                context = validContexts[i];
                break;
            }
            randomVal -= w;
        }

        // 4. Select Article Type
        const allowedArts = [];
        // Intersect filters with levelAllowedArts
        if (filters.def && levelAllowedArts.includes(ARTICLES.DEF)) allowedArts.push(ARTICLES.DEF);
        if (filters.indef && levelAllowedArts.includes(ARTICLES.INDEF)) allowedArts.push(ARTICLES.INDEF);
        if (filters.none && levelAllowedArts.includes(ARTICLES.NONE)) allowedArts.push(ARTICLES.NONE);

        if (allowedArts.length === 0) {
            if (levelAllowedArts.includes(ARTICLES.DEF)) allowedArts.push(ARTICLES.DEF);
            else allowedArts.push(levelAllowedArts[0]);
        }

        const caseType = context.case;
        let artType = allowedArts[Math.floor(Math.random() * allowedArts.length)];

        const rule = GRAMMAR_TABLE[artType][caseType][noun.gender];

        this.currentQuestion = {
            mode: 'adjective',
            noun: noun,
            adj: adj,
            context: context,
            artType: artType,
            caseType: caseType,
            answerArt: rule.art,
            answerAdjSuffix: rule.adj,
            fullAdj: adj.word + rule.adj
        };

        return this.currentQuestion;
    }

    checkAnswer(userArt, userAdjSuffix) {
        if (!this.currentQuestion) return false;

        const explanationKeys = {
            case: this.currentQuestion.caseType,
            gender: this.currentQuestion.noun.gender,
            artType: this.currentQuestion.artType
        };

        if (this.currentQuestion.mode === 'article_drill') {
            const correct = userArt === this.currentQuestion.answer;
            explanationKeys.case = CASES.NOM;
            explanationKeys.artType = ARTICLES.DEF;

            return {
                correct: correct,
                correctArt: this.currentQuestion.answer,
                explanationKeys,
                correctArt: this.currentQuestion.answer // duplicate key, but ok
            };
        }

        const correctArt = this.currentQuestion.answerArt;
        const correctAdjSuffix = this.currentQuestion.answerAdjSuffix;

        const artMatch = (userArt === correctArt) || (correctArt === '' && !userArt);
        const adjMatch = userAdjSuffix === correctAdjSuffix;

        return {
            correct: artMatch && adjMatch,
            artCorrect: artMatch,
            adjCorrect: adjMatch,
            correctArt: correctArt,
            correctAdjSuffix: correctAdjSuffix,
            explanationKeys
        };
    }
}
