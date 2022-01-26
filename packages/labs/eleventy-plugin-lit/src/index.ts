/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Note this file must be CommonJS for compatibility with Eleventy, but we can't
// rely on TypeScript's CommonJS output mode, because that will also convert
// dynamic import() calls to require() calls. That would be bad, because we need
// to import ES modules from @lit-labs/ssr, which requires preserved import()
// calls.
//
// So instead we use TypeScript's ESM output mode, but explicitly write
// require() calls for the CommonJS modules we import.
//
// See https://github.com/microsoft/TypeScript/issues/43329 for more details.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path') as typeof import('path');

type LitPluginOptions = {
  componentModules?: string[];
};

module.exports = {
  configFunction: function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eleventyConfig: any,
    options: LitPluginOptions = {}
  ) {
    eleventyConfig.addTransform(
      'render-lit',
      async (content: string, outputPath: string) => {
        console.log(this);
        if (outputPath.endsWith('.html')) {
          const renderSync = (
            await import('@lit-labs/ssr/lib/render-with-global-dom-shim.js')
          ).renderSync;
          const html = (await import('lit')).html;
          const unsafeHTML = (await import('lit/directives/unsafe-html.js'))
            .unsafeHTML;
          for (const module of options.componentModules ?? []) {
            require(path.join(process.cwd(), module));
          }
          let head, body, tail;
          const page = content.match(/(.*)(<body.*<\/body>)(.*)/);
          if (page) {
            [head, body, tail] = page;
          } else {
            head = `<html><head></head>`;
            body = `<body>${content}</body>`;
            tail = `</html>`;
          }
          return head + renderSync(html`${unsafeHTML(body)}`) + tail;
        }
        return content;
      }
    );
  },
};
