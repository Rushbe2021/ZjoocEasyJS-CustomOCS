import { blobatar } from 'blobatar';
import settings from '../core/settings.js';
import { fetchZeUser, pickUserId } from '../core/zeUser.js';

export function avatarSeed({ userId, name } = {}) {
    if (userId != null && String(userId).trim() !== '' && String(userId) !== '未知') {
        return `ze-user-${userId}`;
    }
    const trimmed = String(name || '').trim();
    if (trimmed) {
        return `ze-user-${trimmed}`;
    }
    return 'ze-user-guest';
}

export function createUserAvatar({ userId, name, size = 40 } = {}) {
    const wrap = document.createElement('div');
    wrap.id = 'avatar';
    wrap.className = 'ze-user-avatar';
    wrap.style.width = `${size}px`;
    wrap.style.height = `${size}px`;
    wrap.innerHTML = blobatar(avatarSeed({ userId, name }), {
        size,
        background: 'circle',
        title: name || '',
    });
    return wrap;
}

export function refreshUserAvatar({ userId, name, size = 40 } = {}) {
    const current = document.getElementById('avatar');
    if (!current) {
        return;
    }
    current.replaceWith(createUserAvatar({ userId, name, size }));
}

export async function syncUserAvatar(userHint = {}) {
    const hintId = pickUserId(userHint);
    if (hintId) {
        settings.userId = hintId;
    }
    if (userHint.nickname) {
        settings.username = userHint.nickname;
    }
    try {
        const info = await fetchZeUser(settings.token);
        if (info) {
            const id = pickUserId(info);
            if (id) {
                settings.userId = id;
            }
            if (info.nickname) {
                settings.username = info.nickname;
            }
        }
    } catch (error) {
        console.warn('同步用户头像失败', error);
    }
    const usernameElement = document.getElementById('username');
    if (usernameElement && settings.username) {
        usernameElement.textContent = settings.username;
    }
    refreshUserAvatar({
        userId: settings.userId,
        name: settings.username,
    });
}
