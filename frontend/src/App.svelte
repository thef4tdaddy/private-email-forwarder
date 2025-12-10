<script lang="ts">
	import Navbar from './components/Navbar.svelte';
	import Dashboard from './pages/Dashboard.svelte';
	import History from './pages/History.svelte';
	import Settings from './pages/Settings.svelte';
	import './app.css';

	let currentView = 'dashboard';

	function handleViewChange(view: string) {
		currentView = view;
	}
</script>

<main>
	<Navbar {currentView} onViewChange={handleViewChange} />

	<div class="container-custom">
		{#if currentView === 'dashboard'}
			<Dashboard />
		{:else if currentView === 'history'}
			<History />
		{:else if currentView === 'settings'}
			<Settings />
		{/if}
	</div>
</main>
