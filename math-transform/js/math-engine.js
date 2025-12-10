/**
 * Math Symbol Transformation Engine
 * 数学符号变换练习引擎
 * 
 * Covers:
 * 1. 括号展开 (Bracket expansion): -(a+b) = -a-b
 * 2. 加减号变化 (Sign changes): -(-a) = +a
 * 3. 等号变换 (Equation transformation): a+b=c → a=c-b
 * 4. 分配律 (Distributive law): 2(a+b) = 2a+2b
 * 5. 合并同类项 (Combining like terms): 2a+3a = 5a
 */

// Question Types
export const Q_TYPES = {
    BRACKET_NEG: 'bracket_neg',      // -(a+b), -(a-b)
    BRACKET_NESTED: 'bracket_nested', // a-(b-c), a+(b-c), a-(b+c)
    BRACKET_MULT: 'bracket_mult',    // 2(a+b), -3(x-y)
    SIGN_DOUBLE: 'sign_double',      // -(-a), +(-b), -(+c)
    EQUATION_MOVE: 'equation_move',  // a+b=c → a=?
    COMBINE_TERMS: 'combine_terms',  // 2a+3a = ?
    FRACTION_SIGN: 'fraction_sign'   // -a/-b = ?
};

// Difficulty Levels
// Level 1: Basic sign changes
// Level 2: Simple bracket expansion
// Level 3: Distributive law with numbers
// Level 4: Equation transformations
// Level 5: Mixed complex problems
// Level 6: All types combined

const LEVEL_CONFIG = {
    1: [Q_TYPES.SIGN_DOUBLE],
    2: [Q_TYPES.SIGN_DOUBLE, Q_TYPES.BRACKET_NEG],
    3: [Q_TYPES.BRACKET_NEG, Q_TYPES.BRACKET_NESTED, Q_TYPES.COMBINE_TERMS],
    4: [Q_TYPES.BRACKET_NESTED, Q_TYPES.BRACKET_MULT, Q_TYPES.EQUATION_MOVE],
    5: [Q_TYPES.EQUATION_MOVE, Q_TYPES.BRACKET_MULT, Q_TYPES.FRACTION_SIGN, Q_TYPES.BRACKET_NESTED],
    6: Object.values(Q_TYPES) // All types
};

// Variables pool
const VARS = ['a', 'b', 'c', 'x', 'y', 'z', 'm', 'n', 'p', 'q'];

// Helper: Random pick
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randNonZero(min, max) {
    let n = 0;
    while (n === 0) n = randInt(min, max);
    return n;
}

// Format coefficient
function formatCoef(n, isFirst = false) {
    if (n === 1) return isFirst ? '' : '+';
    if (n === -1) return '-';
    if (n > 0) return isFirst ? n : '+' + n;
    return n.toString();
}

// Format term
function formatTerm(coef, variable, isFirst = false) {
    if (coef === 0) return '';
    if (coef === 1) return isFirst ? variable : '+' + variable;
    if (coef === -1) return '-' + variable;
    if (coef > 0) return isFirst ? `${coef}${variable}` : `+${coef}${variable}`;
    return `${coef}${variable}`;
}

export class MathEngine {
    constructor() {
        this.currentQuestion = null;
    }

    generateQuestion(level = 1) {
        const allowedTypes = LEVEL_CONFIG[Math.min(level, 6)];
        const type = pick(allowedTypes);

        let question;
        switch (type) {
            case Q_TYPES.SIGN_DOUBLE:
                question = this.genSignDouble();
                break;
            case Q_TYPES.BRACKET_NEG:
                question = this.genBracketNeg();
                break;
            case Q_TYPES.BRACKET_NESTED:
                question = this.genBracketNested();
                break;
            case Q_TYPES.BRACKET_MULT:
                question = this.genBracketMult();
                break;
            case Q_TYPES.EQUATION_MOVE:
                question = this.genEquationMove();
                break;
            case Q_TYPES.COMBINE_TERMS:
                question = this.genCombineTerms();
                break;
            case Q_TYPES.FRACTION_SIGN:
                question = this.genFractionSign();
                break;
            default:
                question = this.genSignDouble();
        }

        this.currentQuestion = question;
        return question;
    }

    // Type 1: Double sign -(-a), -(+a), +(-a)
    genSignDouble() {
        const v = pick(VARS);
        const outer = pick(['+', '-']);
        const inner = pick(['+', '-']);
        
        const prompt = `${outer}(${inner}${v})`;
        
        // Calculate result
        let resultSign;
        if (outer === '+') {
            resultSign = inner;
        } else {
            resultSign = inner === '+' ? '-' : '+';
        }
        
        const answer = resultSign + v;
        const displayAnswer = resultSign === '+' ? v : `-${v}`;
        
        // Generate options
        const options = this.shuffleArray([
            { text: v, value: '+' + v },
            { text: `-${v}`, value: '-' + v },
            { text: `+${v}`, value: '+' + v },
            { text: `-(-${v})`, value: 'trap1' }
        ].filter((opt, idx, arr) => 
            arr.findIndex(o => o.text === opt.text) === idx
        ).slice(0, 4));

        return {
            type: Q_TYPES.SIGN_DOUBLE,
            prompt,
            answer,
            displayAnswer,
            options,
            explanation: {
                zh: outer === '-' 
                    ? `负号乘以${inner === '+' ? '正' : '负'}号等于${resultSign === '+' ? '正' : '负'}号` 
                    : `正号不改变符号`,
                en: outer === '-'
                    ? `Negative × ${inner === '+' ? 'positive' : 'negative'} = ${resultSign === '+' ? 'positive' : 'negative'}`
                    : `Positive sign doesn't change the sign`,
                de: outer === '-'
                    ? `Minus mal ${inner === '+' ? 'Plus' : 'Minus'} ergibt ${resultSign === '+' ? 'Plus' : 'Minus'}`
                    : `Plus ändert das Vorzeichen nicht`
            },
            rule: {
                zh: '符号法则：同号得正，异号得负',
                en: 'Sign Rule: Same signs → positive, Different signs → negative',
                de: 'Vorzeichenregel: Gleiche Vorzeichen → Plus, Ungleiche → Minus'
            }
        };
    }

    // Type 2: Bracket with negative -(a+b), -(a-b)
    genBracketNeg() {
        const v1 = pick(VARS);
        let v2 = pick(VARS);
        while (v2 === v1) v2 = pick(VARS);
        
        const op = pick(['+', '-']);
        const prompt = `-(${v1}${op}${v2})`;
        
        // Expand: distribute the negative
        let answer, displayAnswer;
        if (op === '+') {
            answer = `-${v1}-${v2}`;
            displayAnswer = `-${v1} - ${v2}`;
        } else {
            answer = `-${v1}+${v2}`;
            displayAnswer = `-${v1} + ${v2}`;
        }

        const options = this.shuffleArray([
            { text: `-${v1} - ${v2}`, value: `-${v1}-${v2}` },
            { text: `-${v1} + ${v2}`, value: `-${v1}+${v2}` },
            { text: `${v1} - ${v2}`, value: `${v1}-${v2}` },
            { text: `${v1} + ${v2}`, value: `${v1}+${v2}` }
        ]);

        return {
            type: Q_TYPES.BRACKET_NEG,
            prompt,
            answer,
            displayAnswer,
            options,
            explanation: {
                zh: `负号乘进括号，每一项都要变号：${op === '+' ? '正变负，正变负' : '正变负，负变正'}`,
                en: `Distribute negative sign: each term changes sign`,
                de: `Minuszeichen in die Klammer multiplizieren: Jedes Vorzeichen ändert sich`
            },
            rule: {
                zh: '括号展开：-(a+b) = -a-b，-(a-b) = -a+b',
                en: 'Bracket expansion: -(a+b) = -a-b, -(a-b) = -a+b',
                de: 'Klammerauflösung: -(a+b) = -a-b, -(a-b) = -a+b'
            }
        };
    }

    // Type 2.5: Nested brackets a-(b-c), a+(b-c), a-(b+c)
    genBracketNested() {
        const v1 = pick(VARS);
        let v2 = pick(VARS);
        let v3 = pick(VARS);
        while (v2 === v1) v2 = pick(VARS);
        while (v3 === v1 || v3 === v2) v3 = pick(VARS);
        
        const outerOp = pick(['+', '-']);
        const innerOp = pick(['+', '-']);
        
        const prompt = `${v1} ${outerOp} (${v2} ${innerOp} ${v3})`;
        
        // Calculate result
        // a + (b + c) = a + b + c
        // a + (b - c) = a + b - c
        // a - (b + c) = a - b - c
        // a - (b - c) = a - b + c
        let term2Sign, term3Sign;
        
        if (outerOp === '+') {
            term2Sign = '+';
            term3Sign = innerOp;
        } else {
            term2Sign = '-';
            term3Sign = innerOp === '+' ? '-' : '+';
        }
        
        const answer = `${v1}${term2Sign}${v2}${term3Sign}${v3}`;
        const displayAnswer = `${v1} ${term2Sign} ${v2} ${term3Sign} ${v3}`;

        // Generate all possible wrong answers
        const allOptions = [
            `${v1} + ${v2} + ${v3}`,
            `${v1} + ${v2} - ${v3}`,
            `${v1} - ${v2} + ${v3}`,
            `${v1} - ${v2} - ${v3}`
        ];

        // Find correct option
        const correctOption = allOptions.find(opt => 
            opt.replace(/\s/g, '') === displayAnswer.replace(/\s/g, '')
        ) || displayAnswer;

        const options = this.shuffleArray(
            allOptions.map(opt => ({
                text: opt,
                value: opt.replace(/\s/g, '')
            }))
        );

        return {
            type: Q_TYPES.BRACKET_NESTED,
            prompt,
            answer: answer.replace(/\s/g, ''),
            displayAnswer,
            options,
            explanation: {
                zh: outerOp === '-' 
                    ? `减号后面的括号展开时，括号内每一项都要变号` 
                    : `加号后面的括号展开时，括号内各项符号不变`,
                en: outerOp === '-'
                    ? `When minus sign precedes brackets, each term inside changes sign`
                    : `When plus sign precedes brackets, signs inside stay the same`,
                de: outerOp === '-'
                    ? `Bei einem Minus vor der Klammer ändern sich alle Vorzeichen in der Klammer`
                    : `Bei einem Plus vor der Klammer bleiben die Vorzeichen in der Klammer gleich`
            },
            rule: {
                zh: `a-(b-c) = a-b+c，a-(b+c) = a-b-c，a+(b-c) = a+b-c`,
                en: `a-(b-c) = a-b+c, a-(b+c) = a-b-c, a+(b-c) = a+b-c`,
                de: `a-(b-c) = a-b+c, a-(b+c) = a-b-c, a+(b-c) = a+b-c`
            }
        };
    }

    // Type 3: Bracket with coefficient 2(a+b), -3(x-y)
    genBracketMult() {
        const v1 = pick(VARS);
        let v2 = pick(VARS);
        while (v2 === v1) v2 = pick(VARS);
        
        const coef = randNonZero(-4, 4);
        const op = pick(['+', '-']);
        
        const coefStr = coef === 1 ? '' : coef === -1 ? '-' : coef.toString();
        const prompt = `${coefStr}(${v1}${op}${v2})`;
        
        // Calculate result
        const term1Coef = coef;
        const term2Coef = op === '+' ? coef : -coef;
        
        const term1 = formatTerm(term1Coef, v1, true);
        const term2 = formatTerm(term2Coef, v2, false);
        
        const answer = term1 + term2;
        const displayAnswer = `${term1} ${term2Coef >= 0 ? '+' : '-'} ${Math.abs(term2Coef) === 1 ? '' : Math.abs(term2Coef)}${v2}`;

        // Generate wrong options
        const wrongCoef1 = -term1Coef;
        const wrongCoef2 = -term2Coef;
        
        const options = this.shuffleArray([
            { text: displayAnswer.replace(/\s+/g, ' '), value: answer },
            { text: `${formatTerm(term1Coef, v1, true)} ${-term2Coef >= 0 ? '+' : '-'} ${Math.abs(term2Coef) === 1 ? '' : Math.abs(term2Coef)}${v2}`, value: 'wrong1' },
            { text: `${formatTerm(wrongCoef1, v1, true)} ${term2Coef >= 0 ? '+' : '-'} ${Math.abs(term2Coef) === 1 ? '' : Math.abs(term2Coef)}${v2}`, value: 'wrong2' },
            { text: `${v1}${op}${v2}`, value: 'wrong3' }
        ]);

        return {
            type: Q_TYPES.BRACKET_MULT,
            prompt,
            answer,
            displayAnswer: displayAnswer.replace(/\s+/g, ' '),
            options,
            explanation: {
                zh: `系数 ${coef} 分别乘以括号内每一项`,
                en: `Multiply coefficient ${coef} by each term inside`,
                de: `Koeffizient ${coef} wird mit jedem Glied in der Klammer multipliziert`
            },
            rule: {
                zh: '分配律：a(b+c) = ab + ac',
                en: 'Distributive Law: a(b+c) = ab + ac',
                de: 'Distributivgesetz: a(b+c) = ab + ac'
            }
        };
    }

    // Type 4: Equation transformation a+b=c → a=?
    genEquationMove() {
        const v1 = pick(VARS);
        let v2 = pick(VARS);
        let v3 = pick(VARS);
        while (v2 === v1) v2 = pick(VARS);
        while (v3 === v1 || v3 === v2) v3 = pick(VARS);
        
        const op = pick(['+', '-']);
        
        // Format: v1 op v2 = v3, solve for v1
        const prompt = `${v1} ${op} ${v2} = ${v3}，求 ${v1}`;
        
        // Answer: v1 = v3 - v2 (if op is +) or v1 = v3 + v2 (if op is -)
        let answer, displayAnswer;
        if (op === '+') {
            answer = `${v1}=${v3}-${v2}`;
            displayAnswer = `${v1} = ${v3} - ${v2}`;
        } else {
            answer = `${v1}=${v3}+${v2}`;
            displayAnswer = `${v1} = ${v3} + ${v2}`;
        }

        const options = this.shuffleArray([
            { text: `${v1} = ${v3} - ${v2}`, value: `${v1}=${v3}-${v2}` },
            { text: `${v1} = ${v3} + ${v2}`, value: `${v1}=${v3}+${v2}` },
            { text: `${v1} = ${v2} - ${v3}`, value: `${v1}=${v2}-${v3}` },
            { text: `${v1} = ${v2} + ${v3}`, value: `${v1}=${v2}+${v3}` }
        ]);

        return {
            type: Q_TYPES.EQUATION_MOVE,
            prompt,
            answer,
            displayAnswer,
            options,
            explanation: {
                zh: op === '+' 
                    ? `移项变号：${v2} 从左边移到右边，加号变减号` 
                    : `移项变号：${v2} 从左边移到右边，减号变加号`,
                en: op === '+'
                    ? `Moving term: ${v2} moves to right side, + becomes -`
                    : `Moving term: ${v2} moves to right side, - becomes +`,
                de: op === '+'
                    ? `Umformung: ${v2} wandert nach rechts, Plus wird zu Minus`
                    : `Umformung: ${v2} wandert nach rechts, Minus wird zu Plus`
            },
            rule: {
                zh: '移项法则：移项要变号',
                en: 'Transposition Rule: Sign changes when moving across =',
                de: 'Äquivalenzumformung: Vorzeichen ändert sich beim Seitenwechsel'
            }
        };
    }

    // Type 5: Combine like terms 2a + 3a = ?
    genCombineTerms() {
        const v = pick(VARS);
        const coef1 = randNonZero(-5, 5);
        const coef2 = randNonZero(-5, 5);
        const resultCoef = coef1 + coef2;
        
        const term1 = formatTerm(coef1, v, true);
        const op = coef2 > 0 ? '+' : '';
        const term2 = formatTerm(coef2, v, coef2 < 0);
        
        const prompt = `${term1} ${coef2 >= 0 ? '+' : ''} ${coef2 >= 0 ? formatTerm(coef2, v, true) : formatTerm(coef2, v, true)}`;
        
        const answer = formatTerm(resultCoef, v, true);
        const displayAnswer = resultCoef === 0 ? '0' : answer;

        const wrongResults = [
            resultCoef + 1,
            resultCoef - 1,
            coef1 * coef2,
            -resultCoef
        ].filter(n => n !== resultCoef);

        const options = this.shuffleArray([
            { text: displayAnswer, value: answer },
            { text: formatTerm(wrongResults[0], v, true) || '0', value: 'wrong1' },
            { text: formatTerm(wrongResults[1], v, true) || '0', value: 'wrong2' },
            { text: formatTerm(wrongResults[2], v, true) || '0', value: 'wrong3' }
        ]);

        return {
            type: Q_TYPES.COMBINE_TERMS,
            prompt: `${term1} ${coef2 >= 0 ? '+ ' + formatTerm(coef2, v, true) : formatTerm(coef2, v, true)}`,
            answer,
            displayAnswer,
            options,
            explanation: {
                zh: `合并同类项：系数相加 ${coef1} + (${coef2}) = ${resultCoef}`,
                en: `Combine like terms: coefficients add up ${coef1} + (${coef2}) = ${resultCoef}`,
                de: `Zusammenfassen: Koeffizienten addieren ${coef1} + (${coef2}) = ${resultCoef}`
            },
            rule: {
                zh: '同类项合并：只加减系数，字母不变',
                en: 'Like Terms: Add/subtract coefficients, variable stays',
                de: 'Gleichartige Glieder: Nur Koeffizienten addieren, Variable bleibt'
            }
        };
    }

    // Type 6: Fraction sign -a/-b = ?
    genFractionSign() {
        const v1 = pick(VARS);
        let v2 = pick(VARS);
        while (v2 === v1) v2 = pick(VARS);
        
        const signs = pick([
            { num: '-', den: '-', result: '+' },
            { num: '-', den: '+', result: '-' },
            { num: '+', den: '-', result: '-' }
        ]);
        
        const numSign = signs.num === '+' ? '' : '-';
        const denSign = signs.den === '+' ? '' : '-';
        const prompt = `${numSign}${v1} / ${denSign}${v2}`;
        
        const resultSign = signs.result;
        const answer = resultSign === '+' ? `${v1}/${v2}` : `-${v1}/${v2}`;
        const displayAnswer = resultSign === '+' ? `${v1}/${v2}` : `-${v1}/${v2}`;

        const options = this.shuffleArray([
            { text: `${v1}/${v2}`, value: `${v1}/${v2}` },
            { text: `-${v1}/${v2}`, value: `-${v1}/${v2}` },
            { text: `${v2}/${v1}`, value: 'wrong1' },
            { text: `-${v2}/${v1}`, value: 'wrong2' }
        ]);

        return {
            type: Q_TYPES.FRACTION_SIGN,
            prompt,
            answer,
            displayAnswer,
            options,
            explanation: {
                zh: `分数符号法则：${signs.num === '-' ? '负' : '正'} ÷ ${signs.den === '-' ? '负' : '正'} = ${signs.result === '+' ? '正' : '负'}`,
                en: `Fraction sign rule: ${signs.num} ÷ ${signs.den} = ${signs.result}`,
                de: `Bruchvorzeichen: ${signs.num === '-' ? 'Minus' : 'Plus'} ÷ ${signs.den === '-' ? 'Minus' : 'Plus'} = ${signs.result === '+' ? 'Plus' : 'Minus'}`
            },
            rule: {
                zh: '分数符号：同号得正，异号得负',
                en: 'Fraction Signs: Same → positive, Different → negative',
                de: 'Bruchvorzeichen: Gleiche Vorzeichen → Plus, Ungleiche → Minus'
            }
        };
    }

    checkAnswer(userAnswer) {
        const q = this.currentQuestion;
        if (!q) return { correct: false };

        const normalizedUser = userAnswer.replace(/\s/g, '').toLowerCase();
        const normalizedCorrect = q.answer.replace(/\s/g, '').toLowerCase();
        
        // Also check display answer
        const normalizedDisplay = q.displayAnswer.replace(/\s/g, '').toLowerCase();
        
        const correct = normalizedUser === normalizedCorrect || 
                        normalizedUser === normalizedDisplay ||
                        normalizedUser === q.answer;

        return {
            correct,
            correctAnswer: q.displayAnswer,
            explanation: q.explanation,
            rule: q.rule
        };
    }

    shuffleArray(arr) {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}

// Export question type labels
export const TYPE_LABELS = {
    zh: {
        [Q_TYPES.BRACKET_NEG]: '括号展开（负号）',
        [Q_TYPES.BRACKET_NESTED]: '嵌套括号',
        [Q_TYPES.BRACKET_MULT]: '分配律',
        [Q_TYPES.SIGN_DOUBLE]: '符号法则',
        [Q_TYPES.EQUATION_MOVE]: '移项变号',
        [Q_TYPES.COMBINE_TERMS]: '合并同类项',
        [Q_TYPES.FRACTION_SIGN]: '分数符号'
    },
    en: {
        [Q_TYPES.BRACKET_NEG]: 'Bracket Expansion',
        [Q_TYPES.BRACKET_NESTED]: 'Nested Brackets',
        [Q_TYPES.BRACKET_MULT]: 'Distributive Law',
        [Q_TYPES.SIGN_DOUBLE]: 'Sign Rules',
        [Q_TYPES.EQUATION_MOVE]: 'Equation Transposition',
        [Q_TYPES.COMBINE_TERMS]: 'Combine Like Terms',
        [Q_TYPES.FRACTION_SIGN]: 'Fraction Signs'
    },
    de: {
        [Q_TYPES.BRACKET_NEG]: 'Klammerauflösung',
        [Q_TYPES.BRACKET_NESTED]: 'Verschachtelte Klammern',
        [Q_TYPES.BRACKET_MULT]: 'Distributivgesetz',
        [Q_TYPES.SIGN_DOUBLE]: 'Vorzeichenregeln',
        [Q_TYPES.EQUATION_MOVE]: 'Äquivalenzumformung',
        [Q_TYPES.COMBINE_TERMS]: 'Zusammenfassen',
        [Q_TYPES.FRACTION_SIGN]: 'Bruchvorzeichen'
    }
};

