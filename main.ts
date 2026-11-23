// Second GTA 6 meme entry for make.fun (Node 22, standard library only).
//
// The meme itself lives in the X post. This program hands the grader the
// post's address: it reads POST.json out of MAKEFUN_BOT_DIR (default /bot),
// makes sure it names a real X post, and copies it unchanged into
// MAKEFUN_OUTPUT_DIR (default /output). No network, no clock, and the
// output is a byte-for-byte copy of the input on every run.

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const source = join(botDir, 'POST.json');

// An X post address, as X shows it: x.com or twitter.com, a handle, then
// /status/ followed by the numeric post id. Anything else is not a post
// this bounty can judge, so refuse it here instead of handing in junk.
const POST_ADDRESS = /^https:\/\/(x\.com|twitter\.com)\/[A-Za-z0-9_]{1,15}\/status\/[0-9]+$/;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

if (!existsSync(source)) {
  fail(
    `POST.json is missing at ${source}. ` +
      'Post the meme on X first, then put its address in POST.json as ' +
      '{"url": "https://x.com/<handle>/status/<id>"} and submit.',
  );
}

let text: string;
try {
  text = readFileSync(source, 'utf8');
} catch (err) {
  fail(`POST.json could not be read from ${source}: ${(err as Error).message}`);
}

let parsed: unknown;
try {
  parsed = JSON.parse(text);
} catch (err) {
  fail(`POST.json is not valid JSON: ${(err as Error).message}`);
}

const url = (parsed as { url?: unknown } | null)?.url;
if (typeof url !== 'string' || !POST_ADDRESS.test(url)) {
  fail(
    'POST.json must hold an X post address like ' +
      'https://x.com/<handle>/status/<id>, got: ' +
      text.trim().slice(0, 200),
  );
}

mkdirSync(outputDir, { recursive: true });
try {
  copyFileSync(source, join(outputDir, 'POST.json'));
} catch (err) {
  fail(`POST.json could not be copied to ${outputDir}: ${(err as Error).message}`);
}

// Verify the copy: read the output back and compare it byte for byte with
// the source. A silent short copy would hand the grader a broken POST.json,
// so refuse it here instead of passing it on.
const copied = readFileSync(join(outputDir, 'POST.json'));
if (!copied.equals(readFileSync(source))) {
  fail(`POST.json copied to ${outputDir} does not match the source; refusing it.`);
}

console.log(`entry post: ${url}`);
