export function pickUserId(user) {
    if (!user) {
        return '';
    }
    const id = user.id ?? user.ID ?? user.user_id ?? user.userId ?? user.Id;
    if (id == null || id === '' || String(id) === '未知') {
        return '';
    }
    return String(id);
}

export async function fetchZeUser(token) {
    if (!token) {
        return null;
    }
    const response = await fetch('https://app.zaizhexue.top/api/user/info', {
        headers: {
            Authorization: `Bearer ${String(token).split('|')[0]}`,
        },
    });
    if (!response.ok) {
        return null;
    }
    const payload = await response.json();
    if (!payload || payload.success === false) {
        return null;
    }
    return payload.data || null;
}
