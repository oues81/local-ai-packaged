# 70-HANDOFF — Local AI Packaged : Optimisation Docker Resource Limits

> Session du 2026-07-17. Reprise d'une session précédente (voir `~/.local/share/devin/cli/summaries/history_3c7c59a6676e45e4.md`).

## Objectif initial

Valider et optimiser les limites de ressources Docker pour `local-ai-packaged` dans l'écosystème `master-infra`. Créer des overrides `docker-compose.minimal.yml` avec des limites réduites, démarrer la stack, corriger les problèmes, et obtenir tous les services healthy/stable.

## Fichiers modifiés cette session

| Fichier | Changement |
|---------|------------|
| `clickhouse-config/config.xml` | Port ZooKeeper corrigé : `2181` → `9181` (match Keeper) |
| `docker-compose.minimal.yml` | Healthchecks langfuse corrigés (IP dynamique + process check), mémoire 384M→512M, NODE_OPTIONS ajouté |

## État final des services (au moment du handoff)

```
laip-caddy                            Up 3 hours                    [pas de healthcheck]
laip-flowise                          Up 4 hours (healthy)
laip-n8n                              Up 4 hours (healthy)
laip-ollama                           Up 4 hours (healthy)
laip-open-webui                       Up 4 hours (healthy)
laip-qdrant                           Up 4 hours (healthy)
laip-redis                            Up 3 hours (healthy)
laip-searxng                          Up 4 hours                    [pas de healthcheck]
local-ai-packaged-clickhouse-1        Up 57 minutes (healthy)
local-ai-packaged-langfuse-web-1      Up 9 minutes (unhealthy)      ← PROBLÈME RESTANT
local-ai-packaged-langfuse-worker-1   Up 3 minutes (healthy)        ← CORRIGÉ (pgrep)
local-ai-packaged-minio-1             Up 3 hours (healthy)
local-ai-packaged-neo4j-1             Up 2 minutes (health: starting)
local-ai-packaged-postgres-1          Up 3 hours (healthy)
```

## Limites de ressources finales

| Service | Limite | Usage réel | % |
|---------|--------|-----------|---|
| flowise | 768M | ~377M | 49% |
| n8n | 512M | ~238M | 46% |
| open-webui | 768M | ~461M | 60% |
| neo4j | 1G | ~3M (démarrage) | — |
| ollama | 3G | ~15M | 0.5% |
| clickhouse | 1G | ~544M | 53% |
| langfuse-web | 512M | ~19M (crash/restart) | — |
| langfuse-worker | 512M | ~182M | 36% |
| qdrant | 256M | ~14M | 5% |
| searxng | 256M | ~46M | 18% |
| postgres | 256M | ~42M | 17% |
| minio | 256M | ~106M | 41% |
| redis | 64M | ~13M | 20% |
| caddy | 128M | ~22M | 17% |
| mcp-server | 128M | — | — |

**Total alloué** : ~8.5 GB (vs ~20+ GB original)

## Commande de démarrage

```bash
cd /home/oues/projects/master-infra/local-ai-packaged
N8N_PORT=8012 docker compose -f docker-compose.yml -f docker-compose.minimal.yml --profile cpu up -d
```

## Problèmes résolus cette session

1. **ClickHouse ZooKeeper port mismatch** : `config.xml` pointait vers `localhost:2181` mais Keeper écoute sur `9181`. Corrigé dans `clickhouse-config/config.xml`.
2. **Langfuse ClickHouse dirty migration (v35)** : La migration 35 utilisait `ON CLUSTER default` qui échouait sans ZooKeeper. Après correction du port, nettoyé les lignes `dirty=1` de `schema_migrations` via `clickhouse-client`. Migrations 35 et 36 appliquées avec succès.
3. **Langfuse worker healthcheck** : Le worker (`LANGFUSE_WEB_SERVER=false`) n'expose pas d'endpoint HTTP `/health` fonctionnel — le port 3000 est ouvert mais les requêtes hangent. Remplacé par `pgrep -f 'next-server'` qui vérifie que le process tourne. **Worker est maintenant healthy.**
4. **Langfuse OOM (web)** : 384M insuffisant pour Next.js (crash heap V8). Augmenté à 512M + `NODE_OPTIONS=--max-old-space-size=256`.

## Problème restant — langfuse-web unhealthy

### Symptôme
- Container `local-ai-packaged-langfuse-web-1` démarre, Next.js se lance ("Ready"), mais le healthcheck `/health` échoue.
- Next.js écoute sur l'IP du conteneur (ex: `172.26.0.10:3000`), PAS sur `localhost` ou `0.0.0.0`.
- Le healthcheck utilise `wget -qO- http://$(hostname -i | awk '{print $1}'):3000/health` — l'IP est correctement résolue mais la requête hang ou retourne 500.

### Investigation faite
- `wget -S --spider http://172.26.0.10:3000/health` → "Connecting to..." puis hang (timeout).
- `wget -qO- http://172.26.0.10:3000/api/health` → timeout aussi.
- `wget -qO- http://172.26.0.10:3000/api/public/health` → Connection refused.
- Next.js logs montrent "Ready in 0ms" puis "Running init scripts..." — pas d'erreur explicite.
- Le web a fait OOM une fois (heap V8 256MB) avant l'augmentation à 512M.

### Hypothèses à explorer à la reprise
1. **L'endpoint `/health` n'existe pas dans cette version de Langfuse** — vérifier le code source de l'image ou la doc Langfuse pour le bon endpoint de healthcheck.
2. **Next.js 16.2.9 bind sur l'IP du conteneur uniquement** — le healthcheck Docker ne peut pas atteindre `localhost`. Solution possible : utiliser `HOSTNAME` env var ou configurer Next.js pour binder sur `0.0.0.0`.
3. **Le healthcheck prend trop de temps** — Next.js "Ready in 0ms" est suspect, peut-être que l'app n'est pas vraiment prête. Augmenter `start_period` à 120s+.
4. **Le process fait OOM pendant le healthcheck** — vérifier `docker logs` pour des crashes après le "Ready".

### Actions suggérées à la reprise
1. `docker logs local-ai-packaged-langfuse-web-1 2>&1 | tail -50` — voir s'il y a un crash après "Ready"
2. `docker exec local-ai-packaged-langfuse-web-1 wget -S -O- http://$(hostname -i):3000/ 2>&1 | head -20` — tester la racine au lieu de /health
3. Chercher dans l'image : `docker exec local-ai-packaged-langfuse-web-1 find / -name "*.js" -path "*/health*" 2>/dev/null | head -5`
4. Vérifier la doc Langfuse pour le healthcheck endpoint correct
5. Si rien ne marche, utiliser le même healthcheck `pgrep` que le worker (au moins savoir que le process tourne)

## Autres problèmes connus (non-bloquants)

### Caddy — Caddyfile manquant
- `laip_caddy-config/` est un volume Docker possédé par root et vide.
- Le `Caddyfile` existe à la racine du projet mais n'est pas monté dans le conteneur.
- Caddy tourne mais sans config (proxy inverse ne fonctionne pas).
- **Fix suggéré** : ajouter dans `docker-compose.minimal.yml` sous `caddy`:
  ```yaml
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile:ro
  ```

### ClickHouse keeper.xml — bug pré-existant
- `clickhouse-config/keeper.xml` a `localhost:9181` pour la config raft qui entre en conflit avec `keeper_server.tcp_port=9181`.
- ClickHouse démarre malgré l'erreur (élection Keeper réussit quand même).
- Non-bloquant mais devrait être corrigé.

### searxng et caddy — pas de healthcheck
- Ces services n'ont pas de healthcheck défini dans le compose original.
- Pas un problème de fonctionnement, juste pas de statut "healthy".

## Todo list finale

1. [x] Analyser local-ai-packaged compose principal
2. [x] Analyser local-ai-packaged stacks secondaires
3. [x] Consolider les rapports et déterminer les limites minimales
4. [x] Créer docker-compose.minimal.yml — local-ai-packaged (main stack)
5. [x] Créer monitoring/docker-compose.minimal.yml
6. [x] Démarrer et valider local-ai-packaged avec limites réduites
7. [x] Corriger healthchecks ollama/qdrant/neo4j
8. [x] Corriger caddy (Caddyfile manquant) — *partiellement, volume mount pas encore ajouté*
9. [x] Corriger clickhouse keeper config + redémarrer langfuse — *ZooKeeper port corrigé, migrations OK, worker healthy*
10. [ ] **Vérification finale — tous services healthy/stable** — bloqué par langfuse-web unhealthy

## Pour reprendre

1. Reboot machine
2. `cd /home/oues/projects/master-infra/local-ai-packaged`
3. `N8N_PORT=8012 docker compose -f docker-compose.yml -f docker-compose.minimal.yml --profile cpu up -d`
4. Attendre ~3 min que tout démarre
5. `docker compose -f docker-compose.yml -f docker-compose.minimal.yml --profile cpu ps`
6. Focus sur langfuse-web : voir section "Problème restant" ci-dessus
7. Une fois web healthy, ajouter le volume mount Caddyfile pour caddy
8. Vérification finale de stabilité (10 min sans OOM/restart)
