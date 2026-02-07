<script>
	import { Icon } from 'svelte-icons-pack';
	import { AiFillHome, AiFillTrophy } from 'svelte-icons-pack/ai';
	import { page } from '$app/stores';

	// Reactive variable for the current path
	$: currentPath = $page.url.pathname;
</script>

<header class="fixed left-0 right-0 top-0 z-50 bg-primary/90 backdrop-blur-sm">
	<div class="md:max-w-screen-4xl mx-auto w-full md:px-12">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo -->
			<a href="/" aria-label="Home" class="flex-shrink-0">
				<enhanced:img
					src="$lib/assets/images/thunderball.webp"
					alt="Thunderball Logo"
					class="hidden h-16 w-16 object-contain md:block"
					title="Thunderball Logo"
					width="500"
					height="500"
				/>
			</a>

			<!-- Navigation -->
			<nav class="flex h-full w-full items-center justify-between">
				<!-- Mobile Navigation -->
				<div class="flex h-full w-full items-center md:hidden">
					<a
						href="/"
						aria-label="Home"
						class="flex h-full w-1/2 items-center justify-center text-2xl
						{currentPath === '/' ? 'bg-secondary text-primary' : 'text-secondary'}"
					>
						<Icon src={AiFillHome} />
						<p class="ml-2 text-sm">Info</p>
					</a>
					<a
						href="/tussenstand"
						aria-label="Trophy"
						class="flex h-full w-1/2 items-center justify-center text-2xl
						{currentPath === '/tussenstand' ? 'bg-secondary text-primary' : 'text-secondary'}"
					>
						<Icon src={AiFillTrophy} />
						<p class="ml-2 text-sm">Tussenstand</p>
					</a>
				</div>

				<!-- Desktop Navigation -->
				<div class="desktop-nav hidden w-full items-center justify-end gap-8 md:flex">
					<a
						href="/"
						aria-label="Home"
						class={`text-lg transition-colors ${
							currentPath === '/'
								? 'font-bold text-secondary'
								: 'text-gray-300 hover:text-secondary'
						}`}
					>
						Home
					</a>
					<a
						href="/#info"
						aria-label="Info"
						class="text-lg text-gray-300 transition-colors hover:text-secondary"
					>
						Praktisch
					</a>
					<a
						href="/#history"
						aria-label="History"
						class="text-lg text-gray-300 transition-colors hover:text-secondary"
					>
						Geschiedenis
					</a>
					<a
						href="/tussenstand"
						aria-label="Tussenstand"
						class={`text-lg transition-colors ${
							currentPath === '/tussenstand'
								? 'font-bold text-secondary'
								: 'text-gray-300 hover:text-secondary'
						}`}
					>
						Tussenstand
					</a>
				</div>
			</nav>
		</div>
	</div>
</header>
