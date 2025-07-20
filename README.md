# McLaut Balance Checker Card

Custom **Lovelace card** for Home Assistant to display your **McLaut ISP account balance and details**,
based on sensors provided by the [McLaut Balance Checker](https://github.com/olexandrkucher/homeassistant-mclaut-balance-checker).

This card is designed to complement the HACS integration:
* The integration fetches your McLaut account data and creates sensors.
* This card visualizes those sensors in a clear, user-friendly dashboard panel.

---

## Features

- Displays:
  - Remaining days
  - Balance
  - Daily cost
  - Account number
  - IP address
- Highlights remaining days in color (green/orange/red) based on threshold
- Allows you to copy your Account number and IP address by clicking

---

## Installation

### Via HACS

[![Open your Home Assistant and install](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=olexandrkucher&repository=homeassistant-mclaut-balance-checker-card&category=plugin)

1. Search for **McLaut Balance Checker Card** on HACS tab in Home Assistant
2. Click on three dots and use the **Download** option
3. Reload Lovelace resources (or clear browser cache if necessary).

---

### Manual Installation (not recommended)

1. Download `mclaut-balance-checker-card.js` from this repository.
2. Place it into your Home Assistant `/config/www/` folder.
3. Add it as a resource in your `configuration.yaml`:

```yaml
frontend:
  extra_module_url:
    - /local/community/homeassistant-mclaut-balance-checker-card/mclaut-balance-checker-card.js
```
