import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import { babel } from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
import json from '@rollup/plugin-json';
import builtins from 'rollup-plugin-node-builtins';
import path from "path";
import pkg from "./package.json";

const moduleName = pkg.name.replace(/^@.*\//, "");
// const inputFileName = "src/index.ts";
const inputFileName = "src/ChainApi.js";
// const inputFileName = "src/Web3Util.js";

const banner = `
  /**
   * @license
   * author: ${pkg.author}
   * ${moduleName}.js v${pkg.version}
   * Released under the ${pkg.license} license.
   */
`;

// export default [{
//   input: './src/ChainApi.js',
//   output: {
//     file: './dist/index.js',
//     format: 'umd',
//     name: 'squidgameJssdk',
//     globals: {
//       web3: 'web3',
//       WalletConnect: 'WalletConnect',
//     },
//     intro: 'const global = window;'
//   },
//   externals: ["web3", "WalletConnect"],
//
//   runtimeHelpers: false,
//   plugins: [
//     babel({
//       exclude: 'node_modules/**'
//     }),
//     resolve({
//       preferBuiltins: true,
//       mainFields: ['browser']
//     }),
//     terser(),
//     json(),
//     builtins(),
//     commonjs({
//       include: ['node_modules/**'],
//       sourceMap: false
//     }),
//   ],
// }]

export default [
  {
    input: inputFileName,
    output: [
      {
        name: moduleName,
        file: pkg.browser,
        sourcemap: "inline",
        banner,
      },
      {
        name: moduleName,
        file: pkg.browser.replace(".js", ".min.js"),
        sourcemap: "inline",
        banner,
        plugins: [terser()],
      },
    ],
    runtimeHelpers: false,
    plugins: [
      commonjs({
        include: ['node_modules/**'],
        sourceMap: false
      }),
      json(),
      builtins(),
      terser(),
      babel({
        exclude: 'node_modules/**',
        babelHelpers: "bundled",
        configFile: path.resolve(__dirname, ".babelrc"),
      }),
      resolve({
        preferBuiltins: true,
        mainFields: ['browser'],
        browser: true,
      }),

    ],
  },

  // ES
  {
    input: inputFileName,
    output: [
      {
        file: pkg.module,
        format: "es",
        sourcemap: "inline",
        banner,
      },
    ],
    // external: [
    //   ...Object.keys(pkg.dependencies || {}),
    //   ...Object.keys(pkg.devDependencies || {}),
    // ],
    plugins: [
      typescript({
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      }),
      terser(),
      commonjs({
        extensions: [".js", ".ts"],
      }),
      babel({
        // exclude: 'node_modules/**',
        babelHelpers: "bundled",
        configFile: path.resolve(__dirname, ".babelrc"),
      }),
      resolve({
        browser: false,
      }),
    ],
  },

  // CommonJS
  // {
  //   input: inputFileName,
  //   output: [
  //     {
  //       file: pkg.main,
  //       format: "cjs",
  //       sourcemap: "inline",
  //       banner,
  //     },
  //   ],
  //   external: [
  //     ...Object.keys(pkg.dependencies || {}),
  //     ...Object.keys(pkg.devDependencies || {}),
  //   ],
  //   plugins: [
  //     typescript(),
  //     terser(),
  //     commonjs({
  //       extensions: [".js", ".ts"],
  //     }),
  //     babel({
  //       babelHelpers: "bundled",
  //       configFile: path.resolve(__dirname, ".babelrc"),
  //     }),
  //     resolve({
  //       browser: false,
  //     }),
  //   ],
  // },
];
