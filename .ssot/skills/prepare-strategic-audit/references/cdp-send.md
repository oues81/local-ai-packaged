# CDP send — protocole, setup et pièges

Référence pour `assets/chatgpt-cdp-send.mjs`. Port de la spec 003
`chatgpt-cdp-pipeline` (implémentation Python de référence `generate_via_cdp.py`,
projet consommateur) en Node pur, zéro dépendance.

## Principe dominant

**Ne jamais naviguer.** Cloudflare Turnstile bloque toute navigation automatisée
vers chatgpt.com. On se branche sur une session de navigateur **déjà ouverte par
l'humain** (login + challenge déjà passés) via CDP websocket. Seuls
`Runtime.evaluate` et `Input.dispatchKeyEvent` sont utilisés — jamais
`Page.navigate`, jamais de création de target.

## Lancement du navigateur (une fois, humain)

```powershell
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" `
  --remote-debugging-port=9222 `
  --user-data-dir=<projet>\.edge-debug `
  "https://chatgpt.com"
```

- `--user-data-dir` **dédié obligatoire** : les builds récents refusent le debug
  sur le profil par défaut. Le login ChatGPT persiste dans ce dossier.
- `.edge-debug/` contient les cookies de session → **jamais dans git**.
- Ouvrir une conversation et vérifier que le composer est actif.
- Vérifier : `curl http://127.0.0.1:9222/json` → liste JSON de targets.

## WSL → Windows

CDP bind `127.0.0.1` côté Windows, injoignable depuis WSL2 (mode NAT). Options :

1. **Exécuter l'envoi depuis un client natif Windows** (Claude Code, Cursor,
   Codex CLI sous Windows) — `127.0.0.1:9222` fonctionne directement.
2. **Portproxy one-time** (PowerShell élevé, persiste au reboot) :

   ```powershell
   netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=9222 `
     connectaddress=127.0.0.1 connectport=9222
   New-NetFirewallRule -DisplayName 'WSL CDP 9222' -Direction Inbound `
     -LocalPort 9222 -Protocol TCP -Action Allow -RemoteAddress 172.16.0.0/12
   ```

   L'outil sonde alors automatiquement `http://<gateway-wsl>:9222`.

Résolution d'endpoint : un endpoint **explicite** (`--cdp-endpoint` ou
`CHATGPT_CDP_ENDPOINT`) est exclusif — aucun fallback, sinon un prompt
pourrait partir vers un navigateur non visé. Sans configuration explicite,
l'outil sonde `127.0.0.1:9222` puis la gateway WSL.

## Commandes

```bash
# préflight : endpoint, target, état du composer — read-only
node .ssot/skills/prepare-strategic-audit/assets/chatgpt-cdp-send.mjs doctor

# envoi (exécuté par l'agent APRÈS le gate d'approbation)
node .ssot/skills/prepare-strategic-audit/assets/chatgpt-cdp-send.mjs send \
  --prompt-file docs/prompts/<ts>-chatgpt-web-<slug>.md \
  --wait-reply docs/prompts/<ts>-chatgpt-web-<slug>-output.md   # optionnel
```

Codes de sortie : `0` ok · `2` pas de page chatgpt.com · `3` composer absent ou
non vide · `4` envoi non confirmé · `5` timeout réponse (envoi réussi) · `6`
endpoint injoignable · `7` usage/E/S.

## Séquence d'envoi (spec 003 §5)

1. Composer = `div.ProseMirror[contenteditable="true"]` — **pas**
   `#prompt-textarea`. Refus si le composer est déjà non vide (anti-collision).
2. `document.execCommand('insertText', false, prompt)` — obligatoire ;
   ProseMirror ignore les assignations directes.
3. Enter via `Input.dispatchKeyEvent` keyDown/keyUp (`windowsVirtualKeyCode:
   13`, `text: "\r"`).
4. **Fallback obligatoire** : après ~1,2 s, si le composer est encore rempli
   (~1 envoi sur 10 perdu en race de focus), clic sur
   `button[data-testid="send-button"], button[aria-label*="Send|nvoyer"]`.
5. Confirmation : composer vidé (signaux secondaires : stop-button, nouveau
   `conversation-turn`).
6. `--wait-reply` : poll 2 s jusqu'aux marqueurs de fin (`Réponse terminée`,
   `Response finished`, `Stopped`, `Latest response`, `Dernière réponse` —
   delta vs. avant envoi) ou texte du dernier turn stable + stop-button
   absent ; écrit le dernier turn dans le fichier de sortie. Conteneurs de
   turn, du plus récent au plus ancien : `[data-dil-message-id]` (build
   post-2025), `[data-chatgpt-selection-message-id]`, puis le legacy
   `[data-testid^="conversation-turn"]`.

## Pièges documentés (incidents réels, spec 003 §7)

| Piège | Mitigation |
|---|---|
| `WinError 10048` — ports éphérères épuisés | UNE connexion CDP réutilisée pour toute l'exécution (implémenté). |
| Enter n'envoie pas | Fallback clic bouton (étape 4). |
| Réponse texte / refus / quota | `--wait-reply` capture le texte tel quel — c'est la réponse du consult. |
| `403` websocket | Pas d'en-tête `Origin` dans le handshake (implémenté). |
| Turnstile | Jamais `Page.navigate`, jamais nouvelle fenêtre. |
| Composer déjà rempli | Refus explicite (exit 3) — pas d'append silencieux. |
| Drift DOM | Si `generated-image-preview`/sélecteurs changent, `doctor` expose l'état réel ; adapter les constantes `JS_*` en tête de fichier. |

## Sécurité

- Le prompt envoyé contient du contexte projet — le **gate d'approbation** de
  `prepare-strategic-audit` est le contrôle : rien ne part sans approbation.
- Ne pas binder le debug port sur `0.0.0.0` côté navigateur : CDP = contrôle
  total du navigateur (cookies inclus). Le portproxy WSL ci-dessus restreint
  déjà la plage source au réseau WSL.
