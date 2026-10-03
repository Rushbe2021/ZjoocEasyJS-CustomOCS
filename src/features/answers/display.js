import settings from '../../core/settings.js';
import { runtime } from '../../core/runtime.js';
import insertIntoDeepestElement from './insertElement.js';
import { checkRightAnswer, fetchOriginalJson } from './paper.js';
import { displayErrorNotification } from '../../ui/notifications.js';
import { createLinkIcon } from '../../assets/linkIcons.js';

function createTikuCredit({ standalone = false } = {}) {
    const credit = document.createElement('div');
    credit.className = 'ze-tiku-credit';
    if (standalone) {
        credit.classList.add('modified');
    }

    const brand = document.createElement('a');
    brand.className = 'ze-tiku-credit-brand';
    brand.href = 'https://tiku.zerror.cc';
    brand.target = '_blank';
    brand.rel = 'noopener noreferrer';
    const icon = createLinkIcon('tiku');
    icon.classList.add('ze-tiku-credit-icon');
    icon.alt = 'ZError题库';
    brand.append(icon, document.createTextNode('ZError题库'));

    credit.append(
        document.createTextNode('答案由 '),
        brand,
        document.createTextNode('提供')
    );
    return credit;
}

function appendTikuCredit(target, standalone = false) {
    if (!target || target.querySelector(':scope > .ze-tiku-credit, .ze-tiku-credit')) {
        return;
    }
    target.appendChild(createTikuCredit({ standalone }));
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
                        appendTikuCredit(questions[index], true);
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
                        appendTikuCredit(answerElement);
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

                    appendTikuCredit(answerElement);
                    questions[index].appendChild(answerElement);
                    // 自动答题
                 let answers = subject.rightAnswer.split(',');

                 const common_test_options = questions[index].querySelectorAll('.common_test_option');
                 if (common_test_options.length > 0) {
                     console.log('开始答题');
 
                     answers.forEach((answer, index) => {
                         let optionIndex;
 
                         // 根据 answer 的值决定点击哪个选项
                         if (answer.toLowerCase() === 'yes') {
                             optionIndex = 0; // 点击第一个选项
                         } else if (answer.toLowerCase() === 'no') {
                             optionIndex = 1; // 点击第二个选项
                         } else if (/^[A-Za-z]$/.test(answer.trim())) {
                             // 处理 A/B/C/D/E 等字母选项
                             optionIndex = answer.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
                         } else {
                             console.log(`无效的答案：${answer}`);
                             return; // 跳过无效答案
                         }
 
                         if (optionIndex >= 0 && optionIndex < common_test_options.length) {
                             const firstChild = common_test_options[optionIndex].firstElementChild; // 获取第一个子元素
                             if (firstChild) {
                                 // 使用 setTimeout 延迟点击
                                 setTimeout(() => {
                                     if (!firstChild.classList.contains('is-checked')) {
                                         firstChild.click(); // 点击第一个子元素
                                         console.log('点击了', firstChild);
                                     }
                                 }, index * 200); // 每次点击后延迟 200 毫秒
                             } else {
                                 console.log(`选项 ${answer} 没有子元素`);
                             }
                         } else {
                             console.log(`无效的选项索引：${optionIndex}`);
                         }
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
        const elements = document.querySelectorAll('.modified');
        if (elements.length > 0) {
            return;
        }
        // 查询所有 .questiono-item 元素
        const questions = document.querySelectorAll('.questiono-item');

        const token = settings.token
        if (!token) {
            displayErrorNotification('请先登录', ['未登录状态不能使用显示答案功能，其他功能不受限']);
            return;
        }
        let originalJsonCopy = null;
        try {
            originalJsonCopy = JSON.parse(localStorage.getItem('originalJsonCopy'));
        } catch (e) {
            originalJsonCopy = null;
        }
        const TitleP = document.querySelector('div.top_title p');
        const TitleH6 = document.querySelector('h6');
        if (!TitleP && !TitleH6) {
            console.error('无法获取试卷标题');
            displayErrorNotification('无法获取试卷标题', ['请进入试卷页面再进行答题']);
            runtime.showAnswer = false;
            // showAnswerButton = document.getElementById('showAnswerButton');
            // showAnswerButton.textContent = '显示答案';
            return;
        }
        const title = TitleP ? TitleP.textContent : TitleH6.textContent;  // 如果元素存在，提取文本
        console.log(originalJsonCopy);  // 输出提取的文本内容
        const cachedPaperName = originalJsonCopy?.data?.paperName;
        if (typeof cachedPaperName === 'string') {
            if (cachedPaperName.trim() == title.trim()) {

                runtime.paperData = originalJsonCopy;
                runtime.cachedPaperSubjectList = runtime.paperData.data.paperSubjectList;
            } else {
                console.log(cachedPaperName.trim())
                console.log(title.trim())
            }
        }
        console.log('DOM中的标题：', title);  // 输出提取的文本内容

        if (!runtime.paperData || !runtime.paperData.data || typeof runtime.paperData.data.id === 'undefined') {
            console.error('Invalid originalJson structure or missing id');
            displayErrorNotification('无法获取试卷ID', ['不用担心，这可能是因为你刷新了页面，退出后重新进入答题即可']);
            console.log(runtime.paperData);
            return;
        }

        if (!checkRightAnswer(runtime.paperData)) {
            const paperId = runtime.paperData.data.id; // Get the ID
            const fetchedJson = await fetchOriginalJson(paperId);
            if (!checkRightAnswer(fetchedJson)) {
                displayErrorNotification('很抱歉', ['暂时没有答案']);
                return;
            }
            runtime.paperData = fetchedJson;
            runtime.cachedPaperSubjectList = fetchedJson.data.paperSubjectList;
            localStorage.setItem('originalJsonCopy', JSON.stringify(runtime.paperData));
            console.log('已经存储')
        }

        if (!Array.isArray(runtime.cachedPaperSubjectList)) {
            displayErrorNotification('无法获取题目数据', ['退出后重新进入答题即可']);
            return;
        }

        // 根据 subjectType 对 cachedPaperSubjectList 排序，未知题型排在最后
        const customOrder = [1, 2, 3, 10, 11, 5, 7, 8, 9];
        const orderOf = (subject) => {
            const order = customOrder.indexOf(subject.subjectType || 0);
            return order === -1 ? customOrder.length : order;
        };

        const sortedSubjects = [...runtime.cachedPaperSubjectList].sort((a, b) => orderOf(a) - orderOf(b));
        runtime.currentSortedSubjects = sortedSubjects;



        // 如果存在 .questiono-item 元素
        if (questions.length > 0) {
            if (!checkRightAnswer(runtime.paperData)) {
                displayErrorNotification('很抱歉', ['暂时没有答案']);
                return;
            };
            sortedSubjects.forEach((subject, index) => {
                // 执行答案显示递归函数
                displayAnswersRecursively(questions, subject, index);
            });

        } else {

            // 如果没有找到 .questiono-item，查询 .index_box 并为 li 元素添加事件监听器
            const indexbox = document.querySelector('.index_box');
            if (!indexbox) {
                displayErrorNotification('未在页面上找到题目', ['请在答题页面中尝试显示答案']);
                return;
            };


            const selectedItem = Array.from(indexbox.querySelectorAll('li')).find(li => li.classList.contains('show_select'));
            if (selectedItem) {
                const matchedSubject = findSubjectForCurrentQuestion();
                console.log(matchedSubject ? 'Found matched subject:' : 'No matching subject found.', matchedSubject);
                showAnswerForQuestion(matchedSubject);
            }

            // 题号和上一题/下一题按钮只绑定一次，点击后等题目切换再显示答案
            const buttons = Array.from(document.querySelectorAll('button'));
            const navElements = [
                ...indexbox.querySelectorAll('li'),
                buttons.find(button => button.textContent.trim() === '上一题'),
                buttons.find(button => button.textContent.trim() === '下一题')
            ].filter(Boolean);
            navElements.forEach(element => {
                if (runtime.boundAnswerNavElements.has(element)) return;
                runtime.boundAnswerNavElements.add(element);
                element.addEventListener('click', scheduleAnswerForCurrentQuestion);
            });
        }
        return;
    };

function htmlToText(html) {
        const doc = new DOMParser().parseFromString(String(html ?? ''), 'text/html');
        return doc.body.textContent || '';
    }

function currentQuestionTitle() {
        const questionTitleElement = document.querySelector('.question_content .question_title');
        return questionTitleElement ? questionTitleElement.textContent.trim().replace(/\s+/g, '') : null;
    }

function findSubjectForCurrentQuestion() {
        const questionTitle = currentQuestionTitle();
        if (!questionTitle) return undefined;
        return runtime.currentSortedSubjects.find(subject =>
            htmlToText(subject.subjectName).trim().replace(/\s+/g, '') === questionTitle
        );
    }

function scheduleAnswerForCurrentQuestion() {
        const previousTitle = currentQuestionTitle();
        const startedAt = Date.now();
        const tick = () => {
            const title = currentQuestionTitle();
            if (title === previousTitle && Date.now() - startedAt < 2000) {
                setTimeout(tick, 80);
                return;
            }
            const matchedSubject = findSubjectForCurrentQuestion();
            if (!matchedSubject) {
                console.log('No matching subject found.');
                document.querySelectorAll('.answer-display').forEach(el => el.remove()); // 删除所有已有答案
            }
            if (runtime.showAnswer) {
                showAnswerForQuestion(matchedSubject);
            }
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
                        appendTikuCredit(question_content, true);
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
                        appendTikuCredit(answerElement);
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
                appendTikuCredit(answerElement);
                question_content.appendChild(answerElement)
                setTimeout(() => {
                    const radio_contents = question_content.querySelectorAll('.radio_content');
                    const answers = subject.rightAnswer.split(',');
                    console.log(radio_contents);
                    if (radio_contents.length > 0) {
                        console.log('开始答题');

                        answers.forEach((answer, index) => {
                            let optionIndex = -1;

                            // 处理 'yes' 和 'no'
                            if (answer.toLowerCase() === 'yes') {
                                optionIndex = 0; // 点击第一个选项
                            } else if (answer.toLowerCase() === 'no') {
                                optionIndex = 1; // 点击第二个选项
                            } else {
                                // 处理 A/B/C/D/E
                                optionIndex = answer.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0); // 将 A/B/C/D/E 转换为索引
                            }

                            if (optionIndex >= 0 && optionIndex < radio_contents.length) {
                                const firstChild = radio_contents[optionIndex].firstElementChild; // 获取第一个子元素
                                if (firstChild) {
                                    // 检查子元素是否已经包含 'is-checked' 类
                                    if (!firstChild.classList.contains('is-checked')) {
                                        // 使用 setTimeout 延迟点击
                                        setTimeout(() => {
                                            firstChild.click(); // 点击第一个子元素
                                            console.log('点击了', firstChild);
                                        }, index * 200); // 每次点击后延迟 1 秒
                                    } else {
                                        console.log(`选项 ${answer} 已经被选中了，跳过点击`);
                                    }
                                } else {
                                    console.log(`选项 ${answer} 没有子元素`);
                                }
                            } else {
                                console.log(`无效的答案：${answer}`);
                            }
                        });
                    }
                }, 500); // 每次点击后延迟 1 秒



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
                            appendTikuCredit(childElement, true);
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
                            appendTikuCredit(childAnswerElement);
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

                        appendTikuCredit(newElement);
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
