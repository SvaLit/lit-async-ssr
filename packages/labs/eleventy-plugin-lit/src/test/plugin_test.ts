/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
import * as assert from 'uvu/assert';

test('trivial', async () => {
  assert.is(true, true);
});

test.run();
