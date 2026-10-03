function getCourseId() {
    const url = window.location.href;
    const match = url.match(/course\/study\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

export default getCourseId;