import { writable } from 'svelte/store';

type Theme = 'light' | 'dark';

const isBrowser = typeof window !== 'undefined';

function getInitialTheme(): Theme {
	if (!isBrowser) return 'light';
	
	// Check localStorage first
	const stored = localStorage.getItem('theme') as Theme | null;
	if (stored === 'light' || stored === 'dark') {
		return stored;
	}
	
	// Check system preference
	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
		return 'dark';
	}
	
	return 'light';
}

function createThemeStore() {
	const { subscribe, set, update } = writable<Theme>(getInitialTheme());
	
	return {
		subscribe,
		toggle: () => {
			update(current => {
				const newTheme = current === 'dark' ? 'light' : 'dark';
				if (isBrowser) {
					localStorage.setItem('theme', newTheme);
					document.documentElement.classList.toggle('dark', newTheme === 'dark');
				}
				return newTheme;
			});
		},
		set: (theme: Theme) => {
			if (isBrowser) {
				localStorage.setItem('theme', theme);
				document.documentElement.classList.toggle('dark', theme === 'dark');
			}
			set(theme);
		},
		init: () => {
			if (isBrowser) {
				const theme = getInitialTheme();
				document.documentElement.classList.toggle('dark', theme === 'dark');
				set(theme);
			}
		}
	};
}

export const theme = createThemeStore();
