import settings from '../../core/settings.js';
import { runtime } from '../../core/runtime.js';

export function checkRightAnswer(obj) {
    if (!obj || !obj.data || !Array.isArray(obj.data.paperSubjectList)) {
        return false;
    }

    for (const subject of obj.data.paperSubjectList) {
        if ('rightAnswer' in subject) {
            return true;
        }
        if (subject.childrenList) {
            for (const child of subject.childrenList) {
                if ('rightAnswer' in child) {
                    return true;
                }
            }
        }
    }

    return false;
}

export async function uploadOriginalJson() {
    console.log(runtime.paperData);
    try {
        const response = await fetch('https://app.zaizhexue.top/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(runtime.paperData)
        });
        const data = await response.json();
        console.log('Success:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

export async function fetchOriginalJson(id, needData = true) {
    try {
        console.log("正在发请求");
        const token = settings.token;
        const response = await fetch(`https://app.zaizhexue.top/originalJson?id=${id}&need_data=${needData}&token=${token}`);
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch original JSON:', error);
        return null;
    }
}
