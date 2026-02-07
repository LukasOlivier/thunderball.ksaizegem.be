<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Sponsors from '../Sponsors.svelte';

	let pools = {};
	let matches = [];
	let activePool = 'Alle';
	let loading = true;
	let error = null;
	let teamStandings = [];
	let intervalId;
	let teamPointsMap = {};
	let autoRefreshEnabled = false;

	// Helper: parse times like "9u" or "9u35" into [hours, minutes]
	function parseTimeStr(timeStr = '') {
		const match = timeStr
			.toString()
			.trim()
			.match(/(\d+)u(?:\s*(\d+))?/);
		if (!match) return [0, 0];
		const hours = Number(match[1]) || 0;
		const minutes = match[2] ? Number(match[2]) : 0;
		return [hours, minutes];
	}

	function sortByTime(a, b) {
		const [ah, am] = parseTimeStr(a?.Time);
		const [bh, bm] = parseTimeStr(b?.Time);
		if (ah !== bh) return ah - bh;
		return am - bm;
	}

	async function fetchData() {
		try {
			const response = await fetch('/api/sheet', { cache: 'no-store' });
			if (!response.ok) throw new Error(`Server error: ${response.status} ${response.statusText}`);
			const json = await response.json();
			const [header, ...rows] = json.values || [];
			const parsedData = rows.map((r) => {
				const obj = {};
				header.forEach((h, i) => (obj[h] = r[i] ?? ''));
				return obj;
			});

			matches = parsedData.filter((row) => row['Time']);

			teamStandings = parsedData
				.filter((row) => row['Ploegnaam'] && row['Totaal Punten'])
				.map((row) => ({
					name: row['Ploegnaam'],
					points: Number(row['Totaal Punten']) || 0
				}))
				.sort((a, b) => b.points - a.points);

			// Build quick lookup map for team points (case-insensitive)
			teamPointsMap = teamStandings.reduce((acc, t) => {
				acc[t.name.toLowerCase()] = t.points;
				return acc;
			}, {});

			const newPools = {};
			matches.forEach((match) => {
				const poolName = match['Pool'];
				if (!poolName) return;
				if (!newPools[poolName]) newPools[poolName] = [];
				newPools[poolName].push(match);
			});

			Object.keys(newPools).forEach((poolName) => {
				newPools[poolName].sort(sortByTime);
			});

			pools = newPools; // Trigger reactivity

			if (!activePool && Object.keys(pools).length > 0) {
				const regularPools = Object.keys(pools).filter(
					(pool) => !pool.includes('Halve finale') && !pool.includes('Finale')
				);
				activePool =
					regularPools.length > 0 ? regularPools.sort()[0] : Object.keys(pools).sort()[0];
			}

			error = null; // Clear error on successful fetch
			loading = false;
		} catch (err) {
			error = err?.message ?? String(err);
			loading = false;
			console.error('Error loading sheet:', err);
		}
	}

	onMount(() => {
		// Initialize activePool from URL parameter
		const poolParam = $page.url.searchParams.get('pool');
		if (poolParam) {
			activePool = poolParam;
		}

		fetchData();

		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	});

	function toggleAutoRefresh() {
		autoRefreshEnabled = !autoRefreshEnabled;

		// Clear existing interval
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}

		// Start new interval if enabled
		if (autoRefreshEnabled) {
			intervalId = setInterval(fetchData, 10000); // 10 seconds
		}
	}

	function setActivePool(poolName) {
		activePool = poolName;
		// Update URL parameter
		const url = new URL($page.url);
		url.searchParams.set('pool', poolName);
		goto(url.toString(), { replaceState: true, noScroll: true });
	}

	function hasScore(match) {
		return Boolean((match?.Uitslag || '').toString().trim());
	}

	function getAllMatches() {
		// flatten pools to a single array and sort by time
		return Object.values(pools).flat().sort(sortByTime);
	}

	function getSortedPoolKeys() {
		const allPools = ['Alle'];

		const keys = Object.keys(pools);
		const regularPools = keys
			.filter(
				(pool) =>
					!pool.includes('Halve finale') &&
					!pool.includes('Finale') &&
					!pool.includes('Kwartfinale') &&
					pool !== 'Unassigned'
			)
			.sort();

		const quarterFinalPools = keys.filter((pool) => pool.includes('Kwartfinale')).sort();

		const semifinalPools = keys.filter((pool) => pool.includes('Halve finale')).sort();

		const finalePools = keys.filter((pool) => pool.includes('Finale')).sort();

		return [...allPools, ...regularPools, ...quarterFinalPools, ...semifinalPools, ...finalePools];
	}

	function isKnockoutStage(poolName) {
		return (
			poolName?.includes('Halve finale') ||
			poolName?.includes('Finale') ||
			poolName?.includes('Kwartfinale')
		);
	}

	function getTeamPoints(teamName) {
		return teamPointsMap?.[teamName?.toLowerCase()] ?? 0;
	}

	function getLosingTeam(match) {
		const score = (match?.Uitslag || '').toString().trim();
		if (!score) return null;

		// Parse score like "2-1" or "3-0"
		const scoreMatch = score.match(/(\d+)\s*[-–]\s*(\d+)/);
		if (!scoreMatch) return null;

		const team1Score = parseInt(scoreMatch[1]);
		const team2Score = parseInt(scoreMatch[2]);

		if (team1Score > team2Score) return match['Team 2'];
		if (team2Score > team1Score) return match['Team 1'];
		return null; // tie
	}
</script>

<div class="min-h-screen bg-zinc-50 py-16">
	<div class="container mx-auto max-w-6xl px-4 py-8">
		<div class="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
			<p class="text-amber-700">
				Let op: Dit schema kan nog wijzigen zolang de inschrijvingen open zijn.
			</p>
		</div>

		<!-- Loading and Error States -->
		{#if loading}
			<div class="min-h-[600px]">
				<!-- Loading skeleton -->
				<div
					class="animate-pulse overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
				>
					<div class="h-12 border-b border-zinc-200 bg-zinc-50"></div>
					{#each Array(6) as _, i}
						<div class="flex h-16 border-b border-zinc-100">
							<div class="w-1/6 p-4">
								<div class="h-4 rounded bg-zinc-200"></div>
							</div>
							<div class="w-2/6 p-4">
								<div class="h-4 rounded bg-zinc-200"></div>
							</div>
							<div class="w-2/6 p-4">
								<div class="h-4 rounded bg-zinc-200"></div>
							</div>
							<div class="w-1/6 p-4">
								<div class="h-4 rounded bg-zinc-200"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else if error}
			<div class="my-8 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
				<p class="font-medium text-red-700">{error}</p>
				<button
					class="mt-4 rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
					on:click={() => window.location.reload()}
				>
					Try Again
				</button>
			</div>
		{:else}
			<!-- Pool Selection Tabs -->
			<div class="mb-6 flex items-center justify-between">
				<h2 class="mb-4 text-xl font-semibold text-zinc-900">Planning</h2>
				<!-- Auto Refresh Button -->
				<div class="flex justify-end">
					<button
						on:click={toggleAutoRefresh}
						class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors {autoRefreshEnabled
							? 'bg-green-600 text-white hover:bg-green-700'
							: 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
						{autoRefreshEnabled ? 'Live updates aan' : 'Live updates uit'}
					</button>
				</div>
			</div>

			<div class="mb-6 overflow-x-auto pb-1">
				<div class="flex space-x-1 border-b border-zinc-200">
					{#each getSortedPoolKeys() as poolName}
						<button
							class="whitespace-nowrap px-4 py-2 text-sm font-medium {activePool === poolName
								? 'border-b-2 border-zinc-900 text-zinc-900'
								: 'text-zinc-600 hover:text-zinc-900'}"
							on:click={() => setActivePool(poolName)}
						>
							{poolName}
						</button>
					{/each}
				</div>
			</div>

			<!-- Active Pool Matches -->
			{#if activePool}
				{#if activePool === 'Alle'}
					<div class="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead>
									<tr class="border-b border-zinc-200 bg-zinc-50">
										<th
											class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Time</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Pool</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Team 1</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Team 2</th
										>
										<th
											class="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Score</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Field</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-zinc-200">
									{#each getAllMatches() as match}
										<tr class="transition-colors hover:bg-zinc-50">
											<td class="whitespace-nowrap px-6 py-4 font-medium text-zinc-900"
												>{match.Time}</td
											>
											<td class="whitespace-nowrap px-6 py-4 text-zinc-500">{match.Pool}</td>
											<td class="whitespace-nowrap px-6 py-4 text-zinc-700">{match['Team 1']}</td>
											<td class="whitespace-nowrap px-6 py-4 text-zinc-700">{match['Team 2']}</td>
											<td class="whitespace-nowrap px-6 py-4 text-center">
												{#if hasScore(match)}
													<span class="font-medium text-zinc-900">{match.Uitslag}</span>
												{:else}
													<span class="text-zinc-400">—</span>
												{/if}
											</td>
											<td class="whitespace-nowrap px-6 py-4">
												<span
													class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
												>
													{match.Field}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{:else if isKnockoutStage(activePool)}
					<div class="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead>
									<tr class="border-b border-zinc-200 bg-gray-50">
										<th
											class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Time</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Team 1</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Team 2</th
										>
										<th
											class="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Score</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Field</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-zinc-200">
									{#each pools[activePool] as match, i}
										<tr class="transition-colors hover:bg-zinc-50">
											<td class="whitespace-nowrap px-6 py-4 font-medium text-zinc-900"
												>{match.Time}</td
											>
											<td
												class="whitespace-nowrap px-6 py-4 {getLosingTeam(match) === match['Team 1']
													? 'text-red-800'
													: 'text-zinc-700'}">{match['Team 1']}</td
											>
											<td
												class="whitespace-nowrap px-6 py-4 {getLosingTeam(match) === match['Team 2']
													? 'text-red-800'
													: 'text-zinc-700'}">{match['Team 2']}</td
											>
											<td class="whitespace-nowrap px-6 py-4 text-center">
												{#if hasScore(match)}
													<span class="font-medium text-zinc-900">{match.Uitslag}</span>
												{:else}
													<span class="text-zinc-400">—</span>
												{/if}
											</td>
											<td class="whitespace-nowrap px-6 py-4">
												<span
													class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
												>
													{match.Field}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{:else}
					<div class="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead>
									<tr class="border-b border-zinc-200 bg-zinc-50">
										<th
											class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Time</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Team 1</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Totaal punten</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Team 2</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Totaal punten</th
										>
										<th
											class="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Score</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
											>Field</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-zinc-200">
									{#each pools[activePool] as match, i}
										<tr class="transition-colors hover:bg-zinc-50">
											<td class="whitespace-nowrap px-6 py-4 font-medium text-zinc-900"
												>{match.Time}</td
											>
											<td class="whitespace-nowrap px-6 py-4 text-zinc-700">{match['Team 1']}</td>
											<td class="whitespace-nowrap px-6 py-4 text-zinc-500"
												>{getTeamPoints(match['Team 1'])}</td
											>
											<td class="whitespace-nowrap px-6 py-4 text-zinc-700">{match['Team 2']}</td>
											<td class="whitespace-nowrap px-6 py-4 text-zinc-500"
												>{getTeamPoints(match['Team 2'])}</td
											>
											<td class="whitespace-nowrap px-6 py-4 text-center">
												{#if hasScore(match)}
													<span class="font-medium text-zinc-900">{match.Uitslag}</span>
												{:else}
													<span class="text-zinc-400">—</span>
												{/if}
											</td>
											<td class="whitespace-nowrap px-6 py-4">
												<span
													class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
												>
													{match.Field}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<!-- Empty state -->
						{#if pools[activePool].length === 0}
							<div class="flex flex-col items-center justify-center py-12 text-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mb-4 h-12 w-12 text-zinc-300"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
									/>
								</svg>
								<p class="text-zinc-500">No matches scheduled for this pool.</p>
							</div>
						{/if}
					</div>
				{/if}
			{/if}
		{/if}
		<Sponsors />
	</div>
</div>
