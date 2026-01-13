const { app, BrowserWindow, BrowserView, ipcMain, Menu, shell, dialog, Notification } = require("electron")
const path = require("node:path")
const fs = require("fs")
const { locales, languageNames, f1MenuTranslations } = require("./locales")
const { autoUpdater } = require("electron-updater")

const loadedPlugins = []

const Store = require("electron-store")
let store

try {
  store = new Store()
} catch (error) {
  console.error("Error initializing electron-store:", error)
  // Fallback to basic file-based storage if electron-store fails
  store = {
    get: (key, defaultValue) => {
      try {
        const configPath = path.join(app.getPath("userData"), "config.json")
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, "utf8"))
          return config[key] !== undefined ? config[key] : defaultValue
        }
        return defaultValue
      } catch (e) {
        return defaultValue
      }
    },
    set: (key, value) => {
      try {
        const configPath = path.join(app.getPath("userData"), "config.json")
        let config = {}
        if (fs.existsSync(configPath)) {
          config = JSON.JSON.parse(fs.readFileSync(configPath, "utf8"))
        }
        config[key] = value
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      } catch (e) {
        console.error("Error saving config:", e)
      }
    },
  }
}

let mainWindow
let settingsWindow = null

async function checkForUpdates() {
  try {
    const currentVersion = "1.1.0" // Version actuelle de l'application

    // Use fetch to get the latest release from GitHub API
    const response = await fetch("https://api.github.com/repos/Zetsukae/streamix/releases/latest")
    const data = await response.json()

    if (!data.tag_name) return

    // Remove "v" prefix if present (e.g., v1.2.0 -> 1.2.0)
    const latestVersion = data.tag_name.replace(/^v/, "")

    // Compare versions
    if (latestVersion !== currentVersion) {
      // Show a native notification
      const notification = new Notification({
        title: "Mise à jour disponible",
        body: `Une nouvelle version de Streamix est disponible (v${latestVersion}). Cliquez pour télécharger.`,
        icon: path.join(__dirname, "assets", "icon.png"),
      })

      notification.on("click", () => {
        shell.openExternal(data.html_url)
      })

      notification.show()
    }
  } catch (error) {
    console.error("Erreur lors de la vérification des mises à jour:", error)
  }
}

function createWindow() {
  const preferencesPath = path.join(app.getPath("userData"), "preferences.json")
  let preferences = { windowStyle: "default", homeButtonBehavior: "menu" }

  if (fs.existsSync(preferencesPath)) {
    preferences = JSON.parse(fs.readFileSync(preferencesPath, "utf8"))
  }

  const isWindowsStyle = preferences.windowStyle === "windows"

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      devTools: true,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
    autoHideMenuBar: true,
    frame: isWindowsStyle, // Appliquer la barre native si Windows style
  })

  const configPath = path.join(app.getPath("userData"), "first-launch.json")
  let startUrl = "https://franime.fr/"

  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"))
    if (config.sourceType === "custom" && preferences.experimentalMode) {
      startUrl = config.customUrl || config.customServiceUrl || startUrl
    } else if (config.serviceUrl) {
      startUrl = config.serviceUrl
    }
  } else {
    startUrl =
      "data:text/html;charset=utf-8," +
      encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
    <title>Streamix - Setup</title>
    <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(-45deg, #6c7ce7, #a55eea, #74b9ff, #81ecec);
      background-size: 400% 400%;
      animation: gradient 20s ease infinite;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      overflow: hidden;
    }
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .wave {
      position: absolute;
      border-radius: 40%;
      background: rgba(255, 255, 255, 0.08);
      z-index: -1;
    }
    .wave1 {
      width: 800px;
      height: 825px;
      top: -20%;
      left: 30%;
      margin-left: -400px;
      margin-top: -400px;
      animation: wave1 20s infinite linear;
    }
    .wave2 {
      width: 600px;
      height: 625px;
      top: -15%;
      right: 20%;
      margin-right: -300px;
      margin-top: -300px;
      animation: wave2 25s infinite linear reverse;
    }
    .wave3 {
      width: 400px;
      height: 425px;
      bottom: -10%;
      left: 10%;
      margin-left: -200px;
      margin-bottom: -200px;
      animation: wave3 18s infinite linear;
    }
    @keyframes wave1 {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes wave2 {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes wave3 {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .container {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 15px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      max-width: 400px;
      width: 100%;
      z-index: 10;
    }
    h1 {
      font-size: 28px;
      margin-bottom: 15px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    p {
      font-size: 14px;
      margin-bottom: 30px;
      opacity: 0.9;
    }
    .service-button {
      width: 100%;
      padding: 15px 25px;
      margin-bottom: 15px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 10px;
      background: rgba(255,255,255,0.15);
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }
    .service-button:hover {
      background: rgba(255,255,255,0.25);
      border-color: rgba(255,255,255,0.5);
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }
    .service-button:active {
      transform: translateY(0);
    }
    </style>
    </head>
    <body>
    <div class="wave wave1"></div>
    <div class="wave wave2"></div>
    <div class="wave wave3"></div>
    <div class="container">
    <h1>Bienvenue sur Streamix</h1>
    <p>Choisissez votre service de streaming préféré</p>

    <button class="service-button" onclick="selectService('franime')">
    Franime
    </button>

    <button class="service-button" onclick="selectService('animesama')">
    Anime Sama
    </button>

    <button class="service-button" onclick="selectService('voiranime')">
    Voiranime
    </button>
    </div>

    <script>
    function selectService(service) {
      let serviceUrl = 'https://franime.fr/';

      if (service === 'animesama') {
        serviceUrl = 'https://anime-sama.pw/';
      } else if (service === 'voiranime') {
        serviceUrl = 'https://v6.voiranime.com/';
      }

      window.electronAPI.selectService({ serviceUrl });
    }
    </script>
    </body>
    </html>
    `)
  }

  mainWindow.loadURL(startUrl)

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()

    const configPath = path.join(app.getPath("userData"), "first-launch.json")
    if (!fs.existsSync(configPath)) {
      // Removed setTimeout and call to showServiceSelection()
    }
  })

  mainWindow.webContents.on("did-navigate", (event, url) => {
    // trackHistory(url)
  })

  mainWindow.webContents.on("did-finish-load", () => {
    const currentUrl = mainWindow.webContents.getURL()
    if (currentUrl.startsWith("data:text/html")) {
      return // Don't inject buttons on the welcome screen
    }

    const config = store.get("config", {})
    const currentService = config.service || "franime"
    const isAnimeSama = currentUrl.includes("anime-sama.pw")
    const isVoirAnime = currentUrl.includes("voiranime.com")
    const isCustomUrl = config.sourceType === "custom" && config.customServiceUrl

    if ((currentService === "animesama" || isAnimeSama || isCustomUrl) && !isVoirAnime) {
      mainWindow.webContents
        .executeJavaScript(
          `
        const observer = new MutationObserver(() => {
          const header = document.querySelector('header, nav, .header, .navbar');
          if (header) {
            observer.disconnect();
            setTimeout(() => {
              injectButtons();
            }, 800);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        setTimeout(() => {
          observer.disconnect();
          injectButtons();
        }, 3000);

        function injectButtons() {
          if (!document.getElementById('window-controls')) {
            const controls = document.createElement('div');
            controls.id = 'window-controls';
            controls.innerHTML = \`
            <button id="minimize-btn">−</button>
            <button id="close-btn">×</button>
            \`;
            document.body.appendChild(controls);

            document.getElementById('minimize-btn').onclick = () => {
              if(window.electronAPI) window.electronAPI.minimizeWindow();
            };

              document.getElementById('close-btn').onclick = () => {
                if(window.electronAPI) window.electronAPI.closeWindow();
              };
          }
        }

        if (!document.getElementById('streamix-home-btn')) {
          const homeBtn = document.createElement('button');
          homeBtn.id = 'streamix-home-btn';
          homeBtn.innerHTML = '<img src="https://i.imgur.com/lv3zp1J.png" alt="Home" style="width: 30px; height: 30px;">';
          homeBtn.onclick = () => {
            if(window.electronAPI) window.electronAPI.triggerF1Menu();
          };
            document.body.appendChild(homeBtn);

            if (window.location.hostname.includes('anime-sama')) {
              function adjustButtonPosition() {
                const header = document.querySelector('header, nav, .header, .navbar');
                const homeBtn = document.getElementById('streamix-home-btn');
                const controls = document.getElementById('window-controls');

                if (header && homeBtn && controls) {
                  const headerRect = header.getBoundingClientRect();
                  const isHeaderVisible = headerRect.top >= 0 && headerRect.bottom > 0;

                  if (isHeaderVisible) {
                    homeBtn.style.top = (headerRect.bottom + 10) + 'px';
                    controls.style.top = (headerRect.bottom + 10) + 'px';
                  } else {
                    homeBtn.style.top = '20px';
                    controls.style.top = '20px';
                  }
                }
              }

              const observer = new MutationObserver(adjustButtonPosition);
              observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true
              });

              window.addEventListener('scroll', adjustButtonPosition);
              window.addEventListener('resize', adjustButtonPosition);

              adjustButtonPosition();
            }
        }
        `,
          true,
        )
        .catch(console.error)
    } else {
      mainWindow.webContents
        .executeJavaScript(
          `
        if (!document.getElementById('window-controls')) {
          const controls = document.createElement('div');
          controls.id = 'window-controls';
          controls.innerHTML = \`
          <button id="minimize-btn">−</button>
          <button id="close-btn">×</button>
          \`;
          document.body.appendChild(controls);

          document.getElementById('minimize-btn').onclick = () => {
            if(window.electronAPI) window.electronAPI.minimizeWindow();
          };

            document.getElementById('close-btn').onclick = () => {
              if(window.electronAPI) window.electronAPI.closeWindow();
            };
        }

        if (!document.getElementById('streamix-home-btn')) {
          const homeBtn = document.createElement('button');
          homeBtn.id = 'streamix-home-btn';
          homeBtn.innerHTML = '<img src="https://i.imgur.com/lv3zp1J.png" alt="Home" style="width: 30px; height: 30px;">';
          homeBtn.onclick = () => {
            if(window.electronAPI) window.electronAPI.triggerF1Menu();
          };
            document.body.appendChild(homeBtn);
        }
        `,
          true,
        )
        .catch(console.error)
    }
  })

  mainWindow.webContents.on("dom-ready", () => {
    const stylePath = path.join(__dirname, "assets", "style.css")
    if (fs.existsSync(stylePath)) {
      const baseStyle = fs.readFileSync(stylePath, "utf8")
      mainWindow.webContents.insertCSS(baseStyle)
    }

    const currentUrl = mainWindow.webContents.getURL()
    if (currentUrl.startsWith("data:text/html")) return

    const showSearchBtn = currentUrl.includes("franime.fr")

    const preferencesPath = path.join(app.getPath("userData"), "preferences.json")
    let preferences = { windowStyle: "default" }
    if (fs.existsSync(preferencesPath)) {
      preferences = JSON.parse(fs.readFileSync(preferencesPath, "utf8"))
    }
    const isWindowsStyle = preferences.windowStyle === "windows"

    mainWindow.webContents
      .executeJavaScript(`
      if (window.location.hostname.includes('anime-sama')) {
        document.body.setAttribute('data-anime-sama', 'true');
      }

      if (${showSearchBtn} && !document.getElementById('streamix-search-btn')) {
        const searchBtn = document.createElement('button');
        searchBtn.id = 'streamix-search-btn';
        searchBtn.innerHTML = '<img src="https://i.imgur.com/Jnp4gxM.png" alt="Search" style="width: 25px; height: 25px;">';
        searchBtn.onclick = () => window.location.href = 'https://franime.fr/recherche';
        document.body.appendChild(searchBtn);
      }

      if (!document.getElementById('streamix-home-btn')) {
        const homeBtn = document.createElement('button');
        homeBtn.id = 'streamix-home-btn';
        homeBtn.innerHTML = '<img src="https://i.imgur.com/lv3zp1J.png" alt="Home" style="width: 30px; height: 30px;">';
        homeBtn.onclick = () => {
          if(window.electronAPI) window.electronAPI.triggerF1Menu();
        };
          document.body.appendChild(homeBtn);

          if (window.location.hostname.includes('anime-sama')) {
            function adjustButtonPosition() {
              const header = document.querySelector('header, nav, .header, .navbar');
              const homeBtn = document.getElementById('streamix-home-btn');
              const controls = document.getElementById('window-controls');

              if (header && homeBtn && controls) {
                const headerRect = header.getBoundingClientRect();
                const isHeaderVisible = headerRect.top >= 0 && headerRect.bottom > 0;

                if (isHeaderVisible) {
                  homeBtn.style.top = (headerRect.bottom + 10) + 'px';
                  controls.style.top = (headerRect.bottom + 10) + 'px';
                } else {
                  homeBtn.style.top = '20px';
                  controls.style.top = '10px';
                }
              }
            }

            setTimeout(adjustButtonPosition, 2000);
            const observer = new MutationObserver(adjustButtonPosition);
            observer.observe(document.body, { childList: true, subtree: true });
            window.addEventListener('scroll', adjustButtonPosition);
            window.addEventListener('resize', adjustButtonPosition);
            window.addEventListener('load', adjustButtonPosition);
          }
      }

      if (!document.getElementById('window-controls')) {
        const controls = document.createElement('div');
        controls.id = 'window-controls';

        const isVoiranime = window.location.href.includes('voiranime.com');
        const bgColor = isVoiranime ? 'rgba(0,0,0,0.5)' : 'transparent';

        const isWindowsStyle = ${isWindowsStyle};
        const displayStyle = isWindowsStyle ? 'none' : 'flex';

        const minimizeBtn = document.createElement('button');
        minimizeBtn.id = 'minimize-btn';
        minimizeBtn.textContent = '-';
        minimizeBtn.style.cssText = \`width: 32px !important; height: 32px !important; border: none !important; border-radius: 8px !important; cursor: pointer !important; font-size: 16px !important; font-weight: bold !important; transition: all 0.3s ease !important; display: \${displayStyle} !important; align-items: center !important; justify-content: center !important; background: \${bgColor} !important; color: #ffffff !important; backdrop-filter: blur(10px) !important; z-index: 99999 !important;\`;
        minimizeBtn.onclick = () => {
          if(window.electronAPI) window.electronAPI.minimize();
        };

          const closeBtn = document.createElement('button');
          closeBtn.id = 'close-btn';
          closeBtn.textContent = 'X';
          closeBtn.style.cssText = \`width: 32px !important; height: 32px !important; border: none !important; border-radius: 8px !important; cursor: pointer !important; font-size: 16px !important; font-weight: bold !important; transition: all 0.3s ease !important; display: \${displayStyle} !important; align-items: center !important; justify-content: center !important; background: \${bgColor} !important; color: #ffffff !important; backdrop-filter: blur(10px) !important; z-index: 99999 !important;\`;
          closeBtn.onclick = () => {
            if(window.electronAPI) window.electronAPI.close();
          };

            controls.style.cssText = 'position: fixed !important; top: 10px !important; right: 10px !important; z-index: 99999 !important; display: \${displayStyle} !important; gap: 5px !important;';
            controls.appendChild(minimizeBtn);
            controls.appendChild(closeBtn);
            document.body.appendChild(controls);
      }

      if (!document.getElementById('drag-zone')) {
        const dragZone = document.createElement('div');
        dragZone.id = 'drag-zone';
        document.body.appendChild(dragZone);
      }
      `)
      .catch((err) => console.error("Erreur DOM injection:", err))
  })

  mainWindow.webContents.on("page-title-updated", (event, title) => {
    mainWindow.setTitle("Streamix")
  })

  mainWindow.on("closed", () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const urlObj = new URL(url)
    if (
      urlObj.hostname === "franime.fr" ||
      urlObj.hostname.endsWith(".franime.fr") ||
      urlObj.hostname.includes("anime-sama") ||
      urlObj.hostname === "v6.voiranime.com" ||
      urlObj.hostname.endsWith(".voiranime.com") ||
      urlObj.hostname.includes("discord.com") ||
      urlObj.hostname.includes("discordapp.com") ||
      urlObj.hostname.includes("google.com") ||
      urlObj.hostname.includes("googleapis.com") ||
      urlObj.hostname.includes("accounts.google.com")
    ) {
      // Navigate in the same window instead of opening a new one
      mainWindow.loadURL(url)
      return { action: "deny" }
    }
    shell.openExternal(url)
    return { action: "deny" }
  })

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const urlObj = new URL(url)

    if (url === "streamix://minimize") {
      event.preventDefault()
      mainWindow.minimize()
      return
    }
    if (url === "streamix://close") {
      event.preventDefault()
      mainWindow.close()
      return
    }

    if (
      urlObj.hostname === "franime.fr" ||
      urlObj.hostname.endsWith(".franime.fr") ||
      urlObj.hostname.includes("anime-sama") ||
      urlObj.hostname === "v6.voiranime.com" ||
      urlObj.hostname.endsWith(".voiranime.com") ||
      urlObj.hostname.includes("discord.com") ||
      urlObj.hostname.includes("discordapp.com") ||
      urlObj.hostname.includes("google.com") ||
      urlObj.hostname.includes("googleapis.com") ||
      urlObj.hostname.includes("accounts.google.com")
    ) {
      // Allow navigation within the app
      return
    }
    event.preventDefault()
    shell.openExternal(url)
  })

  // The F1 key event handler from the updates has been integrated here.
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.control === false && input.shift === false && input.alt === false && input.meta === false) {
      if (input.key.toLowerCase() === "f1") {
        event.preventDefault()
        const config = store.get("config", {})
        const currentLang = config.language || "fr"
        const menuTexts = (f1MenuTranslations && f1MenuTranslations[currentLang]) || {
          home: "Accueil",
          refresh: "Actualiser",
          previous: "Précédent",
          next: "Suivant",
          settings: "Paramètres",
          quit: "Quitter",
        }

        mainWindow.webContents
          .executeJavaScript(
            `
          try {
            if (!window.openSettings) {
              window.openSettings = async () => {
                await window.electronAPI.openSettings();
              };
            }

            let menu = document.getElementById('custom-menu');
            if (menu) {
              if (menu.style.display === 'none') {
                menu.style.display = 'block';
              } else {
                menu.style.display = 'none';
              }
            } else {
              menu = document.createElement('div');
              menu.id = 'custom-menu';
              menu.style.cssText = 'position:fixed;top:60px;left:20px;z-index:10002;background:rgba(30,30,30,0.95);backdrop-filter:blur(15px);border:1px solid #333;border-radius:8px;padding:8px 0;min-width:150px;box-shadow:0 8px 25px rgba(0,0,0,0.3);';

              const currentUrl = window.location.href;
              let homeUrl = 'https://franime.fr/';
              if (currentUrl.includes('anime-sama.pw')) {
                homeUrl = 'https://anime-sama.pw/';
              } else if (currentUrl.includes('voiranime.com')) {
                homeUrl = 'https://v6.voiranime.com/';
              }

              const items = [
                {text: '${menuTexts.home}', action: () => { window.location.href = homeUrl; }},
                {text: '${menuTexts.refresh}', action: () => { window.location.reload(); }},
                {text: '${menuTexts.previous}', action: () => { window.history.back(); }},
                {text: '${menuTexts.next}', action: () => { window.history.forward(); }},
                {separator: true},
                {text: '${menuTexts.settings}', action: () => { window.openSettings(); }}
              ];

              items.forEach(item => {
                if (item.separator) {
                  const separator = document.createElement('div');
                  separator.style.cssText = 'height:1px;background:#444;margin:4px 8px;';
                  menu.appendChild(separator);
                } else {
                  const button = document.createElement('button');
                  button.textContent = item.text;
                  button.style.cssText = 'display:block;width:100%;text-align:left;padding:10px 16px;background:none;border:none;color:#e0e0e0;font-size:14px;cursor:pointer;transition:background 0.2s;';
                  button.onmouseover = () => button.style.background = 'rgba(255,255,255,0.1)';
                  button.onmouseout = () => button.style.background = 'none';
                  button.onclick = () => {
                    item.action();
                    menu.style.display = 'none';
                  };
                  menu.appendChild(button);
                }
              });

              document.body.appendChild(menu);

              setTimeout(() => {
                document.addEventListener('click', function closeMenu(e) {
                  if (!menu.contains(e.target)) {
                    menu.style.display = 'none';
                    document.removeEventListener('click', closeMenu);
                  }
                }, {once: false});
              }, 100);
            }
          } catch(error) {
            console.error('[v0] Error creating F1 menu:', error);
          }
        `,
          )
          .catch((err) => {
            console.error("Error executing F1 menu:", err)
          })
      }
      if (input.key.toLowerCase() === "f3") {
        event.preventDefault()
        // Removed call to showServiceSelection(true)
      }
    }
  })
}

// Function to create the application menu
function createApplicationMenu() {
  const menuTemplate = [
    {
      label: "Fichier",
      submenu: [
        { label: "Paramètres", click: () => ipcMain.invoke("open-settings") },
        { type: "separator" },
        { label: "Quitter", role: "quit" },
      ],
    },
    {
      label: "Édition",
      submenu: [
        { label: "Annuler", role: "undo" },
        { label: "Rétablir", role: "redo" },
        { type: "separator" },
        { label: "Couper", role: "cut" },
        { label: "Copier", role: "copy" },
        { label: "Coller", role: "paste" },
      ],
    },
    {
      label: "Affichage",
      submenu: [
        { label: "Recharger", role: "reload" },
        { label: "Outils de développement", role: "toggleDevTools" },
      ],
    },
    {
      label: "Fenêtre",
      submenu: [
        { label: "Minimiser", click: () => ipcMain.invoke("minimize-window") },
        { label: "Fermer", click: () => ipcMain.invoke("close-window") },
      ],
    },
    {
      label: "Aide",
      submenu: [
        {
          label: "Documentation",
          click: async () => {
            await shell.openExternal("https://github.com/Zetsukae/streamix")
          },
        },
        {
          label: "Rapporter un bug",
          click: async () => {
            await shell.openExternal("https://github.com/Zetsukae/streamix/issues")
          },
        },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))
}

function loadPlugins() {
  const preferencesPath = path.join(app.getPath("userData"), "preferences.json")
  let preferences = { plugins: [] }

  if (fs.existsSync(preferencesPath)) {
    preferences = JSON.parse(fs.readFileSync(preferencesPath, "utf8"))
  }

  if (!preferences.plugins || preferences.plugins.length === 0) {
    return
  }

  loadedPlugins.length = 0

  preferences.plugins.forEach((plugin) => {
    if (!plugin.enabled) return

    try {
      console.log(`[Plugin] Loading plugin: ${plugin.name}`)

      // Read and execute plugin file
      const pluginCode = fs.readFileSync(plugin.path, "utf8")

      // Create a safe context for the plugin
      const pluginContext = {
        app,
        mainWindow: () => mainWindow,
        ipcMain,
        console,
        path,
        fs,
      }

      // Execute plugin in a function scope
      const pluginFunction = new Function(...Object.keys(pluginContext), pluginCode)
      pluginFunction(...Object.values(pluginContext))

      loadedPlugins.push({ ...plugin, loaded: true })
      console.log(`[Plugin] Successfully loaded: ${plugin.name}`)
    } catch (error) {
      console.error(`[Plugin] Failed to load ${plugin.name}:`, error)
      loadedPlugins.push({ ...plugin, loaded: false, error: error.message })
    }
  })
}

async function initializeApp() {
  // Removed direct import of electron-store and initialization of store here
  // const StoreModule = await import("electron-store")
  // const Store = StoreModule.default
  // store = new Store() // Store is now initialized directly

  createWindow()
  Menu.setApplicationMenu(null)

  loadPlugins()

  setTimeout(() => {
    checkForUpdates()
  }, 3000) // Attendre 3 secondes après le démarrage

  ipcMain.handle("select-service", async (event, config) => {
    const configPath = path.join(app.getPath("userData"), "first-launch.json")
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close()
    }

    setTimeout(() => {
      app.relaunch()
      app.exit(0)
    }, 300)

    return true
  })

  ipcMain.handle("minimize-window", () => {
    mainWindow.minimize()
  })

  ipcMain.handle("close-window", () => {
    mainWindow.close()
  })

  ipcMain.handle("show-dialog", (event, title, message) => {
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: title,
      message: title,
      detail: message,
      buttons: ["OK"],
    })
  })

  // Updated to use same compact style as triggerF1Menu
  ipcMain.handle("trigger-f1-menu", async (event) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return
    }

    const preferencesPath = path.join(app.getPath("userData"), "preferences.json")
    let preferences = { homeButtonBehavior: "menu" }

    if (fs.existsSync(preferencesPath)) {
      preferences = JSON.parse(fs.readFileSync(preferencesPath, "utf8"))
    }

    if (preferences.homeButtonBehavior === "home") {
      const configPath = path.join(app.getPath("userData"), "first-launch.json")
      let homeUrl = "https://franime.fr/"

      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"))
        if (config.serviceUrl) {
          homeUrl = config.serviceUrl
        } else if (config.customUrl) {
          homeUrl = config.customUrl
        } else if (config.customServiceUrl) {
          homeUrl = config.customServiceUrl
        }
      }

      mainWindow.loadURL(homeUrl)
      return
    }

    try {
      await mainWindow.webContents.executeJavaScript(`
      (function() {
        try {
          if (!window.openSettings) {
            window.openSettings = async () => {
              await window.electronAPI.openSettings();
            };
          }

          let menu = document.getElementById('custom-menu');
          if (menu) {
            if (menu.style.display === 'none') {
              menu.style.display = 'block';
            } else {
              menu.style.display = 'none';
            }
          } else {
            menu = document.createElement('div');
            menu.id = 'custom-menu';
            menu.style.cssText = 'position:fixed;top:60px;left:20px;z-index:10002;background:rgba(30,30,30,0.95);backdrop-filter:blur(15px);border:1px solid #333;border-radius:8px;padding:8px 0;min-width:150px;box-shadow:0 8px 25px rgba(0,0,0,0.3);';

            const currentUrl = window.location.href;
            let homeUrl = 'https://franime.fr/';
            if (currentUrl.includes('anime-sama.pw')) {
              homeUrl = 'https://anime-sama.pw/';
            } else if (currentUrl.includes('voiranime.com')) {
              homeUrl = 'https://v6.voiranime.com/';
            }

            const items = [
              {text: 'Accueil', action: function() { window.location.href = homeUrl; }},
       {text: 'Actualiser', action: function() { window.location.reload(); }},
       {text: 'Précédent', action: function() { window.history.back(); }},
       {text: 'Suivant', action: function() { window.history.forward(); }},
       {separator: true},
       {text: 'Paramètres', action: function() { window.openSettings(); }}
            ];

            items.forEach(item => {
              if (item.separator) {
                const separator = document.createElement('div');
                separator.style.cssText = 'height:1px;background:#444;margin:4px 8px;';
                menu.appendChild(separator);
              } else {
                const button = document.createElement('button');
                button.textContent = item.text;
                button.style.cssText = 'display:block;width:100%;text-align:left;padding:10px 16px;background:none;border:none;color:#e0e0e0;font-size:14px;cursor:pointer;transition:background 0.2s;';
                button.onmouseover = () => button.style.background = 'rgba(255,255,255,0.1)';
                button.onmouseout = () => button.style.background = 'none';
                button.onclick = () => {
                  item.action();
                  menu.style.display = 'none';
                };
                menu.appendChild(button);
              }
            });

            document.body.appendChild(menu);
          }
          return true;
        } catch (error) {
          console.error('[Menu] Error:', error);
          return false;
        }
      })();
      `)
    } catch (error) {
      console.error("[Main] Failed to execute F1 menu script:", error)
    }
  })

  // The triggerF1Menu handler from the updates has been integrated here.
  ipcMain.handle("triggerF1Menu", () => {
    const config = store.get("config", {})
    const currentLang = config.language || "fr"
    const menuTexts = f1MenuTranslations[currentLang]

    mainWindow.webContents
      .executeJavaScript(`
    (function() {
      try {
        if (!window.openSettings) {
          window.openSettings = async () => {
            await window.electronAPI.openSettings();
          };
        }

        let menu = document.getElementById('custom-menu');
        if (menu) {
          if (menu.style.display === 'none') {
            menu.style.display = 'block';
          } else {
            menu.style.display = 'none';
          }
        } else {
          menu = document.createElement('div');
          menu.id = 'custom-menu';
          menu.style.cssText = 'position:fixed;top:60px;left:20px;z-index:10002;background:rgba(30,30,30,0.95);backdrop-filter:blur(15px);border:1px solid #333;border-radius:8px;padding:8px 0;min-width:150px;box-shadow:0 8px 25px rgba(0,0,0,0.3);';

          const currentUrl = window.location.href;
          let homeUrl = 'https://franime.fr/';
          if (currentUrl.includes('anime-sama.pw')) {
            homeUrl = 'https://anime-sama.pw/';
          } else if (currentUrl.includes('voiranime.com')) {
            homeUrl = 'https://v6.voiranime.com/';
          }

          const items = [
            {text: 'Accueil', action: function() { window.location.href = homeUrl; }},
     {text: 'Actualiser', action: function() { window.location.reload(); }},
     {text: 'Précédent', action: function() { window.history.back(); }},
     {text: 'Suivant', action: function() { window.history.forward(); }},
     {separator: true},
     {text: 'Paramètres', action: function() { window.openSettings(); }}
          ];

          items.forEach(item => {
            if (item.separator) {
              const separator = document.createElement('div');
              separator.style.cssText = 'height:1px;background:#444;margin:4px 8px;';
              menu.appendChild(separator);
            } else {
              const button = document.createElement('button');
              button.textContent = item.text;
              button.style.cssText = 'display:block;width:100%;text-align:left;padding:10px 16px;background:none;border:none;color:#e0e0e0;font-size:14px;cursor:pointer;transition:background 0.2s;';
              button.onmouseover = () => button.style.background = 'rgba(255,255,255,0.1)';
              button.onmouseout = () => button.style.background = 'none';
              button.onclick = () => {
                item.action();
                menu.style.display = 'none';
              };
              menu.appendChild(button);
            }
          });

          document.body.appendChild(menu);
        }
        return true;
      } catch (error) {
        console.error('[Menu] Error:', error);
        return false;
      }
    })();
    `)
      .catch(console.error)
  })

  ipcMain.handle("open-settings", async (event) => {
    if (settingsWindow) {
      settingsWindow.focus()
      return
    }

    const config = store.get("config", {})
    const currentLang = config.language || "fr"
    const t = locales[currentLang]

    const preferencesPath = path.join(app.getPath("userData"), "preferences.json")
    let preferences = { windowStyle: "default", homeButtonBehavior: "menu", plugins: [] }
    if (fs.existsSync(preferencesPath)) {
      preferences = JSON.parse(fs.readFileSync(preferencesPath, "utf8"))
    }

    if (!preferences.plugins) {
      preferences.plugins = []
    }

    const currentHomeButtonBehavior = preferences.homeButtonBehavior || "menu"

    settingsWindow = new BrowserWindow({
      width: 900,
      height: 700,
      resizable: false,
      parent: mainWindow,
      modal: true,
      show: false,
      frame: false,
      backgroundColor: "#0a0a0a",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
      },
    })

    const currentService = config.service || "franime"
    const currentWindowStyle = config.windowStyle || "default"
    const sourceType = config.sourceType || "service"
    const customUrl = config.customServiceUrl || ""
    const experimentalEnabled = config.experimentalEnabled || false

    settingsWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8">
        <title>${t.settingsTitle}</title>
        <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #0a0a0a;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0;
          overflow: hidden;
        }

        .settings-container {
          background: #111;
          width: 100%;
          max-width: 900px;
          height: 700px;
          display: flex;
          overflow: hidden;
          border: 1px solid #222;
        }

        .sidebar {
          width: 220px;
          background: #0a0a0a;
          padding: 30px 0;
          border-right: 1px solid #1a1a1a;
        }

        .sidebar-item {
          padding: 14px 24px;
          color: #666;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 13px;
          font-weight: 500;
          border-left: 2px solid transparent;
          letter-spacing: 0.3px;
        }

        .sidebar-item:hover {
          background: rgba(255,255,255,0.02);
          color: #999;
        }

        .sidebar-item.active {
          background: rgba(220, 38, 38, 0.08);
          color: #dc2626;
          border-left-color: #dc2626;
        }

        .content {
          flex: 1;
          padding: 40px 40px 100px 40px;
          overflow-y: auto;
          position: relative;
          background: #111;
        }

        .section {
          display: none;
        }

        .section.active {
          display: block;
        }

        .section-title {
          font-size: 22px;
          color: #fff;
          margin-bottom: 32px;
          font-weight: 600;
          letter-spacing: -0.5px;
        }

        .setting-group {
          margin-bottom: 28px;
        }

        .setting-label {
          display: block;
          color: #aaa;
          margin-bottom: 10px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.2px;
        }

        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .radio-option {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: #1a1a1a;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1.5px solid transparent;
        }

        .radio-option:hover {
          background: #1f1f1f;
          border-color: #2a2a2a;
        }

        .radio-option.selected {
          background: rgba(220, 38, 38, 0.08);
          border-color: #dc2626;
        }

        .radio-option input[type="radio"] {
          margin-right: 12px;
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #dc2626;
        }

        .radio-option label {
          color: #ddd;
          cursor: pointer;
          flex: 1;
          font-size: 13px;
        }

        select {
          width: 100%;
          padding: 12px 14px;
          background: #1a1a1a;
          border: 1.5px solid #2a2a2a;
          border-radius: 12px;
          color: #fff;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        select:hover {
          border-color: #dc2626;
          background: #1f1f1f;
        }

        select:focus {
          outline: none;
          border-color: #dc2626;
          background: #1f1f1f;
        }

        option {
          background: #1a1a1a;
          color: #fff;
        }

        input[type="text"] {
          width: 100%;
          padding: 12px 14px;
          background: #1a1a1a;
          border: 1.5px solid #2a2a2a;
          border-radius: 12px;
          color: #fff;
          font-size: 13px;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        input[type="text"]:hover {
          border-color: #3a3a3a;
        }

        input[type="text"]:focus {
          outline: none;
          border-color: #dc2626;
          background: #1f1f1f;
        }

        input[type="text"]::placeholder {
          color: #555;
        }

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin-right: 12px;
          cursor: pointer;
          accent-color: #dc2626;
        }

        .checkbox-option {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: #1a1a1a;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1.5px solid transparent;
        }

        .checkbox-option:hover {
          background: #1f1f1f;
          border-color: #2a2a2a;
        }

        .checkbox-option label {
          color: #ddd;
          cursor: pointer;
          font-size: 13px;
        }

        .warning {
          display: flex;
          align-items: flex-start;
          padding: 14px 16px;
          background: rgba(234, 179, 8, 0.06);
          border-left: 2px solid #eab308;
          border-radius: 12px;
          margin-top: 10px;
        }

        .warning-content {
          flex: 1;
        }

        .warning p {
          color: #fbbf24;
          font-size: 12px;
          margin-bottom: 6px;
          line-height: 1.5;
        }

        .warning p strong {
          color: #fcd34d;
          font-weight: 600;
        }

        .warning ul {
          list-style: none;
          padding-left: 0;
        }

        .warning li {
          color: #fde68a;
          font-size: 11px;
          margin-bottom: 4px;
          padding-left: 16px;
          position: relative;
          line-height: 1.4;
        }

        .warning li:before {
          content: "•";
          position: absolute;
          left: 0;
          color: #eab308;
        }

        .actions {
          position: fixed;
          bottom: 0;
          left: 220px;
          right: 0;
          padding: 18px 40px;
          background: #0a0a0a;
          border-top: 1px solid #1a1a1a;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          z-index: 100;
        }

        .btn-primary, .btn-secondary, .btn-danger {
          padding: 11px 24px;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          letter-spacing: 0.2px;
        }

        .btn-primary {
          background: #dc2626;
          color: white;
        }

        .btn-primary:hover {
          background: #b91c1c;
        }

        .btn-primary:active {
          transform: scale(0.98);
        }

        .btn-secondary {
          background: #1a1a1a;
          color: #aaa;
          border: 1.5px solid #2a2a2a;
        }

        .btn-secondary:hover {
          background: #222;
          border-color: #3a3a3a;
          color: #ccc;
        }

        .btn-secondary:active {
          transform: scale(0.98);
        }

        .btn-danger {
          background: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background: #b91c1c;
        }

        .btn-danger:active {
          transform: scale(0.98);
        }

        .about-content {
          color: #aaa;
        }

        .version {
          font-size: 16px;
          color: #dc2626;
          font-weight: 600;
          margin-bottom: 28px;
        }

        .about-section {
          margin-bottom: 24px;
          padding: 18px;
          background: #1a1a1a;
          border-radius: 12px;
          border: 1px solid #222;
        }

        .about-section h3 {
          color: #fff;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 600;
        }

        .about-section p {
          color: #999;
          line-height: 1.6;
          font-size: 13px;
        }

        .services-list {
          list-style: none;
          padding: 0;
        }

        .services-list li {
          padding: 10px 14px;
          background: rgba(220, 38, 38, 0.06);
          border-radius: 10px;
          margin-bottom: 6px;
          color: #ccc;
          font-size: 13px;
          border: 1px solid rgba(220, 38, 38, 0.15);
        }

        .links {
          display: flex;
          gap: 10px;
        }

        .link-btn {
          padding: 10px 18px;
          background: rgba(220, 38, 38, 0.08);
          border: 1.5px solid #dc2626;
          border-radius: 12px;
          color: #dc2626;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s ease;
          display: inline-block;
        }

        .link-btn:hover {
          background: rgba(220, 38, 38, 0.15);
        }

        .link-btn:active {
          transform: scale(0.98);
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #111;
        }

        ::-webkit-scrollbar-thumb {
          background: #dc2626;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #b91c1c;
        }

        .hidden {
          display: none !important;
        }

        .plugin-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .plugin-info {
          flex: 1;
        }

        .plugin-name {
          color: #e0e0e0;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .plugin-path {
          color: #888;
          font-size: 12px;
          font-family: monospace;
        }

        .btn-danger-small {
          padding: 6px 12px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-danger-small:hover {
          background: #b91c1c;
        }

        </style>
        </head>
        <body>
        <div class="settings-container">
        <div class="sidebar">
        <div class="sidebar-item active" data-section="general">${t.general}</div>
        <div class="sidebar-item" data-section="customization">${t.customization}</div>
        <div class="sidebar-item" data-section="plugins">${t.pluginsTitle}</div>
        <div class="sidebar-item" data-section="developer">${t.developerOptions}</div>
        <div class="sidebar-item" data-section="about">${t.about}</div>
        </div>

        <div class="content">
        <div class="section active" id="general">
        <h2 class="section-title">${t.generalSettings}</h2>

        <div class="setting-group">
        <label class="setting-label">${t.language}</label>
        <select id="language-select">
        ${Object.entries(languageNames)
          .map(([code, name]) => `<option value="${code}" ${code === currentLang ? "selected" : ""}>${name}</option>`)
          .join("")}
          </select>
          </div>

          <div class="setting-group" id="source-type-group" ${!experimentalEnabled ? 'style="display: none;"' : ""}>
          <label class="setting-label">${t.sourceType}</label>
          <div class="radio-group">
          <div class="radio-option ${sourceType === "service" ? "selected" : ""}">
          <input type="radio" name="sourceType" value="service" id="source-service" ${sourceType === "service" ? "checked" : ""}>
          <label for="source-service">${t.useService}</label>
          </div>
          <div class="radio-option ${sourceType === "custom" ? "selected" : ""}">
          <input type="radio" name="sourceType" value="custom" id="source-custom" ${sourceType === "custom" ? "checked" : ""}>
          <label for="source-custom">${t.useCustomUrl}</label>
          </div>
          </div>
          </div>

          <div class="setting-group" id="service-list-container" style="display: ${sourceType === "service" || !experimentalEnabled ? "block" : "none"};">
          <label class="setting-label">${t.streamingService}</label>
          <div class="radio-group">
          <div class="radio-option ${currentService === "franime" ? "selected" : ""}">
          <input type="radio" name="service" value="franime" id="service-franime" ${currentService === "franime" ? "checked" : ""}>
          <label for="service-franime">Franime (franime.fr)</label>
          </div>
          <div class="radio-option ${currentService === "animesama" ? "selected" : ""}">
          <input type="radio" name="service" value="animesama" id="service-animesama" ${currentService === "animesama" ? "checked" : ""}>
          <label for="service-animesama">Anime-Sama (anime-sama.pw)</label>
          </div>
          <div class="radio-option ${currentService === "voiranime" ? "selected" : ""}">
          <input type="radio" name="service" value="voiranime" id="service-voiranime" ${currentService === "voiranime" ? "checked" : ""}>
          <label for="service-voiranime">VoirAnime (voiranime.com)</label>
          </div>
          </div>
          </div>

          <div class="setting-group" id="custom-url-container" style="display: ${sourceType === "custom" && experimentalEnabled ? "block" : "none"};">
          <label class="setting-label">${t.customUrl}</label>
          <input type="text" id="custom-url" placeholder="${t.customUrlPlaceholder}" value="${customUrl}">
          <div class="warning">
          <div class="warning-content">
          <p>${t.customUrlWarning}</p>
          </div>
          </div>
          </div>

          <div class="setting-group">
          <label class="setting-label">${t.topLeftButton}</label>
          <div class="radio-group">
          <div class="radio-option">
          <input type="radio" name="homeButtonBehavior" value="menu" id="behavior-menu" ${currentHomeButtonBehavior === "menu" ? "checked" : ""}>
          <label for="behavior-menu">${t.showMenuF1}</label>
          </div>
          <div class="radio-option">
          <input type="radio" name="homeButtonBehavior" value="home" id="behavior-home" ${currentHomeButtonBehavior === "home" ? "checked" : ""}>
          <label for="behavior-home">${t.goToHome}</label>
          </div>
          </div>
          </div>

          <div class="setting-group">
          <label class="setting-label">${t.reset}</label>
          <button class="btn-danger" onclick="resetApp()">${t.resetButton}</button>
          <div class="warning">
          <div class="warning-content">
          <p>${t.resetWarning}</p>
          </div>
          </div>
          </div>
          </div>

          <div class="section" id="customization">
          <h2 class="section-title">${t.customizationTitle}</h2>

          <div class="setting-group">
          <label class="setting-label">${t.windowStyle}</label>
          <div class="radio-group">
          <div class="radio-option ${currentWindowStyle === "default" ? "selected" : ""}">
          <input type="radio" name="windowStyle" value="default" id="style-default" ${currentWindowStyle === "default" ? "checked" : ""}>
          <label for="style-default">${t.defaultStyle}</label>
          </div>
          <div class="radio-option ${currentWindowStyle === "windows" ? "selected" : ""}">
          <input type="radio" name="windowStyle" value="windows" id="style-windows" ${currentWindowStyle === "windows" ? "checked" : ""}>
          <label for="style-windows">${t.nativeStyle}</label>
          </div>
          </div>
          </div>
          </div>

          <div class="section" id="plugins">
          <h2 class="section-title">${t.pluginsTitle}</h2>

          <div class="setting-group">
          <label class="setting-label">${t.installedPlugins}</label>
          <div id="plugins-list" style="margin-top: 12px;">
          ${
            preferences.plugins && preferences.plugins.length > 0
              ? preferences.plugins
                  .map(
                    (plugin, index) => `
          <div class="plugin-item" data-plugin-path="${plugin.path}">
            <div class="plugin-info">
              <div class="plugin-name">${plugin.name || "Plugin"}</div>
              <div class="plugin-path">${plugin.path}</div>
            </div>
            <button class="btn-danger-small remove-plugin-btn" data-plugin-path="${plugin.path}">${t.removePlugin}</button>
          </div>
        `,
                  )
                  .join("")
              : `<p style="color: #888; font-size: 13px;">${t.noPlugins}</p>`
          }
          </div>
          </div>

          <div class="setting-group">
          <button class="btn-primary" id="add-plugin-btn">${t.addPlugin}</button>
          <div class="warning" style="margin-top: 12px;">
          <div class="warning-content">
          <p><strong>⚠️</strong> ${t.pluginWarning}</p>
          </div>
          </div>
          </div>
          </div>

          <div class="section" id="developer">
          <h2 class="section-title">${t.developerTitle}</h2>

          <div class="setting-group">
          <label class="setting-label">${t.experimental}</label>
          <div class="checkbox-option">
          <input type="checkbox" id="experimental-enabled" ${experimentalEnabled ? "checked" : ""}>
          <label for="experimental-enabled">${t.enableExperimental}</label>
          </div>
          <div class="warning">
          <div class="warning-content">
          <p>${t.experimentalWarning}</p>
          </div>
          </div>
          </div>

          <div class="setting-group">
          <div class="warning">
          <div class="warning-content">
          <p><strong>${t.securityWarningTitle}</strong></p>
          <p>${t.securityWarningText}</p>
          <ul>
          <li>${t.securityWarning1}</li>
          <li>${t.securityWarning2}</li>
          <li>${t.securityWarning3}</li>
          </ul>
          </div>
          </div>
          </div>
          ${
            experimentalEnabled
              ? `
            <div class="setting-group">
            <label class="setting-label">Debug Mode</label>
            <p style="color: #888; font-size: 13px;">Developer tools are enabled in experimental mode</p>
            </div>
            `
              : ""
          }
          </div>

          <div class="section" id="about">
          <div class="about-content">
          <h2 class="section-title">${t.aboutTitle}</h2>

          <div class="version">${t.version}</div>

          <div class="about-section">
          <h3>${t.availableServices}</h3>
          <ul class="services-list">
          <li>Franime (franime.fr)</li>
          <li>Anime-Sama (anime-sama.pw)</li>
          <li>VoirAnime (voiranime.com)</li>
          </ul>
          </div>

          <div class="about-section">
          <p>${t.madeWith}</p>
          <p style="margin-top: 10px; font-size: 12px; color: #888;">${t.disclaimer}</p>
          </div>

          <div class="about-section">
          <h3>${t.usefulLinks}</h3>
          <div class="links">
          <a href="#" class="link-btn" onclick="openExternal('https://github.com/Zetsukae/streamix'); return false;">${t.documentation}</a>
          <a href="#" class="link-btn" onclick="openExternal('https://github.com/Zetsukae/streamix/issues'); return false;">${t.reportBug}</a>
          </div>
          </div>
          </div>
          </div>

          <div class="actions">
          <button class="btn-primary" id="save-settings-btn">${t.save}</button>
          <button class="btn-secondary" id="close-settings-btn">${t.cancel}</button>
          </div>
          </div>
          </div>

          <script>
          // Define translations first
          window.t = {
            removePlugin: '${t.removePlugin}',
            noPlugins: '${t.noPlugins}',
            pluginRemoveError: '${t.pluginRemoveError}',
            confirmRemove: '${t.confirmRemove || "Confirmer la suppression"}'
          };
          
          // Define all functions first
          async function saveSettings() {
            const service = document.querySelector('input[name="service"]:checked')?.value || 'franime';
            const windowStyle = document.querySelector('input[name="windowStyle"]:checked')?.value || 'default';
            const experimentalEnabled = document.getElementById('experimental-enabled')?.checked || false;
            const language = document.getElementById('language-select')?.value || 'fr';
            const homeButtonBehavior = document.querySelector('input[name="homeButtonBehavior"]:checked')?.value || 'menu';

            let sourceType = 'service';
            let customUrl = '';

            if (experimentalEnabled) {
              sourceType = document.querySelector('input[name="sourceType"]:checked')?.value || 'service';
              customUrl = document.getElementById('custom-url')?.value || '';
            }

            const oldExperimental = ${experimentalEnabled};
            const oldLanguage = '${currentLang}';
            const needsRestart = experimentalEnabled !== oldExperimental || language !== oldLanguage;

            try {
              await window.electronAPI.saveConfig({
                service,
                windowStyle,
                sourceType,
                customServiceUrl: customUrl,
                experimentalEnabled,
                language,
                homeButtonBehavior
              });

              if (needsRestart) {
                await window.electronAPI.restartApp();
              } else {
                await window.electronAPI.closeSettings();
              }
            } catch (error) {
              console.error('[v0] Error saving settings:', error);
              alert('Erreur lors de la sauvegarde des paramètres');
            }
          }

          async function closeSettings() {
            try {
              await window.electronAPI.closeSettings();
            } catch (error) {
              console.error('[v0] Error closing settings:', error);
            }
          }

          async function resetApp() {
            if (confirm('${t.resetWarning.replace(/'/g, "\\'")}')) {
              try {
                await window.electronAPI.resetApp();
              } catch (error) {
                console.error('[v0] Error resetting app:', error);
              }
            }
          }

          async function openExternal(url) {
            try {
              await window.electronAPI.openExternal(url);
            } catch (error) {
              console.error('[v0] Error opening external URL:', error);
            }
          }

          function updateUIBasedOnExperimental() {
            const experimentalCheckbox = document.getElementById('experimental-enabled');
            const serviceRadio = document.getElementById('source-service');
            const customRadio = document.getElementById('source-custom');
            const serviceListContainer = document.getElementById('service-list-container');
            const customUrlContainer = document.getElementById('custom-url-container');
            const sourceTypeGroup = document.getElementById('source-type-group');
            
            const isExperimental = experimentalCheckbox?.checked || false;

            if (sourceTypeGroup) {
              sourceTypeGroup.style.display = isExperimental ? 'block' : 'none';
            }

            if (!isExperimental) {
              if (serviceListContainer) serviceListContainer.style.display = 'block';
              if (customUrlContainer) customUrlContainer.style.display = 'none';
              if (serviceRadio) serviceRadio.checked = true;
            } else {
              if (customRadio && customRadio.checked) {
                if (serviceListContainer) serviceListContainer.style.display = 'none';
                if (customUrlContainer) customUrlContainer.style.display = 'block';
              } else {
                if (serviceListContainer) serviceListContainer.style.display = 'block';
                if (customUrlContainer) customUrlContainer.style.display = 'none';
              }
            }
          }

          const handleRemovePluginClick = async (event) => {
            const btn = event.target;
            const pluginPath = btn.dataset.pluginPath;
            if (!pluginPath) {
              console.error('[v0] Plugin path not found for removal');
              return;
            }
            
            const confirmed = confirm(window.t.removePlugin + '?\\n\\n' + pluginPath);
            if (!confirmed) {
              return;
            }
            
            const pluginItem = btn.closest('.plugin-item');
            if (pluginItem) {
              pluginItem.style.opacity = '0.5';
              pluginItem.style.pointerEvents = 'none';
            }
            
            try {
              const result = await window.electronAPI.removePlugin(pluginPath);
              if (result.success) {
                if (pluginItem) {
                  pluginItem.remove();
                }
                const pluginsList = document.getElementById('plugins-list');
                if (pluginsList && pluginsList.children.length === 0) {
                  pluginsList.innerHTML = '<p style="color: #888; font-size: 13px;">' + window.t.noPlugins + '</p>';
                }
              } else {
                if (pluginItem) {
                  pluginItem.style.opacity = '1';
                  pluginItem.style.pointerEvents = 'auto';
                }
                alert(result.error || window.t.pluginRemoveError);
              }
            } catch (error) {
              console.error('[v0] Error removing plugin:', error);
              if (pluginItem) {
                pluginItem.style.opacity = '1';
                pluginItem.style.pointerEvents = 'auto';
              }
              alert(window.t.pluginRemoveError);
            }
          };

          // Now set up all event listeners
          document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
              document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
              document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
              item.classList.add('active');
              document.getElementById(item.dataset.section).classList.add('active');
            });
          });

          document.querySelectorAll('.radio-option input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
              const group = radio.closest('.radio-group');
              group.querySelectorAll('.radio-option').forEach(opt => opt.classList.remove('selected'));
              radio.closest('.radio-option').classList.add('selected');
            });
          });

          const serviceRadio = document.getElementById('source-service');
          const customRadio = document.getElementById('source-custom');
          const serviceListContainer = document.getElementById('service-list-container');
          const customUrlContainer = document.getElementById('custom-url-container');
          const experimentalCheckbox = document.getElementById('experimental-enabled');
          const sourceTypeGroup = document.getElementById('source-type-group');

          if (experimentalCheckbox) {
            experimentalCheckbox.addEventListener('change', updateUIBasedOnExperimental);
          }

          if (serviceRadio && customRadio) {
            serviceRadio.addEventListener('change', () => {
              if (serviceListContainer) serviceListContainer.style.display = 'block';
              if (customUrlContainer) customUrlContainer.style.display = 'none';
            });

            customRadio.addEventListener('change', () => {
              if (serviceListContainer) serviceListContainer.style.display = 'none';
              if (customUrlContainer) customUrlContainer.style.display = 'block';
            });
          }

          document.getElementById('add-plugin-btn')?.addEventListener('click', async () => {
            try {
              const result = await window.electronAPI.selectPluginFile();
              if (result.success) {
                const pluginsList = document.getElementById('plugins-list');
                if (pluginsList.querySelector('p')) {
                  pluginsList.innerHTML = '';
                }

                const pluginItem = document.createElement('div');
                pluginItem.className = 'plugin-item';
                pluginItem.dataset.pluginPath = result.plugin.path;
                pluginItem.innerHTML = '<div class="plugin-info"><div class="plugin-name">' + result.plugin.name + '</div><div class="plugin-path">' + result.plugin.path + '</div></div><button class="btn-danger-small remove-plugin-btn" data-plugin-path="' + result.plugin.path + '">' + result.translations.removePlugin + '</button>';
                pluginsList.appendChild(pluginItem);

                const removeButton = pluginItem.querySelector('.remove-plugin-btn');
                removeButton.addEventListener('click', handleRemovePluginClick);
              } else {
                alert(result.error || 'Erreur lors de la sélection du fichier.');
              }
            } catch (error) {
              console.error('[v0] Error adding plugin:', error);
              alert('Erreur lors de l\\'ajout du plugin');
            }
          });

          document.querySelectorAll('.remove-plugin-btn').forEach(btn => {
            btn.addEventListener('click', handleRemovePluginClick);
          });

          document.getElementById('save-settings-btn')?.addEventListener('click', saveSettings);
          document.getElementById('close-settings-btn')?.addEventListener('click', closeSettings);

          // Initialize UI state
          updateUIBasedOnExperimental();
          </script>
          </body>
          </html>
          `)}`,
    )

    settingsWindow.once("ready-to-show", () => {
      settingsWindow.show()
    })

    settingsWindow.on("closed", () => {
      settingsWindow = null
    })
  })

  ipcMain.handle("get-preferences", async (event) => {
    const preferencesPath = path.join(app.getPath("userData"), "preferences.json")
    let preferences = { windowStyle: "default", homeButtonBehavior: "menu", plugins: [] }

    if (fs.existsSync(preferencesPath)) {
      preferences = JSON.parse(fs.readFileSync(preferencesPath, "utf8"))
    }

    return preferences
  })

  // IPC handlers for settings window
  ipcMain.handle("close-settings", () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close()
    }
  })

  ipcMain.handle("select-plugin-file", async (event) => {
    const config = store.get("config", {})
    const currentLang = config.language || "fr"
    const t = locales[currentLang]

    const result = await dialog.showOpenDialog(settingsWindow, {
      title: "Sélectionner un plugin",
      filters: [{ name: "JavaScript Files", extensions: ["js"] }],
      properties: ["openFile"],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false }
    }

    const pluginPath = result.filePaths[0]
    const pluginName = path.basename(pluginPath, ".js")

    // Load plugin metadata
    const preferencesPath = path.join(app.getPath("userData"), "preferences.json")
    let preferences = { windowStyle: "default", homeButtonBehavior: "menu", plugins: [] }

    if (fs.existsSync(preferencesPath)) {
      preferences = JSON.parse(fs.readFileSync(preferencesPath, "utf8"))
    }

    if (!preferences.plugins) {
      preferences.plugins = []
    }

    // Check if plugin already exists
    const existingPlugin = preferences.plugins.find((p) => p.path === pluginPath)
    if (existingPlugin) {
      return { success: false, error: t.pluginAlreadyInstalled }
    }

    // Add plugin to preferences
    const newPlugin = {
      name: pluginName,
      path: pluginPath,
      enabled: true,
    }

    preferences.plugins.push(newPlugin)

    fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2))

    loadPlugins()

    return { success: true, plugin: newPlugin, translations: t }
  })

  ipcMain.handle("remove-plugin", async (event, pluginPath) => {
    const preferencesPath = path.join(app.getPath("userData"), "preferences.json")
    let preferences = { windowStyle: "default", homeButtonBehavior: "menu", plugins: [] }

    if (fs.existsSync(preferencesPath)) {
      preferences = JSON.parse(fs.readFileSync(preferencesPath, "utf8"))
    }

    if (!preferences.plugins) {
      preferences.plugins = []
    }

    const pluginIndex = preferences.plugins.findIndex((p) => p.path === pluginPath)

    if (pluginIndex >= 0) {
      preferences.plugins.splice(pluginIndex, 1)
      fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2))

      loadPlugins()

      return { success: true }
    }

    return { success: false, error: "Plugin not found" }
  })

  ipcMain.handle("get-plugins", async () => {
    const preferencesPath = path.join(app.getPath("userData"), "preferences.json")
    let preferences = { plugins: [] }

    if (fs.existsSync(preferencesPath)) {
      preferences = JSON.parse(fs.readFileSync(preferencesPath, "utf8"))
    }

    return preferences.plugins || []
  })

  ipcMain.handle("save-config", async (event, config) => {
    store.set("config", config)

    const configPath = path.join(app.getPath("userData"), "first-launch.json")
    const preferencesPath = path.join(app.getPath("userData"), "preferences.json")

    let preferences = {}
    if (fs.existsSync(preferencesPath)) {
      preferences = JSON.parse(fs.readFileSync(preferencesPath, "utf8"))
    }
    preferences.experimentalMode = config.experimentalEnabled || false
    preferences.homeButtonBehavior = config.homeButtonBehavior || "menu"
    preferences.windowStyle = config.windowStyle || "default"
    fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2))

    // Handle configuration file
    if (config.sourceType === "custom" && config.customServiceUrl && config.experimentalEnabled) {
      let fileConfig = {}
      if (fs.existsSync(configPath)) {
        fileConfig = JSON.parse(fs.readFileSync(configPath, "utf8"))
      }
      fileConfig.customUrl = config.customServiceUrl
      fileConfig.customServiceUrl = config.customServiceUrl
      fileConfig.sourceType = "custom"
      fs.writeFileSync(configPath, JSON.stringify(fileConfig, null, 2))
    } else if (config.service) {
      let serviceUrl = "https://franime.fr/"

      if (config.service === "animesama") {
        serviceUrl = "https://anime-sama.pw/"
      } else if (config.service === "voiranime") {
        serviceUrl = "https://v6.voiranime.com/"
      }

      let fileConfig = {}
      if (fs.existsSync(configPath)) {
        fileConfig = JSON.parse(fs.readFileSync(configPath, "utf8"))
      }
      fileConfig.serviceUrl = serviceUrl
      fileConfig.sourceType = "service"
      if (!config.experimentalEnabled) {
        delete fileConfig.customUrl
        delete fileConfig.customServiceUrl
      }
      fs.writeFileSync(configPath, JSON.stringify(fileConfig, null, 2))
    }

    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close()
    }
    setTimeout(() => {
      app.relaunch()
      app.exit(0)
    }, 300)

    return true
  })

  ipcMain.handle("restart-app", () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close()
    }
    setTimeout(() => {
      app.relaunch()
      app.exit(0)
    }, 300)
  })

  ipcMain.handle("save-preferences", async (event, preferences) => {
    const preferencesPath = path.join(app.getPath("userData"), "preferences.json")

    let oldPreferences = { windowStyle: "default", homeButtonBehavior: "menu" }
    if (fs.existsSync(preferencesPath)) {
      oldPreferences = JSON.parse(fs.readFileSync(preferencesPath, "utf8"))
    }

    fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2))

    const configPath = path.join(app.getPath("userData"), "first-launch.json")

    if (preferences.experimentalMode && preferences.sourceType === "custom" && preferences.customUrl) {
      let config = {}
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, "utf8"))
      }
      config.customUrl = preferences.customUrl
      config.sourceType = "custom"
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    } else if (preferences.service) {
      let serviceUrl = "https://franime.fr/"

      if (preferences.service === "animesama") {
        serviceUrl = "https://anime-sama.pw/"
      } else if (preferences.service === "voiranime") {
        serviceUrl = "https://v6.voiranime.com/"
      }

      let config = {}
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, "utf8"))
      }
      config.serviceUrl = serviceUrl
      config.sourceType = "service"
      if (!preferences.experimentalMode) {
        delete config.customUrl
      }
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    }

    if (
      oldPreferences.windowStyle !== preferences.windowStyle ||
      oldPreferences.experimentalMode !== preferences.experimentalMode ||
      preferences.service
    ) {
      if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.close()
      }
      setTimeout(() => {
        app.relaunch()
        app.exit(0)
      }, 300)
    }

    return true
  })

  ipcMain.handle("reset-application", async (event) => {
    const userDataPath = app.getPath("userData")
    const preferencesPath = path.join(userDataPath, "preferences.json")
    const configPath = path.join(userDataPath, "first-launch.json")

    // Supprimer les fichiers de configuration
    if (fs.existsSync(preferencesPath)) {
      fs.unlinkSync(preferencesPath)
    }
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }

    // Redémarrer l'application
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close()
    }

    setTimeout(() => {
      app.relaunch()
      app.exit(0)
    }, 500)

    return true
  })

  ipcMain.handle("open-external-link", async (event, url) => {
    await shell.openExternal(url)
    return true
  })
}

app.whenReady().then(initializeApp)

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// Placeholder for trackHistory if it was meant to be kept
function trackHistory(url) {
  // Implementation for tracking history
}

function createF1MenuScript(menuTexts) {
  return `
  try {
    if (!window.openSettings) {\
      window.openSettings = async () => 
        await window.electronAPI.openSettings();
    }

    let menu = document.getElementById('custom-menu');
    if (menu) {
      if (menu.style.display === 'none') {
        menu.style.display = 'block';
      } else {
        menu.style.display = 'none';
      }
    } else {
      menu = document.createElement('div');
      menu.id = 'custom-menu';
      menu.style.cssText = 'position:fixed;top:60px;left:20px;z-index:10002;background:rgba(30,30,30,0.95);backdrop-filter:blur(15px);border:1px solid #333;border-radius:8px;padding:8px 0;min-width:150px;box-shadow:0 8px 25px rgba(0,0,0,0.3);';

      const currentUrl = window.location.href;
      let homeUrl = 'https://franime.fr/';
      if (currentUrl.includes('anime-sama.pw')) {
        homeUrl = 'https://anime-sama.pw/';
      } else if (currentUrl.includes('voiranime.com')) {
        homeUrl = 'https://v6.voiranime.com/';
      }

      const items = [
        {text: '${menuTexts.home}', action: () => { window.location.href = homeUrl; }},
        {text: '${menuTexts.refresh}', action: () => { window.location.reload(); }},
        {text: '${menuTexts.previous}', action: () => { window.history.back(); }},
        {text: '${menuTexts.next}', action: () => { window.history.forward(); }},
        {separator: true},
        {text: '${menuTexts.settings}', action: () => { window.openSettings(); }}
      ];

      items.forEach(item => {
        if (item.separator) {
          const separator = document.createElement('div');
          separator.style.cssText = 'height:1px;background:#444;margin:4px 8px;';
          menu.appendChild(separator);
        } else {
          const button = document.createElement('button');
          button.textContent = item.text;
          button.style.cssText = 'display:block;width:100%;text-align:left;padding:10px 16px;background:none;border:none;color:#e0e0e0;font-size:14px;cursor:pointer;transition:background 0.2s;';
          button.onmouseover = () => button.style.background = 'rgba(255,255,255,0.1)';
          button.onmouseout = () => button.style.background = 'none';
          button.onclick = () => {
            item.action();
            menu.style.display = 'none';
          };
          menu.appendChild(button);
        }
      });

      document.body.appendChild(menu);

      setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
          if (!menu.contains(e.target)) {
            menu.style.display = 'none';
            document.removeEventListener('click', closeMenu);
          }
        }, {once: false});
      }, 100);
    }
  } catch(error) {
    console.error('[v0] Error creating F1 menu:', error);
  }
  `
}
