import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async';
import App from './App';

export interface Rendered {
  html: string;
  helmet: HelmetServerState;
}

/** Renders one route to HTML for the build-time prerender (scripts/prerender.mjs). Waits for lazy pages. */
export function render(url: string): Promise<Rendered> {
  const helmetContext: { helmet?: HelmetServerState } = {};
  return new Promise((resolve, reject) => {
    const out = new PassThrough();
    const chunks: Buffer[] = [];
    out.on('data', (c: Buffer) => chunks.push(c));
    out.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf8'), helmet: helmetContext.helmet as HelmetServerState }));
    const stream = renderToPipeableStream(
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </HelmetProvider>,
      {
        onAllReady: () => stream.pipe(out),
        onShellError: reject,
        onError: reject,
      },
    );
  });
}
