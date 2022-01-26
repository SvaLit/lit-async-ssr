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
    for (const module of options.componentModules ?? []) {
      eleventyConfig.addWatchTarget(module);
    }
    eleventyConfig.addTransform(
      'render-lit',
      async (content: string, outputPath: string) => {
        if (!outputPath.endsWith('.html')) {
          return content;
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

        const {getWindow} = await import('@lit-labs/ssr/lib/dom-shim.js');
        const window = getWindow({includeJSBuiltIns: true});
        const {ModuleLoader} = await import(
          '@lit-labs/ssr/lib/module-loader.js'
        );
        const loader = new ModuleLoader({global: window});
        // TODO(aomarks) Is process.cwd() correct here? Can Eleventy be invoked
        // from one cwd but pointed to an eleventy config file in another
        // directory?
        const referrer = path.join(process.cwd(), 'fake-referrer.js');
        await Promise.all(
          (options.componentModules ?? []).map((module) =>
            loader.importModule(module, referrer)
          )
        );

        const script = `
          import {render} from '@lit-labs/ssr/lib/render-lit-html.js';
          import {html} from 'lit';
          export const result = render(html\`${escapeStringToEmbedInTemplateLiteral(
            body
          )}\`);
        `;
        const module = await loader.loadScript(script, referrer);
        const result = module.namespace['result'];
        let rendered = '';
        for (const fragment of result) {
          rendered += fragment;
        }

        return head + rendered + tail;
      }
    );
  },
};

/**
 * Escape an HTML text content string such that it can be safely embedded in a
 * JavaScript template literal (backtick string).
 */
const escapeStringToEmbedInTemplateLiteral = (unescaped: string): string =>
  unescaped.replace(/\\/g, `\\\\`).replace(/`/g, '\\`').replace(/\$/g, '\\$');
