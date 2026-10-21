#!/usr/bin/env node
/**
 * chatgpt-cdp-send.mjs — send a prepared prompt into an already-open ChatGPT web
 * session over the Chrome DevTools Protocol (CDP).
 *
 * Pure Node.js ESM, zero runtime dependencies (a minimal RFC 6455 WebSocket
 * client is embedded — Node 20 has no stable global WebSocket).
 *
 * Protocol source: spec 003-chatgpt-cdp-pipeline (portable spec), §5 sequence:
 *   attach to an EXISTING page target (never Page.navigate — that re-triggers
 *   Cloudflare Turnstile), Runtime.evaluate only, execCommand('insertText')
 *   into the ProseMirror composer, Enter via Input.dispatchKeyEvent, fallback
 *   send-button click when Enter is lost (~1/10 observed), delivery confirmed
 *   by composer-empty / new conversation-turn / stop-button signals.
 *
 * Usage:
 *   node chatgpt-cdp-send.mjs doctor [--cdp-endpoint URL]
 *   node chatgpt-cdp-send.mjs send --prompt-file PATH [options]
 *
 * Options:
 *   --cdp-endpoint URL   CDP HTTP endpoint (default probe order:
 *                        $CHATGPT_CDP_ENDPOINT, http://127.0.0.1:9222, then
 *                        the WSL default-gateway IP on port 9222)
 *   --timeout MS         per-call CDP timeout (default 30000)
 *   --wait-reply PATH    after send, poll for the reply and write the last
 *                        conversation-turn text to PATH (default off)
 *   --reply-timeout S    wait-reply timeout in seconds (default 180)
 *
 * Exit codes: 0 ok · 2 no chatgpt.com page target · 3 composer absent or
 * pre-filled · 4 send unconfirmed · 5 reply timeout (send DID succeed) ·
 * 6 CDP endpoint unreachable · 7 usage/IO error.
 */

import net from "node:net";
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Minimal RFC 6455 WebSocket client (ws:// only — CDP is plaintext localhost).
// Client frames are masked per spec; server frames are expected unmasked but
// masked ones are tolerated. Fragmentation, ping/pong and close are handled.
// ---------------------------------------------------------------------------

const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function wsEncodeFrame(opcode, payload) {
  const len = payload.length;
  let head;
  if (len < 126) {
    head = Buffer.from([0x80 | opcode, 0x80 | len]);
  } else if (len < 65536) {
    head = Buffer.alloc(4);
    head[0] = 0x80 | opcode;
    head[1] = 0x80 | 126;
    head.writeUInt16BE(len, 2);
  } else {
    head = Buffer.alloc(10);
    head[0] = 0x80 | opcode;
    head[1] = 0x80 | 127;
    head.writeBigUInt64BE(BigInt(len), 2);
  }
  const mask = crypto.randomBytes(4);
  const masked = Buffer.allocUnsafe(len);
  for (let i = 0; i < len; i += 1) masked[i] = payload[i] ^ mask[i & 3];
  return Buffer.concat([head, mask, masked]);
}

class WsClient {
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.fragments = [];
    this.fragmentOpcode = null;
    this.queue = [];
    this.waiters = [];
    this.closed = false;
    socket.on("data", (chunk) => this.#onData(chunk));
    socket.on("close", () => this.#onClose());
    socket.on("error", () => this.#onClose());
  }

  static async connect(wsUrl, { timeoutMs = 30000 } = {}) {
    const url = new URL(wsUrl);
    if (url.protocol !== "ws:") throw new Error(`only ws:// supported, got ${url.protocol}`);
    const port = Number(url.port || 80);
    const key = crypto.randomBytes(16).toString("base64");
    const socket = await new Promise((resolve, reject) => {
      const s = net.connect({ host: url.hostname, port });
      const timer = setTimeout(() => {
        s.destroy();
        reject(new Error(`tcp connect timeout ${url.hostname}:${port}`));
      }, timeoutMs);
      s.once("connect", () => {
        clearTimeout(timer);
        resolve(s);
      });
      s.once("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
    // HTTP upgrade — IMPORTANT: no Origin header. Edge/CDP rejects (403)
    // websocket handshakes that carry Origin (spec 003 §5.2).
    const request =
      `GET ${url.pathname}${url.search} HTTP/1.1\r\n` +
      `Host: ${url.hostname}:${port}\r\n` +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Key: ${key}\r\n` +
      "Sec-WebSocket-Version: 13\r\n\r\n";
    const response = await new Promise((resolve, reject) => {
      let acc = Buffer.alloc(0);
      const timer = setTimeout(() => {
        socket.destroy();
        reject(new Error("websocket handshake timeout"));
      }, timeoutMs);
      const onData = (chunk) => {
        acc = Buffer.concat([acc, chunk]);
        const idx = acc.indexOf("\r\n\r\n");
        if (idx === -1) return;
        clearTimeout(timer);
        socket.off("data", onData);
        const head = acc.subarray(0, idx).toString("latin1");
        const rest = acc.subarray(idx + 4);
        resolve({ head, rest });
      };
      socket.on("data", onData);
      socket.write(request);
    });
    const statusLine = response.head.split("\r\n")[0] || "";
    if (!/ 101 /.test(statusLine)) {
      socket.destroy();
      throw new Error(`websocket upgrade refused: ${statusLine.trim() || "no status"}`);
    }
    const accept = crypto
      .createHash("sha1")
      .update(key + WS_GUID)
      .digest("base64");
    if (!response.head.toLowerCase().includes(`sec-websocket-accept: ${accept}`.toLowerCase())) {
      socket.destroy();
      throw new Error("websocket upgrade: bad Sec-WebSocket-Accept");
    }
    const client = new WsClient(socket);
    if (response.rest.length) client.#onData(response.rest);
    return client;
  }

  #onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    for (;;) {
      if (this.buffer.length < 2) return;
      const b0 = this.buffer[0];
      const b1 = this.buffer[1];
      const fin = (b0 & 0x80) !== 0;
      const opcode = b0 & 0x0f;
      const masked = (b1 & 0x80) !== 0;
      let len = b1 & 0x7f;
      let offset = 2;
      if (len === 126) {
        if (this.buffer.length < offset + 2) return;
        len = this.buffer.readUInt16BE(offset);
        offset += 2;
      } else if (len === 127) {
        if (this.buffer.length < offset + 8) return;
        len = Number(this.buffer.readBigUInt64BE(offset));
        offset += 8;
      }
      const maskLen = masked ? 4 : 0;
      if (this.buffer.length < offset + maskLen + len) return;
      let payload = this.buffer.subarray(offset + maskLen, offset + maskLen + len);
      if (masked) {
        const mask = this.buffer.subarray(offset, offset + 4);
        payload = Buffer.from(payload);
        for (let i = 0; i < payload.length; i += 1) payload[i] ^= mask[i & 3];
      }
      this.buffer = this.buffer.subarray(offset + maskLen + len);

      if (opcode === 0x9) {
        // ping → pong
        this.socket.write(wsEncodeFrame(0xa, Buffer.from(payload)));
        continue;
      }
      if (opcode === 0x8) {
        this.#onClose();
        return;
      }
      if (opcode === 0xa) continue; // pong — ignore
      // data frames: text(0x1)/binary(0x2) start, continuation(0x0) follows
      if (opcode !== 0x0) this.fragmentOpcode = opcode;
      this.fragments.push(Buffer.from(payload));
      if (!fin) continue;
      const whole = Buffer.concat(this.fragments);
      const op = this.fragmentOpcode;
      this.fragments = [];
      this.fragmentOpcode = null;
      if (op !== 0x1) continue; // only text messages matter for CDP
      const text = whole.toString("utf8");
      const waiter = this.waiters.shift();
      if (waiter) waiter(text);
      else this.queue.push(text);
    }
  }

  #onClose() {
    if (this.closed) return;
    this.closed = true;
    while (this.waiters.length) this.waiters.shift()(null);
  }

  sendText(text) {
    if (this.closed) throw new Error("websocket closed");
    this.socket.write(wsEncodeFrame(0x1, Buffer.from(text, "utf8")));
  }

  nextMessage(timeoutMs = 0) {
    if (this.queue.length) return Promise.resolve(this.queue.shift());
    if (this.closed) return Promise.resolve(null);
    return new Promise((resolve) => {
      const wrapped = (msg) => {
        if (timer) clearTimeout(timer);
        resolve(msg);
      };
      const timer =
        timeoutMs > 0
          ? setTimeout(() => {
              const idx = this.waiters.indexOf(wrapped);
              if (idx >= 0) this.waiters.splice(idx, 1);
              resolve(null);
            }, timeoutMs)
          : null;
      this.waiters.push(wrapped);
    });
  }

  close() {
    if (this.closed) return;
    try {
      this.socket.write(wsEncodeFrame(0x8, Buffer.alloc(0)));
    } catch { /* ignore */ }
    this.closed = true;
    this.socket.destroy();
  }
}

// ---------------------------------------------------------------------------
// CDP JSON-RPC over the page websocket
// ---------------------------------------------------------------------------

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 0;
    this.pending = new Map();
    this.#demux();
  }

  // Single demultiplexing loop: every incoming message is routed to the
  // pending call matching its id. Events (no id) are ignored.
  async #demux() {
    for (;;) {
      const msg = await this.ws.nextMessage(0);
      if (msg === null) {
        for (const [, p] of this.pending) {
          clearTimeout(p.timer);
          p.reject(new Error("cdp websocket closed"));
        }
        this.pending.clear();
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(msg);
      } catch {
        continue;
      }
      if (parsed.id === undefined) continue;
      const p = this.pending.get(parsed.id);
      if (!p) continue;
      this.pending.delete(parsed.id);
      clearTimeout(p.timer);
      if (parsed.error) p.reject(new Error(`${parsed.error.message || "cdp error"}`));
      else p.resolve(parsed.result);
    }
  }

  call(method, params = {}, timeoutMs = 30000) {
    const id = (this.nextId += 1);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`cdp call timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.sendText(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression, timeoutMs = 30000) {
    const result = await this.call(
      "Runtime.evaluate",
      { expression, returnByValue: true, awaitPromise: true },
      timeoutMs,
    );
    if (result.exceptionDetails) {
      const text = result.exceptionDetails.text || "evaluation exception";
      throw new Error(`Runtime.evaluate failed: ${text}`);
    }
    return result.result ? result.result.value : undefined;
  }
}

// ---------------------------------------------------------------------------
// Endpoint discovery
// ---------------------------------------------------------------------------

function httpGetJson(urlString, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const req = http.get(urlString, { timeout: timeoutMs }, (res) => {
      let acc = "";
      res.setEncoding("utf8");
      res.on("data", (c) => {
        acc += c;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(acc));
        } catch {
          resolve(null);
        }
      });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.on("error", () => resolve(null));
  });
}

function isWsl() {
  return /microsoft|wsl/i.test(os.release());
}

function wslGatewayIp() {
  // WSL2 NAT: the Windows host is the default gateway / resolv.conf nameserver.
  try {
    const out = execFileSync("ip", ["route"], { encoding: "utf8", timeout: 3000 });
    const m = out.match(/default via (\d+\.\d+\.\d+\.\d+)/);
    if (m) return m[1];
  } catch { /* fall through */ }
  try {
    const rc = fs.readFileSync("/etc/resolv.conf", "utf8");
    const m = rc.match(/nameserver\s+(\d+\.\d+\.\d+\.\d+)/);
    if (m) return m[1];
  } catch { /* fall through */ }
  return null;
}

export function endpointCandidates({ flag, env } = {}) {
  const one = (u, why) => [{ url: u.replace(/\/+$/, ""), why }];
  const envVal = env || process.env.CHATGPT_CDP_ENDPOINT;
  // An explicitly configured endpoint is exclusive: silently falling back to
  // a different browser would send prompts to a target the user did not pick.
  if (flag) return one(flag, "--cdp-endpoint");
  if (envVal) return one(envVal, "CHATGPT_CDP_ENDPOINT");
  const list = [{ url: "http://127.0.0.1:9222", why: "default" }];
  if (isWsl()) {
    const gw = wslGatewayIp();
    if (gw) list.push({ url: `http://${gw}:9222`, why: "wsl-gateway (needs Windows portproxy)" });
  }
  return list;
}

async function probeEndpoint(base, timeoutMs = 3000) {
  const version = await httpGetJson(`${base}/json/version`, timeoutMs);
  return version && typeof version === "object" ? version : null;
}

async function resolveEndpoint({ flag, timeoutMs = 3000, log = () => {} } = {}) {
  const candidates = endpointCandidates({ flag });
  const probed = [];
  for (const c of candidates) {
    const version = await probeEndpoint(c.url, timeoutMs);
    probed.push({ ...c, ok: !!version, browser: version ? version.Browser : null });
    log(`${version ? "OK " : "FAIL"} ${c.url} (${c.why})`);
    if (version) return { endpoint: c.url, version, probed };
  }
  return { endpoint: null, version: null, probed };
}

async function findChatGptTarget(endpoint, timeoutMs = 5000) {
  const targets = await httpGetJson(`${endpoint}/json`, timeoutMs);
  if (!Array.isArray(targets)) return { target: null, pages: [] };
  const pages = targets.filter(
    (t) =>
      t.type === "page" &&
      typeof t.url === "string" &&
      (t.url.includes("chatgpt.com") || t.url.includes("chat.openai.com")),
  );
  return { target: pages[0] || null, pages };
}

// ---------------------------------------------------------------------------
// Page-side JavaScript (Runtime.evaluate expressions)
// ---------------------------------------------------------------------------

const JS_COMPOSER = "div.ProseMirror[contenteditable='true']";

const JS_PROBE = `(() => {
  const c = document.querySelector("${JS_COMPOSER}");
  const b = document.querySelector(
    'button[data-testid="send-button"], button[aria-label*="Send"], button[aria-label*="nvoyer"]');
  const stop = document.querySelector(
    'button[data-testid="stop-button"], button[aria-label*="Stop"], button[aria-label*="rrêter"]');
  return {
    url: location.href,
    title: document.title,
    composerPresent: !!c,
    composerText: c ? c.innerText.slice(0, 120) : null,
    sendButton: b ? (b.disabled ? "disabled" : "enabled") : "absent",
    stopButtonPresent: !!stop,
    previews: document.querySelectorAll('[data-testid*="preview"]').length,
    turnCount: document.querySelectorAll(
      '[data-testid^="conversation-turn"], [data-dil-message-id]').length,
    alerts: [...document.querySelectorAll('[role="alert"]')].map((e) => e.innerText.slice(0, 120)),
  };
})()`;

const JS_INSERT = `((prompt) => {
  const d = document.querySelector("${JS_COMPOSER}");
  if (!d) return { ok: false, reason: "composer-missing" };
  if (d.innerText.trim().length > 0) return { ok: false, reason: "composer-not-empty", text: d.innerText.slice(0, 120) };
  d.focus();
  const inserted = document.execCommand("insertText", false, prompt);
  return { ok: inserted === true, text: d.innerText.slice(0, 80), length: d.innerText.length };
})`;

const JS_STATE = `(() => {
  const c = document.querySelector("${JS_COMPOSER}");
  const stop = document.querySelector(
    'button[data-testid="stop-button"], button[aria-label*="Stop"], button[aria-label*="rrêter"]');
  const markers = ["Réponse terminée", "Response finished", "Stopped",
    "Latest response", "Dernière réponse"];
  const body = document.body ? document.body.innerText : "";
  let markerCount = 0;
  for (const m of markers) markerCount += body.split(m).length - 1;
  // Turn containers, newest DOM first. The post-2025 ChatGPT build marks
  // assistant replies with data-dil-message-id (inside a
  // data-chatgpt-selection-message-id group) and ships almost no
  // data-testid hooks; older builds used data-testid="conversation-turn-N".
  const legacy = [...document.querySelectorAll('[data-testid^="conversation-turn"]')];
  const dil = [...document.querySelectorAll("[data-dil-message-id]")];
  const sel = [...document.querySelectorAll("[data-chatgpt-selection-message-id]")];
  const turns = legacy.length ? legacy : dil.length ? dil : sel;
  return {
    composerEmpty: c ? c.innerText.trim().length === 0 : null,
    composerText: c ? c.innerText.slice(0, 80) : null,
    stopButtonPresent: !!stop,
    turnCount: turns.length,
    lastTurnText: turns.length ? turns[turns.length - 1].innerText : "",
    markerCount,
  };
})()`;

const JS_CLICK_SEND = `(() => {
  const b = document.querySelector(
    'button[data-testid="send-button"], button[aria-label*="Send"], button[aria-label*="nvoyer"]');
  if (!b) return { ok: false, reason: "send-button-missing" };
  b.click();
  return { ok: true };
})()`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function launchInstructions() {
  const lines = [
    "No usable ChatGPT page found. To open one (Windows):",
    "",
    '  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" ^',
    "    --remote-debugging-port=9222 ^",
    "    --user-data-dir=<project>\\.edge-debug ^",
    '    "https://chatgpt.com"',
    "",
    "  - Dedicated --user-data-dir is REQUIRED (recent builds refuse debug on",
    "    the default profile) and keeps the ChatGPT login persistent.",
    "  - Add .edge-debug/ to .gitignore — it holds session cookies.",
    "  - Log in manually, open a conversation, then re-run doctor.",
  ];
  if (isWsl()) {
    lines.push(
      "",
      "  WSL note: CDP binds 127.0.0.1 on Windows and is NOT reachable from WSL.",
      "  One-time fix (elevated PowerShell on Windows):",
      "",
      "    netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=9222 connectaddress=127.0.0.1 connectport=9222",
      "    New-NetFirewallRule -DisplayName 'WSL CDP 9222' -Direction Inbound -LocalPort 9222 -Protocol TCP -Action Allow -RemoteAddress 172.16.0.0/12",
      "",
      "  then this tool's wsl-gateway probe will reach it.",
    );
  }
  return lines.join("\n");
}

function usage() {
  return [
    "usage:",
    "  node chatgpt-cdp-send.mjs doctor [--cdp-endpoint URL]",
    "  node chatgpt-cdp-send.mjs send --prompt-file PATH [--cdp-endpoint URL]",
    "      [--timeout MS] [--wait-reply PATH] [--reply-timeout S]",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdDoctor({ endpointFlag }) {
  const r = await resolveEndpoint({
    flag: endpointFlag,
    log: (l) => console.log(`[probe] ${l}`),
  });
  if (!r.endpoint) {
    console.log(`\nCDP endpoint unreachable.\n\n${launchInstructions()}`);
    return 6;
  }
  console.log(`\nendpoint: ${r.endpoint}  browser: ${r.version.Browser || "?"}`);
  const { target, pages } = await findChatGptTarget(r.endpoint);
  if (pages.length > 1) {
    console.log(`note: ${pages.length} chatgpt.com page targets — using the first.`);
  }
  if (!target) {
    console.log(`\nNo chatgpt.com page target.\n\n${launchInstructions()}`);
    return 2;
  }
  console.log(`target: ${target.url}`);
  const ws = await WsClient.connect(target.webSocketDebuggerUrl);
  const cdp = new Cdp(ws);
  const probe = await cdp.evaluate(JS_PROBE);
  ws.close();
  console.log("\npage probe:");
  console.log(JSON.stringify(probe, null, 2));
  if (!probe.composerPresent) {
    console.log(
      "\nverdict: composer NOT found — open a conversation in that tab (or ChatGPT DOM changed; see references/cdp-send.md).",
    );
    return 3;
  }
  if (probe.composerText && probe.composerText.trim().length > 0) {
    console.log("\nverdict: composer is NON-EMPTY — clear or send it manually before scripted send.");
    return 3;
  }
  console.log("\nverdict: ready — composer present and empty.");
  return 0;
}

async function cmdSend({ endpointFlag, promptFile, timeoutMs, waitReply, replyTimeoutS }) {
  const prompt = fs.readFileSync(promptFile, "utf8");
  if (!prompt.trim()) {
    console.error(`error: prompt file is empty: ${promptFile}`);
    return 7;
  }
  const r = await resolveEndpoint({
    flag: endpointFlag,
    log: (l) => console.log(`[probe] ${l}`),
  });
  if (!r.endpoint) {
    console.error(`CDP endpoint unreachable.\n\n${launchInstructions()}`);
    return 6;
  }
  const { target, pages } = await findChatGptTarget(r.endpoint);
  if (!target) {
    console.error(`No chatgpt.com page target.\n\n${launchInstructions()}`);
    return 2;
  }
  if (pages.length > 1) {
    console.log(`note: ${pages.length} chatgpt.com page targets — using the first.`);
  }
  console.log(`target: ${target.url}`);

  const ws = await WsClient.connect(target.webSocketDebuggerUrl, { timeoutMs });
  const cdp = new Cdp(ws);

  try {
    // 1. Insert the prompt — execCommand is mandatory: ProseMirror ignores
    //    direct innerText/value assignments (spec 003 §5.4).
    const ins = await cdp.evaluate(`${JS_INSERT}(${JSON.stringify(prompt)})`, timeoutMs);
    if (!ins || !ins.ok) {
      console.error(`insert failed: ${JSON.stringify(ins)}`);
      if (ins && ins.reason === "composer-not-empty") {
        console.error("Refusing to append into a non-empty composer — clear it manually first.");
      }
      return 3;
    }
    console.log(`inserted ${prompt.length} chars into composer.`);

    // 2. Send via Enter (avoids send-button selector fragility — spec §5.5).
    await cdp.call(
      "Input.dispatchKeyEvent",
      { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" },
      timeoutMs,
    );
    await cdp.call(
      "Input.dispatchKeyEvent",
      { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 },
      timeoutMs,
    );

    // 3. Confirm — ~1/10 Enter is lost to a ProseMirror focus race; fall back
    //    to the send button when the composer is still filled.
    await sleep(1200);
    let st = await cdp.evaluate(JS_STATE, timeoutMs);
    if (st.composerEmpty === false) {
      console.log("Enter did not send (composer still filled) — clicking send button.");
      const click = await cdp.evaluate(JS_CLICK_SEND, timeoutMs);
      if (!click.ok) {
        console.error(`send fallback failed: ${JSON.stringify(click)}`);
        return 4;
      }
      await sleep(2000);
      st = await cdp.evaluate(JS_STATE, timeoutMs);
    }
    if (st.composerEmpty === false) {
      console.error(`send unconfirmed — composer still filled: ${JSON.stringify(st)}`);
      return 4;
    }
    const signals = [];
    if (st.composerEmpty === true) signals.push("composer-empty");
    if (st.stopButtonPresent) signals.push("stop-button");
    console.log(`sent. confirmation: ${signals.join(", ") || "none"}.`);

    // 4. Optional reply capture.
    if (waitReply) {
      const deadline = Date.now() + replyTimeoutS * 1000;
      const baselineMarkers = st.markerCount;
      let lastText = "";
      let stableRounds = 0;
      for (;;) {
        if (Date.now() > deadline) {
          console.error(`reply timeout after ${replyTimeoutS}s (send DID succeed).`);
          return 5;
        }
        await sleep(2000);
        const cur = await cdp.evaluate(JS_STATE, timeoutMs);
        const finished = cur.markerCount > baselineMarkers;
        const text = cur.lastTurnText || "";
        const stable = text.length > 0 && text === lastText;
        stableRounds = stable ? stableRounds + 1 : 0;
        lastText = text;
        if (finished || (stableRounds >= 1 && !cur.stopButtonPresent && text.length > 0)) {
          fs.mkdirSync(path.dirname(path.resolve(waitReply)), { recursive: true });
          fs.writeFileSync(waitReply, text, "utf8");
          console.log(`reply captured (${text.length} chars) → ${waitReply}`);
          return 0;
        }
      }
    }
    return 0;
  } finally {
    ws.close();
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  if (command === "doctor") {
    return cmdDoctor({ endpointFlag: args["cdp-endpoint"] });
  }
  if (command === "send") {
    if (!args["prompt-file"]) {
      console.error(`missing --prompt-file\n${usage()}`);
      return 7;
    }
    return cmdSend({
      endpointFlag: args["cdp-endpoint"],
      promptFile: args["prompt-file"],
      timeoutMs: Number(args.timeout) || 30000,
      waitReply:
        args["wait-reply"] === true
          ? `${args["prompt-file"]}-reply.md`
          : args["wait-reply"],
      replyTimeoutS: Number(args["reply-timeout"]) || 180,
    });
  }
  console.error(usage());
  return 7;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(`fatal: ${err.message}`);
      process.exit(7);
    });
}

export { WsClient, Cdp, wsEncodeFrame, resolveEndpoint, findChatGptTarget };
