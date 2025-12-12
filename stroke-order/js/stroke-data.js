/**
 * Chinese Character Stroke Order Data
 * 
 * Each character contains:
 * - char: The Chinese character
 * - pinyin: Pinyin pronunciation
 * - meaning: English meaning
 * - strokeCount: Total number of strokes
 * - strokes: Array of stroke definitions
 *   - type: Stroke type (横heng, 竖shu, 撇pie, 捺na, 点dian, 提ti, 折zhe, 钩gou)
 *   - name: Chinese name of the stroke
 *   - direction: Direction vector [dx, dy] normalized
 *   - path: Array of control points [[x, y], ...] normalized 0-1
 *   - tolerance: Matching tolerance (0-1, lower = stricter)
 */

// Stroke type definitions
export const STROKE_TYPES = {
    HENG: 'heng',      // 横 Horizontal stroke (left to right)
    SHU: 'shu',        // 竖 Vertical stroke (top to bottom)
    PIE: 'pie',        // 撇 Left-falling stroke
    NA: 'na',          // 捺 Right-falling stroke
    DIAN: 'dian',      // 点 Dot
    TI: 'ti',          // 提 Rising stroke
    ZHE: 'zhe',        // 折 Turning stroke
    GOU: 'gou',        // 钩 Hook
    HENGZHE: 'hengzhe', // 横折
    SHUZHE: 'shuzhe',   // 竖折
    HENGZHEGOU: 'hengzhegou', // 横折钩
    SHUGOU: 'shugou',   // 竖钩
    WANGOU: 'wangou',   // 弯钩
    PIEDIAN: 'piedian', // 撇点
    HENGPIE: 'hengpie', // 横撇
};

// Stroke names in Chinese
export const STROKE_NAMES = {
    [STROKE_TYPES.HENG]: '横',
    [STROKE_TYPES.SHU]: '竖',
    [STROKE_TYPES.PIE]: '撇',
    [STROKE_TYPES.NA]: '捺',
    [STROKE_TYPES.DIAN]: '点',
    [STROKE_TYPES.TI]: '提',
    [STROKE_TYPES.ZHE]: '折',
    [STROKE_TYPES.GOU]: '钩',
    [STROKE_TYPES.HENGZHE]: '横折',
    [STROKE_TYPES.SHUZHE]: '竖折',
    [STROKE_TYPES.HENGZHEGOU]: '横折钩',
    [STROKE_TYPES.SHUGOU]: '竖钩',
    [STROKE_TYPES.WANGOU]: '弯钩',
    [STROKE_TYPES.PIEDIAN]: '撇点',
    [STROKE_TYPES.HENGPIE]: '横撇',
};

// Basic character set (easiest)
export const BASIC_CHARS = [
    {
        char: '一',
        pinyin: 'yī',
        meaning: 'one',
        strokeCount: 1,
        strokes: [
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.15, 0.5], [0.85, 0.5]],
                tolerance: 0.3
            }
        ]
    },
    {
        char: '二',
        pinyin: 'èr',
        meaning: 'two',
        strokeCount: 2,
        strokes: [
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.2, 0.35], [0.8, 0.35]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.15, 0.65], [0.85, 0.65]],
                tolerance: 0.3
            }
        ]
    },
    {
        char: '三',
        pinyin: 'sān',
        meaning: 'three',
        strokeCount: 3,
        strokes: [
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.2, 0.25], [0.8, 0.25]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.25, 0.5], [0.75, 0.5]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.15, 0.75], [0.85, 0.75]],
                tolerance: 0.3
            }
        ]
    },
    {
        char: '十',
        pinyin: 'shí',
        meaning: 'ten',
        strokeCount: 2,
        strokes: [
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.15, 0.5], [0.85, 0.5]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.5, 0.15], [0.5, 0.85]],
                tolerance: 0.3
            }
        ]
    },
    {
        char: '大',
        pinyin: 'dà',
        meaning: 'big',
        strokeCount: 3,
        strokes: [
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.2, 0.35], [0.8, 0.35]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.5, 0.35], [0.2, 0.85]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.NA,
                name: '捺',
                direction: [0.5, 0.866],
                path: [[0.5, 0.35], [0.8, 0.85]],
                tolerance: 0.35
            }
        ]
    },
    {
        char: '小',
        pinyin: 'xiǎo',
        meaning: 'small',
        strokeCount: 3,
        strokes: [
            {
                type: STROKE_TYPES.SHUGOU,
                name: '竖钩',
                direction: [0, 1],
                path: [[0.5, 0.15], [0.5, 0.75], [0.55, 0.7]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.45, 0.45], [0.25, 0.75]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.DIAN,
                name: '点',
                direction: [0.5, 0.866],
                path: [[0.55, 0.45], [0.7, 0.65]],
                tolerance: 0.4
            }
        ]
    },
    {
        char: '人',
        pinyin: 'rén',
        meaning: 'person',
        strokeCount: 2,
        strokes: [
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.55, 0.2], [0.25, 0.85]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.NA,
                name: '捺',
                direction: [0.5, 0.866],
                path: [[0.55, 0.2], [0.8, 0.85]],
                tolerance: 0.35
            }
        ]
    },
    {
        char: '口',
        pinyin: 'kǒu',
        meaning: 'mouth',
        strokeCount: 3,
        strokes: [
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.3, 0.25], [0.3, 0.75]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENGZHE,
                name: '横折',
                direction: [1, 0],
                path: [[0.3, 0.25], [0.7, 0.25], [0.7, 0.75]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.3, 0.75], [0.7, 0.75]],
                tolerance: 0.3
            }
        ]
    },
    {
        char: '日',
        pinyin: 'rì',
        meaning: 'sun/day',
        strokeCount: 4,
        strokes: [
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.3, 0.2], [0.3, 0.8]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENGZHE,
                name: '横折',
                direction: [1, 0],
                path: [[0.3, 0.2], [0.7, 0.2], [0.7, 0.8]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.3, 0.5], [0.7, 0.5]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.3, 0.8], [0.7, 0.8]],
                tolerance: 0.3
            }
        ]
    },
    {
        char: '月',
        pinyin: 'yuè',
        meaning: 'moon/month',
        strokeCount: 4,
        strokes: [
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.3, 0.95],
                path: [[0.35, 0.2], [0.25, 0.85]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.HENGZHE,
                name: '横折钩',
                direction: [1, 0],
                path: [[0.35, 0.2], [0.7, 0.2], [0.7, 0.8], [0.65, 0.85]],
                tolerance: 0.4
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.35, 0.45], [0.7, 0.45]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.35, 0.65], [0.7, 0.65]],
                tolerance: 0.3
            }
        ]
    },
    {
        char: '山',
        pinyin: 'shān',
        meaning: 'mountain',
        strokeCount: 3,
        strokes: [
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.5, 0.15], [0.5, 0.85]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.SHUZHE,
                name: '竖折',
                direction: [0, 1],
                path: [[0.25, 0.4], [0.25, 0.85], [0.75, 0.85]],
                tolerance: 0.4
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.75, 0.4], [0.75, 0.85]],
                tolerance: 0.3
            }
        ]
    },
    {
        char: '水',
        pinyin: 'shuǐ',
        meaning: 'water',
        strokeCount: 4,
        strokes: [
            {
                type: STROKE_TYPES.SHUGOU,
                name: '竖钩',
                direction: [0, 1],
                path: [[0.5, 0.15], [0.5, 0.7], [0.55, 0.65]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.HENGPIE,
                name: '横撇',
                direction: [1, 0],
                path: [[0.35, 0.35], [0.5, 0.35], [0.3, 0.55]],
                tolerance: 0.4
            },
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.5, 0.45], [0.2, 0.85]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.NA,
                name: '捺',
                direction: [0.5, 0.866],
                path: [[0.5, 0.45], [0.8, 0.85]],
                tolerance: 0.35
            }
        ]
    },
    {
        char: '火',
        pinyin: 'huǒ',
        meaning: 'fire',
        strokeCount: 4,
        strokes: [
            {
                type: STROKE_TYPES.DIAN,
                name: '点',
                direction: [-0.3, 0.95],
                path: [[0.35, 0.35], [0.3, 0.45]],
                tolerance: 0.4
            },
            {
                type: STROKE_TYPES.DIAN,
                name: '点',
                direction: [0.3, 0.95],
                path: [[0.65, 0.35], [0.7, 0.45]],
                tolerance: 0.4
            },
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.55, 0.2], [0.2, 0.85]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.NA,
                name: '捺',
                direction: [0.5, 0.866],
                path: [[0.55, 0.35], [0.85, 0.85]],
                tolerance: 0.35
            }
        ]
    },
    {
        char: '木',
        pinyin: 'mù',
        meaning: 'wood/tree',
        strokeCount: 4,
        strokes: [
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.15, 0.4], [0.85, 0.4]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.5, 0.15], [0.5, 0.85]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.5, 0.4], [0.2, 0.75]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.NA,
                name: '捺',
                direction: [0.5, 0.866],
                path: [[0.5, 0.4], [0.8, 0.75]],
                tolerance: 0.35
            }
        ]
    },
    {
        char: '土',
        pinyin: 'tǔ',
        meaning: 'earth/soil',
        strokeCount: 3,
        strokes: [
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.25, 0.35], [0.75, 0.35]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.5, 0.35], [0.5, 0.8]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.15, 0.8], [0.85, 0.8]],
                tolerance: 0.3
            }
        ]
    },
    {
        char: '王',
        pinyin: 'wáng',
        meaning: 'king',
        strokeCount: 4,
        strokes: [
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.2, 0.25], [0.8, 0.25]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.25, 0.5], [0.75, 0.5]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.5, 0.25], [0.5, 0.75]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.15, 0.75], [0.85, 0.75]],
                tolerance: 0.3
            }
        ]
    },
    {
        char: '天',
        pinyin: 'tiān',
        meaning: 'sky/heaven',
        strokeCount: 4,
        strokes: [
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.2, 0.25], [0.8, 0.25]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.15, 0.5], [0.85, 0.5]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.5, 0.5], [0.2, 0.85]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.NA,
                name: '捺',
                direction: [0.5, 0.866],
                path: [[0.5, 0.5], [0.8, 0.85]],
                tolerance: 0.35
            }
        ]
    },
    {
        char: '中',
        pinyin: 'zhōng',
        meaning: 'middle/center',
        strokeCount: 4,
        strokes: [
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.5, 0.15], [0.5, 0.85]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENGZHE,
                name: '横折',
                direction: [1, 0],
                path: [[0.3, 0.3], [0.7, 0.3], [0.7, 0.7]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.3, 0.7], [0.7, 0.7]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.3, 0.3], [0.3, 0.7]],
                tolerance: 0.3
            }
        ]
    },
    {
        char: '上',
        pinyin: 'shàng',
        meaning: 'up/above',
        strokeCount: 3,
        strokes: [
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.5, 0.2], [0.5, 0.8]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.3, 0.45], [0.7, 0.45]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.2, 0.8], [0.8, 0.8]],
                tolerance: 0.3
            }
        ]
    },
    {
        char: '下',
        pinyin: 'xià',
        meaning: 'down/below',
        strokeCount: 3,
        strokes: [
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.2, 0.25], [0.8, 0.25]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.5, 0.25], [0.5, 0.85]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.DIAN,
                name: '点',
                direction: [0.5, 0.866],
                path: [[0.55, 0.5], [0.7, 0.65]],
                tolerance: 0.4
            }
        ]
    }
];

// Common characters (medium difficulty)
export const COMMON_CHARS = [
    {
        char: '我',
        pinyin: 'wǒ',
        meaning: 'I/me',
        strokeCount: 7,
        strokes: [
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.3, 0.2], [0.15, 0.5]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.15, 0.35], [0.5, 0.35]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.35, 0.2], [0.35, 0.55]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.15, 0.55], [0.5, 0.55]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.SHUGOU,
                name: '斜钩',
                direction: [0.3, 0.95],
                path: [[0.5, 0.2], [0.7, 0.7], [0.75, 0.65]],
                tolerance: 0.4
            },
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.55, 0.5], [0.4, 0.75]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.DIAN,
                name: '点',
                direction: [0.3, 0.95],
                path: [[0.7, 0.55], [0.85, 0.75]],
                tolerance: 0.4
            }
        ]
    },
    {
        char: '你',
        pinyin: 'nǐ',
        meaning: 'you',
        strokeCount: 7,
        strokes: [
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.25, 0.2], [0.15, 0.45]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.25, 0.35], [0.25, 0.85]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.5, 0.2], [0.35, 0.55]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.HENGZHEGOU,
                name: '横折钩',
                direction: [1, 0],
                path: [[0.4, 0.35], [0.7, 0.35], [0.7, 0.55], [0.65, 0.5]],
                tolerance: 0.4
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.55, 0.35], [0.55, 0.55]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.55, 0.6], [0.4, 0.85]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.NA,
                name: '捺',
                direction: [0.5, 0.866],
                path: [[0.55, 0.6], [0.75, 0.85]],
                tolerance: 0.35
            }
        ]
    },
    {
        char: '他',
        pinyin: 'tā',
        meaning: 'he/him',
        strokeCount: 5,
        strokes: [
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.25, 0.2], [0.15, 0.5]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.25, 0.4], [0.25, 0.85]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENGZHE,
                name: '横折',
                direction: [1, 0],
                path: [[0.4, 0.3], [0.8, 0.3], [0.8, 0.55]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.6, 0.3], [0.6, 0.55]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.SHUGOU,
                name: '竖弯钩',
                direction: [0, 1],
                path: [[0.6, 0.55], [0.6, 0.75], [0.85, 0.75], [0.85, 0.7]],
                tolerance: 0.4
            }
        ]
    },
    {
        char: '好',
        pinyin: 'hǎo',
        meaning: 'good',
        strokeCount: 6,
        strokes: [
            {
                type: STROKE_TYPES.PIE,
                name: '撇点',
                direction: [-0.5, 0.866],
                path: [[0.3, 0.2], [0.15, 0.5], [0.25, 0.6]],
                tolerance: 0.4
            },
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.25, 0.5], [0.15, 0.85]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.15, 0.6], [0.35, 0.6]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENGZHE,
                name: '横折',
                direction: [1, 0],
                path: [[0.5, 0.25], [0.8, 0.25], [0.8, 0.55]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.5, 0.55], [0.8, 0.55]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.SHUGOU,
                name: '竖弯钩',
                direction: [0, 1],
                path: [[0.65, 0.55], [0.65, 0.75], [0.85, 0.75], [0.85, 0.7]],
                tolerance: 0.4
            }
        ]
    },
    {
        char: '是',
        pinyin: 'shì',
        meaning: 'is/yes',
        strokeCount: 9,
        strokes: [
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.5, 0.1], [0.5, 0.35]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENGZHE,
                name: '横折',
                direction: [1, 0],
                path: [[0.3, 0.2], [0.7, 0.2], [0.7, 0.35]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.3, 0.35], [0.7, 0.35]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.2, 0.45], [0.8, 0.45]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.25, 0.55], [0.75, 0.55]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.3, 0.65], [0.7, 0.65]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.5, 0.45], [0.5, 0.75]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.5, 0.75], [0.25, 0.9]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.NA,
                name: '捺',
                direction: [0.5, 0.866],
                path: [[0.5, 0.75], [0.75, 0.9]],
                tolerance: 0.35
            }
        ]
    },
    {
        char: '不',
        pinyin: 'bù',
        meaning: 'not',
        strokeCount: 4,
        strokes: [
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.15, 0.25], [0.85, 0.25]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.5, 0.25], [0.2, 0.7]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.5, 0.25], [0.5, 0.85]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.DIAN,
                name: '点',
                direction: [0.5, 0.866],
                path: [[0.55, 0.5], [0.7, 0.65]],
                tolerance: 0.4
            }
        ]
    },
    {
        char: '在',
        pinyin: 'zài',
        meaning: 'at/in',
        strokeCount: 6,
        strokes: [
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.2, 0.2], [0.8, 0.2]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.5, 0.2], [0.25, 0.55]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.5, 0.2], [0.5, 0.55]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.2, 0.55], [0.8, 0.55]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.3, 0.7], [0.7, 0.7]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.15, 0.85], [0.85, 0.85]],
                tolerance: 0.3
            }
        ]
    },
    {
        char: '有',
        pinyin: 'yǒu',
        meaning: 'have',
        strokeCount: 6,
        strokes: [
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.2, 0.2], [0.7, 0.2]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.PIE,
                name: '撇',
                direction: [-0.5, 0.866],
                path: [[0.5, 0.2], [0.2, 0.55]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.SHU,
                name: '竖',
                direction: [0, 1],
                path: [[0.3, 0.4], [0.3, 0.85]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENGZHE,
                name: '横折',
                direction: [1, 0],
                path: [[0.3, 0.4], [0.8, 0.4], [0.8, 0.85]],
                tolerance: 0.35
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.3, 0.6], [0.8, 0.6]],
                tolerance: 0.3
            },
            {
                type: STROKE_TYPES.HENG,
                name: '横',
                direction: [1, 0],
                path: [[0.3, 0.85], [0.8, 0.85]],
                tolerance: 0.3
            }
        ]
    }
];

// HSK Level 1 characters
export const HSK1_CHARS = [
    ...BASIC_CHARS,
    ...COMMON_CHARS
];

// Get all characters
export const ALL_CHARS = [
    ...BASIC_CHARS,
    ...COMMON_CHARS
];

// Utility function to get characters by category
export function getCharacterSet(category) {
    switch (category) {
        case 'basic':
            return BASIC_CHARS;
        case 'common':
            return COMMON_CHARS;
        case 'hsk1':
            return HSK1_CHARS;
        default:
            return ALL_CHARS;
    }
}

// Get a random character from a set
export function getRandomCharacter(category = 'basic') {
    const chars = getCharacterSet(category);
    return chars[Math.floor(Math.random() * chars.length)];
}

// Find character by char
export function findCharacter(char) {
    return ALL_CHARS.find(c => c.char === char);
}

