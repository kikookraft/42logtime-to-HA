# ft-logtime-mqtt

Bridge between the 42 API and MQTT that automatically publishes logtime statistics to Home Assistant, Node-RED, or any MQTT-compatible system.

## Features

* Connects to the 42 API
* Automatically fetches user logtime statistics
* Periodic MQTT publishing
* Simple deployment using Docker Compose

---

# Requirements

* Docker
* Docker Compose
* An accessible MQTT broker
* A 42 API application

---

# Installation

## 1. Clone the repository

```bash
git clone https://github.com/kikookraft/42logtime-to-HA.git
cd 42logtime-to-HA
```

---

## 2. Configure Docker Compose

Edit the `docker-compose.yml` file and replace all placeholder values with your own configuration.

Example:

```yaml
environment:
  # =========================
  # 42 API
  # =========================
  FT_CLIENT_ID: "u-s4t2ud-xxxxx"
  FT_CLIENT_SECRET: "s-s4t2ud-xxxxx"
  FT_LOGIN: "your42login"

  # =========================
  # MQTT
  # =========================
  MQTT_HOST: "192.168.1.10"
  MQTT_PORT: "1883"
  MQTT_USERNAME: "mqtt-user"
  MQTT_PASSWORD: "mqtt-password"
  MQTT_TOPIC: "42/logtime"

  # =========================
  # Update interval
  # 300000 ms = 5 minutes
  # =========================
  UPDATE_INTERVAL: "300000"
```

---

# Configuration

## 42 API Variables

| Variable           | Description              |
| ------------------ | ------------------------ |
| `FT_CLIENT_ID`     | 42 application client ID |
| `FT_CLIENT_SECRET` | 42 API client secret     |
| `FT_LOGIN`         | 42 login to monitor      |

---

## MQTT Variables

| Variable        | Description                        |
| --------------- | ---------------------------------- |
| `MQTT_HOST`     | MQTT broker IP address or hostname |
| `MQTT_PORT`     | MQTT broker port                   |
| `MQTT_USERNAME` | MQTT username                      |
| `MQTT_PASSWORD` | MQTT password                      |
| `MQTT_TOPIC`    | MQTT publish topic                 |

---

## Update Interval

| Variable          | Description                     |
| ----------------- | ------------------------------- |
| `UPDATE_INTERVAL` | Update interval in milliseconds |

Examples:

```text
300000 = 5 minutes
60000 = 1 minute
```

---

# Start the container

From the project directory:

```bash
docker compose up -d
```

---

# View logs

```bash
docker logs -f ft-logtime-mqtt
```

---

# Home Assistant

Configuration:
in your `configuration.yaml` put this:
```yaml
mqtt:
  sensor:
    # --- LOGTIME 42 ---
    - name: "42 Logtime Hours"
      unique_id: "42_logtime_hours"
      state_topic: "42/logtime"
      value_template: "{{ value_json.hours }}"
      unit_of_measurement: "h"
      icon: "mdi:clock-outline"

    - name: "42 Logtime Seconds"
      unique_id: "42_logtime_seconds"
      state_topic: "42/logtime"
      value_template: "{{ value_json.seconds }}"
      unit_of_measurement: "s"
      icon: "mdi:timer-outline"

    - name: "42 Logtime Sessions"
      unique_id: "42_logtime_sessions"
      state_topic: "42/logtime"
      value_template: "{{ value_json.sessions }}"
      icon: "mdi:counter"

    - name: "42 Logtime Updated"
      unique_id: "42_logtime_updated"
      state_topic: "42/logtime"
      value_template: "{{ value_json.updated_at }}"
      icon: "mdi:update"

    - name: "42 Monthly Logtime Hours"
      unique_id: "42_monthly_logtime_hours"
      state_topic: "42/logtime"
      value_template: "{{ value_json.monthly_hours }}"
      unit_of_measurement: "h"
      icon: "mdi:calendar-clock"

    - name: "42 Monthly Logtime Seconds"
      unique_id: "42_monthly_logtime_seconds"
      state_topic: "42/logtime"
      value_template: "{{ value_json.monthly_seconds }}"
      unit_of_measurement: "s"
      icon: "mdi:calendar-clock"

    - name: "42 Monthly Logtime Sessions"
      unique_id: "42_monthly_logtime_sessions"
      state_topic: "42/logtime"
      value_template: "{{ value_json.monthly_sessions }}"
      icon: "mdi:counter"

  binary_sensor:
    - name: "42 Logtime Active"
      unique_id: "42_logtime_active"
      state_topic: "42/logtime"
      value_template: "{{ value_json.active }}"
      payload_on: true
      payload_off: false
      device_class: connectivity
```

--- 

Advanced text display in a tile card:
create a slider entry that is the total number of hours you need to do in a month
for me hte name of the slider is `input_number.logtime_mensuel_total`

Then in a tile card, edit the text in yaml and write this:
```yaml
# Hello {{ user }}

Today: {% set h = states('sensor.42_logtime_hours') | float %} **{{ '%02dh%02d' | format(h | int, ((h % 1) * 60) | int) }}** of logtime in **{{ states('sensor.42_logtime_sessions') }}** session(s){% set month = states('sensor.42_monthly_logtime_hours') | float %}
{% set remaining = ( states('input_number.logtime_mensuel_total') | float
- month
) %} This month: **{{ '%02dh%02d' | format(month | int, ((month % 1) * 60) | int) }}** in **{{ states('sensor.42_monthly_logtime_sessions') }}** sessions (**{{ '%02dh%02d' | format(remaining | int, ((remaining % 1) * 60) | int) }}** restant)
```
