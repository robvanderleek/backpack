export function timeSince (timestamp, timestampSince) {
    const now = timestampSince ? timestampSince : new Date().getTime();
    const seconds = Math.floor((now - timestamp) / 1000);
    return getInterval(seconds);
}

function getInterval(seconds) {
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        return `${interval}y`;
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return `${interval}m`;
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return `${interval}d`;
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return `${interval}h`;
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return `${interval}m`;
    }
    return `${seconds}s`;
}