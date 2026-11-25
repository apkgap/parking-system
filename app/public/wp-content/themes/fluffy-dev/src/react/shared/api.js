export function getConfig() {
	return window.fluffyReactConfig || {
		ajaxUrl: '/wp-admin/admin-ajax.php',
		restUrl: '/wp-json/',
		customRestUrl: '/wp-json/custom/v1/',
		carrentRestUrl: '/wp-json/carrent/',
		homeUrl: '/',
		checkoutUrl: '/checkout/',
		logoutUrl: '/wp-login.php?action=logout',
		lang: 'th',
		canRegister: true,
		nonces: {},
		user: { isLoggedIn: false, id: 0 },
	};
}

export async function wpAjax(action, payload = {}) {
	const { ajaxUrl } = getConfig();
	const body = new URLSearchParams();
	body.append('action', action);

	const appendNested = (prefix, value) => {
		if (value === null || value === undefined) {
			return;
		}
		if (Array.isArray(value)) {
			value.forEach((item, index) => appendNested(`${prefix}[${index}]`, item));
		} else if (typeof value === 'object') {
			Object.entries(value).forEach(([k, v]) => appendNested(`${prefix}[${k}]`, v));
		} else {
			body.append(prefix, String(value));
		}
	};

	Object.entries(payload).forEach(([key, value]) => {
		if (typeof value === 'object' && value !== null) {
			appendNested(key, value);
		} else if (value !== undefined && value !== null) {
			body.append(key, String(value));
		}
	});

	const response = await fetch(ajaxUrl, {
		method: 'POST',
		credentials: 'same-origin',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
		},
		body: body.toString(),
	});

	const json = await response.json();
	if (!response.ok || json.success === false) {
		const msg =
			typeof json.data === 'string'
				? json.data
				: json.data?.message || 'Request failed';
		throw new Error(msg);
	}
	return json.data;
}

export async function wpRest(url, options = {}) {
	const { nonces } = getConfig();
	const headers = {
		'Content-Type': 'application/json',
		...(nonces?.rest ? { 'X-WP-Nonce': nonces.rest } : {}),
		...(options.headers || {}),
	};

	const response = await fetch(url, {
		credentials: 'same-origin',
		...options,
		headers,
	});

	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(data?.message || `HTTP ${response.status}`);
	}
	return data;
}
