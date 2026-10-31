import { loadAnswerers } from '../../core/answererConfig.js';

const REQUEST_TIMEOUT_MS = 60 * 1000;
const DEFAULT_HANDLER = 'return (res)=> [JSON.stringify(res), undefined]';
const DEFAULT_SEPARATORS = ['===', '#', '---', '###', '|', ';', '；'];
const CACHE_PREFIX = 'ze_answerer_cache:';
const CACHE_TTL_MS = 30 * 60 * 1000;
const memoryCache = new Map();

/* ------------------------------ 字符串工具 ------------------------------ */

function clearString(str, ...exclude) {
    exclude.push('①②③④⑤⑥⑦⑧⑨');
    return String(str ?? '')
        .trim()
        .toLocaleLowerCase()
        .replace(RegExp(`[^\\u2E80-\\u9FFFA-Za-z0-9${exclude.join('')}]*`, 'g'), '');
}

function normalizeString(str) {
    return clearString(
        String(str ?? '')
            .replace(/[，。！？；：""''、（）【】《》\s]/g, '')
            .replace(/[,.\-!?;:'"()[\]<>]/g, '')
            .replace(/[ａ-ｚＡ-Ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
            .replace(/％/g, '%')
    );
}

function removeRedundant(str) {
    return (
        String(str ?? '')
            .trim()
            .replace(/^[A-Z]{1}[^A-Za-z0-9⺀-鿿]+([A-Za-z0-9⺀-鿿]+)/, '$1')
            .replace(/^[A-Z]{1}([⺀-鿿][A-Za-z0-9⺀-鿿]*)/, '$1') || ''
    );
}

function compareTwoStrings(first, second) {
    const a = String(first ?? '').replace(/\s+/g, '');
    const b = String(second ?? '').replace(/\s+/g, '');
    if (a === b) {
        return a.length ? 1 : 0;
    }
    if (a.length < 2 || b.length < 2) {
        return 0;
    }
    const bigrams = new Map();
    for (let i = 0; i < a.length - 1; i++) {
        const bigram = a.slice(i, i + 2);
        bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    let intersection = 0;
    for (let i = 0; i < b.length - 1; i++) {
        const bigram = b.slice(i, i + 2);
        const count = bigrams.get(bigram) || 0;
        if (count > 0) {
            intersection++;
            bigrams.set(bigram, count - 1);
        }
    }
    return (2 * intersection) / (a.length - 1 + b.length - 1);
}

function findBestMatch(mainString, targetStrings) {
    if (!targetStrings.length) {
        return { bestMatch: { target: '', rating: 0 }, ratings: [] };
    }
    const ratings = targetStrings.map((target) => ({
        target,
        rating: compareTwoStrings(mainString, target),
    }));
    let bestMatch = ratings[0];
    for (const rating of ratings) {
        if (rating.rating > bestMatch.rating) {
            bestMatch = rating;
        }
    }
    return { bestMatch, ratings };
}

/* ------------------------------ 答案工具 ------------------------------ */

function isProgramAnswer(answer) {
    const code = String(answer ?? '').trim();
    if (!code || !/[;|；]/.test(code)) {
        return false;
    }
    let score = 0;
    const strong = [
        /#include\s*[<"]/,
        /#define\s+\w/,
        /#!\//,
        /\b(?:int|void|float|double|char|long|short)\s+main\s*\(/,
        /\bfunction\s+\w+\s*\(/,
        /\bdef\s+\w+\s*\(/,
        /\bpublic\s+(?:class|static|void|int|float|double|String|final)\b/,
        /\bprivate\s+(?:class|static|void|int|float|double|String|final)\b/,
        /\bprotected\s+(?:class|static|void|int|float|double|String|final)\b/,
        /\bprintf\s*\(/,
        /\bscanf\s*\(/,
        /\bcout\s*<</,
        /\bcin\s*>>/,
        /System\.out\./,
        /console\.log\s*\(/,
        /\bpackage\s+[\w.]+\s*;/,
        /\bimport\s+[\w.*]+\s*;/,
        /\bclass\s+\w+\s*\{/,
        /\bstruct\s+\w+\s*\{/,
    ];
    for (const re of strong) {
        if (re.test(code)) score += 2;
    }
    const medium = [
        /=>/,
        /->/,
        /::/,
        /\+\+/,
        /--/,
        /[+\-*/%]=/,
        /\bnew\s+\w+\s*\(/,
        /\bfor\s*\(/,
        /\bwhile\s*\(/,
        /\bif\s*\(/,
        /\bswitch\s*\(/,
        /\btypedef\s+/,
        /\b(?:int|float|double|char|void|bool|boolean|long|short|String|auto|const|let|var)\s+\w+/,
        /\bsizeof\s*\(/,
        /\bmalloc\s*\(/,
        /\bfree\s*\(/,
        /\bcout\b/,
        /\bcin\b/,
    ];
    for (const re of medium) {
        if (re.test(code)) score += 1;
    }
    if (/\{/.test(code) && /\}/.test(code)) score += 1;
    if (/;/.test(code)) score += 1;
    return score >= 2;
}

export function splitAnswer(answer, separators = DEFAULT_SEPARATORS) {
    let text = String(answer ?? '').trim();
    if (text.length === 0) {
        return [];
    }
    let separatorList = separators.length ? separators : DEFAULT_SEPARATORS;
    separatorList = separatorList.filter((item) => item.trim().length > 0);
    if (isProgramAnswer(text)) {
        separatorList = separatorList.filter((item) => item !== ';' && item !== '|' && item !== '；');
    }
    try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
            return json
                .map(String)
                .map((item) => item.trim())
                .filter((item) => item.length > 0);
        }
    } catch (error) {
        for (const separator of separatorList) {
            if (text.split(separator).length > 1) {
                return text
                    .split(separator)
                    .map((item) => item.trim())
                    .filter((item) => item.length > 0);
            }
        }
    }
    return [text];
}

function isPlainAnswer(answer) {
    const text = String(answer ?? '').trim();
    if (text.length > 8 || !/[A-Z]/.test(text)) {
        return false;
    }
    let min = 0;
    const counter = {};
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code < min) {
            return false;
        }
        min = code;
        counter[min] = (counter[min] || 0) + 1;
    }
    return Object.keys(counter).every((key) => counter[key] === 1);
}

function resolvePlainAnswer(answer) {
    const resolved = String(answer ?? '').trim().replace(/[,，.。．、 #]/g, '').trim();
    return isPlainAnswer(resolved) ? resolved : undefined;
}

/* ------------------------------ 答案解析器 ------------------------------ */

function answerNormalizedMatch(answers, options) {
    const normalizedAnswers = answers.map(removeRedundant).map(normalizeString);
    const normalizedOptions = options.map(removeRedundant).map(normalizeString);
    if (!normalizedAnswers.length) {
        return [];
    }
    return normalizedOptions
        .map((option, index) => {
            let level = 0;
            if (option) {
                for (const answer of normalizedAnswers) {
                    if (answer === option) {
                        level = 2;
                        break;
                    }
                    if (answer.includes(option)) {
                        level = 1;
                    }
                }
            }
            return { level, original: options[index] };
        })
        .filter((item) => item.level > 0)
        .sort((a, b) => b.level - a.level)
        .map((item) => item.original);
}

function answerSimilar(answers, options) {
    const normalizedAnswers = answers.map(removeRedundant).map((answer) => clearString(answer));
    const normalizedOptions = options.map(removeRedundant).map((option) => clearString(option));
    if (!normalizedAnswers.length) {
        return normalizedOptions.map(() => ({ rating: 0, target: '' }));
    }
    return normalizedOptions.map((option) => {
        if (!option.trim()) {
            return { rating: 0, target: '' };
        }
        return findBestMatch(option, normalizedAnswers).bestMatch;
    });
}

function answerSimilarWithGap(answers, options) {
    const normalizedAnswers = answers.map(removeRedundant).map((answer) => clearString(answer));
    const normalizedOptions = options.map(removeRedundant).map((option) => clearString(option));
    if (!normalizedAnswers.length) {
        return normalizedOptions.map(() => ({ rating: 0, target: '', gap: 0 }));
    }
    const ratings = normalizedOptions.map((option) => {
        if (!option.trim()) {
            return { rating: 0, target: '' };
        }
        return findBestMatch(option, normalizedAnswers).bestMatch;
    });
    const sorted = [...ratings].sort((a, b) => b.rating - a.rating);
    const maxRating = sorted[0]?.rating ?? 0;
    let secondRating = 0;
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].rating < maxRating) {
            secondRating = sorted[i].rating;
            break;
        }
    }
    return ratings.map((rating) => ({
        ...rating,
        gap: rating.rating === maxRating ? maxRating - secondRating : 0,
    }));
}

function disambiguateSimilarOptions(options, ratings, threshold = 0.6) {
    if (options.length <= 1) {
        return options;
    }
    const normalized = options.map((option) => normalizeString(removeRedundant(option)));
    const eliminated = new Set();
    for (let i = 0; i < options.length; i++) {
        if (eliminated.has(i)) continue;
        for (let j = i + 1; j < options.length; j++) {
            if (eliminated.has(j)) continue;
            const pairwise = findBestMatch(normalized[i], [normalized[j]]).bestMatch.rating;
            if (pairwise > threshold) {
                if (ratings[i] >= ratings[j]) {
                    eliminated.add(j);
                } else {
                    eliminated.add(i);
                    break;
                }
            }
        }
    }
    return options.filter((_, index) => !eliminated.has(index));
}

function resolveSingle(answers, options, separators) {
    const allAnswer = answers.map((answer) => splitAnswer(answer, separators)).flat();
    const optionStrings = options.map(removeRedundant);

    const normalized = answerNormalizedMatch(allAnswer, optionStrings);
    if (normalized.length) {
        const index = optionStrings.findIndex((option) => option === normalized[0]);
        if (index !== -1) {
            return { finish: true, option: options[index] };
        }
    }

    const ratings = answerSimilar(allAnswer, optionStrings);
    let bestIndex = -1;
    let bestRating = 0;
    ratings.forEach((rating, index) => {
        if (rating.rating > bestRating) {
            bestRating = rating.rating;
            bestIndex = index;
        }
    });
    if (bestIndex !== -1 && bestRating > 0.6) {
        return { finish: true, option: options[bestIndex] };
    }

    for (const answer of allAnswer) {
        const plain = resolvePlainAnswer(String(answer).trim());
        if (plain && plain.length === 1) {
            const index = plain.charCodeAt(0) - 65;
            if (optionStrings[index] !== undefined) {
                return { finish: true, option: options[index] };
            }
        }
    }

    if (allAnswer.length > 1) {
        const merged = allAnswer.join('');
        const result = resolveSingle([merged], options, separators);
        if (result.finish) {
            return result;
        }
    }

    return { finish: false, allAnswer, options: optionStrings };
}

function resolveMultiple(resultAnswers, options, separators) {
    const optionStrings = options.map(removeRedundant);
    const groups = [];

    for (const resultAnswer of resultAnswers) {
        const answers = splitAnswer(String(resultAnswer).trim(), separators);

        const normalizedGroup = {
            options: [],
            answers: [],
            ratings: [],
            similarSum: 0,
            similarCount: 0,
        };
        const normalizedOptions = answerNormalizedMatch(answers, optionStrings);
        for (const option of normalizedOptions) {
            const index = optionStrings.indexOf(option);
            if (index === -1) continue;
            const matchedAnswer = answers.find((answer) => {
                const normalizedAnswer = normalizeString(removeRedundant(answer));
                const normalizedOption = normalizeString(removeRedundant(option));
                return normalizedAnswer === normalizedOption || normalizedAnswer.includes(normalizedOption);
            });
            if (!matchedAnswer) continue;
            normalizedGroup.options.push(options[index]);
            normalizedGroup.answers.push(matchedAnswer);
            const normalizedAnswer = normalizeString(removeRedundant(matchedAnswer));
            const normalizedOption = normalizeString(removeRedundant(option));
            normalizedGroup.ratings.push(normalizedAnswer === normalizedOption ? 1 : 0.8);
        }
        const normalizedKept = disambiguateSimilarOptions(normalizedGroup.options, normalizedGroup.ratings);
        const normalizedIndices = normalizedKept.map((option) => normalizedGroup.options.indexOf(option));
        normalizedGroup.options = normalizedKept;
        normalizedGroup.answers = normalizedIndices.map((index) => normalizedGroup.answers[index]);
        normalizedGroup.ratings = normalizedIndices.map((index) => normalizedGroup.ratings[index]);
        normalizedGroup.similarCount = normalizedGroup.options.length;
        normalizedGroup.similarSum = normalizedGroup.ratings.reduce((a, b) => a + b, 0);

        const ratingGroup = { options: [], answers: [], ratings: [], similarSum: 0, similarCount: 0 };
        const ratings = answerSimilarWithGap(answers, optionStrings);
        ratings.forEach((rating, index) => {
            if (rating.rating > 0.6) {
                ratingGroup.options.push(options[index]);
                ratingGroup.answers.push(rating.target);
                ratingGroup.ratings.push(rating.rating);
            }
        });
        const kept = disambiguateSimilarOptions(ratingGroup.options, ratingGroup.ratings);
        const keptIndices = kept.map((option) => ratingGroup.options.indexOf(option));
        ratingGroup.options = kept;
        ratingGroup.answers = keptIndices.map((index) => ratingGroup.answers[index]);
        ratingGroup.ratings = keptIndices.map((index) => ratingGroup.ratings[index]);
        ratingGroup.similarCount = ratingGroup.options.length;
        ratingGroup.similarSum = ratingGroup.ratings.reduce((a, b) => a + b, 0);

        groups.push(
            [normalizedGroup, ratingGroup].sort(
                (a, b) => b.similarCount * 100 + b.similarSum - (a.similarCount * 100 + a.similarSum)
            )[0]
        );
    }

    const sorted = groups
        .filter((group) => group.similarCount !== 0)
        .sort((a, b) => b.similarCount * 100 + b.similarSum - (a.similarCount * 100 + a.similarSum));

    if (sorted[0]) {
        return { finish: true, options: sorted[0].options, groups: sorted };
    }

    const plainOptions = [];
    for (const answer of resultAnswers) {
        const text = String(answer ?? '').trim();
        if (resolvePlainAnswer(text)) {
            for (const char of text) {
                const index = char.charCodeAt(0) - 65;
                if (options[index] !== undefined) {
                    plainOptions.push(options[index]);
                }
            }
        }
    }
    if (plainOptions.length) {
        return { finish: true, plainOptions: [...new Set(plainOptions)] };
    }

    return { finish: false };
}

const CORRECT_WORDS = ['是', '对', '正确', '确定', '√', '对的', '是的', '正确的', 'true', 'True', 'T', 'yes', '1'];
const INCORRECT_WORDS = [
    '非',
    '否',
    '错',
    '错误',
    '×',
    'X',
    '错的',
    '不对',
    '不正确的',
    '不正确',
    '不是',
    '不是的',
    'false',
    'False',
    'F',
    'no',
    '0',
];

function judgementMatches(target, words) {
    return words.some(
        (word) =>
            clearString(removeRedundant(word), '√', '×') === clearString(removeRedundant(target), '√', '×')
    );
}

function isJudgementOptions(options) {
    if (options.length !== 2) {
        return false;
    }
    const hasCorrect = options.some((option) => judgementMatches(option, CORRECT_WORDS));
    const hasIncorrect = options.some((option) => judgementMatches(option, INCORRECT_WORDS));
    return hasCorrect && hasIncorrect;
}

function resolveJudgement(answerGroups, options) {
    for (const answers of answerGroups) {
        const showCorrect = answers.find((answer) => judgementMatches(answer, CORRECT_WORDS));
        const showIncorrect = answers.find((answer) => judgementMatches(answer, INCORRECT_WORDS));
        if (showCorrect || showIncorrect) {
            for (const option of options) {
                const textCorrect = judgementMatches(option, CORRECT_WORDS);
                const textIncorrect = judgementMatches(option, INCORRECT_WORDS);
                if (showCorrect && textCorrect) {
                    return { finish: true, option };
                }
                if (showIncorrect && textIncorrect) {
                    return { finish: true, option };
                }
            }
            return { finish: false };
        }
    }
    return { finish: false };
}

function resolveCompletion(answerGroups, blankCount, separators) {
    for (const answers of answerGroups) {
        let list = answers.filter((answer) => answer);
        if (list.length === 1) {
            list = splitAnswer(list[0], separators);
        }
        if (list.length !== 0 && (list.length === blankCount || blankCount === 1)) {
            if (list.length === blankCount) {
                return { finish: true, answers: list };
            }
            if (blankCount === 1) {
                return { finish: true, answers: [list.join(' ')] };
            }
        }
    }
    return { finish: false };
}

/* ------------------------------ 请求引擎 ------------------------------ */

function withTimeout(promise, ms, message) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function resolvePlaceholders(value, env, options = {}) {
    if (typeof value === 'string') {
        return value.replace(/\$\{(.*?)\}/g, (match, key) => {
            if (!Object.prototype.hasOwnProperty.call(env, key)) {
                return match;
            }
            const raw = env[key];
            const text = raw == null ? '' : String(raw);
            return options.encodeURI ? encodeURIComponent(text) : text;
        });
    }
    if (Array.isArray(value)) {
        return value.map((item) => resolvePlaceholders(item, env, options));
    }
    if (value && typeof value === 'object') {
        const result = {};
        Object.keys(value).forEach((key) => {
            result[key] = resolvePlaceholders(value[key], env, options);
        });
        return result;
    }
    return value;
}

function resolveData(data, env) {
    const result = {};
    Object.keys(data || {}).forEach((key) => {
        const value = data[key];
        if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'handler')) {
            const handler = Function(value.handler)();
            if (typeof handler !== 'function') {
                throw new Error('data 字段解析器必须返回一个函数');
            }
            result[key] = handler(env);
        } else {
            result[key] = resolvePlaceholders(value, env);
        }
    });
    return result;
}

function requestOnce(url, options) {
    const { method, responseType, data, type, headers } = options;

    if (type === 'GM_xmlhttpRequest') {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest === 'undefined') {
                reject(new Error('GM_xmlhttpRequest is not defined'));
                return;
            }
            const contentType = headers['Content-Type'] || headers['content-type'];
            const body =
                contentType === 'application/x-www-form-urlencoded'
                    ? new URLSearchParams(data).toString()
                    : Object.keys(data).length
                      ? JSON.stringify(data)
                      : undefined;
            GM_xmlhttpRequest({
                url,
                method: method.toUpperCase(),
                data: body,
                headers: Object.keys(headers).length ? headers : undefined,
                responseType: responseType === 'json' ? 'json' : undefined,
                onload: (response) => {
                    if (response.status === 200) {
                        if (responseType === 'json') {
                            try {
                                resolve(JSON.parse(response.responseText));
                            } catch (error) {
                                reject(error);
                            }
                        } else {
                            resolve(response.responseText || '');
                        }
                    } else {
                        reject(new Error(response.responseText || `HTTP ${response.status}`));
                    }
                },
                onerror: (error) => reject(error),
            });
        });
    }

    const init = { method, headers };
    if (method === 'post') {
        init.body = JSON.stringify(data);
    }
    return fetch(url, init).then((response) =>
        responseType === 'json' ? response.json() : response.text()
    );
}

async function requestWrapper(wrapper, env) {
    const {
        name = '未知题库',
        homepage = '#',
        method = 'get',
        type = 'fetch',
        contentType = 'json',
        headers = {},
        data: wrapperData = {},
        handler = DEFAULT_HANDLER,
    } = wrapper;

    try {
        let url;
        let requestData = {};

        if (method.toLowerCase() === 'get') {
            url = new URL(resolvePlaceholders(wrapper.url, env, { encodeURI: true }));
            Object.keys(wrapperData).forEach((key) => {
                const value = resolvePlaceholders(wrapperData[key], env);
                url.searchParams.set(key, value == null ? '' : String(value));
            });
        } else if (method.toLowerCase() === 'post') {
            url = new URL(wrapper.url);
            requestData = resolveData(wrapperData, env);
        } else {
            throw new Error('不支持的请求方式');
        }

        const responseData = await withTimeout(
            requestOnce(url.toString(), {
                method,
                responseType: contentType,
                data: requestData,
                type,
                headers: JSON.parse(JSON.stringify(headers || {})),
            }),
            REQUEST_TIMEOUT_MS,
            '题库请求超时，可能是题库问题，或者请检查网络或者重试。'
        );

        const responseHandler = Function(handler)();
        if (typeof responseHandler !== 'function') {
            throw new Error('handler 响应处理器必须返回一个函数');
        }
        const info = responseHandler(responseData);

        let results = [];
        if (info && Array.isArray(info)) {
            if (info.every((item) => Array.isArray(item))) {
                results = info.map((item) => ({
                    question: item[0],
                    answer: item[1],
                    extra_data: item[2] || {},
                }));
            } else {
                results = [{ question: info[0], answer: info[1], extra_data: info[2] || {} }];
            }
        }

        return {
            url: wrapper.url,
            name,
            homepage,
            results,
            response: responseData,
            data: requestData,
        };
    } catch (error) {
        return {
            url: wrapper.url,
            name,
            homepage,
            results: [],
            response: undefined,
            data: undefined,
            error: error?.message || '题库连接失败',
        };
    }
}

function buildCacheKey(env, wrappers) {
    return [
        wrappers.map((wrapper) => `${wrapper.name}@${wrapper.url}`).join('|'),
        env.type || '',
        env.title || '',
        env.options || '',
    ].join('::');
}

function readCache(key) {
    const cached = memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
        return cached.value;
    }
    try {
        const raw = sessionStorage.getItem(CACHE_PREFIX + key);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        if (parsed.expires > Date.now()) {
            memoryCache.set(key, parsed);
            return parsed.value;
        }
        sessionStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
        // ignore cache failures
    }
    return null;
}

function writeCache(key, value) {
    const entry = { expires: Date.now() + CACHE_TTL_MS, value };
    memoryCache.set(key, entry);
    try {
        sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (error) {
        // ignore cache failures
    }
}

export async function searchAnswers(env, wrappers = loadAnswerers()) {
    const list = Array.isArray(wrappers) ? wrappers : [];
    if (!list.length) {
        throw new Error('题库配置不能为空，请配置后重新开始自动答题。');
    }
    const key = buildCacheKey(env, list);
    const cached = readCache(key);
    if (cached) {
        return cached;
    }
    const infos = await Promise.all(list.map((wrapper) => requestWrapper(wrapper, env)));
    if (infos.some((info) => info.results && info.results.length)) {
        const cacheable = infos.map(({ response, data, ...rest }) => rest);
        writeCache(key, cacheable);
    }
    return infos.map(({ response, data, ...rest }) => rest);
}

export async function testAnswerers(wrappers = loadAnswerers()) {
    const list = Array.isArray(wrappers) ? wrappers : [];
    if (!list.length) {
        throw new Error('题库配置不能为空，请配置后重试。');
    }
    const env = {
        title: '连接测试',
        options: 'A. 选项一\nB. 选项二',
        type: 'single',
    };
    const infos = await Promise.all(list.map((wrapper) => requestWrapper(wrapper, env)));
    return infos.map((info) => ({
        name: info.name || '未知题库',
        ok: !info.error,
        message: info.error
            ? info.error
            : info.results.length
              ? `连接成功，返回 ${info.results.length} 条结果`
              : '连接成功，但未返回答案',
        results: info.results,
    }));
}

/* ------------------------------ DOM 上下文与结果转换 ------------------------------ */

function collapseText(text) {
    return String(text ?? '').replace(/\s+/g, ' ').trim();
}

export function inferQuestionContext(element) {
    const root =
        element ||
        document.querySelector('.question_content') ||
        document.querySelector('.questiono-item');
    if (!root) {
        return { root: null, title: '', options: [], type: 'single', blankCount: 0 };
    }

    const titleElement = root.querySelector(
        'span.processing_img, .question_title, .question_title_text, .subject_name, [class*="question_title"]'
    );
    let title = collapseText(
        titleElement ? titleElement.innerText || titleElement.textContent : ''
    );
    if (!title) {
        const numberElement = root.querySelector('b.fl');
        title = collapseText(numberElement ? numberElement.innerText || numberElement.textContent : '');
    }

    let optionElements = Array.from(root.querySelectorAll('label.el-radio, label.el-checkbox'));
    if (!optionElements.length) {
        optionElements = Array.from(
            root.querySelectorAll('.common_test_option, .radio_content, .option_item')
        );
    }
    if (!optionElements.length) {
        optionElements = Array.from(root.querySelectorAll('span.el-radio__label, span.el-checkbox__label'));
    }
    const options = optionElements.map((option) =>
        collapseText(option.innerText || option.textContent)
    );

    const radioCount =
        root.querySelectorAll('label.el-radio').length ||
        optionElements.filter((option) => option.querySelector('input[type="radio"]')).length;
    const checkboxCount =
        root.querySelectorAll('label.el-checkbox').length ||
        optionElements.filter((option) => option.querySelector('input[type="checkbox"]')).length;
    const blankElements = Array.from(root.querySelectorAll('.blanks_box'));
    const textareas = Array.from(root.querySelectorAll('textarea'));

    let type = 'single';
    if (blankElements.length || textareas.length) {
        type = 'completion';
    } else if (radioCount === 2) {
        type = 'judgement';
    } else if (radioCount > 2) {
        type = 'single';
    } else if (checkboxCount >= 2) {
        type = 'multiple';
    } else if (options.length === 2 && isJudgementOptions(options)) {
        type = 'judgement';
    }

    const blankCount = blankElements.length || textareas.length || (type === 'completion' ? 1 : 0);

    return { root, title, options, type, blankCount };
}

export function resolveAnswer(searchInfos, context) {
    const infos = (searchInfos || []).filter((info) => info && info.results && info.results.length);
    if (!infos.length) {
        const error = (searchInfos || []).find((info) => info && info.error)?.error;
        return { finish: false, message: error || '题库未找到答案', source: null };
    }

    const sourceInfo = infos[0];
    const source = {
        name: sourceInfo.name || '未知题库',
        homepage: sourceInfo.homepage || '#',
    };
    const optionTexts = context.options || [];
    const answerGroups = infos.map((info) => info.results.map((result) => result.answer || ''));
    const answers = answerGroups.flat();
    const type = context.type || 'single';

    if (type === 'completion') {
        const result = resolveCompletion(answerGroups, context.blankCount || 1);
        if (result.finish) {
            return { finish: true, type, answers: result.answers, source };
        }
    } else if (type === 'multiple') {
        const result = resolveMultiple(answers, optionTexts);
        const chosen = result.options || result.plainOptions;
        if (result.finish && chosen) {
            const indexes = chosen
                .map((option) => optionTexts.indexOf(option))
                .filter((index) => index >= 0);
            if (indexes.length) {
                return { finish: true, type, optionIndexes: indexes, source };
            }
        }
    } else {
        if (isJudgementOptions(optionTexts)) {
            const result = resolveJudgement(answerGroups, optionTexts);
            if (result.finish && result.option !== undefined) {
                const index = optionTexts.indexOf(result.option);
                if (index >= 0) {
                    return { finish: true, type: 'judgement', optionIndexes: [index], source };
                }
            }
        }
        const result = resolveSingle(answers, optionTexts);
        if (result.finish && result.option !== undefined) {
            const index = optionTexts.indexOf(result.option);
            if (index >= 0) {
                return { finish: true, type, optionIndexes: [index], source };
            }
        }
    }

    const text = answers.map((answer) => String(answer ?? '').trim()).find(Boolean);
    return {
        finish: false,
        type,
        text,
        source,
        message: text ? undefined : '题库未找到答案',
    };
}

export function toSubject(context, resolution) {
    if (!resolution) {
        return null;
    }
    const source = resolution.source || null;

    if (resolution.type === 'completion' && resolution.answers && resolution.answers.length) {
        return {
            subjectType: 7,
            subjectName: context.title,
            rightAnswer: JSON.stringify(resolution.answers.map((answer) => [answer])),
            _source: source,
        };
    }

    if (resolution.optionIndexes && resolution.optionIndexes.length) {
        const answer = resolution.optionIndexes
            .map((index) => String.fromCharCode(65 + index))
            .join(',');
        return {
            subjectType: 1,
            subjectName: context.title,
            rightAnswer: answer,
            _source: source,
        };
    }

    if (resolution.text) {
        return {
            subjectType: 1,
            subjectName: context.title,
            rightAnswer: resolution.text,
            _source: source,
        };
    }

    return null;
}
