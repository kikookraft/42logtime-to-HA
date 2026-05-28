# ft-logtime-mqtt

Bridge entre l'API 42 et MQTT permettant de publier automatiquement les statistiques de logtime vers Home Assistant, Node-RED ou tout autre système compatible MQTT.

## Fonctionnalités

* Connexion à l'API 42
* Récupération automatique du logtime utilisateur
* Publication MQTT périodique
* Déploiement simple avec Docker Compose

---

# Prérequis

* Docker
* Docker Compose
* Un broker MQTT accessible
* Une application API 42

---

# Installation



---

# Configuration

## Variables API 42

| Variable           | Description                   |
| ------------------ | ----------------------------- |
| `FT_CLIENT_ID`     | Client ID de l'application 42 |
| `FT_CLIENT_SECRET` | Secret API 42                 |
| `FT_LOGIN`         | Login 42 à surveiller         |

---

## Variables MQTT

| Variable        | Description                           |
| --------------- | ------------------------------------- |
| `MQTT_HOST`     | Adresse IP ou hostname du broker MQTT |
| `MQTT_PORT`     | Port MQTT                             |
| `MQTT_USERNAME` | Utilisateur MQTT                      |
| `MQTT_PASSWORD` | Mot de passe MQTT                     |
| `MQTT_TOPIC`    | Topic de publication                  |

---

## Intervalle de mise à jour

| Variable          | Description                 |
| ----------------- | --------------------------- |
| `UPDATE_INTERVAL` | Intervalle en millisecondes |

Exemple :

```text
300000 = 5 minutes
60000 = 1 minute
```

---

# Lancement

Depuis le dossier du projet :

```bash
docker compose up -d
```

---

# Exemple d'intégration Home Assistant

Exemple de capteur MQTT :

```yaml
mqtt:
  sensor:
    - name: "42 Logtime"
      state_topic: "42/logtime"
```

---
