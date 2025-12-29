<script>
	import { onMount } from 'svelte';

	let sponsors = [];

	onMount(async () => {
		try {
			const response = await fetch('/api/sponsors');
			if (response.ok) {
				sponsors = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch sponsors:', error);
		}
	});
</script>

<section id="info" class="mx-auto flex w-full max-w-screen-xl flex-col px-4 py-24">
	<h2 class="mb-6 text-3xl font-bold text-primary md:text-4xl">Met dank aan onze sponsors!</h2>

	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
		{#each sponsors as sponsor}
			<div class="flex items-center justify-center rounded-lg">
				<a href={sponsor.url} target="_blank" rel="noopener noreferrer">
					<img
						src={sponsor.image}
						alt={sponsor.name}
						title={sponsor.name}
						class="max-h-24 object-contain sm:max-h-32"
					/>
				</a>
			</div>
		{/each}
	</div>
</section>
