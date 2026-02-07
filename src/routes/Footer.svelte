<script>
	import { onMount } from 'svelte';
	import { Icon } from 'svelte-icons-pack';
	import { AiFillFacebook, AiFillInstagram } from 'svelte-icons-pack/ai';

	let socials = [];

	onMount(async () => {
		try {
			const res = await fetch('/api/website');
			const data = await res.json();
			socials = [
				{
					icon: AiFillInstagram,
					link: data.instagramUrl || 'https://www.instagram.com/thunderball_2026'
				},
				{
					icon: AiFillFacebook,
					link: data.facebookUrl || 'https://fb.me/e/5qUhkqeeo'
				}
			];
		} catch (err) {
			console.error('Error loading social URLs:', err);
			socials = [
				{
					icon: AiFillInstagram,
					link: 'https://www.instagram.com/thunderball_2026'
				},
				{
					icon: AiFillFacebook,
					link: 'https://fb.me/e/5qUhkqeeo'
				}
			];
		}
	});
</script>

<footer class="bg-primary py-8 text-secondary">
	<div class="container mx-auto max-w-screen-xl px-4">
		<div class="flex flex-col items-center justify-between md:flex-row">
			<enhanced:img
				src="$lib/assets/images/thunderball.webp"
				alt="Thunderball Logo"
				class="mb-8 h-24 w-24 object-contain md:mb-0"
				title="Thunderball Logo"
				width="500"
				height="500"
			/>

			<!-- Social Icons -->
			<div class="flex gap-6">
				{#each socials as social, index}
					<a
						href={social.link}
						target="_blank"
						rel="noopener noreferrer"
						class="h text-4xl text-secondary transition-colors hover:text-secondary/80"
						aria-label="Social Media"
					>
						<Icon src={social.icon} />
					</a>
				{/each}
			</div>
		</div>
		<div class="mt-8 border-t border-secondary/20 pt-8 text-sm text-secondary">
			<p>
				&copy; Website door
				<a href="https://www.lukasolivier.be" class="cursor-pointer underline"> Lukas Olivier </a>
			</p>
		</div>
	</div>
</footer>
