const version = '0.0.6'

class McLautBalanceCheckerCard extends HTMLElement {
  setConfig(config) {
    this.config = config;
    this.attachShadow({ mode: "open" });

    const cardTitle = config.title || "McLaut Баланс";
    const displayName = config.display_name || config.account_name || "—";

    this.shadowRoot.innerHTML = `
      <ha-card header="${cardTitle}: ${displayName}">
        <style>
          .card-content {
            padding: 16px;
            font-family: sans-serif;
            display: grid;
            row-gap: 8px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .label {
            color: #555;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .formatable-numeric-value {
            font-weight: bold;
          }
          .value-high {
            color: #2e7d32;
          }
          .value-medium {
            color: #ff9800;
          }
          .value-low {
            color: #d32f2f;
          }
          .clickable {
            cursor: pointer;
            text-decoration: underline dotted;
          }
          .copied {
            color: green;
            animation: flash 0.8s;
          }
          @keyframes flash {
            0% { opacity: 0.2; }
            30% { opacity: 1; }
            100% { opacity: 0.2; }
          }
        </style>
        <div class="card-content">
          <div class="row mclaut-sensor">
            <span class="label">📅 Залишок (днів):</span>
            <span class="formatable-numeric-value" data-sensor="days_of_internet">—</span>
          </div>
          <div class="row mclaut-sensor">
            <span class="label">💰 Баланс:</span>
            <span data-sensor="balance" data-unit="₴">—</span>
          </div>
          <div class="row mclaut-sensor">
            <span class="label">📉 Вартість за день:</span>
            <span data-sensor="daily_cost" data-unit="₴">—</span>
          </div>
          <div class="row mclaut-sensor">
            <span class="label">👤 Рахунок:</span>
            <span class="clickable" data-sensor="account_number">—</span>
          </div>
          <div class="row mclaut-sensor">
            <span class="label">🌐 IP-адреса:</span>
            <span class="clickable" data-sensor="ip_address">—</span>
          </div>
          <!--
          <div class="row mclaut-sensor">
            <span class="label">🚀 Швидкість:</span>
            <span data-sensor="connection_speed" data-unit="MBit/s">—</span>
          </div>
          -->
        </div>
      </ha-card>
    `;

    this.setupCopy(this.shadowRoot);
  }

  set hass(hass) {
    const name = this.config.account_name;
    if (!name) {
      console.error("Account Name is required!!!");
      return;
    }

    const get = (suffix) => hass.states[`sensor.${name}_${suffix}`]?.state ?? "—";

    const rows = this.shadowRoot.querySelectorAll(".mclaut-sensor");
    rows.forEach(row => {
      const target = row.querySelector("[data-sensor]");
      if (!target) {
        console.warn("Element for showing sensor value was not found inside block with class=mclaut-sensor.");
        return;
      }

      const key = target.getAttribute("data-sensor");
      const unit = target.getAttribute("data-unit");
      if (unit) {
        target.textContent = `${get(key)} ${unit}`
      } else {
        target.textContent = `${get(key)}`;
      }
    });

    const formatNumericValues = (root) => {
      const elements = root.querySelectorAll(".formatable-numeric-value");
      elements.forEach(element => {
        const key = element.getAttribute("data-sensor");
        const value = parseFloat(get(key));
        if (!isNaN(value)) {
          let level = "value-high";
          if (value < 7) {
            level = "value-low";
          } else if (value < 14) {
            level = "value-medium";
          }
          element.classList.add(level);
        }
      });
    };
    formatNumericValues(this.shadowRoot);
  }

  setupCopy(root) {
    const elements = root.querySelectorAll(".clickable");
    elements.forEach(element => {
      const flashCopied = () => {
        element.classList.add("copied");
        setTimeout(() => element.classList.remove("copied"), 800);
      };

      element.addEventListener("click", () => {
        const value = element.textContent.trim();
        const temp = document.createElement("textarea");
        temp.value = value;
        temp.setAttribute("readonly", "");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        try {
          document.execCommand("copy");
          flashCopied();
        } catch (err) {
          console.error("Copy failed", err);
        }
        document.body.removeChild(temp);
      });
    })
  }

  getCardSize() {
    return 3;
  }

  getGridOptions() {
    return {
      rows: 4,
      columns: 12,
      min_rows: 4,
      min_columns: 7,
    };
  }

  static getConfigElement() {
    return document.createElement("mclaut-balance-checker-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:mclaut-balance-checker-card",
      account_name: "home",
      display_name: "Home",
      title: "McLaut"
    };
  }
}

console.info(
  `%c McLaut Balance Checker Card %c Version ${version} `,
  "color: white; font-weight: bold; background: blue;",
  "color: white; font-weight: bold; background: dimgray"
);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "mclaut-balance-checker-card",
  name: "McLaut Balance Checker Card",
  description: "Shows the McLaut ISP account information"
});

if (!customElements.get("mclaut-balance-checker-card")) {
  customElements.define("mclaut-balance-checker-card", McLautBalanceCheckerCard);
}


class McLautBalanceCheckerEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    this._config = { ...config };
    this.render();
  }

  render() {
    if (!this.shadowRoot) {
      return;
    }

    const hass = document.querySelector("home-assistant")?.hass;
    const allEntities = hass ? Object.keys(hass.states) : [];
    const accountSuggestions = [...new Set(
      allEntities
        .filter(e => e.startsWith("sensor.") && e.includes("_account_number"))
        .map(e => e.replace("sensor.", "").replace("_account_number", ""))
    )];

    if (!this.shadowRoot.querySelector("#editor")) {
      this.shadowRoot.innerHTML = `
        <style>
          #editor {
            font-family: sans-serif;
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 12px;
          }
          label {
            font-weight: bold;
            color: #333;
          }
          input, select {
            margin-top: 4px;
            padding: 6px 10px;
            font-size: 14px;
            border: 1px solid #ccc;
            border-radius: 6px;
            width: 100%;
            box-sizing: border-box;
          }
          .field {
            display: flex;
            flex-direction: column;
          }
        </style>
        <div id="editor">
          <div class="field">
            <label for="account">Account Name</label>
            <select id="account">
              <option value="">Select an account</option>
              ${accountSuggestions.map(name => `<option value="${name}">${name}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="display">Display Name</label>
            <input id="display" placeholder="Домашній акаунт" />
          </div>
          <div class="field">
            <label for="title">Card Title</label>
            <input id="title" placeholder="McLaut Баланс" />
          </div>
        </div>
      `;

      this.shadowRoot.getElementById("account").addEventListener("input", e => {
        this._config.account_name = e.target.value;
        this.dispatchConfigChangedEvent();
      });
      this.shadowRoot.getElementById("display").addEventListener("input", e => {
        this._config.display_name = e.target.value;
        this.dispatchConfigChangedEvent();
      });
      this.shadowRoot.getElementById("title").addEventListener("input", e => {
        this._config.title = e.target.value;
        this.dispatchConfigChangedEvent();
      });
    }

    this.shadowRoot.getElementById("account").value = this._config?.account_name || "";
    this.shadowRoot.getElementById("display").value = this._config?.display_name || "";
    this.shadowRoot.getElementById("title").value = this._config?.title || "";
  }

  dispatchConfigChangedEvent = () => {
    const event = new CustomEvent("config-changed", {
      detail: {
        config: this._config,
        error: null,
        guiModeAvailable: true
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  };
}

if (!customElements.get("mclaut-balance-checker-editor")) {
  customElements.define("mclaut-balance-checker-editor", McLautBalanceCheckerEditor);
}
