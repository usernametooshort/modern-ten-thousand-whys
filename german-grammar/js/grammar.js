
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

const NOUNS = [
    // People
    { word: 'Mann', gender: 'masc', meaning: 'Man', tags: ['person'] },
    { word: 'Frau', gender: 'fem', meaning: 'Woman', tags: ['person'] },
    { word: 'Kind', gender: 'neut', meaning: 'Child', tags: ['person'] },
    { word: 'Kinder', gender: 'pl', meaning: 'Children', tags: ['person'] },
    { word: 'Lehrer', gender: 'masc', meaning: 'Teacher', tags: ['person'] },
    
    // Animals
    { word: 'Hund', gender: 'masc', meaning: 'Dog', tags: ['animal'] },
    { word: 'Katze', gender: 'fem', meaning: 'Cat', tags: ['animal'] },
    
    // Objects
    { word: 'Tisch', gender: 'masc', meaning: 'Table', tags: ['object', 'furniture'] },
    { word: 'Lampe', gender: 'fem', meaning: 'Lamp', tags: ['object', 'furniture'] },
    { word: 'Buch', gender: 'neut', meaning: 'Book', tags: ['object'] },
    { word: 'Bücher', gender: 'pl', meaning: 'Books', tags: ['object'] },
    { word: 'Stift', gender: 'masc', meaning: 'Pen', tags: ['object'] },
    
    // Food
    { word: 'Apfel', gender: 'masc', meaning: 'Apple', tags: ['food'] },
    { word: 'Brot', gender: 'neut', meaning: 'Bread', tags: ['food'] },
    { word: 'Suppe', gender: 'fem', meaning: 'Soup', tags: ['food'] },
    
    // Vehicles/Buildings
    { word: 'Auto', gender: 'neut', meaning: 'Car', tags: ['vehicle'] },
    { word: 'Autos', gender: 'pl', meaning: 'Cars', tags: ['vehicle'] },
    { word: 'Haus', gender: 'neut', meaning: 'House', tags: ['building'] },
    
    // Plants
    { word: 'Blume', gender: 'fem', meaning: 'Flower', tags: ['plant'] }
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
            [GENDERS.FEM]:  { art: 'die', adj: 'e' },
            [GENDERS.NEUT]: { art: 'das', adj: 'e' },
            [GENDERS.PL]:   { art: 'die', adj: 'en' }
        },
        [CASES.AKK]: {
            [GENDERS.MASC]: { art: 'den', adj: 'en' },
            [GENDERS.FEM]:  { art: 'die', adj: 'e' },
            [GENDERS.NEUT]: { art: 'das', adj: 'e' },
            [GENDERS.PL]:   { art: 'die', adj: 'en' }
        },
        [CASES.DAT]: {
            [GENDERS.MASC]: { art: 'dem', adj: 'en' },
            [GENDERS.FEM]:  { art: 'der', adj: 'en' },
            [GENDERS.NEUT]: { art: 'dem', adj: 'en' },
            [GENDERS.PL]:   { art: 'den', adj: 'en' }
        },
        [CASES.GEN]: {
            [GENDERS.MASC]: { art: 'des', adj: 'en' },
            [GENDERS.FEM]:  { art: 'der', adj: 'en' },
            [GENDERS.NEUT]: { art: 'des', adj: 'en' },
            [GENDERS.PL]:   { art: 'der', adj: 'en' }
        }
    },
    // Indefinite Articles (Mixed Endings)
    [ARTICLES.INDEF]: {
        [CASES.NOM]: {
            [GENDERS.MASC]: { art: 'ein', adj: 'er' },
            [GENDERS.FEM]:  { art: 'eine', adj: 'e' },
            [GENDERS.NEUT]: { art: 'ein', adj: 'es' },
            [GENDERS.PL]:   { art: 'keine', adj: 'en' } // Mixed plural is always with kein/mein
        },
        [CASES.AKK]: {
            [GENDERS.MASC]: { art: 'einen', adj: 'en' },
            [GENDERS.FEM]:  { art: 'eine', adj: 'e' },
            [GENDERS.NEUT]: { art: 'ein', adj: 'es' },
            [GENDERS.PL]:   { art: 'keine', adj: 'en' }
        },
        [CASES.DAT]: {
            [GENDERS.MASC]: { art: 'einem', adj: 'en' },
            [GENDERS.FEM]:  { art: 'einer', adj: 'en' },
            [GENDERS.NEUT]: { art: 'einem', adj: 'en' },
            [GENDERS.PL]:   { art: 'keinen', adj: 'en' }
        },
        [CASES.GEN]: {
            [GENDERS.MASC]: { art: 'eines', adj: 'en' },
            [GENDERS.FEM]:  { art: 'einer', adj: 'en' },
            [GENDERS.NEUT]: { art: 'eines', adj: 'en' },
            [GENDERS.PL]:   { art: 'keiner', adj: 'en' }
        }
    },
    // No Articles (Strong Endings)
    [ARTICLES.NONE]: {
        [CASES.NOM]: {
            [GENDERS.MASC]: { art: '', adj: 'er' },
            [GENDERS.FEM]:  { art: '', adj: 'e' },
            [GENDERS.NEUT]: { art: '', adj: 'es' },
            [GENDERS.PL]:   { art: '', adj: 'e' }
        },
        [CASES.AKK]: {
            [GENDERS.MASC]: { art: '', adj: 'en' },
            [GENDERS.FEM]:  { art: '', adj: 'e' },
            [GENDERS.NEUT]: { art: '', adj: 'es' },
            [GENDERS.PL]:   { art: '', adj: 'e' }
        },
        [CASES.DAT]: {
            [GENDERS.MASC]: { art: '', adj: 'em' },
            [GENDERS.FEM]:  { art: '', adj: 'er' },
            [GENDERS.NEUT]: { art: '', adj: 'em' },
            [GENDERS.PL]:   { art: '', adj: 'en' }
        },
        [CASES.GEN]: {
            [GENDERS.MASC]: { art: '', adj: 'en' }, // Strong Genitive M/N usually takes -en if noun takes -s
            [GENDERS.FEM]:  { art: '', adj: 'er' },
            [GENDERS.NEUT]: { art: '', adj: 'en' }, 
            [GENDERS.PL]:   { art: '', adj: 'er' }
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

export class GrammarEngine {
    constructor() {
        this.currentQuestion = null;
        this.mode = 'adjective'; // 'adjective' or 'article_drill'
        this.retryCount = 0;
    }

    setMode(mode) {
        this.mode = mode;
    }

    generateQuestion(filters, level = 5) {
        this.retryCount = 0;
        // If filters are provided, use them. Otherwise (or if strictly in progression mode), use level.
        // For this implementation, we will merge them: Level defines the MAX complexity, filters can restrict it further if manually set.
        // But the user asked for "Upgrade by difficulty", so let's prefer Level constraints if filters are "all on" or "default".
        
        return this._generateQuestionAttempt(filters, level);
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
