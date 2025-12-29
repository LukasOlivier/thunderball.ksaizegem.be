<script>
	import { onMount } from 'svelte';
	import LandingHeroBackground from './HeroBackground.svelte';

	let websiteInfo = {
		datum: '...',
		inschrijvingslink: '#'
	};

	onMount(async () => {
		try {
			const response = await fetch('/api/website');
			if (response.ok) {
				websiteInfo = await response.json();
			}
			console.log(websiteInfo);
		} catch (error) {
			console.error('Failed to fetch website info:', error);
		}
	});
</script>

<section
	class="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 pt-16"
>
	<!-- Background images -->
	<LandingHeroBackground />

	<!-- Content -->
	<div class="z-10 mx-auto w-full max-w-4xl text-center">
		<div class="mb-4">
			<span class="rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-primary">
				{websiteInfo?.datum}
			</span>
		</div>
		<h1 class="title mb-6 text-4xl font-bold uppercase text-primary md:text-6xl">
			KSA Izegem
			<span class="title mt-2 block text-5xl md:text-7xl">Thunderball</span>
		</h1>
		<a
			href={websiteInfo?.inschrijvingslink}
			target="_blank"
			class="relative inline-block overflow-hidden rounded-lg bg-primary px-6 py-3 text-lg font-semibold text-secondary transition-all duration-300 ease-in-out hover:text-white hover:brightness-110 active:scale-95"
		>
			Inschrijven
			<span
				class="absolute inset-0 -translate-x-full bg-secondary opacity-10 transition-transform duration-300"
			></span>
		</a>
	</div>
</section>
