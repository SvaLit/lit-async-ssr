# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- ## Unreleased -->

## [0.3.6] - 2021-07-28

## Fixed

- Escaped `<`, `>`, and `&` characters in HTML text content are now preserved
  when generating runtime & transform mode output. Previously they sometimes
  were emitted unescaped, generating invalid markup.

## [0.3.5] - 2021-07-14

## Added

- Added `configureSsrLocalization` in `@lit/localize-tools/lib/ssr.js` which
  allows for safe concurrent rendering of localized templates with
  `@lit-labs/ssr` or other renderers using
  [`AsyncLocalStorage`](https://nodejs.org/api/async_hooks.html#async_hooks_class_asynclocalstorage).

  ```ts
  import {configureSsrLocalization} from '@lit/localize-tools/lib/ssr.js';
  import {render} from '@lit-labs/ssr/lib/render-with-global-dom-shim.js';
  import {html} from 'lit';

  const {withLocale} = await configureSsrLocalization({
    sourceLocale: 'en',
    targetLocales: ['es', 'nl'],
    loadLocale: (locale) => import(`./locales/${locale}.js`)),
  });

  const handleHttpRequest = (req, res) => {
    const locale = localeForRequest(req);
    withLocale(locale, async () => {
      // Any async work can happen in this function, and the request's locale
      // context will be safely preserved for every msg() call.
      await doSomeAsyncWork();
      for (const chunk of render(msg(html`Hello World`))) {
        res.write(chunk);
      }
      res.end();
    });
  };
  ```

## [0.3.4] - 2021-05-18

### Fixed

- Fix `Cannot find module '..../@lit/localize/internal/id-generation.js'` error
  by bumping `@lit/localize` dependency.

## [0.3.3] - 2021-05-18

### Fixed

- Fix bugs relating to expression values being substituted in duplicate or
  incorrect order in localized templates.

- Fix bug relating to `START_LIT_LOCALIZE_EXPR_` strings appearing inside
  localized templates.

## [0.3.2] - 2021-05-07

### Fixed

- Fixed missing `str` tag in generated translation templates.

## [0.3.1] - 2021-04-20

- Update dependencies.

## [0.3.0] - 2021-04-19

### Changed

- **[BREAKING]** Lit dependency upgraded to v2.

- **[BREAKING]** Replaces `Localized` mixin transform with `@localized`
  decorator and `updateWhenLocaleChanges` transforms.

## [0.2.1] - 2021-04-02

### Changed

- XLIFF file headers have been simplified to:

```xml
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
```

## [0.2.0] - 2021-03-30

### Changed

- **[BREAKING]** Description comments (`// msgdesc:`) have been removed in favor
  of the `desc` option.

Before:

```js
// msgdesc: Home page
class HomePage {
  hello() {
    // msgdesc: Greeting to Earth
    return msg(html`Hello World`);
  }
  goodbye() {
    // msgdesc: Farewell to Earth
    return msg(html`Goodbye World`);
  }
}
```

After:

```js
class HomePage {
  hello() {
    return msg(html`Hello World`, {
      desc: 'Home page / Greeting to Earth',
    });
  }
  goodbye() {
    return msg(html`Goodbye World`, {
      desc: 'Home page / Farewell to Earth',
    });
  }
}
```

## [0.1.1] - 2021-03-30

### Changed

- Bumped dependency versions for `xmldom` and `@lit/localize`

## [0.1.0] - 2021-03-24

### Changed

- Initial release of `@lit/localize-tools` package. This new package provides
  the `lit-localize` binary, while `@lit/localize` continues to provide the
  browser library (`msg`, `LocalizedElement`, etc.).

- **BREAKING** `lit-localize` now uses JS modules instead of CommonJS, so it
  requires Node 14 or higher.
