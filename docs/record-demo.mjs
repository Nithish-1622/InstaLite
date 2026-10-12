#!/usr/bin/env node
/**
 * Records a short screen-capture demo of the InstaLite frontend.
 *
 * It launches headless Chrome, drives the real UI over the DevTools Protocol
 * (watch feed -> like -> comment -> open profile -> follow -> create post ->
 * publish -> see it on the feed) while grabbing viewport frames, then encodes
 * them into docs/screenshots/demo.mp4 with ffmpeg.
 *
 * Prerequisites:
 *   - Spring Boot on http://localhost:8080
 *   - Next.js dev server on http://localhost:3000
 *   - ffmpeg available on PATH
 *
 * Usage:
 *   node docs/record-demo.mjs            record + encode
 *   node docs/record-demo.mjs --prepare  only generate the demo upload image
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "docs", "screenshots");
const OUT_FILE = path.join(OUT_DIR, "demo.mp4");
const POSTER_FILE = path.join(OUT_DIR, "demo-poster.jpg");
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:3000";
const DEBUG_PORT = 9333;
const WIDTH = 1440;
const HEIGHT = 900;
const TARGET_FPS = 15;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The demo post image the upload step publishes (built below with ffmpeg).
const UPLOAD_FILE =
  process.env.DEMO_UPLOAD_FILE ||
  path.join(os.tmpdir(), "instalite-upload.jpg");

/** Creates the 1080x1080 image that the "create post" step uploads. */
function ensureUploadImage() {
  if (fs.existsSync(UPLOAD_FILE)) return;
  // The colon in "C:" must be escaped with a single backslash for ffmpeg's
  // filterparser; on other platforms "Arial" resolves through fontconfig.
  const font =
    process.platform === "win32" ? "C\\:/Windows/Fonts/arial.ttf" : "Arial";
  const ff = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-f", "lavfi",
      "-i", "color=c=0x0f2027:s=1080x1080",
      "-vf",
      "drawtext=fontfile='" + font + "':text='InstaLite demo shot':fontsize=72:fontcolor=0xffb347:x=(w-text_w)/2:y=h/2-90," +
        "drawtext=fontfile='" + font + "':text='golden hour practice':fontsize=48:fontcolor=0xffffff:x=(w-text_w)/2:y=h/2+20," +
        "drawtext=fontfile='" + font + "':text='1080 x 1080':fontsize=36:fontcolor=0xaaaaaa:x=(w-text_w)/2:y=h/2+110",
      "-frames:v", "1",
      "-q:v", "3",
      UPLOAD_FILE,
    ],
    { encoding: "utf8" }
  );
  if (ff.status !== 0 || !fs.existsSync(UPLOAD_FILE)) {
    throw new Error(
      "Could not generate the demo upload image with ffmpeg:\n" +
        (ff.stderr || "").slice(-800)
    );
  }
}

// ---------------------------------------------------------------- chrome ---
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error("Chrome/Edge not found - set CHROME_PATH");
}

function launchChrome() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "instalite-chrome-"));
  const child = spawn(
    findChrome(),
    [
      "--headless=new",
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${profile}`,
      `--window-size=${WIDTH},${HEIGHT}`,
      "--hide-scrollbars",
      "--mute-audio",
      "--autoplay-policy=no-user-gesture-required",
      "--disable-extensions",
      "about:blank",
    ],
    { stdio: "ignore" }
  );
  return { child, profile };
}

async function findTarget() {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page && page.webSocketDebuggerUrl) return page;
    } catch {
      /* devtools not up yet */
    }
    await sleep(250);
  }
  throw new Error("Chrome DevTools endpoint never came up");
}

// ------------------------------------------------------------------- cdp ---
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let nextId = 1;
    const pending = new Map();
    ws.addEventListener("open", () =>
      resolve({
        send(method, params = {}) {
          return new Promise((res, rej) => {
            const id = nextId++;
            pending.set(id, { res, rej });
            ws.send(JSON.stringify({ id, method, params }));
            setTimeout(() => {
              if (pending.delete(id)) rej(new Error(`CDP timeout: ${method}`));
            }, 30000);
          });
        },
        close() {
          try {
            ws.close();
          } catch {
            /* already closed */
          }
        },
      })
    );
    ws.addEventListener("message", (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message));
        else res(msg.result);
      }
      // events are ignored - we poll instead of listening
    });
    ws.addEventListener("error", (err) => reject(err));
  });
}

// ------------------------------------------------------------ recording ---
async function main() {
  ensureUploadImage();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const frameDir = fs.mkdtempSync(path.join(os.tmpdir(), "instalite-frames-"));
  const listFile = path.join(frameDir, "frames.txt");

  console.log("Launching headless Chrome...");
  const { child, profile } = launchChrome();

  let cdp;
  let capturing = true;
  const stamps = [];
  const frameNames = [];

  try {
    const target = await findTarget();
    cdp = await connect(target.webSocketDebuggerUrl);
    const { send } = cdp;

    await send("Page.enable");
    await send("Runtime.enable");
    await send("DOM.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: WIDTH,
      height: HEIGHT,
      deviceScaleFactor: 1,
      mobile: false,
    });
    // Pick the demo user before any app code runs (no login in this project).
    const alice = {
      id: 1,
      username: "alice",
      profileImage: "/uploads/avatar-alice.png",
    };
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `try { localStorage.setItem('instagram_current_user', ${JSON.stringify(
        JSON.stringify(alice)
      )}); } catch (e) {}`,
    });

    console.log("Loading", FRONTEND);
    await send("Page.navigate", { url: FRONTEND });
    await sleep(1200);

    // --- frame capture loop (runs while the UI is driven below) ---
    const captureLoop = (async () => {
      let i = 0;
      while (capturing) {
        const t0 = Date.now();
        try {
          const shot = await send("Page.captureScreenshot", {
            format: "jpeg",
            quality: 70,
          });
          const name = `f${String(i).padStart(5, "0")}.jpg`;
          fs.writeFileSync(
            path.join(frameDir, name),
            Buffer.from(shot.data, "base64")
          );
          frameNames.push(name);
          stamps.push(Date.now());
          i++;
        } catch {
          /* transient (e.g. mid-navigation) - skip the frame */
        }
        const elapsed = Date.now() - t0;
        await sleep(Math.max(0, 1000 / TARGET_FPS - elapsed));
      }
    })();

    // --- UI helpers -----------------------------------------------------
    const js = async (expression) => {
      const r = await send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (r.exceptionDetails) {
        throw new Error(
          r.exceptionDetails.exception?.description ||
            r.exceptionDetails.text ||
            "evaluate failed"
        );
      }
      return r.result.value;
    };
    const waitFor = async (expression, label, timeout = 15000) => {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if (await js(expression)) return;
        await sleep(250);
      }
      throw new Error(`Timeout waiting for ${label}`);
    };
    const clickFirst = (jsFn) => js(`(() => { ${jsFn} })()`);
    const typeChars = async (selector, text, delay = 70) => {
      const focused = await js(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return false;
        el.focus();
        return true;
      })()`);
      if (!focused) throw new Error("Cannot focus " + selector);
      for (const ch of text) {
        await send("Input.dispatchKeyEvent", { type: "char", text: ch });
        await sleep(delay);
      }
    };

    // --- the demo script ------------------------------------------------
    console.log("Waiting for the feed...");
    await waitFor(
      "document.querySelectorAll('article.post').length >= 3",
      "feed posts",
      25000
    );
    await sleep(1800);

    // Play the first video so the capture shows live media.
    await js(`(() => {
      const v = document.querySelector('article.post video');
      if (v) { v.muted = true; v.play().catch(() => {}); }
      return true;
    })()`);
    await sleep(2000);

    // Scroll down through the long feed.
    console.log("Scrolling the feed...");
    for (let i = 0; i < 5; i++) {
      await js("window.scrollBy({ top: 640, behavior: 'smooth' })");
      await sleep(620);
    }

    // Like the first post that is not liked yet.
    console.log("Liking + commenting...");
    const foundLike = await clickFirst(`
      const b = [...document.querySelectorAll('article.post button')]
        .find((x) => x.getAttribute('aria-label') === 'Like post');
      if (!b) return false;
      b.scrollIntoView({ block: 'center', behavior: 'smooth' });
      window.__likeBtn = b;
      return true;
    `);
    if (foundLike) {
      await sleep(900);
      await js("window.__likeBtn.click()");
      await sleep(1300);

      // Open the comment box of the same post (re-query: React may re-render).
      await clickFirst(`
        const a = document.querySelector('article.post');
        const c = a && a.querySelector('button[aria-label="Toggle comments"]');
        if (!c) return false;
        c.click();
        return true;
      `);
      await waitFor("!!document.querySelector('.add-comment input')", "comment box");
      await sleep(900);

      await typeChars(".add-comment input", "Unreal session, save me a spot!", 65);
      await sleep(450);
      await js(
        "document.querySelector('.add-comment button[type=\"submit\"]').click()"
      );
      await waitFor(
        "[...document.querySelectorAll('.comment')].some((c) => c.textContent.includes('Unreal session'))",
        "posted comment",
        10000
      );
      await sleep(1400);
    }

    // Visit the author's profile and follow them.
    console.log("Opening profile + follow...");
    await clickFirst(`
      const u = document.querySelector('article.post .post-username');
      if (!u) return false;
      u.click();
      return true;
    `);
    await waitFor(
      "location.pathname.startsWith('/profile') && !!document.querySelector('.profile-tabs')",
      "profile page",
      20000
    );
    await sleep(1300);

    const followed = await clickFirst(`
      const b = [...document.querySelectorAll('.profile-topline button')]
        .find((x) => x.textContent.trim() === 'Follow');
      if (!b) return false;
      b.click();
      return true;
    `);
    if (followed) {
      await waitFor(
        "[...document.querySelectorAll('.profile-topline button')].some((x) => x.textContent.trim() === 'Following')",
        "Following state",
        10000
      );
      await sleep(1400);
    }

    // Peek at the profile grid.
    await js("window.scrollBy({ top: 420, behavior: 'smooth' })");
    await sleep(1200);
    await js("window.scrollTo({ top: 0, behavior: 'smooth' })");
    await sleep(900);

    // Create a new post.
    console.log("Creating a post...");
    await clickFirst(`
      const b = [...document.querySelectorAll('.sidebar .nav-item')]
        .find((x) => x.textContent.includes('Create'));
      if (!b) return false;
      b.click();
      return true;
    `);
    await waitFor(
      "location.pathname === '/upload' && !!document.querySelector('.dropzone')",
      "upload dialog",
      15000
    );
    await sleep(1500);

    // Pick the file through the real hidden <input type=file>.
    const doc = await send("DOM.getDocument", { depth: 0 });
    const { nodeId } = await send("DOM.querySelector", {
      nodeId: doc.root.nodeId,
      selector: 'input[type="file"]',
    });
    if (!nodeId) throw new Error("File input not found on /upload");
    await send("DOM.setFileInputFiles", {
      files: [UPLOAD_FILE],
      nodeId,
    });
    await js(`(() => {
      const i = document.querySelector('input[type="file"]');
      if (i) {
        i.dispatchEvent(new Event('input', { bubbles: true }));
        i.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    })()`);
    await waitFor("!!document.querySelector('.share-preview')", "preview step", 10000);
    await sleep(1700);

    await typeChars(".share-caption textarea", "Golden hour practice shot", 75);
    await sleep(900);
    await clickFirst(`
      const b = [...document.querySelectorAll('.dialog-header button')]
        .find((x) => x.textContent.trim() === 'Share');
      if (!b || b.disabled) return false;
      b.click();
      return true;
    `);
    await waitFor(
      "document.body.innerText.includes('Your post has been shared')",
      "share success",
      20000
    );
    await sleep(1700);

    // Back to the feed - the new post should be on top.
    await clickFirst(`
      const b = [...document.querySelectorAll('.dialog button')]
        .find((x) => x.textContent.includes('Go to the feed'));
      if (!b) return false;
      b.click();
      return true;
    `);
    await waitFor(
      "location.pathname === '/' && document.querySelectorAll('article.post').length > 0",
      "feed reload",
      15000
    );
    await sleep(700);
    await js(`(() => {
      const p = document.querySelector('article.post');
      if (p) p.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return true;
    })()`);
    await sleep(2600); // hold on the freshly published post

    console.log("Stopping capture...");
    capturing = false;
    await captureLoop;
  } finally {
    capturing = false;
    try {
      cdp?.close();
    } catch {
      /* ignore */
    }
    try {
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"]);
    } catch {
      /* ignore */
    }
    // Chrome needs a moment to exit before its profile can be deleted.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        fs.rmSync(profile, { recursive: true, force: true });
        break;
      } catch {
        spawnSync("ping", ["-n", "1", "127.0.0.1"], { stdio: "ignore" });
      }
    }
  }

  if (frameNames.length < 30) {
    fs.rmSync(frameDir, { recursive: true, force: true });
    throw new Error(`Only ${frameNames.length} frames captured - aborting`);
  }

  // --- encode: per-frame durations keep the real pacing ---
  const lines = [];
  for (let i = 0; i < frameNames.length; i++) {
    const dur =
      i + 1 < stamps.length
        ? (stamps[i + 1] - stamps[i]) / 1000
        : 1 / TARGET_FPS;
    lines.push(`file '${frameNames[i]}'`, `duration ${dur.toFixed(4)}`);
  }
  lines.push(`file '${frameNames[frameNames.length - 1]}'`); // ffmpeg needs the last one repeated
  fs.writeFileSync(listFile, lines.join("\n"), "utf8");

  console.log(`Encoding ${frameNames.length} frames -> demo.mp4`);
  const ff = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", listFile,
      "-vf", "format=yuv420p",
      "-c:v", "libx264",
      "-crf", "26",
      "-preset", "medium",
      "-movflags", "+faststart",
      OUT_FILE,
    ],
    { encoding: "utf8" }
  );
  if (ff.status !== 0) {
    console.error(ff.stderr?.slice(-3000));
    fs.rmSync(frameDir, { recursive: true, force: true });
    throw new Error("ffmpeg failed");
  }

  // Poster image for README players that do not autoplay.
  spawnSync(
    "ffmpeg",
    ["-y", "-ss", "00:00:03", "-i", OUT_FILE, "-frames:v", "1", "-q:v", "3", POSTER_FILE],
    { encoding: "utf8" }
  );

  fs.rmSync(frameDir, { recursive: true, force: true });
  const mb = (fs.statSync(OUT_FILE).size / 1024 / 1024).toFixed(1);
  console.log(`Done: ${path.relative(ROOT, OUT_FILE)} (${mb} MB)`);
}

if (process.argv.includes("--prepare")) {
  try {
    ensureUploadImage();
    console.log(`Demo upload image ready: ${UPLOAD_FILE}`);
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
} else {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
