import { getConfig } from './api';

export function t(th, en) {
	return getConfig().lang === 'th' ? th : en;
}
