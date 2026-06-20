import { mount } from "svelte";

import App from "./App.svelte";

import "uno.css";
import "katex/dist/katex.min.css";
import "katex/contrib/mhchem";
import "katex/contrib/copy-tex";

import "./styles/global.css";

const app = mount(App, {
  target: document.getElementById("app") as HTMLElement,
});

export default app;
