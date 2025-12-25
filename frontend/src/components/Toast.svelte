<script lang="ts">
	import { toasts } from '../lib/stores/toast';
	import { X, CheckCircle, AlertCircle, Info } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	function getToastClasses(type: 'success' | 'error' | 'info') {
		const baseClasses = 'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-xl min-w-[300px] max-w-sm';
		
		if (type === 'success') {
			return `${baseClasses} bg-emerald-50 border-emerald-100 dark:bg-emerald-900/50 dark:border-emerald-800`;
		} else if (type === 'error') {
			return `${baseClasses} bg-red-50 border-red-100 dark:bg-red-900/50 dark:border-red-800`;
		} else {
			return `${baseClasses} bg-blue-50 border-blue-100 dark:bg-blue-900/50 dark:border-blue-800`;
		}
	}

	function getTextClasses(type: 'success' | 'error' | 'info') {
		const baseClasses = 'text-sm font-medium flex-1 leading-snug';
		
		if (type === 'success') {
			return `${baseClasses} text-emerald-900 dark:text-emerald-100`;
		} else if (type === 'error') {
			return `${baseClasses} text-red-900 dark:text-red-100`;
		} else {
			return `${baseClasses} text-blue-900 dark:text-blue-100`;
		}
	}
</script>

<div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
	{#each $toasts as toast (toast.id)}
		<div
			class={getToastClasses(toast.type)}
			in:fly={{ y: 20, duration: 300 }}
			out:fly={{ x: 20, duration: 200 }}
			animate:flip
		>
			<div class="shrink-0">
				{#if toast.type === 'success'}
					<CheckCircle class="text-emerald-500 dark:text-emerald-400" size={20} />
				{:else if toast.type === 'error'}
					<AlertCircle class="text-red-500 dark:text-red-400" size={20} />
				{:else}
					<Info class="text-blue-500 dark:text-blue-400" size={20} />
				{/if}
			</div>

			<p class={getTextClasses(toast.type)}>
				{toast.message}
			</p>

			<button
				class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
				onclick={() => toasts.remove(toast.id)}
				aria-label="Close notification"
			>
				<X size={16} class="opacity-40 hover:opacity-100 transition-opacity" />
			</button>
		</div>
	{/each}
</div>
