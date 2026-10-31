import settings from '../../core/settings.js';
import { runtime } from '../../core/runtime.js';
import insertIntoDeepestElement from './insertElement.js';
import { loadAnswerers } from '../../core/answererConfig.js';
import { searchAnswers, inferQuestionContext, resolveAnswer, toSubject } from './answerer.js';
import { displayErrorNotification } from '../../ui/notifications.js';

function createTikuCredit(source, standalone = false) {
    const credit = document.createElement('div');
    credit.className = 'ze-tiku-credit';
    if (standalone) {
        credit.classList.add('modified');
    }

    const name = source?.name || '自定义题库';
    const homepage = source?.homepage;

    if (homepage && homepage !== '#') {
        const brand = document.createElement('a');
        brand.className = 'ze-tiku-credit-brand';
        brand.href = homepage;
        brand.target = '_blank';
        brand.rel = 'noopener noreferrer';
        brand.append(document.createTextNode(name));
        credit.append(document.createTextNode('答案由 '), brand, document.createTextNode(' 提供'));
    } else {
        credit.append(document.createTextNode(`答案由 ${name} 提供`));
    }
    return credit;
}

function appendTikuCredit(target, standalone = false, source = null) {
    if (!target || target.querySelector('.ze-tiku-credit')) {
        return;
    }
    target.appendChild(createTikuCredit(source, standalone));
}

function clickOption(optionElements, answer) {
    let optionIndex = -1;
    const text = String(answer ?? '').trim().toLowerCase();

    if (text === 'yes') {
        optionIndex = 0;
    } else if (text === 'no') {
        optionIndex = 1;
    } else if (/^[a-z]$/.test(text)) {
        optionIndex = text.toUpperCase().charCodeAt(0) - 65;
    }

    if (optionIndex < 0 || optionIndex >= optionElements.length) {
        console.log(`无效的答案或选项索引：${answer}`);
        return;
    }

    const optionElement = optionElements[optionIndex];
    const input = optionElement.querySelector('input[type="radio"], input[type="checkbox"]');
    const target = input || optionElement.firstElementChild || optionElement;
    const checked =
        target.checked ||
        target.classList.contains('is-checked') ||
        optionElement.classList.contains('is-checked');

    if (checked) {
        console.log(`选项 ${answer} 已被选中，跳过点击`);
        return;
    }

    target.click();
    console.log('点击了', target);
}

function displayAnswersRecursively(questions, subject, index) {
        // Check if subject has no rightAnswer and childrenList is empty
        if (!subject.rightAnswer && (!subject.childrenList || subject.childrenList.length === 0) && runtime.alerted == 0) {
            alert('请求中没有答案');
            runtime.alerted = 1;
            return; // Return the current index without further processing
        }

        if (subject.rightAnswer && questions[index]) {
            // Add the answer to the question
            const answerElement = document.createElement('div');
            answerElement.style.color = 'green';
            answerElement.style.fontWeight = 'bold';
            answerElement.className = 'answer-display';
            answerElement.classList.add('modified');

            // Check if rightAnswer contains HTML (using a simple regex to detect HTML tags)
            const isHtml = /<[^>]*>/g.test(subject.rightAnswer);

            // If it's not HTML, process it as plain text (similar to your previous logic)
            if (subject.subjectType == 7) {
                let formattedAnswers = '';
                if (settings.examMode) {
                    let rawAnswer = subject.rightAnswer.replace(/\|/g, ','); // Replace separator
                    let parsedAnswers = JSON.parse(rawAnswer); // Convert to JSON object
                    parsedAnswers.forEach((answerSet, idx) => {
                        // 只显示第一个答案（如果有多个答案的话）
                        const answerToDisplay = Array.isArray(answerSet) && answerSet.length > 0
                            ? answerSet[0]
                            : answerSet;

                        // 拼接答案并添加复制功能
                        formattedAnswers += `${answerToDisplay} `;

                    });

                    formattedAnswers = formattedAnswers.trim(); // 去掉末尾的换行符
                    console.log(formattedAnswers);
                    insertIntoDeepestElement(questions[index], formattedAnswers);
                } else {
                    console.log('填空题');
                    let rawAnswer = subject.rightAnswer.replace(/\|/g, ','); // Replace separator
                    let parsedAnswers = JSON.parse(rawAnswer); // Convert to JSON object


                    // Handle fill-in-the-blank questions
                    const fillBlankDivs = questions[index].querySelectorAll('.el-row');
                    if (fillBlankDivs && fillBlankDivs.length == parsedAnswers.length) {
                        fillBlankDivs.forEach((div, idx) => {
                            if (parsedAnswers[idx]) {
                                const individualAnswer = document.createElement('div');
                                individualAnswer.style.color = 'blue'; // 设置颜色为蓝色以突出显示
                                individualAnswer.classList.add('modified');

                                if (Array.isArray(parsedAnswers[idx]) && parsedAnswers[idx].length > 1) {
                                    // 多个答案的情况下，每个答案单独占一行
                                    individualAnswer.innerHTML = `第${idx + 1}问:<br>${parsedAnswers[idx]
                                        .map(ans => `<code class="answer" onclick="copyText(this)">${ans}</code>`)
                                        .join(' ')}（只用填一个，多填不给分）`;
                                } else {
                                    // 单个答案的情况下直接显示
                                    individualAnswer.innerHTML = `第${idx + 1}问: <code class="answer" onclick="copyText(this)">${parsedAnswers[idx]}</code>`;
                                }

                                div.appendChild(individualAnswer); // 添加到对应的 div 中
                            }
                        });
                        appendTikuCredit(questions[index], true, subject._source);
                    } else {
                        try {
                            parsedAnswers.forEach((answerSet, idx) => {
                                if (Array.isArray(answerSet) && answerSet.length > 1) {
                                    // 拼接多个答案，使用单独的代码块分隔，并添加点击复制功能
                                    formattedAnswers += `第${idx + 1}问:<br>${answerSet.map(ans => `<code class="answer" onclick="copyText(this)">${ans}</code>`).join(' ')}（只用填一个，多填不给分）<br>`;
                                } else {
                                    // 单个答案直接输出，并添加点击复制功能
                                    formattedAnswers += `第${idx + 1}问: <code class="answer" onclick="copyText(this)">${answerSet}</code><br>`;
                                }
                            });

                            formattedAnswers = formattedAnswers.trim(); // 去掉末尾的换行符

                            answerElement.innerHTML = `正确答案:<br>${formattedAnswers}`;
                        } catch (e) {
                            console.error('Failed to parse rightAnswer:', subject.rightAnswer, e);
                            answerElement.textContent = `正确答案: 格式错误`;
                        }
                        appendTikuCredit(answerElement, false, subject._source);
                        questions[index].appendChild(answerElement);
                    }
                }
            } else {
                // Handle other question types as plain text
                if (settings.examMode) {
                    insertIntoDeepestElement(questions[index], subject.rightAnswer);

                } else {
                    if (isHtml) {
                        // If it's HTML, we directly insert it as innerHTML
                        answerElement.innerHTML = `正确答案:<br>${subject.rightAnswer}`;
                    }
                    else {
                        answerElement.textContent = `正确答案: ${subject.rightAnswer}`;
                    }

                    appendTikuCredit(answerElement, false, subject._source);
                    questions[index].appendChild(answerElement);
                    // 自动答题
                    const answers = subject.rightAnswer.split(',');
                    let optionElements = Array.from(questions[index].querySelectorAll('.common_test_option'));
                    if (!optionElements.length) {
                        optionElements = Array.from(
                            questions[index].querySelectorAll('label.el-radio, label.el-checkbox')
                        );
                    }

                    if (optionElements.length > 0) {
                        console.log('开始答题');
                        answers.forEach((answer, answerIndex) => {
                            setTimeout(() => clickOption(optionElements, answer), answerIndex * 200);
                        });
                    }
                }

                 
            }
        }

        // If childrenList is not empty, recursively process it
        if (subject.childrenList && Array.isArray(subject.childrenList)) {
            const subquestions = questions[index].querySelectorAll('.questiono-main');
            subject.childrenList.forEach((child, index) => {
                displayAnswersRecursively(subquestions, child, index);
            });
        }
        return;
    }

export async function displayRightAnswers() {
    const wrappers = loadAnswerers();
    if (!wrappers.length) {
        displayErrorNotification('未配置题库', ['请先在「题库」页添加题库配置']);
        runtime.showAnswer = false;
        syncShowAnswerButton();
        return;
    }

    const elements = document.querySelectorAll('.modified');
    if (elements.length > 0) {
        return;
    }

    const questions = Array.from(document.querySelectorAll('.questiono-item'));
    if (questions.length > 0) {
        let resolvedCount = 0;
        let lastMessage = '';
        for (const question of questions) {
            if (!runtime.showAnswer) return;
            const context = inferQuestionContext(question);
            const { subject, message } = await resolveSubjectForContext(context, wrappers);
            if (subject) {
                displayAnswersRecursively([question], subject, 0);
                resolvedCount++;
            } else {
                lastMessage = message || lastMessage;
            }
            await delay(120);
        }
        if (resolvedCount === 0) {
            runtime.showAnswer = false;
            syncShowAnswerButton();
            displayErrorNotification('未获取到答案', [lastMessage || '题库未返回可用答案']);
        }
        return;
    }

    // 如果没有找到 .questiono-item，查询 .index_box 并为 li 元素添加事件监听器
    const indexbox = document.querySelector('.index_box');
    if (!indexbox) {
        runtime.showAnswer = false;
        syncShowAnswerButton();
        displayErrorNotification('未在页面上找到题目', ['请在答题页面中尝试显示答案']);
        return;
    }

    const selectedItem = Array.from(indexbox.querySelectorAll('li')).find((li) => li.classList.contains('show_select'));
    if (selectedItem) {
        const { subject, message } = await resolveCurrentQuestionSubject(wrappers);
        if (subject) {
            showAnswerForQuestion(subject);
        } else {
            document.querySelectorAll('.answer-display').forEach((el) => el.remove());
            runtime.showAnswer = false;
            syncShowAnswerButton();
            displayErrorNotification('未获取到答案', [message || '题库未返回可用答案']);
        }
    }

    // 题号和上一题/下一题按钮只绑定一次，点击后等题目切换再显示答案
    const buttons = Array.from(document.querySelectorAll('button'));
    const navElements = [
        ...indexbox.querySelectorAll('li'),
        buttons.find((button) => button.textContent.trim() === '上一题'),
        buttons.find((button) => button.textContent.trim() === '下一题'),
    ].filter(Boolean);
    navElements.forEach((element) => {
        if (runtime.boundAnswerNavElements.has(element)) return;
        runtime.boundAnswerNavElements.add(element);
        element.addEventListener('click', scheduleAnswerForCurrentQuestion);
    });
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveSubjectForContext(context, wrappers) {
    if (!context || !context.title) {
        return { subject: null, message: '未找到题目标题，页面结构可能已变化' };
    }
    let infos;
    try {
        infos = await searchAnswers(context, wrappers);
    } catch (error) {
        return { subject: null, message: error.message };
    }
    const resolution = resolveAnswer(infos, context);
    const subject = toSubject(context, resolution);
    if (!subject) {
        console.warn('[ZE题库] 未获取到答案', context.title, context.type, resolution.message);
    }
    return { subject, message: resolution.message };
}

async function resolveCurrentQuestionSubject(wrappers) {
    const root = document.querySelector('.question_content') || document.querySelector('.questiono-item');
    if (!root) {
        return null;
    }
    const context = inferQuestionContext(root);
    return resolveSubjectForContext(context, wrappers);
}

function currentQuestionTitle() {
    const questionTitleElement = document.querySelector('.question_content .question_title');
    return questionTitleElement ? questionTitleElement.textContent.trim().replace(/\s+/g, '') : null;
}

function scheduleAnswerForCurrentQuestion() {
    const previousTitle = currentQuestionTitle();
    const startedAt = Date.now();
    const tick = async () => {
        const title = currentQuestionTitle();
        if (title === previousTitle && Date.now() - startedAt < 2000) {
            setTimeout(tick, 80);
            return;
        }
        if (!runtime.showAnswer) {
            return;
        }
        const wrappers = loadAnswerers();
        if (!wrappers.length) {
            return;
        }
        const subject = await resolveCurrentQuestionSubject(wrappers);
        const resolved = subject.subject || null;
        if (!resolved) {
            console.log('No matching subject found.');
            document.querySelectorAll('.answer-display').forEach((el) => el.remove());
            return;
        }
        showAnswerForQuestion(resolved);
    };
    setTimeout(tick, 80);
}


export function showAnswerForQuestion(subject) {
        // 先清除上一个显示的答案
        const answerElements = document.querySelectorAll('.modified');
        answerElements.forEach(el => el.remove()); // 删除所有已有答案
        const question_content = document.querySelector('.question_content');
        const answerElement = document.createElement('div');
        answerElement.style.color = 'green';
        answerElement.style.fontWeight = 'bold';
        answerElement.className = 'answer-display';
        answerElement.classList.add('modified');

        if (!subject) {
            return;
        }
        const isHtml = /<[^>]*>/g.test(subject.rightAnswer);


        if (subject.subjectType == 7) {
            let rawAnswer = subject.rightAnswer.replace(/\|/g, ',');
            let parsedAnswers = JSON.parse(rawAnswer);
            let formattedAnswers = ''; // 初始化结果字符串

            if (settings.examMode) {
                let rawAnswer = subject.rightAnswer.replace(/\|/g, ','); // Replace separator
                let parsedAnswers = JSON.parse(rawAnswer); // Convert to JSON object
                parsedAnswers.forEach((answerSet, idx) => {
                    // 只显示第一个答案（如果有多个答案的话）
                    const answerToDisplay = Array.isArray(answerSet) && answerSet.length > 0
                        ? answerSet[0]
                        : answerSet;

                    // 拼接答案并添加复制功能
                    formattedAnswers += `${answerToDisplay} `;
                });

                formattedAnswers = formattedAnswers.trim(); // 去掉末尾的换行符
                console.log(formattedAnswers);
                insertIntoDeepestElement(question_content, formattedAnswers);
            } else {
                console.log(question_content);

                // 延迟1秒后查找 .blanks_box 元素
                setTimeout(() => {
                    const blanks_box = question_content.querySelectorAll(".blanks_box"); // 获取相关元素
                    if (blanks_box.length > 0) {
                        blanks_box.forEach((div, idx) => {
                            if (parsedAnswers[idx]) {

                                const individualAnswer = document.createElement('div');
                                individualAnswer.style.color = 'blue';
                                individualAnswer.classList.add('modified');
                                if (Array.isArray(parsedAnswers[idx]) && parsedAnswers[idx].length > 1) {
                                    // 多个答案的情况下，每个答案单独占一行，添加class和onclick函数

                                    individualAnswer.innerHTML = `第${idx + 1}问:<br>${parsedAnswers[idx]
                                        .map(ans => `<code class="answer" onclick="copyText(this)">${ans}</code>`)
                                        .join(' ')}（只用填一个，多填不给分）`;
                                } else {
                                    individualAnswer.innerHTML = `第${idx + 1}问: <code class="answer" onclick="copyText(this)">${parsedAnswers[idx]}</code>`;

                                }
                                div.appendChild(individualAnswer);

                            }
                        });
                        appendTikuCredit(question_content, true, subject._source);
                    } else {
                        try {
                            // 遍历数组，按要求拼接内容
                            parsedAnswers.forEach(answerSet => {
                                if (Array.isArray(answerSet) && answerSet.length > 1) {
                                    formattedAnswers += answerSet.join('，') + '（只用填一个，多填不给分）\n'; // 子数组元素拼接后换行
                                } else {
                                    formattedAnswers += answerSet + '\n'; // 单个元素直接换行
                                }
                            });

                            formattedAnswers = formattedAnswers.trim(); // 移除末尾多余换行符

                            // 设置最终结果，使用 innerHTML 并替换 \n 为 <br>
                            answerElement.innerHTML = `正确答案:<br>${formattedAnswers.replace(/\n/g, '<br>')}`;
                        } catch (e) {
                            console.error('Failed to parse rightAnswer:', subject.rightAnswer, e);
                            answerElement.textContent = `正确答案: 格式错误`;
                        }
                        appendTikuCredit(answerElement, false, subject._source);
                        question_content.appendChild(answerElement);
                    }
                }, 200); // 延迟1秒执行
            }
        } else {
            // Handle other question types
            if (settings.examMode) {
                insertIntoDeepestElement(question_content, subject.rightAnswer);
            } else {
                if (isHtml) {
                    answerElement.innerHTML = `${subject.rightAnswer}`;
                } else {
                    answerElement.textContent = `正确答案: ${subject.rightAnswer}`;
                }
                appendTikuCredit(answerElement, false, subject._source);
                question_content.appendChild(answerElement)
                setTimeout(() => {
                    let optionElements = Array.from(question_content.querySelectorAll('.radio_content'));
                    if (!optionElements.length) {
                        optionElements = Array.from(
                            question_content.querySelectorAll('label.el-radio, label.el-checkbox')
                        );
                    }
                    if (!optionElements.length) {
                        optionElements = Array.from(
                            question_content.querySelectorAll('.common_test_option')
                        );
                    }

                    const answers = subject.rightAnswer.split(',');
                    console.log(optionElements);
                    if (optionElements.length > 0) {
                        console.log('开始答题');
                        answers.forEach((answer, answerIndex) => {
                            setTimeout(() => clickOption(optionElements, answer), answerIndex * 200);
                        });
                    }
                }, 500); // 每次点击后延迟 500 毫秒



            }

        };
        if (subject.childrenList && subject.childrenList.length > 0) {
            const liElements = question_content.querySelectorAll('li');
            subject.childrenList.forEach((child, i) => {
                console.log('遍历子题')
                const childElement = liElements[i];
                if (!childElement || !child.rightAnswer) return;
                const isHtml_ = /<[^>]*>/g.test(child.rightAnswer);
                if (child.subjectType == 7) {

                    let rawAnswer = child.rightAnswer.replace(/\|/g, ','); // 替换分隔符
                    let parsedAnswers = JSON.parse(rawAnswer); // 转为 JSON 对象
                    let formattedAnswers = '';
                    if (settings.examMode) {
                        parsedAnswers.forEach((answerSet, idx) => {
                            // 只显示第一个答案（如果有多个答案的话）
                            const answerToDisplay = Array.isArray(answerSet) && answerSet.length > 0
                                ? answerSet[0]
                                : answerSet;

                            // 拼接答案并添加复制功能
                            formattedAnswers += `${answerToDisplay} `;

                        });

                        formattedAnswers = formattedAnswers.trim(); // 去掉末尾的换行符
                        console.log(formattedAnswers);
                        insertIntoDeepestElement(childElement, formattedAnswers);
                    } else {
                        // 找到填空题对应的 .el-row 元素并插入答案
                        const blanks_box = childElement.querySelectorAll('.blanks_box')
                        if (blanks_box.length > 0) {
                            blanks_box.forEach((div, idx) => {
                                if (parsedAnswers[idx]) {
                                    const individualAnswer = document.createElement('div');
                                    individualAnswer.style.color = 'blue'; // 设置字体颜色为蓝色以突出显示
                                    individualAnswer.classList.add('modified');

                                    if (Array.isArray(parsedAnswers[idx]) && parsedAnswers[idx].length > 1) {
                                        // 多个答案的情况下，每个答案单独占一行，添加class和onclick函数
                                        individualAnswer.innerHTML = `第${idx + 1}问:<br>${parsedAnswers[idx]
                                            .map(ans => `<code class="answer" onclick="copyText(this)">${ans}</code>`)
                                            .join(' ')}（只用填一个，多填不给分）`;
                                    } else {
                                        // 单个答案直接显示，添加class和onclick函数
                                        individualAnswer.innerHTML = `第${idx + 1}问: <code class="answer" onclick="copyText(this)">${parsedAnswers[idx]}</code>`;
                                    }

                                    div.appendChild(individualAnswer); // 添加到对应的 div 中
                                }
                            });
                            appendTikuCredit(childElement, true, subject._source);
                        } else {
                            const childAnswerElement = answerElement.cloneNode(false);
                            try {
                                // 遍历数组，按要求拼接内容
                                parsedAnswers.forEach(answerSet => {
                                    if (Array.isArray(answerSet) && answerSet.length > 1) {
                                        formattedAnswers += answerSet.join('，') + '（只用填一个，多填不给分）\n'; // 子数组元素拼接后换行
                                    } else {
                                        formattedAnswers += answerSet + '\n'; // 单个元素直接换行
                                    }
                                });

                                formattedAnswers = formattedAnswers.trim(); // 移除末尾多余换行符

                                // 设置最终结果，使用 innerHTML 并替换 \n 为 <br>
                                childAnswerElement.innerHTML = `正确答案:<br>${formattedAnswers.replace(/\n/g, '<br>')}`;
                            } catch (e) {
                                console.error('Failed to parse rightAnswer:', child.rightAnswer, e);
                                childAnswerElement.textContent = `正确答案: 格式错误`;
                            }
                            appendTikuCredit(childAnswerElement, false, subject._source);
                            childElement.appendChild(childAnswerElement)
                        }
                    }
                } else {
                    // Handle other question types
                    const newElement = document.createElement('div');
                    newElement.className = 'answer-display';
                    newElement.classList.add('modified');
                    newElement.style.color = 'green';
                    newElement.style.fontWeight = 'bold';
                    if (settings.examMode) {
                        insertIntoDeepestElement(childElement, child.rightAnswer);
                    } else {
                        if (isHtml_) {
                            newElement.innerHTML = `正确答案: <br> ${child.rightAnswer}`;
                        } else {
                            newElement.textContent = `正确答案: ${child.rightAnswer}`;
                        }

                        appendTikuCredit(newElement, false, subject._source);
                        childElement.appendChild(newElement);
                    }


                }
            });
        }
    };

function hideRightAnswers() {
        const modifiedElements = document.querySelectorAll('.modified');
        modifiedElements.forEach(element => {
            element.style.display = 'none';
        });
    }

function syncShowAnswerButton() {
        const showAnswerButton = document.querySelector('.showAnswerButton');
        if (!showAnswerButton) {
            return;
        }
        showAnswerButton.textContent = runtime.showAnswer ? '隐藏答案' : '显示答案';
    }

    // 定义命名函数来处理显示/隐藏 modified 元素
export async function toggleAnswers() {
        if (!runtime.showAnswer) {
            document.querySelectorAll('.modified').forEach((element) => {
                element.style.display = '';
            });
            runtime.showAnswer = true;
            syncShowAnswerButton();
            await displayRightAnswers();
            syncShowAnswerButton();
            return;
        }
        runtime.showAnswer = false;
        syncShowAnswerButton();
        hideRightAnswers();
}

function hasQuestionPage() {
        return !!(
            document.querySelector('.questiono-item') ||
            document.querySelector('.question_content') ||
            document.querySelector('.index_box')
        );
    }

export async function refreshAnswersForNewPage() {
        if (!runtime.showAnswer) return;
        document.querySelectorAll('.modified').forEach(el => el.remove());
        const startedAt = Date.now();
        while (Date.now() - startedAt < 2000) {
            if (!runtime.showAnswer) return;
            if (hasQuestionPage()) break;
            await new Promise(r => setTimeout(r, 100));
        }
        if (!runtime.showAnswer || !hasQuestionPage()) return;
        await displayRightAnswers();
    }
