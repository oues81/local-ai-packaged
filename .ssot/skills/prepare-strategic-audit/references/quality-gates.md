# Collecte et validation du mandat d'audit

## Champs à identifier

| Champ | Question à trancher | Comportement en cas d'absence |
| --- | --- | --- |
| Dépôt cible | Quel dépôt doit être audité et où les plans sont-ils écrits ? | Utiliser le dépôt distant explicite, sinon indiquer INCONNU |
| Branche source | Quel ref distant sert de baseline ? | Branche par défaut à vérifier par l'auditeur |
| Mission métier | Quel problème utilisateur/organisation est résolu ? | Identifier les inconnues et demander à l'auditeur de les confronter au code |
| Architecture | Principaux composants, frontières et interfaces ? | Fournir seulement les chemins réellement inspectés |
| Sécurité | Quels effets réels, droits, secrets et parties tierces ? | Mettre l'investigation de confiance en priorité |
| ACOS | Quelle SSOT, quelles projections et quelle reprise ? | Détection dynamique ; ne pas inventer de chemins |
| Environnement | Clone local, worktrees, remotes, divergence ? | Signaler que l'état local n'est pas l'état GitHub |
| Écosystème | Quels voisins pertinents, quels degrés d'accès ? | Lecture seule, exclure ceux non autorisés |
| Livrables | Formats de specs, numéro courant, étapes attendues ? | Déterminer à l'exécution dans le dépôt distant |
| Autorisations (`WRITE_AUTH`) | `planning-branch` (défaut Frontier ChatGPT) ou `conversation-only` (opt-out) ? | `planning-branch` si ambigu / silence ; `conversation-only` seulement si l'opérateur l'a dit clairement |

## Règles de qualité bloquantes

1. **Pas de confusion de rôles** : préparateur local ≠ auditeur ChatGPT ≠ implémenteur Cursor.
2. **Pas de conclusion injectée** : ne transformer ni soupçon, ni recommandation personnelle, ni documentation ancienne en finding confirmé.
3. **Pas de secret** : expurger les valeurs sensibles, même présentes par erreur dans le dépôt.
4. **Pas de chemin ACOS inventé** : identifier les vrais paths et bannière de génération.
5. **Pas de références mutables comme unique preuve** : l'auditeur doit fixer le SHA et préférer les permalinks.
6. **Pas de vague parallèle fictive** : chemins disjoints, ressources communes, propriétaires et gates.
7. **Pas de faux tests** : préciser tests à demander vs tests effectivement exécutés.
8. **Pas de priorisation aplatie** : impact, vraisemblance, valeur, effort, incertitude et dépendances.
9. **Pas de déploiement implicite** : seules écritures autorisées = branche dédiée de planification (défaut). Jamais merge/`main`/code applicatif.
10. **Pas de bloc de texte vide** : tout placeholder est remplacé par une information, `À VÉRIFIER` ou une exclusion explicite.
11. **Pas d'orchestration sans pack distant** : en `planning-branch`, le mandat exige push + relecture des 11 artefacts ; le prompt Cursor doit commencer par `git fetch` + vérification, sinon STOP.

## Particularités multi-dépôts

- Décrire les liens d'intégration et les contrats, sans supposer qu'un dépôt voisin partage la même branche, la même SSOT ou le même cycle.
- Pour des worktrees intentionnellement indépendants, indiquer clairement leur dépôt, branche et propriété ; ne demander aucune harmonisation ou fusion automatique.
- Éviter d'écrire dans plusieurs dépôts pour une même mission sans mandat spécifique : retenir une seule cible de planification et définir les autres en lecture seule.

## Critères de qualité du prompt préparé

- Peut-on l'utiliser dans une nouvelle conversation sans contexte supplémentaire ?
- Le futur auditeur sait-il **quoi vérifier** plutôt que quoi croire ?
- A-t-il un mandat d'amélioration originale, pas seulement de validation ?
- Sait-il ce qu'il a le droit d'écrire et ce qui exige approbation ?
- Peut-il distinguer preuve, risque, hypothèse et proposition ?
- Sait-il comment transformer les résultats en tâches et vagues non conflictuelles ?
- Sait-il produire un véritable snippet autonome pour Cursor ?
- Peut-il constater honnêtement qu'il n'a pas pu accéder/écrire à GitHub ?
