<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Premium billing is a client-side competition demo using the existing Firebase user plan; never connect or simulate a real payment processor without replacing this architecture.
- GitHub Pages builds use vite.pages.config.ts (SPA mode, base path from PAGES_BASE); asset/data URLs must use import.meta.env.BASE_URL so they work under a repo subpath.
