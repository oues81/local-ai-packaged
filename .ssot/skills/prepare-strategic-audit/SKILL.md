---
name: prepare-strategic-audit
description: Prepare (do not run) a pasteable ChatGPT-web GitHub audit mandate from local project context. Invoked by 0200-frontier-consult --channel chatgpt-web / "Frontier Consult ChatGPT".
---

# Préparer un mandat d'audit stratégique externe

## Invocation ACOS

Canal de `0200-frontier-consult` : `--channel chatgpt-web` / `--emit-prompt` / phrase
**« Frontier Consult ChatGPT »**. Ce n'est **pas** Codex (`--cli codex`) et ce n'est **pas**
un consult in-session.

## Limite de responsabilité essentielle

Tu es **l'agent préparateur local**, et non l'auditeur externe. Ton travail consiste à produire un **prompt de mission prêt à envoyer/copier dans ChatGPT (interface web)**. N'effectue ni audit approfondi à la place de ChatGPT, ni implémentation applicative. Ne modifie pas le code local hors fichier de prompt autorisé, et n'exécute pas d'actions sur un tenant, des données ou une infrastructure.

**`WRITE_AUTH` défaut = `planning-branch`** : le mandat ordonne à ChatGPT de **créer et pousser** une branche temporaire dédiée avec les 11 artefacts de planification (specs/plan/tasks/waves/…), puis de vérifier leur présence sur GitHub avant tout prompt d'orchestration Cursor. C'est le contrat normal de « Frontier Consult ChatGPT » — sans ça, les agents d'implémentation ne trouvent rien sur le dépôt.

**Opt-out seulement** : `WRITE_AUTH=conversation-only` si l'opérateur dit explicitement « sans écriture », « conversation only », ou `--conversation-only`. Dans ce cas, remplir le template en conséquence et le prompt d'orchestration doit interdire de chercher un pack GitHub.

## Ressources du skill

- Prompt générique à adapter : [assets/prompt-template.md](assets/prompt-template.md)
- Règles de qualité et grilles de collecte : [references/quality-gates.md](references/quality-gates.md)
- Exemple de sortie complète : `examples/enterprise-admin-prompt-v2.md` à la racine du kit (si disponible).

## Méthode

1. **Reconnaître le contexte** : déterminer le dépôt courant et son `origin`, la branche locale, le `HEAD`, la branche principale distante connue et les éventuels worktrees. Ne pas supposer que le remote-tracking local est à jour. Relever si le travail local n'est pas poussé, sans copier ni exposer de données sensibles. S'il existe des worktrees indépendants ou des dépôts liés, préserver leurs frontières.
2. **Découvrir les conventions** : repérer `AGENTS.md`, les règles projet, les `SKILL.md`, l'entry point de reprise (p. ex. `0020-resume`), les constitutions, `.ssot/`, les spécifications, marqueurs `DO NOT EDIT`, scripts de génération, CI et dossiers de documentation. Ne pas exécuter aveuglément un entry point avant d'avoir compris sa nature.
3. **Extraire les invariants vérifiables** : mission métier ; sous-systèmes et flux ; frontières de confiance ; intégrations à d'autres dépôts ; surfaces sensibles ; décisions ouvertes ; contraintes humaines ; méthodes de test ; obligations de sécurité. Fournir chemins et statuts de validation, pas des affirmations gratuites.
4. **Distinguer faits, hypothèses, instructions** : les faits observés localement sont un briefing **à revérifier sur GitHub** ; les hypothèses sont explicitement qualifiées ; les orientations métier de l'utilisateur sont des objectifs, pas des conclusions. Ne jamais forcer le futur auditeur à confirmer une architecture ou à adopter des solutions prédéfinies.
5. **Remplir tous les champs** du template sans conserver de `{{PLACEHOLDER}}`. Mettre `WRITE_AUTH=planning-branch` sauf opt-out explicite. Nommer `OUTPUT_REPO` (= dépôt audité sauf consigne contraire), un slug de branche attendu (`temp/<slug>-strategic-audit-YYYYMMDD`), et rappeler que la mission ChatGPT est **incomplète** sans push + relecture des 11 fichiers. Adapter les axes techniques au projet. Inclure les dépôts voisins seulement s'ils apportent du contexte (lecture seule).
6. **Contrôler le mandat** avec la checklist du fichier `references/quality-gates.md` : séparation préparateur/auditeur/orchestrateur, SHA de base, provenance, anti-hallucination, ACOS, sécurité, variantes multi-repo/worktrees, qualité des livrables, gates de mutation, prévention de drift, compatibilité des vagues.
7. **Livrer à l'utilisateur** le prompt autonome intégral dans un bloc copiable, accompagné d'un bref résumé des données vérifiées, suppositions et limites. Produire un fichier de prompt local seulement si c'est demandé ou nécessaire au partage. Ne pas prétendre avoir interrogé ChatGPT ou modifié GitHub.
8. **Envoyer (défaut) ou s'arrêter (`--emit-prompt`)** — voir « Envoi direct via CDP » ci-dessous.

## Règles supplémentaires

- Ne jamais inclure secrets, valeurs `.env`, clés, dumps, mots de passe, extraits sensibles ou fichiers KeePass dans le prompt ou les artefacts.
- Ne jamais traduire « connecter GitHub » par « accès garanti en écriture » : le prompt doit ordonner à ChatGPT de **vérifier ses permissions** et de rendre compte d'un éventuel blocage.
- Une absence de test trouvé n'est pas une preuve d'absence de tests : noter la couverture de l'exploration.
- Si l'utilisateur demande un *audit sans écritures* / `--conversation-only`, alors seulement passer `WRITE_AUTH=conversation-only`. Sinon **toujours** `planning-branch`. Si multi-dépôts : un seul dépôt d'écriture pour les documents ; les autres en lecture seule.
- Après envoi CDP (ou collage), rappeler à l'opérateur le critère de succès : branche distante visible + 11 fichiers ; tant que ce n'est pas vrai, **ne pas** lancer les conversations d'orchestration Cursor.
- Ne pas hardcoder `specs/004`, le nom de branche, la date du jour, le modèle utilisé ni l'existence d'un entry point ACOS non vérifié.

## Envoi direct via CDP (défaut)

Par défaut, le mandat est **envoyé dans la session ChatGPT web déjà ouverte** via
Chrome DevTools Protocol, après un **gate d'approbation**. `--emit-prompt`
conserve l'ancien comportement (bloc copiable seul, aucun envoi).

Prérequis (détaillés dans [references/cdp-send.md](references/cdp-send.md)) :
Edge/Chrome lancé avec `--remote-debugging-port=9222` et un `--user-data-dir`
dédié, login ChatGPT fait par l'humain, conversation ouverte. Préflight :

```bash
node .ssot/skills/prepare-strategic-audit/assets/chatgpt-cdp-send.mjs doctor
```

### Séquence obligatoire

1. Écrire le mandat dans `docs/prompts/<ts>-chatgpt-web-<slug>.md` et livrer le
   bloc copiable + résumé (étape 7) — c'est ce contenu exact qui sera envoyé.
2. **GATE — s'arrêter et demander l'approbation** via la surface de choix
   structurée du client (ou attente explicite de l'opérateur). Rien n'est envoyé
   sans approbation. Ne jamais envoyer depuis un sous-agent sans autorisation
   préalable de l'opérateur.
3. Sur approbation, envoyer :

   ```bash
   node .ssot/skills/prepare-strategic-audit/assets/chatgpt-cdp-send.mjs send \
     --prompt-file docs/prompts/<ts>-chatgpt-web-<slug>.md \
     --wait-reply docs/prompts/<ts>-chatgpt-web-<slug>-output.md   # optionnel
   ```

   Résoudre le chemin du script comme les companions (projet `.ssot/skills/…`,
   puis `node_modules/@acos/core/templates/ssot/…`, puis `acosSource.path`).
4. Rapporter le code de sortie : `0` envoyé ; `2/3/6` → afficher la sortie
   `doctor` et les instructions, ne pas retenter en aveugle ; `4` envoi non
   confirmé → le texte est peut-être resté dans le composer, le dire ; `5` →
   envoi réussi mais réponse non capturée dans le délai.
5. **Stop.** Ne pas exécuter le mandat soi-même, ne pas pousser sur GitHub.

## Résultat attendu

Un seul prompt d'audit externe, indépendant, critique, précis et réalisable, possédant un périmètre connu, un contrat de preuves, une procédure de planification en vagues et un contrat de transmission vers Cursor/ACOS. Il doit permettre à ChatGPT d'exécuter la mission **sans se fier au clone local**.
