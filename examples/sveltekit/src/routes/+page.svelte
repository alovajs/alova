<script lang="ts">
	import Counter from './Counter.svelte';
	import welcome from '$lib/images/svelte-welcome.webp';
	import welcome_fallback from '$lib/images/svelte-welcome.png';
	import { useRequest } from 'alova';
	import { getData } from '../api';
	import type { PageData } from './$types';
  import { useForm } from '@alova/scene-svelte'


  const { form } = useForm(formData => {
    return getData(formData);
  }, {
    initialForm: {
      username: '',
      password: ''
    }
  })

  const { data: data2, loading, error, send } = useRequest(getData, {
    initialData: []
  });

  export let data: PageData;
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<h1>
		<span class="welcome">
      <div>{JSON.stringify(data)}</div>
      <div on:click={send}>{$loading}</div>
      <div>{$loading ? 'loading...' : JSON.stringify($data2)}</div>
			<!-- <picture>
				<source srcset={welcome} type="image/webp" />
				<img src={welcome_fallback} alt="Welcome" />
			</picture> -->
		</span>

		to your new<br />SvelteKit app
	</h1>

	<h2>
		try editing <strong>src/routes/+page.svelte</strong>
	</h2>

	<Counter />
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}

	.welcome {
		display: block;
		position: relative;
		width: 100%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		display: block;
	}
</style>
