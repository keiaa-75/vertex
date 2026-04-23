import { mount } from 'svelte'
import App from './App.svelte'

// Initialize Svelte 5 app on the embed container
const app = mount(App, { target: document.getElementById('app')! })

export default app