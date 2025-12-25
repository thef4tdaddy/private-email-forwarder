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
	const initialTheme = getInitialTheme();
	const { subscribe, set, update } = writable<Theme>(initialTheme);
	
	// Initialize dark class on document
	if (isBrowser) {
		if (initialTheme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
	
	return {
		subscribe,
		toggle: () => {
			update(current => {
				const newTheme = current === 'dark' ? 'light' : 'dark';
				if (isBrowser) {
					localStorage.setItem('theme', newTheme);
					if (newTheme === 'dark') {
						document.documentElement.classList.add('dark');
					} else {
						document.documentElement.classList.remove('dark');
					}
				}
				return newTheme;
			});
		},
		set: (theme: Theme) => {
			if (isBrowser) {
				localStorage.setItem('theme', theme);
				if (theme === 'dark') {
					document.documentElement.classList.add('dark');
				} else {
					document.documentElement.classList.remove('dark');
				}
			}
			set(theme);
		}
	};
}

export const theme = createThemeStore();
