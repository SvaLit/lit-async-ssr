/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {Package, PackageJson, AnalyzerInterface} from './model.js';
import {AbsolutePath} from './paths.js';
import {getModule} from './javascript/modules.js';
export {PackageJson};
import {
  getPackageInfo,
  getPackageRootForModulePath,
} from './javascript/packages.js';

export interface AnalyzerInit {
  getProgram: () => ts.Program;
  fs: AnalyzerInterface['fs'];
  path: AnalyzerInterface['path'];
  basePath?: AbsolutePath;
}

/**
 * An analyzer for Lit typescript modules.
 */
export class Analyzer implements AnalyzerInterface {
  private readonly _getProgram: () => ts.Program;
  readonly fs: AnalyzerInterface['fs'];
  readonly path: AnalyzerInterface['path'];
  private _commandLine: ts.ParsedCommandLine | undefined = undefined;

  constructor(init: AnalyzerInit) {
    this._getProgram = init.getProgram;
    this.fs = init.fs;
    this.path = init.path;
  }

  get program() {
    return this._getProgram();
  }

  get commandLine() {
    return (this._commandLine ??= getCommandLineFromProgram(this));
  }

  getModule(modulePath: AbsolutePath) {
    return getModule(
      this.program.getSourceFile(this.path.normalize(modulePath))!,
      this
    );
  }

  getPackage() {
    const rootFileNames = this.program.getRootFileNames();

    // Find the package.json for this package based on the first root filename
    // in the program (we assume all root files in a program belong to the same
    // package)
    if (rootFileNames.length === 0) {
      throw new Error('No source files found in package.');
    }
    const packageInfo = getPackageInfo(rootFileNames[0] as AbsolutePath, this);

    return new Package({
      ...packageInfo,
      modules: rootFileNames.map((fileName) =>
        getModule(
          this.program.getSourceFile(this.path.normalize(fileName))!,
          this,
          packageInfo
        )
      ),
    });
  }
}

/**
 * Extracts a `ts.ParsedCommandLine` (essentially, the key bits of a
 * `tsconfig.json`) from the analyzer's `ts.Program`.
 *
 * The `ts.getOutputFileNames()` function must be passed a
 * `ts.ParsedCommandLine`; since not all usages of the analyzer create the
 * program directly from a tsconfig (plugins get passed the program only),
 * this allows backing the `ParsedCommandLine` out of an existing program.
 */
export const getCommandLineFromProgram = (
  analyzer: Analyzer
): ts.ParsedCommandLine => {
  const compilerOptions = analyzer.program.getCompilerOptions();
  const files = analyzer.program.getRootFileNames();
  const json = {
    files,
    compilerOptions,
  };
  if (compilerOptions.configFilePath !== undefined) {
    // For a TS project, derive the package root from the config file path
    const packageRoot = analyzer.path.basename(
      compilerOptions.configFilePath as string
    );
    return ts.parseJsonConfigFileContent(
      json,
      ts.sys,
      packageRoot,
      undefined,
      compilerOptions.configFilePath as string
    );
  } else {
    // Otherwise, this is a JS project; we can determine the package root
    // based on the package.json location; we can look that up based on
    // the first root file
    const packageRoot = getPackageRootForModulePath(
      files[0] as AbsolutePath,
      analyzer
      // Note we don't pass a configFilePath since we don't have one; This just
      // means we can't use ts.getOutputFileNames(), which we isn't needed in
      // JS program
    );
    return ts.parseJsonConfigFileContent(json, ts.sys, packageRoot);
  }
};
