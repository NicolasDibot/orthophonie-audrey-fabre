# L'orthophonie au quotidien

Site de ressources et de prise de rendez-vous destiné aux patients et aux aidants d'Audrey Fabre.

Le front est prévu pour GitHub Pages. Les données modifiables passent par une API FastAPI dès que `config.js` contient l'URL du backend.

## Notes techniques

- Les contenus de ressources sont dans `data/padlet-data.js`.
- Les fichiers et images sont dans `assets/`.
- Le backend est dans `backend/`.
- Sans URL d'API dans `config.js`, le site garde un mode local de secours.
- Avec l'API, les fiches modifiées, fichiers importés, commentaires, messages de contact, validations et demandes de rendez-vous sont sauvegardés dans la base du backend.
- Les pièces jointes des rendez-vous ne sont téléchargeables qu'avec une session d'administration valide.
- En local, le backend peut utiliser SQLite.
- En production, le backend utilise Supabase/Postgres via `DATABASE_URL`.

## Backend local

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements-dev.txt
DATABASE_PATH=backend/audrey-dev.db \
ADMIN_PASSWORD='mot-de-passe-local' \
SECRET_KEY='secret-local-long-et-aleatoire' \
.venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8787
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
- `PUBLIC_BASE_URL` : URL publique de l'API, utilisée pour les fichiers importés

Tous les messages de contact sont conservés dans l'espace d'administration. Pour les envoyer aussi par courriel, ajouter ces variables SMTP dans Render :

- `SMTP_HOST` : serveur SMTP du fournisseur
- `SMTP_PORT` : `587` avec STARTTLS ou `465` avec SSL
- `SMTP_USERNAME` et `SMTP_PASSWORD` : identifiants SMTP privés
- `SMTP_FROM_EMAIL` : adresse d'expédition autorisée par le fournisseur
- `CONTACT_TO_EMAIL` : adresse destinataire des messages de contact
- `SMTP_USE_SSL` : `true` uniquement pour le port 465
- `SMTP_STARTTLS` : `true` pour le port 587

L'adresse saisie dans le formulaire est placée dans `Reply-To`, ce qui permet à Audrey Fabre de répondre directement sans usurper l'adresse de l'expéditeur.

Après déploiement de l'API, mettre son URL publique dans `config.js`, puis pousser la modification pour que GitHub Pages l'utilise.

## Vérifications

```bash
.venv/bin/ruff check backend/main.py backend/test_main.py
.venv/bin/pytest -q backend/test_main.py
.venv/bin/pip-audit -r backend/requirements.txt
deno check app.js
```

## Données de santé

L'hébergement Render/Supabase décrit ici n'est pas présenté comme certifié HDS. Les formulaires demandent donc de ne pas transmettre de compte rendu, ordonnance, pièce d'identité ou autre document médical confidentiel. Une utilisation avec des données de santé identifiantes nécessite au préalable une validation juridique, contractuelle et d'hébergement adaptée.
