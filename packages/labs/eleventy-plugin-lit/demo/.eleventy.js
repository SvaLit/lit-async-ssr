/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

const litPlugin = require('../index.js');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('./_js');
  eleventyConfig.addPlugin(litPlugin, {
    componentModules: ['./_js/components.bundle.js'],
  });
};
