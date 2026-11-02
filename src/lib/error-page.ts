export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 "DM Sans", system-ui, -apple-system, sans-serif; background: #08090D; color: #F5F7FF; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; border: 1px solid rgba(255,255,255,0.12); border-radius: 1rem; background: linear-gradient(180deg, rgba(23,27,36,0.82), rgba(17,20,27,0.82)); box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 32px rgba(0,0,0,0.30); }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #9BA3B4; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.625rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #245BFF; color: #fff; box-shadow: 0 4px 16px rgba(36,91,255,0.3); }
      .secondary { background: rgba(255,255,255,0.06); color: #F5F7FF; border-color: rgba(255,255,255,0.12); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
