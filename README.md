# Cabinet d'Orthophonie d'Audrey Fabre

Site de ressources et de prise de rendez-vous pour le Cabinet d'Orthophonie d'Audrey Fabre.

Le front est prévu pour GitHub Pages. Les données modifiables passent par une API FastAPI dès que `config.js` contient l'URL du backend.

## Notes techniques

- Les contenus de ressources sont dans `data/padlet-data.js`.
- Les fichiers et images sont dans `assets/`.
- Le backend est dans `backend/`.
- Sans URL d'API dans `config.js`, le site garde un mode local de secours.
- Avec l'API, les fiches modifiées, commentaires, validations et demandes de rendez-vous sont sauvegardés dans la base du backend.
- En local, le backend peut utiliser SQLite.
- En production, le backend utilise Supabase/Postgres via `DATABASE_URL`.

## Backend local

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
DATABASE_PATH=backend/audrey-dev.db SECRET_KEY=dev-secret .venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8787
```

Puis renseigner temporairement dans `config.js` :

```js
window.AUDREY_API_BASE_URL = "http://127.0.0.1:8787";
```

## Déploiement

Le dépôt contient `render.yaml` pour déployer l'API sur Render sans disque persistant. Variables importantes :

- `ADMIN_USERNAME` : `audrey`
- `ADMIN_PASSWORD` : mot de passe de connexion admin
- `SECRET_KEY` : secret de signature des sessions
- `CORS_ORIGINS` : origine GitHub Pages autorisée
- `DATABASE_URL` : chaîne de connexion Supabase/Postgres avec SSL

Après déploiement de l'API, mettre son URL publique dans `config.js`, puis pousser la modification pour que GitHub Pages l'utilise.
