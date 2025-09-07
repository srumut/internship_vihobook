import { useRouter } from "vue-router";

export function parseCookies(): Record<string, string> {
    const cookies: Record<string, string> = {};
    const raw = document.cookie || "";
    if (!raw) {
        return cookies;
    }

    for (let cookiestr of raw.split("; ")) {
        const keyval: string[] = cookiestr.split("=");
        cookies[keyval[0]] = keyval[1];
    }
    return cookies;
}

export function navigateToDashboardIfLoggedIn(cookie: string) {
    const cookies = parseCookies();
    const router = useRouter();

    if (!cookies["authorization"]) {
        return;
    }

    if (cookies["account"] == "user") {
        router.push("/products");
    } else if (cookies["account"] == "admin") {
        router.push("/admin/dashboard");
    }
}

export function navigateToAuthIfNotLoggedIn() {
    const cookies = parseCookies();
    const router = useRouter();

    if (!cookies["authorization"] || !cookies["account"]) {
        router.push("/auth");
    }
}

export function parseJwtPayload(token: string) {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    // base64url -> base64
    const b64 = payload
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    try {
        const json = atob(b64);
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}
