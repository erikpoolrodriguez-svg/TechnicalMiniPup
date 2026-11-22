(() => {
  "use strict";

  const canvas = document.querySelector("#game-canvas, canvas[data-game-canvas], canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: false });
  const WORLD = { width: 2200, height: 850 };
  const BOT_CEILING_Y = 90;
  const VIEW = { width: 1280, height: 720 };
  const PLAYER_STANDING_HEIGHT = 44;
  const PLAYER_CROUCH_HEIGHT = 26;
  const PLAYER_SLIDE_HEIGHT = 22;
  const SLIDE_DURATION = 0.6;
  const SLIDE_COOLDOWN = 0.5;
  const SLIDE_MAX_SPEED = 560;
  const JUMP_BUFFER = 0.14;
  const LAVA_SURFACE_BASE_Y = WORLD.height - 125;
  const LAVA_KILL_CREDIT_WINDOW = 5000;
  const DEFAULT_BINDINGS = {
    left: "KeyA", right: "KeyD", jump: "Space", sprint: "ShiftLeft",
    crouch: "ControlLeft", fire: "Mouse0", grapple: "Mouse2",
    pause: "Escape", scoreboard: "Tab",
  };
  const BINDING_LABELS = {
    left: "Mover izquierda", right: "Mover derecha", jump: "Saltar",
    sprint: "Correr", crouch: "Agacharse / deslizarse", fire: "Disparar",
    grapple: "Gancho", pause: "Pausa", scoreboard: "Marcador",
  };
  const MUSIC = {
    bpm: 112,
    chords: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]],
    roots: [45, 41, 48, 43],
  };
  const colors = {
    cyan: "#00f3ff",
    pink: "#ff2a85",
    lime: "#b9ff3b",
    yellow: "#ffe66d",
    violet: "#b27aff",
    white: "#f5fbff",
    dark: "#07101c",
  };
  const colorChoices = {
    CIAN: colors.cyan,
    CYAN: colors.cyan,
    MAGENTA: colors.pink,
    AMARILLO: colors.yellow,
    YELLOW: colors.yellow,
    VERDE: colors.lime,
    GREEN: colors.lime,
    PÚRPURA: colors.violet,
    PURPLE: colors.violet,
  };
  const classes = {
    RUNNER: { hp: 100, speed: 340, jump: 535, stamina: 240, critical: 1, recoil: 1 },
    TANK: { hp: 130, speed: 260, jump: 475, stamina: 240, critical: 1, recoil: 0.58 },
    SNIPER: { hp: 100, speed: 285, jump: 495, stamina: 240, critical: 1.45, recoil: 1 },
    GRAPPLER: { hp: 100, speed: 300, jump: 510, stamina: 300, critical: 1, recoil: 1 },
  };
  const weapons = {
    "PLASMA PISTOL": { damage: 18, speed: 920, cooldown: 0.27, count: 1, spread: 0, color: colors.cyan, ammo: Infinity },
    "CYBER RIFLE": { damage: 13, speed: 1080, cooldown: 0.105, count: 1, spread: 0.018, color: colors.lime, ammo: 48 },
    "NEON SHOTGUN": { damage: 11, speed: 760, cooldown: 0.7, count: 5, spread: 0.34, color: colors.pink, ammo: 20 },
    "RAIL SNIPER": { damage: 75, speed: 1750, cooldown: 1.05, count: 1, spread: 0, color: colors.yellow, ammo: 8 },
  };
  const weaponLabels = {
    "PLASMA PISTOL": "PISTOLA DE PLASMA",
    "CYBER RIFLE": "RIFLE CIBERNÉTICO",
    "NEON SHOTGUN": "ESCOPETA NEÓN",
    "RAIL SNIPER": "FRANCOTIRADOR RAIL",
  };
  const maps = {
    "NEON DISTRICT": [
      [230, 660, 130, 22], [610, 660, 130, 22], [990, 660, 130, 22],
      [1370, 660, 130, 22], [1750, 660, 130, 22], [2050, 660, 130, 22],
      [70, 590, 130, 22], [260, 530, 130, 22], [450, 590, 130, 22],
      [640, 530, 130, 22], [830, 590, 130, 22], [1020, 530, 130, 22],
      [1210, 590, 130, 22], [1400, 530, 130, 22], [1590, 590, 130, 22],
      [1780, 530, 130, 22], [1970, 590, 130, 22],
      [165, 450, 130, 22], [355, 390, 130, 22], [545, 450, 130, 22],
      [735, 390, 130, 22], [925, 450, 130, 22], [1115, 390, 130, 22],
      [1305, 450, 130, 22], [1495, 390, 130, 22], [1685, 450, 130, 22],
      [1875, 390, 130, 22],
    ],
    SKYLINE: [
      [220, 680, 130, 22], [600, 680, 130, 22], [980, 680, 130, 22],
      [1360, 680, 130, 22], [1740, 680, 130, 22], [2050, 680, 130, 22],
      [90, 580, 130, 22], [280, 520, 130, 22], [470, 580, 130, 22],
      [660, 520, 130, 22], [850, 580, 130, 22], [1040, 520, 130, 22],
      [1230, 580, 130, 22], [1420, 520, 130, 22], [1610, 580, 130, 22],
      [1800, 520, 130, 22], [1990, 580, 130, 22],
      [185, 440, 130, 22], [375, 380, 130, 22], [565, 440, 130, 22],
      [755, 380, 130, 22], [945, 440, 130, 22], [1135, 380, 130, 22],
      [1325, 440, 130, 22], [1515, 380, 130, 22], [1705, 440, 130, 22],
      [1895, 380, 130, 22],
    ],
    "GRID ZERO": [
      [220, 680, 130, 22], [600, 680, 130, 22], [980, 680, 130, 22],
      [1360, 680, 130, 22], [1740, 680, 130, 22], [2050, 680, 130, 22],
      [60, 600, 130, 22], [250, 540, 130, 22], [440, 600, 130, 22],
      [630, 540, 130, 22], [820, 600, 130, 22], [1010, 540, 130, 22],
      [1200, 600, 130, 22], [1390, 540, 130, 22], [1580, 600, 130, 22],
      [1770, 540, 130, 22], [1960, 600, 130, 22],
      [155, 460, 130, 22], [345, 400, 130, 22], [535, 460, 130, 22],
      [725, 400, 130, 22], [915, 460, 130, 22], [1105, 400, 130, 22],
      [1295, 460, 130, 22], [1485, 400, 130, 22], [1675, 460, 130, 22],
      [1865, 400, 130, 22],
    ],
  };

  const state = {
    active: false,
    mode: "offline",
    paused: false,
    playerName: "PLAYER",
    playerClass: "RUNNER",
    color: colors.cyan,
    room: null,
    roomList: [],
    selectedMap: "NEON DISTRICT",
    deaths: 0,
    controlMode: "auto",
    cameraX: 0,
    cameraY: 0,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    dpr: 1,
    lastTime: 0,
    fps: 60,
    frameCount: 0,
    fpsClock: 0,
    shake: 0,
    soundVolume: 0.32,
    showStats: true,
    screenShake: true,
    advancedParticles: true,
    player: null,
    bots: [],
    remotePlayers: new Map(),
    bullets: [],
    particles: [],
    lavaParticles: [],
    lavaParticlePool: [],
    lavaBubbleTimer: 0,
    lavaEmberTimer: 0,
    lavaTime: 0,
    crates: [],
    feed: [],
    keys: new Set(),
    codes: new Set(),
    jumpQueued: false,
    jumpBuffer: 0,
    canvasRect: null,
    bgSky: null,
    bgHaze: null,
    pointer: { x: 0, y: 0, down: false, rightDown: false, worldX: 0, worldY: 0 },
    touchMove: { x: 0, y: 0, active: false },
    touchAim: { x: 0, y: 0, active: false, fire: false },
    touchIds: new Map(),
    touchLayoutEditing: false,
    touchLayoutScale: 1,
    touchLayoutPointer: null,
    touchLayoutPositions: {},
    feedSequence: 0,
    healthHudTimer: 0,
    socket: null,
    serverTimeOffset: null,
    lastNetworkAt: 0,
    lastShotAt: 0,
    lastCrateAt: 0,
    fireTimeout: 0,
    audio: null,
    gameElapsed: 0,
    roomCheckTimer: 0,
    sensitivity: 1.16,
    returnAfterOptions: null,
    touchCrouchHeld: false,
    soundEnabled: true,
    music: { enabled: true, volume: 0.6, playing: false, timer: 0, step: 0, nextTime: 0, gain: null, noise: null },
    bindings: { ...DEFAULT_BINDINGS },
    awaitingKey: null,
    pendingConflict: null,
  };

  function emit(name, detail = {}) {
    document.dispatchEvent(new CustomEvent(`cyberarena:${name}`, { detail }));
  }

  function findElement(...selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  }

  function updateText(selectors, value) {
    const element = findElement(...selectors);
    if (element) element.textContent = String(value);
  }

  function showScreen(name) {
    const screenName = name === "playing" ? "game" : name === "paused" ? "pause" : name;
    document.body.dataset.screen = screenName;
    document.querySelectorAll("[data-screen]").forEach((element) => {
      if (element.dataset.persistent !== undefined) return;
      element.hidden = element.dataset.screen !== screenName;
    });
    if (screenName === "game") requestAnimationFrame(fitCanvas);
    updateMusicForScreen(screenName);
    if (screenName !== "game" && !state.active) initDemo();
    emit("screen", { name: screenName });
  }

  function notify(message, kind = "info") {
    emit("notice", { message, kind });
    const toast = findElement("#toast", "[data-toast]");
    if (toast) {
      toast.textContent = message;
      toast.dataset.kind = kind;
      toast.hidden = false;
      clearTimeout(state.fireTimeout);
      state.fireTimeout = setTimeout(() => { toast.hidden = true; }, 2600);
    }
  }

  function setPlayerIdentity() {
    const nameInput = findElement("#player-name", "#playerName", "[name='playerName']");
    if (nameInput?.value.trim()) state.playerName = nameInput.value.trim().slice(0, 18);
    const activeClass = document.querySelector("[data-class].is-selected, [data-class][aria-pressed='true']");
    if (activeClass?.dataset.class) state.playerClass = activeClass.dataset.class.toUpperCase();
    const activeColor = document.querySelector("[data-color].is-selected, [data-color][aria-pressed='true']");
    if (activeColor?.dataset.color) state.color = colorChoices[activeColor.dataset.color.toUpperCase()] || activeColor.dataset.color;
    const classInput = findElement("#selected-class");
    if (classInput?.value) state.playerClass = classInput.value.toUpperCase();
    const colorInput = findElement("#selected-color");
    if (colorInput?.value) state.color = colorChoices[colorInput.value.toUpperCase()] || colorInput.value;
    updateText(["#menu-player-class"], state.playerClass);
    const colorName = state.color === colors.pink ? "magenta" : state.color === colors.yellow ? "amarillo" : state.color === colors.lime ? "verde" : state.color === colors.violet ? "púrpura" : "cian";
    updateText(["#menu-player-color"], `Clase neón · ${colorName}`);
    const avatar = findElement(".avatar-hex");
    if (avatar) avatar.textContent = state.playerClass.slice(0, 1);
    const preview = findElement("#character-preview");
    if (preview) preview.style.setProperty("--suit-color", state.color);
    try {
      localStorage.setItem("cyber-arena-profile", JSON.stringify({
        name: state.playerName,
        playerClass: state.playerClass,
        color: state.color,
      }));
    } catch (_error) {}
  }

  function makePlayer() {
    const stats = classes[state.playerClass] || classes.RUNNER;
    const spawn = randomSpawnPoint();
    return {
      id: state.socket?.id || "local-player",
      name: state.playerName,
      class: state.playerClass,
      color: state.color,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      width: 30,
      height: PLAYER_STANDING_HEIGHT,
      hp: stats.hp,
      maxHp: stats.hp,
      score: 0,
      streak: 0,
      weapon: "PLASMA PISTOL",
      ammo: Infinity,
      weaponAmmo: { "PLASMA PISTOL": Infinity },
      grounded: false,
      crouching: false,
      sliding: false,
      slideTime: 0,
      slideCooldown: 0,
      facing: 1,
      aim: 0,
      coyote: 0,
      jumps: 0,
      jumpBoostTime: 0,
      climbing: false,
      climbStamina: stats.stamina,
      fatigued: false,
      grapple: null,
      shotCooldown: 0,
      invulnerable: 1,
      squash: 1,
      anim: 0,
      dead: false,
      lastHitBy: null,
      lastHitAt: 0,
    };
  }

  function makeBots() {
    const names = ["GHOST//07", "VANTA", "NEON_KID", "NULLBYTE"];
    const botColors = [colors.pink, colors.lime, colors.yellow, colors.violet];
    return names.slice(0, 3).map((name, index) => {
      const spawn = randomSpawnPoint();
      return {
      id: `bot-${index}`,
      name,
      class: ["SNIPER", "RUNNER", "TANK"][index],
      color: botColors[index],
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      width: 30,
      height: PLAYER_STANDING_HEIGHT,
      hp: 90 + index * 10,
      maxHp: 90 + index * 10,
      score: 0,
      streak: 0,
      weapon: index === 0 ? "CYBER RIFLE" : "PLASMA PISTOL",
      grounded: false,
      crouching: false,
      sliding: false,
      slideTime: 0,
      slideCooldown: 0,
      facing: -1,
      aim: Math.PI,
      coyote: 0,
      jumps: 0,
      jumpBoostTime: 0,
      climbing: false,
      climbStamina: 200,
      fatigued: false,
      shotCooldown: 0.3 + Math.random() * 0.8,
      invulnerable: 0,
      squash: 1,
      anim: Math.random() * 5,
      aiJump: Math.random() * 2,
      dead: false,
      lastHitBy: null,
      lastHitAt: 0,
      };
    });
  }

  function fitCanvas() {
    state.canvasRect = canvas.getBoundingClientRect();
    const rect = state.canvasRect;
    const cssWidth = Math.max(1, rect.width || window.innerWidth);
    const cssHeight = Math.max(1, rect.height || window.innerHeight);
    const compactViewport = cssWidth < 980;
    if (compactViewport) {
      VIEW.width = cssWidth;
      VIEW.height = cssHeight;
      state.scale = 1;
      state.offsetX = 0;
      state.offsetY = 0;
    } else {
      VIEW.width = 1280;
      VIEW.height = 720;
      state.scale = Math.min(cssWidth / VIEW.width, cssHeight / VIEW.height);
      state.offsetX = (cssWidth - VIEW.width * state.scale) / 2;
      state.offsetY = (cssHeight - VIEW.height * state.scale) / 2;
    }
    state.dpr = Math.min(window.devicePixelRatio || 1, compactViewport ? 1.5 : 2);
    canvas.width = Math.round(cssWidth * state.dpr);
    canvas.height = Math.round(cssHeight * state.dpr);
    state.lowPower = compactViewport;
  }

  function cachedScreenToWorld(clientX, clientY) {
    const rect = state.canvasRect || canvas.getBoundingClientRect();
    const x = (clientX - rect.left - state.offsetX) / state.scale + state.cameraX;
    const y = (clientY - rect.top - state.offsetY) / state.scale + state.cameraY;
    return { x, y };
  }

  function screenToWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - state.offsetX) / state.scale + state.cameraX;
    const y = (clientY - rect.top - state.offsetY) / state.scale + state.cameraY;
    return { x, y };
  }

  function updatePointerPosition(clientX, clientY) {
    state.pointer.x = clientX;
    state.pointer.y = clientY;
    const world = screenToWorld(clientX, clientY);
    state.pointer.worldX = world.x;
    state.pointer.worldY = world.y;
  }

  function platforms() {
    if (!state.active && state.demo) return maps[state.demo.map] || maps["NEON DISTRICT"];
    return maps[state.selectedMap] || maps["NEON DISTRICT"];
  }

  function randomSpawnPoint() {
    const list = platforms();
    const [x, y, width] = list[Math.floor(Math.random() * list.length)] || list[0];
    return { x: x + width / 2 - 15, y: y - PLAYER_STANDING_HEIGHT - 2 };
  }

  function platformUnderOrNear(x) {
    let best = null;
    let bestDistance = Infinity;
    for (const platform of platforms()) {
      const [px, , width] = platform;
      if (x >= px - 10 && x <= px + width + 10) return platform;
      const distance = Math.min(Math.abs(x - px), Math.abs(x - (px + width)));
      if (distance < bestDistance) {
        best = platform;
        bestDistance = distance;
      }
    }
    return best;
  }

  function nearestPlatform(x, fromY) {
    let best = null;
    let bestDistance = Infinity;
    for (const platform of platforms()) {
      const [px, py, width] = platform;
      if (x < px - 10 || x > px + width + 10 || py < fromY - 220) continue;
      const distance = py - fromY;
      if (distance >= -8 && distance < bestDistance) {
        best = platform;
        bestDistance = distance;
      }
    }
    return best;
  }

  function startGame(mode = "offline") {
    setPlayerIdentity();
    state.mode = mode;
    state.active = true;
    state.paused = false;
    state.gameElapsed = 0;
    state.deaths = 0;
    state.player = makePlayer();
    state.bots = mode === "offline" ? makeBots() : [];
    state.remotePlayers.clear();
    state.bullets = [];
    state.particles = [];
    for (const particle of state.lavaParticles) state.lavaParticlePool.push(particle);
    state.lavaParticles.length = 0;
    state.lavaBubbleTimer = 0;
    state.lavaEmberTimer = 0;
    state.serverTimeOffset = null;
    state.crates = [];
    state.feed = [];
    state.cameraX = 0;
    state.cameraY = 0;
    state.lastCrateAt = 0;
    state.player.invulnerable = 1.25;
    showScreen("playing");
    fitCanvas();
    const rect = canvas.getBoundingClientRect();
    state.pointer.x = rect.left + rect.width / 2;
    state.pointer.y = rect.top + rect.height / 2;
    emit("match-start", { mode });
    sound(550, 0.13, "triangle");
    updateHud();
  }

  function startOffline() {
    if (state.socket?.connected && state.room) state.socket.emit("room:leave");
    state.room = null;
    startGame("offline");
  }

  function onlinePlayerPayload() {
    setPlayerIdentity();
    return { name: state.playerName, class: state.playerClass, color: state.color };
  }

  function ensureSocket() {
    if (state.socket?.connected) return state.socket;
    if (typeof window.io !== "function") {
      notify("El servidor online no está disponible. Prueba el modo offline.", "error");
      return null;
    }
    if (state.socket) {
      state.socket.connect();
      return state.socket;
    }
    state.socket = window.io({ autoConnect: true, reconnection: true });
    state.socket.on("connect", () => {
      emit("connection", { connected: true });
      state.socket.emit("rooms:request");
    });
    state.socket.on("disconnect", () => {
      emit("connection", { connected: false });
      if (state.mode === "online") notify("Se perdió la conexión con la sala.", "error");
    });
    state.socket.on("connect_error", () => {
      emit("connection", { connected: false });
    });
    state.socket.on("rooms:list", (rooms) => {
      state.roomList = Array.isArray(rooms) ? rooms : [];
      emit("rooms", { rooms: state.roomList });
    });
    state.socket.on("room:joined", (data) => {
      state.room = data.room;
      state.selectedMap = data.room?.map || state.selectedMap;
      startGame("online");
      if (state.player) state.player.id = data.playerId;
      for (const remote of data.players || []) {
        if (remote.id === data.playerId) continue;
        state.remotePlayers.set(remote.id, {
          ...remote,
          width: 30,
          height: remote.height || PLAYER_STANDING_HEIGHT,
          vx: remote.vx || 0,
          vy: remote.vy || 0,
          targetHeight: remote.height || PLAYER_STANDING_HEIGHT,
          anim: 0,
          squash: 1,
          weapon: remote.weapon || "PLASMA PISTOL",
        });
      }
      state.crates = (data.crates || []).map(makeSyncedCrate);
      notify(`Conectado a ${data.room.name}`, "success");
    });
    state.socket.on("room:player-joined", (remote) => {
      if (!state.player || remote.id === state.player.id) return;
      state.remotePlayers.set(remote.id, {
        ...remote,
        width: 30,
        height: remote.height || PLAYER_STANDING_HEIGHT,
        vx: remote.vx || 0,
        vy: remote.vy || 0,
        targetHeight: remote.height || PLAYER_STANDING_HEIGHT,
        anim: 0,
        squash: 1,
      });
      pushFeed(`${remote.name} ENTRÓ A LA ARENA`, colors.cyan);
    });
    state.socket.on("room:player-left", ({ id }) => {
      const remote = state.remotePlayers.get(id);
      if (remote) pushFeed(`${remote.name} SALIÓ DE LA ARENA`, colors.pink);
      state.remotePlayers.delete(id);
    });
    state.socket.on("room:state", (data) => {
      state.room = data.room;
      emit("room-state", data);
    });
    state.socket.on("game:sync", (data) => {
      const now = performance.now();
      for (const remote of data.players || []) {
        if (remote.id === state.player?.id) continue;
        let current = state.remotePlayers.get(remote.id);
        if (!current) {
          current = {
            ...remote,
            width: 30,
            height: remote.height || PLAYER_STANDING_HEIGHT,
            vx: remote.vx || 0,
            vy: remote.vy || 0,
            targetHeight: remote.height || PLAYER_STANDING_HEIGHT,
            anim: 0,
            squash: 1,
          };
          state.remotePlayers.set(remote.id, current);
        }
        current.targetX = remote.x;
        current.targetY = remote.y;
        current.targetHeight = Number.isFinite(remote.height) ? remote.height : PLAYER_STANDING_HEIGHT;
        current.vx = Number.isFinite(remote.vx) ? remote.vx : current.vx;
        current.vy = Number.isFinite(remote.vy) ? remote.vy : current.vy;
        current.facing = Number.isFinite(remote.facing) ? remote.facing : current.facing;
        current.targetAim = remote.aim;
        current.hp = remote.hp;
        current.maxHp = remote.maxHp || current.maxHp || 100;
        current.score = remote.score;
        current.streak = Number.isFinite(remote.streak) ? remote.streak : current.streak || 0;
        current.weapon = remote.weapon;
        current.lastSync = now;
      }
    });
    state.socket.on("player:fire", (shot) => {
      const remote = state.remotePlayers.get(shot.id);
      if (!remote) return;
      const weaponName = shot.weapon || "PLASMA PISTOL";
      const weapon = weapons[weaponName] || weapons["PLASMA PISTOL"];
      for (let index = 0; index < weapon.count; index += 1) {
        const spread = weapon.count === 1
          ? (Math.random() - 0.5) * weapon.spread
          : (index - (weapon.count - 1) / 2) * weapon.spread * 0.5;
        const angle = shot.aim + spread;
        state.bullets.push({
          x: shot.x, y: shot.y, vx: Math.cos(angle) * weapon.speed, vy: Math.sin(angle) * weapon.speed,
          owner: shot.id, faction: "remote", color: weapon.color || shot.color || colors.cyan, damage: weapon.damage, life: 1.55,
          weapon: weaponName,
        });
      }
      sound(300, 0.07, "square", 0.055);
    });
    state.socket.on("player:elimination", ({ killerId, killerName, killerScore, killerStreak, victimId, victimName }) => {
      pushFeed(`${killerName} ELIMINÓ A ${victimName || "UN JUGADOR"}`, colors.pink);
      if (killerId === state.player?.id) {
        state.player.score = killerScore;
        if (Number.isFinite(killerStreak)) state.player.streak = killerStreak;
      } else {
        const killer = state.remotePlayers.get(killerId);
        if (killer) {
          killer.score = killerScore;
          if (Number.isFinite(killerStreak)) killer.streak = killerStreak;
        }
      }
      if (victimId === state.player?.id && state.player && !state.player.dead) {
        state.player.hp = 0;
        state.player.streak = 0;
        eliminate(state.player, killerName);
      } else {
        const victim = state.remotePlayers.get(victimId);
        if (victim) {
          victim.hp = 0;
          victim.dead = true;
          victim.streak = 0;
          setTimeout(() => {
            if (!state.active || !state.remotePlayers.has(victimId)) return;
            victim.dead = false;
            victim.hp = victim.maxHp || 100;
          }, 1800);
        }
      }
      updateHud();
    });
    state.socket.on("crate:spawn", (crate) => {
      if (!state.crates.some((current) => current.id === crate.id)) state.crates.push(makeSyncedCrate(crate));
    });
    state.socket.on("crate:picked", ({ id, playerId }) => {
      const crate = state.crates.find((current) => current.id === id);
      state.crates = state.crates.filter((current) => current.id !== id);
      const collector = state.remotePlayers.get(playerId);
      if (crate && playerId !== state.player?.id) {
        pushFeed(`${collector?.name || "OTRO PILOTO"} RECOGIÓ ${crate.weapon}`, crate.color || colors.cyan);
      }
    });
    return state.socket;
  }

  function getRoomForm() {
    const getValue = (...selectors) => findElement(...selectors)?.value;
    const name = getValue("#room-name", "#roomName", "[name='roomName']") || "NIGHT SHIFT";
    const maxPlayers = Number(getValue("#room-max", "#room-max-players", "#maxPlayers", "[name='maxPlayers']") || 6);
    const map = getValue("#room-map", "#map-select", "[name='map']") || state.selectedMap;
    const privacyElement = document.querySelector("input[name='privacy']:checked");
    const privacy = privacyElement?.value === "private" ? "private" : "public";
    return { name, maxPlayers, map, privacy, player: onlinePlayerPayload() };
  }

  function createOnlineRoom() {
    const socket = ensureSocket();
    if (!socket) return;
    const create = () => socket.emit("room:create", getRoomForm(), (result) => {
      if (!result?.ok) notify(result?.error || "No se pudo crear la sala.", "error");
      else if (result.room?.code) {
        updateText(["#room-code-display", "[data-room-code]"], result.room.code);
        const codeCard = findElement("#private-code-result");
        if (codeCard) codeCard.hidden = false;
        emit("room-created", { room: result.room });
      }
    });
    if (socket.connected) create();
    else socket.once("connect", create);
  }

  function joinOnlineRoom(payload = {}) {
    const socket = ensureSocket();
    if (!socket) return;
    const codeField = findElement("#join-code", "#join-room-code", "#room-code", "[name='roomCode']");
    const code = payload.code || codeField?.value?.trim() || "";
    const join = () => socket.emit("room:join", {
      id: payload.id,
      code,
      player: onlinePlayerPayload(),
    }, (result) => {
      if (!result?.ok) notify(result?.error || "No se pudo entrar a la sala.", "error");
    });
    if (socket.connected) join();
    else socket.once("connect", join);
  }

  function renderRooms(rooms) {
    const list = findElement("#room-list");
    if (!list) return;
    const search = (findElement("#room-search")?.value || "").trim().toLowerCase();
    const visibleRooms = (Array.isArray(rooms) ? rooms : []).filter((room) =>
      !search || String(room.name || "").toLowerCase().includes(search),
    );
    const count = findElement("#room-count");
    if (count) count.textContent = `${visibleRooms.length} ${visibleRooms.length === 1 ? "ACTIVA" : "ACTIVAS"}`;
    if (!visibleRooms.length) {
      list.innerHTML = `<div class="room-empty" id="room-empty" role="status">${
        search ? "No hay salas que coincidan con esa búsqueda." : "No hay salas públicas activas. Crea una para invitar a tus amigos."
      }</div>`;
      return;
    }
    list.innerHTML = visibleRooms.map((room) => {
      const roomName = escapeHtml(room.name || "ARENA");
      const mapName = escapeHtml(room.map || "NEON DISTRICT");
      const id = escapeHtml(room.id || "");
      const ping = Math.max(0, Math.round(Number(room.ping) || 0));
      return `<article class="room-row" role="listitem" data-room-id="${id}">
        <div class="room-name-cell"><span class="room-name">${roomName}</span><span class="room-sub"><span class="tag">PÚBLICA</span> &nbsp; ${mapName}</span></div>
        <div class="room-stat room-population"><small>JUGADORES</small>${Number(room.players) || 0} / ${Number(room.maxPlayers) || 6}</div>
        <div class="room-stat room-map"><small>MAPA</small>${mapName}</div>
        <div class="room-stat room-ping"><small>PING</small><span class="${ping > 75 ? "ping-warm" : "ping"}">${ping} ms</span></div>
        <button class="btn btn-small" type="button" data-action="join-room" data-room-id="${id}" aria-label="Unirse a ${roomName}">Unirse <span class="btn-arrow" aria-hidden="true">→</span></button>
      </article>`;
    }).join("");
  }

  function loadRooms() {
    const socket = ensureSocket();
    if (socket?.connected) socket.emit("rooms:request");
    else fetch("/api/rooms").then((response) => response.json()).then((rooms) => {
      state.roomList = Array.isArray(rooms) ? rooms : [];
      emit("rooms", { rooms: state.roomList });
    }).catch(() => notify("No se pudo cargar la lista de salas.", "error"));
  }

  function togglePause(force) {
    if (!state.active) return;
    state.paused = typeof force === "boolean" ? force : !state.paused;
    showScreen(state.paused ? "paused" : "playing");
    if (!state.paused) {
      state.lastTime = performance.now();
      for (const fighter of [state.player, ...state.bots]) {
        if (fighter?.pendingRespawn) {
          setTimeout(() => {
            if (!state.active || state.paused || !fighter.pendingRespawn) return;
            if (fighter === state.player) respawnEntity(fighter);
            else respawnBot(fighter);
          }, 600);
        }
      }
    }
    if (state.paused && state.player) {
      const entries = [state.player, ...state.bots, ...state.remotePlayers.values()].filter(Boolean);
      const rank = entries.filter((item) => (item.score || 0) > (state.player.score || 0)).length + 1;
      updateText(["#pause-placement"], `${rank}.º de ${entries.length}`);
      updateText(["#pause-kills"], state.player.score || 0);
      updateText(["#pause-deaths"], state.deaths);
      const minutes = String(Math.floor(state.gameElapsed / 60)).padStart(2, "0");
      const seconds = String(Math.floor(state.gameElapsed % 60)).padStart(2, "0");
      updateText(["#pause-time"], `${minutes}:${seconds}`);
    }
    emit("pause", { paused: state.paused });
  }

  function quitToMenu() {
    state.active = false;
    state.paused = false;
    if (state.socket?.connected && state.room) state.socket.emit("room:leave");
    state.room = null;
    updateText(["#result-kills"], state.player?.score || 0);
    updateText(["#result-deaths"], state.deaths);
    updateText(["#result-score"], (state.player?.score || 0) * 100);
    updateText(["#result-player-line"], `Buen combate, ${state.player?.name || state.playerName}. La ciudad recuerda tu partida.`);
    showScreen("results");
    emit("match-end", { score: state.player?.score || 0 });
  }

  function setOption(name, value) {
    if (name === "controlMode") state.controlMode = value;
    if (name === "volume") state.soundVolume = Number(value) / 100;
    if (name === "soundEnabled") state.soundEnabled = Boolean(value);
    if (name === "screenShake") state.screenShake = Boolean(value);
    if (name === "advancedParticles") state.advancedParticles = Boolean(value);
    if (name === "showStats") state.showStats = Boolean(value);
    if (name === "sensitivity") state.sensitivity = Math.max(0.25, Math.min(2, Number(value) / 50));
    if (name === "controlMode") document.body.dataset.control = value;
    if (name === "musicEnabled") {
      state.music.enabled = Boolean(value);
      if (!state.music.enabled) stopMusic(0.4);
      else updateMusicForScreen(document.body.dataset.screen);
    }
    if (name === "musicVolume") {
      state.music.volume = Math.max(0, Math.min(1, Number(value) / 100));
      if (state.music.gain && state.music.playing && state.audio) {
        state.music.gain.gain.setTargetAtTime(Math.max(0.0001, state.music.volume), state.audio.currentTime, 0.05);
      }
    }
  }

  function handleAction(target) {
    const action = target.dataset.action;
    if (!action) return;
    switch (action) {
      case "start-offline":
      case "play-offline":
        startOffline();
        break;
      case "open-lobby":
        loadRooms();
        showScreen("lobby");
        break;
      case "open-characters":
        showScreen("characters");
        break;
      case "open-options":
        if (state.active && state.paused) state.returnAfterOptions = "pause";
        showScreen("options");
        break;
      case "back-menu":
      case "back-to-menu":
        if (state.returnAfterOptions === "pause") {
          state.returnAfterOptions = null;
          showScreen("pause");
        } else {
          showScreen("menu");
        }
        break;
      case "back-to-lobby":
        showScreen("lobby");
        break;
      case "confirm-character":
      case "save-character":
        setPlayerIdentity();
        showScreen("menu");
        notify(`${state.playerClass} listo para el combate.`, "success");
        break;
      case "play-again":
        startOffline();
        break;
      case "create-room":
        createOnlineRoom();
        break;
      case "join-room":
        joinOnlineRoom({ id: target.dataset.roomId });
        break;
      case "join-code":
      case "join-by-code":
        joinOnlineRoom();
        break;
      case "refresh-rooms":
        loadRooms();
        break;
      case "pause":
      case "pause-match":
        togglePause(true);
        break;
      case "resume":
      case "resume-match":
        togglePause(false);
        break;
      case "quit":
      case "quit-to-menu":
      case "leave-match":
        quitToMenu();
        break;
      case "select-class":
        state.playerClass = (target.dataset.class || "RUNNER").toUpperCase();
        document.querySelectorAll("[data-class]").forEach((element) => {
          const selected = element === target;
          element.classList.toggle("is-selected", selected);
          element.setAttribute("aria-pressed", String(selected));
        });
        const preview = findElement("#character-preview");
        if (preview) preview.dataset.previewClass = state.playerClass.toLowerCase();
        setPlayerIdentity();
        emit("class-selected", { playerClass: state.playerClass });
        break;
      case "select-color":
        state.color = colorChoices[(target.dataset.color || "").toUpperCase()] || target.dataset.color || colors.cyan;
        document.querySelectorAll("[data-color]").forEach((element) => {
          const selected = element === target;
          element.classList.toggle("is-selected", selected);
          element.setAttribute("aria-pressed", String(selected));
        });
        setPlayerIdentity();
        emit("color-selected", { color: state.color });
        break;
      case "save-settings":
      case "save-options":
        try {
          const settings = {};
          document.querySelectorAll("[data-setting]").forEach((element) => {
            settings[element.dataset.setting] = element.type === "checkbox" ? element.checked : element.value;
          });
          localStorage.setItem("cyber-arena-settings", JSON.stringify(settings));
        } catch (_error) {}
        notify("Ajustes guardados.", "success");
        showScreen(state.returnAfterOptions || "menu");
        state.returnAfterOptions = null;
        break;
      case "reset-options":
        try { localStorage.removeItem("cyber-arena-settings"); } catch (_error) {}
        document.querySelectorAll("[data-setting]").forEach((element) => {
          if (element.type === "checkbox") element.checked = true;
          else if (element.dataset.setting === "controlMode") element.value = "auto";
          else if (element.dataset.setting === "volume") element.value = "72";
          else if (element.dataset.setting === "sensitivity") element.value = "58";
          setOption(element.dataset.setting, element.type === "checkbox" ? element.checked : element.value);
          const output = document.querySelector(`output[for="${element.id}"]`);
          if (output) output.value = element.dataset.setting === "volume" ? `${element.value}%` : element.value;
        });
        notify("Ajustes restablecidos.", "info");
        break;
      case "reset-bindings":
        state.bindings = { ...DEFAULT_BINDINGS };
        saveBindings();
        endKeyCapture();
        notify("Controles restablecidos a los valores por defecto.", "info");
        break;
      case "reset-binding": {
        const action = target.dataset.bindAction;
        if (action && DEFAULT_BINDINGS[action]) {
          const code = DEFAULT_BINDINGS[action];
          const holder = Object.entries(state.bindings).find(([owner, ownerCode]) => owner !== action && ownerCode === code);
          if (holder) {
            const previous = state.bindings[action];
            state.bindings[holder[0]] = previous;
          }
          state.bindings[action] = code;
          saveBindings();
          renderBindings();
          uiSound("confirm");
        }
        break;
      }
      case "bind-key":
        if (state.awaitingKey === target.dataset.bind) endKeyCapture();
        else beginKeyCapture(target.dataset.bind);
        uiSound("click");
        break;
      case "toggle-scoreboard": {
        const opened = document.body.classList.toggle("scoreboard-open");
        target.setAttribute("aria-pressed", String(opened));
        break;
      }
      case "edit-controls":
        setTouchLayoutEditing(true);
        break;
      case "reset-touch-layout":
        resetTouchLayout();
        break;
      case "done-touch-layout":
        saveTouchLayout();
        setTouchLayoutEditing(false);
        break;
      default:
        break;
    }
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (target?.matches("button[type='submit']")) return;
    if (!target) return;
    const action = target.dataset.action;
    const kind = /back|menu|lobby|quit|leave|resume/.test(action) ? "back" : /confirm|save|play|start|join|create/.test(action) ? "confirm" : "click";
    uiSound(kind);
    handleAction(target);
  });
  document.addEventListener("pointerover", (event) => {
    const target = event.target.closest("button:not([disabled]), .menu-link");
    if (target && !(event.relatedTarget instanceof Element && event.relatedTarget.closest("button, .menu-link"))) uiSound("hover");
  });
  const unlockAudio = () => {
    ensureAudio();
    if (state.music.enabled) updateMusicForScreen(document.body.dataset.screen || "menu");
  };
  window.addEventListener("pointerdown", unlockAudio, true);
  window.addEventListener("keydown", unlockAudio, true);
  document.addEventListener("input", (event) => {
    const target = event.target;
    if (target.matches("[data-setting]")) {
      const value = target.type === "checkbox" ? target.checked : target.value;
      setOption(target.dataset.setting, value);
      const output = document.querySelector(`output[for="${target.id}"]`);
      if (output) output.value = target.dataset.setting === "volume" ? `${value}%` : String(value);
      emit("setting", { name: target.dataset.setting, value });
    }
    if (target.id === "touch-size") {
      state.touchLayoutScale = Math.max(0.7, Math.min(1.4, Number(target.value) / 100));
      updateTouchLayoutScale();
      saveTouchLayout();
    }
    if (target.id === "room-search") renderRooms(state.roomList);
  });
  document.addEventListener("submit", (event) => {
    if (event.target.id === "create-room-form") {
      event.preventDefault();
      createOnlineRoom();
    }
  });
  document.addEventListener("cyberarena:rooms", (event) => renderRooms(event.detail.rooms));
  document.addEventListener("cyberarena:connection", (event) => {
    const status = findElement("#connection-status");
    const note = findElement("#network-note");
    if (status) {
      status.innerHTML = `<i class="status-led" aria-hidden="true"></i>${event.detail.connected ? "Servidor conectado" : "Sin conexión al servidor"}`;
      status.dataset.connected = String(event.detail.connected);
    }
    if (note) {
      note.innerHTML = event.detail.connected
        ? "<strong>● Conectado</strong> &nbsp; Las salas se actualizan en tiempo real"
        : "<strong>● Sin conexión</strong> &nbsp; Comprueba que el servidor esté activo";
    }
  });
  document.addEventListener("cyberarena:room-created", (event) => {
    const code = event.detail.room?.code;
    if (!code) return;
    updateText(["#room-code-display", "[data-room-code]"], code);
    updateText(["#hud-room-code-value"], code);
    const codeCard = findElement("#private-code-result");
    const codeChip = findElement("#hud-room-code");
    if (codeCard) codeCard.hidden = false;
    if (codeChip) codeChip.hidden = false;
  });
  document.addEventListener("cyberarena:room-state", (event) => {
    if (state.mode === "online") updateHud();
    const room = event.detail.room;
    if (room?.code) {
      updateText(["#hud-room-code-value"], room.code);
      const codeChip = findElement("#hud-room-code");
      if (codeChip) codeChip.hidden = false;
    }
  });

  function sound(frequency, duration, wave = "sine", gain = 0.12) {
    if (!state.soundEnabled || state.soundVolume <= 0) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      state.audio ||= new AudioContext();
      if (state.audio.state === "suspended") state.audio.resume();
      const oscillator = state.audio.createOscillator();
      const volume = state.audio.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, state.audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(45, frequency * 0.52), state.audio.currentTime + duration);
      volume.gain.setValueAtTime(gain * state.soundVolume, state.audio.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, state.audio.currentTime + duration);
      oscillator.connect(volume);
      volume.connect(state.audio.destination);
      oscillator.start();
      oscillator.stop(state.audio.currentTime + duration);
    } catch (_error) {
      // Audio is optional; gameplay continues when the browser blocks sound.
    }
  }

  function ensureAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      state.audio ||= new AudioContext();
      if (state.audio.state === "suspended") state.audio.resume();
      return state.audio;
    } catch (_error) {
      return null;
    }
  }

  function uiSound(kind) {
    if (!state.soundEnabled || state.soundVolume <= 0) return;
    const audio = ensureAudio();
    if (!audio) return;
    const now = audio.currentTime;
    if (kind === "hover") {
      if (now - (state.lastHoverAt || 0) < 0.07) return;
      state.lastHoverAt = now;
    }
    if (now - (state.lastUiAt || 0) < 0.03) return;
    state.lastUiAt = now;
    const presets = {
      hover: { frequency: 740, duration: 0.05, wave: "sine", gain: 0.035 },
      click: { frequency: 420, duration: 0.07, wave: "triangle", gain: 0.09 },
      back: { frequency: 300, duration: 0.1, wave: "triangle", gain: 0.09 },
      confirm: { frequency: 620, duration: 0.12, wave: "triangle", gain: 0.1 },
    };
    const preset = presets[kind] || presets.click;
    sound(preset.frequency, preset.duration, preset.wave, preset.gain);
  }

  function updateMusicForScreen(screenName) {
    const inMenu = screenName === "menu" || screenName === "lobby" || screenName === "characters" || screenName === "options";
    if (!state.music.enabled || !inMenu) stopMusic(0.9);
    else startMusic();
  }

  function startMusic() {
    if (!state.music.enabled) return;
    const audio = ensureAudio();
    if (!audio || state.music.playing) return;
    state.music.playing = true;
    state.music.gain = audio.createGain();
    state.music.gain.gain.setValueAtTime(0.0001, audio.currentTime);
    state.music.gain.gain.setTargetAtTime(Math.max(0.0001, state.music.volume), audio.currentTime, 0.7);
    state.music.noise = audio.createBufferSource();
    const buffer = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    state.music.noise.buffer = buffer;
    state.music.noise.loop = true;
    state.music.nextTime = audio.currentTime + 0.1;
    state.music.step = 0;
    state.music.noise.start();
    scheduleMusic();
  }

  function stopMusic(fade = 0.5) {
    const audio = state.audio;
    if (!state.music.playing) return;
    state.music.playing = false;
    clearTimeout(state.music.timer);
    if (!audio || !state.music.gain) return;
    state.music.gain.gain.setTargetAtTime(0.0001, audio.currentTime, fade / 3);
    const noise = state.music.noise;
    const gain = state.music.gain;
    setTimeout(() => {
      try { noise?.stop(); } catch (_error) {}
      try { gain.disconnect(); } catch (_error) {}
    }, fade * 1000 + 200);
    state.music.noise = null;
    state.music.gain = null;
  }

  function musicVoice(type, frequency, at, duration, gainValue, destination) {
    const audio = state.audio;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(gainValue, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.05);
  }

  function scheduleMusic() {
    if (!state.music.playing) return;
    const audio = state.audio;
    if (!audio || !state.music.gain) return;
    const stepDuration = 60 / MUSIC.bpm / 2;
    while (state.music.nextTime < audio.currentTime + 1.2) {
      const step = state.music.step;
      const bar = Math.floor(step / 8) % MUSIC.chords.length;
      const chord = MUSIC.chords[bar];
      const at = state.music.nextTime;
      if (step % 8 === 0) {
        musicVoice("sawtooth", midiToFrequency(MUSIC.roots[bar] - 12), at, stepDuration * 7.4, 0.16, state.music.gain);
      }
      if (step % 2 === 0) {
        const note = chord[(step / 2) % chord.length];
        musicVoice("square", midiToFrequency(note + 12), at, stepDuration * 0.9, 0.028, state.music.gain);
      }
      if (step % 4 === 0) {
        musicVoice("sine", 72, at, 0.13, 0.22, state.music.gain);
      } else if (step % 4 === 2) {
        musicVoice("triangle", 240, at, 0.07, 0.06, state.music.gain);
      }
      state.music.nextTime += stepDuration;
      state.music.step = step + 1;
    }
    state.music.timer = setTimeout(scheduleMusic, 250);
  }

  function midiToFrequency(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  // ---- Demo match behind the main menu (decorative, reuses the engine) ----
  function initDemo() {
    if (state.active || state.demo) return;
    state.demo = {
      map: ["NEON DISTRICT", "SKYLINE", "GRID ZERO"][Math.floor(Math.random() * 3)],
      cameraX: 0,
      cameraY: 0,
      targetX: 0,
      waitTimer: 0,
      player: null,
      bots: [],
      bullets: [],
    };
    state.demo.player = {
      ...buildDemoFighter("SPECTER-9", "RUNNER", colors.cyan, { x: WORLD.width / 2 - 15, y: 300 }),
      weapon: "CYBER RIFLE",
    };
    state.demo.bots = ["VANTA", "NULLBYTE", "KARMA//77"].map((name, index) => ({
      ...buildDemoFighter(name, ["SNIPER", "TANK", "RUNNER"][index], [colors.pink, colors.yellow, colors.lime][index], randomSpawnPoint()),
      weapon: index === 1 ? "NEON SHOTGUN" : "PLASMA PISTOL",
    }));
  }

  function buildDemoFighter(name, playerClass, color, spawn) {
    const stats = classes[playerClass] || classes.RUNNER;
    return {
      name,
      class: playerClass,
      color,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      width: 30,
      height: PLAYER_STANDING_HEIGHT,
      hp: stats.hp,
      maxHp: stats.hp,
      score: 0,
      streak: 0,
      grounded: false,
      crouching: false,
      sliding: false,
      slideTime: 0,
      slideCooldown: 0,
      facing: -1,
      aim: Math.PI,
      coyote: 0,
      jumps: 0,
      jumpBoostTime: 0,
      climbing: false,
      climbStamina: stats.stamina,
      fatigued: false,
      grapple: null,
      shotCooldown: 0.4 + Math.random(),
      invulnerable: 0,
      squash: 1,
      anim: Math.random() * 5,
      aiJump: Math.random() * 2,
      dead: false,
      lastHitBy: null,
      lastHitAt: 0,
      demoRespawn: 0,
      demo: true,
    };
  }

  function updateDemo(dt) {
    if (!state.demo || state.active) return;
    const demo = state.demo;
    const fighters = [demo.player, ...demo.bots];
    for (const fighter of fighters) {
      if (fighter.dead) {
        fighter.demoRespawn -= dt;
        if (fighter.demoRespawn <= 0) {
          const spawn = randomSpawnPoint();
          fighter.x = spawn.x;
          fighter.y = spawn.y;
          fighter.vx = 0;
          fighter.vy = 0;
          fighter.hp = fighter.maxHp;
          fighter.dead = false;
          fighter.height = PLAYER_STANDING_HEIGHT;
          fighter.invulnerable = 1;
          fighter.demoRespawn = 0;
        }
        continue;
      }
      const rivals = fighters.filter((candidate) => candidate !== fighter && !candidate.dead);
      const target = rivals[Math.floor(Math.random() * rivals.length)] || demo.player;
      const deltaX = target.x - fighter.x;
      const deltaY = target.y - fighter.y;
      const distance = Math.hypot(deltaX, deltaY);
      const direction = Math.sign(deltaX) || 1;
      let move = distance > 420 ? direction : distance > 160 ? direction * 0.4 : -direction * 0.4;
      if (fighter.x < 120) move = 1;
      if (fighter.x > WORLD.width - 120) move = -1;
      fighter.aiJump -= dt;
      let jumpPressed = false;
      if (fighter.grounded && fighter.aiJump < 0) {
        jumpPressed = true;
        fighter.aiJump = 1 + Math.random() * 1.6;
      }
      if (!fighter.grounded && fighter.vy > 60 && fighter.jumps < 2 &&
          fighter.y + fighter.height > LAVA_SURFACE_BASE_Y - 190) jumpPressed = true;
      applyPhysics(fighter, { move, jumpPressed, climb: deltaY < -140 }, dt, false);
      fighter.aim = Math.atan2(deltaY - 6, deltaX);
      fighter.facing = Math.cos(fighter.aim) >= 0 ? 1 : -1;
      fighter.shotCooldown -= dt;
      if (distance < 620 && fighter.shotCooldown <= 0) {
        if (Math.random() < 0.8) demoFire(fighter);
        fighter.shotCooldown = fighter.class === "SNIPER" ? 1.2 : 0.7 + Math.random() * 0.5;
      }
      if (fighter.y + fighter.height >= lavaSurfaceY(fighter.x + 15)) {
        fighter.hp = 0;
        bigLavaSplash(fighter.x + 15, lavaSurfaceY(fighter.x + 15));
        fighter.dead = true;
        fighter.demoRespawn = 2.2;
      }
    }
    updateDemoBullets(dt);
    demo.waitTimer -= dt;
    if (demo.waitTimer <= 0) {
      demo.targetX = Math.max(0, Math.min(WORLD.width - VIEW.width, (demo.player.x + demo.bots[0]?.x || WORLD.width / 2) / 2 - VIEW.width / 2));
      demo.waitTimer = 4 + Math.random() * 4;
    }
    demo.cameraX += (demo.targetX - demo.cameraX) * Math.min(1, dt * 0.7);
    demo.cameraY = (WORLD.height - VIEW.height) * 0.72;
    state.cameraX = demo.cameraX;
    state.cameraY = demo.cameraY;
    updateLava(dt);
    updateParticles(dt);
  }

  function demoFire(fighter) {
    const weapon = weapons[fighter.weapon] || weapons["PLASMA PISTOL"];
    const muzzleX = fighter.x + fighter.width / 2 + Math.cos(fighter.aim) * 26;
    const muzzleY = fighter.y + fighter.height * 0.42 + Math.sin(fighter.aim) * 20;
    for (let index = 0; index < weapon.count; index += 1) {
      const spread = weapon.count === 1 ? (Math.random() - 0.5) * weapon.spread : (index - (weapon.count - 1) / 2) * weapon.spread * 0.5;
      const angle = fighter.aim + spread;
      state.bullets.push({
        x: muzzleX, y: muzzleY, vx: Math.cos(angle) * weapon.speed, vy: Math.sin(angle) * weapon.speed,
        owner: `demo-${fighter.name}`, faction: "demo", color: weapon.color, damage: 0, life: 1.4, weapon: fighter.weapon,
      });
    }
    addParticle(muzzleX, muzzleY, weapon.color, 3, 70);
  }

  function updateDemoBullets(dt) {
    for (let index = state.bullets.length - 1; index >= 0; index -= 1) {
      const bullet = state.bullets[index];
      const previousX = bullet.x;
      const previousY = bullet.y;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      let hit = bullet.life <= 0 || bullet.x < 0 || bullet.x > WORLD.width || bullet.y < 0 || bullet.y > WORLD.height;
      if (!hit) {
        for (const [x, y, width, height] of platforms()) {
          if (segmentHitsRect(previousX, previousY, bullet.x, bullet.y, x - 2, y - 2, x + width + 2, y + height + 2)) {
            hit = true;
            addParticle(bullet.x, bullet.y, bullet.color, 3, 80);
            break;
          }
        }
      }
      if (!hit) {
        for (const fighter of [state.demo?.player, ...(state.demo?.bots || [])]) {
          if (!fighter || fighter.dead || bullet.owner === `demo-${fighter.name}`) continue;
          if (segmentHitsRect(previousX, previousY, bullet.x, bullet.y, fighter.x - 2, fighter.y - 2, fighter.x + fighter.width + 2, fighter.y + fighter.height + 2)) {
            fighter.hp = Math.max(0, fighter.hp - 9);
            addParticle(bullet.x, bullet.y, bullet.color, 6, 130);
            if (fighter.hp <= 0) {
              fighter.dead = true;
              fighter.demoRespawn = 2.5;
              addParticle(fighter.x + 15, fighter.y + 20, fighter.color, 18, 240);
            }
            hit = true;
            break;
          }
        }
      }
      if (hit) state.bullets.splice(index, 1);
    }
  }

  function drawDemo() {
    if (!state.demo || state.active) return;
    drawBackground();
    drawLava();
    for (const [index, platform] of platforms().entries()) drawPlatform(platform, index);
    drawLavaPlatformGlow();
    drawBullets();
    for (const bot of state.demo.bots) drawCharacter(bot);
    drawCharacter(state.demo.player);
    drawParticles();
  }

  // ---- Configurable key bindings ----
  function keyLabel(code) {
    if (!code) return "—";
    if (code.startsWith("Key")) return code.slice(3);
    if (code.startsWith("Digit")) return code.slice(5);
    if (code.startsWith("Arrow")) return { Up: "↑", Down: "↓", Left: "←", Right: "→" }[code.slice(5)] || code.slice(5).toUpperCase();
    const map = {
      Space: "ESPACIO", ShiftLeft: "SHIFT IZQ", ShiftRight: "SHIFT DER",
      ControlLeft: "CTRL IZQ", ControlRight: "CTRL DER", AltLeft: "ALT",
      AltRight: "ALT DER", Tab: "TAB", Escape: "ESC", Enter: "ENTER",
      Backquote: "`", Mouse0: "CLIC IZQ", Mouse1: "CLIC CENTRAL", Mouse2: "CLIC DER",
    };
    return map[code] || code.toUpperCase();
  }

  function renderBindings() {
    for (const [action, code] of Object.entries(state.bindings)) {
      const element = document.querySelector(`[data-bind="${action}"]`);
      if (element) element.textContent = keyLabel(code);
    }
    const hint = findElement("#hud-controls-hint");
    if (hint) {
      hint.innerHTML =
        `<span class="keycap">${keyLabel(state.bindings.left)}</span><span class="keycap">${keyLabel(state.bindings.right)}</span> Moverse ` +
        `<span class="keycap">${keyLabel(state.bindings.sprint)}</span> Correr ` +
        `<span class="keycap">${keyLabel(state.bindings.crouch)}</span> Agacharse / deslizarse ` +
        `<span class="keycap">${keyLabel(state.bindings.jump)}</span> Saltar ` +
        `<span class="keycap">${keyLabel(state.bindings.fire)}</span> Disparar`;
    }
  }

  function saveBindings() {
    try { localStorage.setItem("cyber-arena-bindings", JSON.stringify(state.bindings)); } catch (_error) {}
  }

  function restoreBindings() {
    try {
      const saved = JSON.parse(localStorage.getItem("cyber-arena-bindings") || "null");
      if (saved && typeof saved === "object") {
        for (const action of Object.keys(DEFAULT_BINDINGS)) {
          if (typeof saved[action] === "string") state.bindings[action] = saved[action];
        }
      }
    } catch (_error) {}
    renderBindings();
  }

  function buildBindingsUi() {
    const list = findElement("#bind-list");
    if (!list || list.childElementCount) return;
    for (const [action, label] of Object.entries(BINDING_LABELS)) {
      const row = document.createElement("div");
      row.className = "bind-row";
      const name = document.createElement("span");
      name.className = "bind-name";
      name.textContent = label;
      const key = document.createElement("button");
      key.type = "button";
      key.className = "bind-key";
      key.dataset.action = "bind-key";
      key.dataset.bind = action;
      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "bind-reset";
      reset.dataset.action = "reset-binding";
      reset.dataset.bindAction = action;
      reset.setAttribute("aria-label", `Restablecer ${label}`);
      reset.textContent = "↺";
      row.append(name, key, reset);
      list.appendChild(row);
    }
  }

  function beginKeyCapture(action) {
    state.awaitingKey = action;
    document.querySelectorAll("[data-bind]").forEach((element) => {
      element.classList.toggle("is-capturing", element.dataset.bind === action);
    });
    const button = document.querySelector(`[data-bind="${action}"]`);
    if (button) button.textContent = "Presiona una tecla…";
  }

  function endKeyCapture() {
    state.awaitingKey = null;
    state.pendingConflict = null;
    document.querySelectorAll("[data-bind]").forEach((element) => {
      element.classList.remove("is-capturing");
    });
    renderBindings();
  }

  function assignKey(action, code) {
    const holder = Object.entries(state.bindings).find(([owner, ownerCode]) => owner !== action && ownerCode === code);
    if (holder) {
      const previous = state.bindings[action];
      state.bindings[holder[0]] = previous;
      notify(`"${BINDING_LABELS[holder[0]]}" ahora usa ${keyLabel(previous)} (intercambio automático).`, "info");
    }
    state.bindings[action] = code;
    saveBindings();
    endKeyCapture();
    uiSound("confirm");
  }

  function bindingPressed(action, key, code, button) {
    const bound = state.bindings[action];
    if (bound.startsWith("Mouse")) return button === Number(bound.slice(5));
    return code === bound;
  }

  function keyMatches(action, event) {
    return bindingPressed(action, event.key?.toLowerCase(), event.code, event.button);
  }

  function isBoundCode(code) {
    return Object.values(state.bindings).includes(code);
  }

  function addParticle(x, y, color, count = 5, speed = 210) {
    const amount = state.advancedParticles ? count : Math.min(2, count);
    const particleLimit = state.lowPower ? 90 : 260;
    if (state.particles.length + amount > particleLimit) {
      state.particles.splice(0, state.particles.length + amount - particleLimit);
    }
    for (let i = 0; i < amount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.35 + Math.random() * 0.9);
      state.particles.push({
        x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity - 50,
        life: 0.22 + Math.random() * 0.5, maxLife: 0.72, size: 1.4 + Math.random() * 3.2, color,
      });
    }
  }

  function renderKillFeed() {
    const feed = findElement("#kill-feed", "[data-kill-feed]");
    if (!feed) return;
    feed.replaceChildren();
    for (const entry of state.feed) {
      const line = document.createElement("div");
      line.className = "kill-item kill-feed-line";
      line.style.setProperty("--feed-color", entry.color);
      line.textContent = entry.text;
      feed.appendChild(line);
    }
  }

  function pushFeed(text, color = colors.cyan) {
    const entry = { id: ++state.feedSequence, text, color, at: performance.now() };
    state.feed = [entry];
    renderKillFeed();
    window.setTimeout(() => {
      if (state.feed[0]?.id !== entry.id) return;
      state.feed = [];
      renderKillFeed();
    }, 3000);
    emit("kill-feed", { text, color });
  }

  function updateHud() {
    if (!state.player) return;
    const player = state.player;
    updateHealthHud(player);
    updateText(["#hud-weapon", "#hud-weapon-name", "[data-hud='weapon']"], weaponLabels[player.weapon] || player.weapon);
    updateText(["#hud-ammo", "[data-hud='ammo']"], player.ammo === Infinity ? "∞" : player.ammo);
    updateText(["#hud-ammo-label"], player.ammo === Infinity ? "CARGA INFINITA" : "MUNICIÓN");
    updateText(["#hud-score", "#score-player-kills", "[data-hud='score']"], player.score);
    updateText(["#score-player-score"], player.score * 100);
    updateText(["#hud-player-name", "[data-hud='player-name']"], player.name);
    updateText(["#hud-player-class"], player.class);
    updateText(["#hud-map"], state.selectedMap === "NEON DISTRICT" ? "DISTRITO NEÓN" : state.selectedMap);
    updateText(["#hud-match-time"], `${String(Math.floor(state.gameElapsed / 60)).padStart(2, "0")}:${String(Math.floor(state.gameElapsed % 60)).padStart(2, "0")}`);
    updateText(["#hud-ping"], state.room ? `${state.room.ping} ms` : "—");
    updateText(["#hud-fps"], state.fps);
    updateText(["#pause-score"], player.score * 100);
    updateText(["#result-score"], player.score * 100);
    const staminaBar = findElement("#stamina-fill", "[data-stamina-fill]");
    if (staminaBar) {
      staminaBar.style.height = `${Math.max(0, player.climbStamina / (classes[player.class]?.stamina || 240) * 100)}%`;
      staminaBar.dataset.fatigued = String(player.fatigued);
    }
    renderKillFeed();
    const scoreboard = findElement("#scoreboard-body", "[data-scoreboard]");
    if (scoreboard) {
      const entries = [player, ...state.bots, ...state.remotePlayers.values()]
        .filter((item) => !item.dead)
        .sort((a, b) => b.score - a.score);
      scoreboard.innerHTML = entries.map((item) =>
        `<div class="score-row ${item === player ? "is-you" : ""}"><span>${escapeHtml(item.name)}</span><span>${item.score || 0}</span><span>${(item.score || 0) * 100}</span></div>`,
      ).join("");
    }
    const performanceStats = findElement("#hud-performance");
    const pingChip = findElement("#hud-ping")?.closest(".match-chip");
    if (performanceStats) performanceStats.hidden = !state.showStats;
    if (pingChip) pingChip.hidden = !state.showStats;
    const weaponHud = findElement(".weapon-hud");
    if (weaponHud) weaponHud.dataset.weapon = player.weapon;
    emit("hud", {
      hp: player.hp, maxHp: player.maxHp, weapon: player.weapon, ammo: player.ammo,
      score: player.score, fps: state.fps, room: state.room, stamina: player.climbStamina,
    });
  }

  function updateHealthHud(player = state.player) {
    if (!player) return;
    const hp = Math.max(0, Math.min(player.maxHp, player.hp));
    updateText(["#hud-health", "#hud-player-hp", "[data-hud='health']"], `${Math.ceil(hp)} / ${player.maxHp}`);
    const healthMeter = findElement("[role='meter']");
    if (healthMeter) {
      healthMeter.setAttribute("aria-valuemax", String(player.maxHp));
      healthMeter.setAttribute("aria-valuenow", String(Math.ceil(hp)));
    }
    const healthBar = findElement("#health-fill", "#hud-health-fill", "[data-health-fill]");
    if (healthBar) healthBar.style.width = `${Math.max(0, hp / player.maxHp * 100)}%`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]);
  }

  function moveInput() {
    const left = state.codes.has(state.bindings.left) || state.keys.has("arrowleft");
    const right = state.codes.has(state.bindings.right) || state.keys.has("arrowright");
    let value = (right ? 1 : 0) - (left ? 1 : 0);
    if (state.touchMove.active) value = state.touchMove.x;
    return Math.max(-1, Math.min(1, value));
  }

  function jumpInput() {
    return state.codes.has(state.bindings.jump) || state.keys.has("jump");
  }

  function crouchInput() {
    return state.codes.has(state.bindings.crouch) || state.touchCrouchHeld ||
      (state.touchMove.active && state.touchMove.y > 0.62);
  }

  function sprintInput() {
    return state.codes.has(state.bindings.sprint) ||
      (state.touchMove.active && Math.abs(state.touchMove.x) > 0.84);
  }

  function fireInput() {
    return state.pointer.down || state.touchAim.fire;
  }

  function resizePlayer(player, height) {
    if (height > player.height) {
      const bottom = player.y + player.height;
      const top = bottom - height;
      if (top < 0) return false;
      for (const [x, y, platformWidth, platformHeight] of platforms()) {
        const overlapsX = player.x + player.width > x + 2 && player.x < x + platformWidth - 2;
        const overlapsY = top < y + platformHeight - 3 && bottom > y + 3;
        if (overlapsX && overlapsY) return false;
      }
    }
    const bottom = player.y + player.height;
    player.y = bottom - height;
    player.height = height;
    return true;
  }

  function finishSlide(player) {
    player.sliding = false;
    player.slideTime = 0;
    player.slideCooldown = SLIDE_COOLDOWN;
  }

  function tryJump(player) {
    const stats = classes[player.class] || classes.RUNNER;
    if (player.sliding) {
      finishSlide(player);
      player.slideCooldown = Math.max(player.slideCooldown, SLIDE_COOLDOWN * 0.7);
      const direction = Math.sign(player.vx) || player.facing || 1;
      const carry = Math.min(Math.abs(player.vx), SLIDE_MAX_SPEED);
      player.vx = direction * carry * 0.94;
      player.vy = -(stats.jump * 0.98) || -500;
      player.grounded = false;
      player.coyote = 0;
      player.jumps = 1;
      player.jumpBoostTime = 0.13;
      player.squash = 0.7;
      addParticle(player.x + player.width / 2, player.y + player.height, player.color, 10, 170);
      sound(640, 0.13, "triangle");
      return true;
    }
    if (player.climbing) {
      player.climbing = false;
      player.vy = -stats.jump * 0.93 || -500;
      player.vx = -player.facing * 180;
      player.jumps = 1;
      player.jumpBoostTime = 0.13;
      player.squash = 0.72;
      sound(520, 0.11, "triangle");
      return true;
    }
    if (player.grounded || player.coyote > 0) {
      player.vy = -stats.jump || -500;
      player.grounded = false;
      player.coyote = 0;
      player.jumps = 1;
      player.jumpBoostTime = 0.13;
    } else if (player.jumps < 2) {
      player.vy = -stats.jump * 0.83 || -415;
      player.jumps = 2;
      player.jumpBoostTime = 0.13;
      addParticle(player.x + player.width / 2, player.y + player.height, player.color, 9, 150);
    } else {
      return false;
    }
    player.squash = 0.7;
    sound(player.jumps === 1 ? 540 : 760, 0.12, "triangle");
    return true;
  }

  function findWall(player, direction) {
    for (const [x, y, width, height] of platforms()) {
      const withinHeight = player.y + player.height > y + 4 && player.y < y + height - 3;
      if (!withinHeight) continue;
      const touchesLeft = direction > 0 && player.x + player.width <= x + 8 && player.x + player.width >= x - 5;
      const touchesRight = direction < 0 && player.x >= x + width - 8 && player.x <= x + width + 5;
      if (touchesLeft || touchesRight) return { x, y, width, height, side: touchesLeft ? "left" : "right" };
    }
    return null;
  }

  function applyPhysics(player, input, dt, isPlayer = false) {
    if (player.dead) return;
    const stats = classes[player.class] || classes.RUNNER;
    const move = Math.max(-1, Math.min(1, input.move || 0));
    const crouchRequested = Boolean(input.crouch);
    const sprintRequested = Boolean(input.sprint) && move !== 0;
    const wasGrounded = player.grounded;
    const oldBottom = player.y + player.height;
    player.anim += dt * (Math.abs(player.vx) > 15 || player.climbing ? 9 : 2);
    player.shotCooldown = Math.max(0, player.shotCooldown - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.squash += (1 - player.squash) * Math.min(1, dt * 8);
    if (wasGrounded) {
      player.coyote = 0.12;
      player.jumps = 0;
      player.climbStamina = Math.min(stats.stamina, player.climbStamina + dt * 80);
      player.fatigued = false;
    } else {
      player.coyote = Math.max(0, player.coyote - dt);
    }

    player.slideCooldown = Math.max(0, (player.slideCooldown || 0) - dt);
    if (player.sliding && (!crouchRequested || !wasGrounded)) finishSlide(player);
    if (!player.sliding && crouchRequested && player.slideCooldown <= 0 && wasGrounded && move !== 0 &&
        Math.abs(player.vx) >= stats.speed * 0.72 && Math.sign(player.vx) === Math.sign(move)) {
      const speed = Math.abs(player.vx);
      player.vx = Math.sign(move) * Math.min(SLIDE_MAX_SPEED, Math.max(speed + 70, speed * 1.12));
      player.sliding = true;
      player.slideTime = SLIDE_DURATION;
      player.crouching = true;
      addParticle(player.x + player.width / 2, player.y + player.height - 3, player.color, 6, 120);
      if (isPlayer) sound(200, 0.18, "sawtooth", 0.07);
    }

    if (player.sliding) {
      const progress = 1 - player.slideTime / SLIDE_DURATION;
      if (move !== 0 && Math.sign(move) !== Math.sign(player.vx)) finishSlide(player);
      else {
        player.vx *= Math.exp(-(1.3 + progress * 2.4) * dt);
        player.slideTime -= dt;
        if (isPlayer && Math.random() < dt * 26) {
          addParticle(player.x + player.width / 2 - player.facing * 14, player.y + player.height - 2, "rgba(160,220,255,.8)", 1, 45);
        }
        if (player.slideTime <= 0 || Math.abs(player.vx) < stats.speed * 0.3) finishSlide(player);
      }
    } else {
      const stanceSpeed = player.crouching ? 0.55 : 1;
      const targetSpeed = stats.speed * stanceSpeed * (sprintRequested ? 1.16 : 1) * move;
      if (move) {
        const sameDirection = Math.sign(player.vx) === Math.sign(move);
        if (sameDirection && Math.abs(player.vx) > Math.abs(targetSpeed)) {
          const easing = player.grounded ? 220 : 130;
          player.vx -= Math.sign(player.vx) *
            Math.min(Math.abs(player.vx) - Math.abs(targetSpeed), easing * dt);
        } else {
          const acceleration = player.grounded ? (player.crouching ? 1300 : 2100) : 650;
          player.vx += Math.sign(targetSpeed - player.vx) *
            Math.min(Math.abs(targetSpeed - player.vx), acceleration * dt);
        }
      } else {
        player.vx *= Math.pow(player.grounded ? (player.crouching ? 0.03 : 0.12) : 0.38, dt);
      }
      const horizontalCap = SLIDE_MAX_SPEED;
      player.vx = Math.max(-horizontalCap, Math.min(horizontalCap, player.vx));
      if (Math.abs(player.vx) < 2) player.vx = 0;
    }
    if (move) player.facing = move > 0 ? 1 : -1;

    if (isPlayer) {
      if (input.jumpPressed) state.jumpBuffer = JUMP_BUFFER;
      if (player.grounded || player.coyote > 0) {
        if (state.jumpBuffer > 0) {
          state.jumpBuffer = 0;
          tryJump(player);
        }
      } else {
        state.jumpBuffer = Math.max(0, state.jumpBuffer - dt);
        if (input.jumpPressed) tryJump(player);
      }
    } else if (input.jumpPressed) {
      tryJump(player);
    }

    if (!player.sliding) {
      const wantsCrouch = crouchRequested && player.slideCooldown <= 0;
      resizePlayer(player, wantsCrouch ? PLAYER_CROUCH_HEIGHT : PLAYER_STANDING_HEIGHT);
      player.crouching = player.height < PLAYER_STANDING_HEIGHT;
    } else {
      resizePlayer(player, PLAYER_SLIDE_HEIGHT);
      player.crouching = true;
    }
    if (player.jumpBoostTime > 0) {
      if (isPlayer && jumpInput() && player.vy < 0 && !player.climbing) {
        player.vy = Math.max(-650, player.vy - 460 * dt);
      }
      player.jumpBoostTime = Math.max(0, player.jumpBoostTime - dt);
    }

    if (!player.grounded && Math.abs(player.vy) > 40 && (move || (isPlayer && state.touchMove.y < -0.35))) {
      const climbDirection = isPlayer && state.touchMove.y < -0.35 ? player.facing : move;
      const wall = findWall(player, climbDirection);
      const wantsClimb = isPlayer
        ? moveInput() !== 0 || state.touchMove.y < -0.35
        : input.climb;
      if (wall && wantsClimb && !player.fatigued && player.climbStamina > 0) {
        player.climbing = true;
        player.vy = -155;
        player.vx = 0;
        player.x = wall.side === "left" ? wall.x - player.width : wall.x + wall.width;
        player.climbStamina = Math.max(0, player.climbStamina - dt * 60);
        if (player.climbStamina <= 0) {
          player.fatigued = true;
          player.climbing = false;
        }
      } else if (player.climbStamina < 4 && !wasGrounded) {
        player.fatigued = true;
        player.climbing = false;
      }
    } else {
      player.climbing = false;
    }

    player.vy += (player.climbing ? 0 : 1360) * dt;
    player.vy = Math.min(player.vy, 900);
    if (player.grapple) {
      const dx = player.grapple.x - (player.x + player.width / 2);
      const dy = player.grapple.y - (player.y + player.height / 2);
      const distance = Math.hypot(dx, dy);
      const grappleRange = player.class === "GRAPPLER" ? 700 : 520;
      if (distance < 35 || distance > grappleRange || input.grappleReleased) player.grapple = null;
      else {
        player.vx += dx / distance * 520 * dt;
        player.vy += dy / distance * 520 * dt;
        const speed = Math.hypot(player.vx, player.vy);
        if (speed > 620) {
          player.vx = player.vx / speed * 620;
          player.vy = player.vy / speed * 620;
        }
      }
    }

    const previousX = player.x;
    let nextX = player.x + player.vx * dt;
    for (const [x, y, width, height] of platforms()) {
      if (player.y + player.height <= y + 2 || player.y >= y + height) continue;
      const crossesLeftFace = player.vx > 0 && previousX + player.width <= x && nextX + player.width > x;
      const crossesRightFace = player.vx < 0 && previousX >= x + width && nextX < x + width;
      const overlapsPlatform = nextX + player.width > x && nextX < x + width;
      if (crossesLeftFace || crossesRightFace || overlapsPlatform) {
        if (player.vx > 0) nextX = x - player.width;
        else if (player.vx < 0) nextX = x + width;
        player.vx = 0;
      }
    }
    player.x = nextX;

    player.y += player.vy * dt;
    player.grounded = false;
    for (const [x, y, width, height] of platforms()) {
      const overlaps = player.x + player.width > x + 2 && player.x < x + width - 2;
      const crossedTop = oldBottom <= y + 8 && player.y + player.height >= y && player.vy >= 0;
      if (overlaps && crossedTop) {
        player.y = y - player.height;
        if (player.vy > 100) {
          player.squash = 1.18;
          if (isPlayer) state.shake = Math.min(8, state.shake + player.vy * 0.012);
          addParticle(player.x + player.width / 2, y, player.color, 4, 95);
        }
        player.vy = 0;
        player.grounded = true;
        player.climbing = false;
        player.grapple = null;
      } else if (height > 30 && overlaps && player.vy < 0 && player.y < y + 24 && player.y + player.height > y + 8) {
        player.y = y + 25;
        player.vy = 30;
      }
    }

    if (!isPlayer && player.y < BOT_CEILING_Y) {
      player.y = BOT_CEILING_Y;
      if (player.vy < 0) player.vy = 0;
      player.jumpBoostTime = 0;
      player.grapple = null;
    }

    if (player.x < 0) { player.x = 0; player.vx = Math.max(0, player.vx); }
    if (player.x + player.width > WORLD.width) { player.x = WORLD.width - player.width; player.vx = Math.min(0, player.vx); }
    if (!player.demo && player.y + player.height >= lavaSurfaceY(player.x + player.width / 2)) {
      player.hp = 0;
      lavaDeath(player, isPlayer);
    } else if (!player.demo && player.y > WORLD.height + 70) {
      player.hp = 0;
      eliminate(player, "the abyss");
    }
    if (isPlayer && Math.abs(player.vx) > 300 && Math.random() < dt * 9) {
      addParticle(player.x + player.width / 2 - player.facing * 13, player.y + player.height * 0.6, player.color, 1, 35);
    }
    if (wasGrounded && !player.grounded) player.coyote = 0.12;
  }

  function nearestTarget(bot) {
    const targets = [
      state.player,
      ...state.remotePlayers.values(),
      ...state.bots.filter((candidate) => candidate.id !== bot.id),
    ].filter((player) => player && !player.dead && player.hp > 0);
    return targets.reduce((best, player) => {
      const distance = Math.hypot(player.x - bot.x, player.y - bot.y);
      return !best || distance < best.distance ? { player, distance } : best;
    }, null);
  }

  function updateBots(dt) {
    for (const bot of state.bots) {
      if (bot.dead) continue;
      const targetResult = nearestTarget(bot);
      if (!targetResult) {
        applyPhysics(bot, { move: 0, jumpPressed: false, climb: false }, dt, false);
        bot.shotCooldown -= dt;
        if (bot.shotCooldown <= 0) {
          fireWeapon(bot, bot.aim, bot.id);
          bot.shotCooldown = bot.class === "SNIPER" ? 1.08 : 0.72 + Math.random() * 0.45;
        }
        continue;
      }
      const target = targetResult.player;
      const deltaX = target.x - bot.x;
      const deltaY = target.y - bot.y;
      const direction = Math.sign(deltaX);
      const platform = nearestPlatform(bot.x + bot.width / 2, bot.y + bot.height);
      const targetPlatform = nearestPlatform(target.x + target.width / 2, target.y + target.height);
      let move = Math.abs(deltaX) > 300 ? direction : Math.abs(deltaX) > 135 ? direction * 0.32 : -direction * 0.35;
      const supply = state.crates.filter((crate) => crate.landed).reduce((best, crate) => {
        const distance = Math.hypot(crate.x - bot.x, crate.y - bot.y);
        return distance < (best?.distance ?? Infinity) ? { crate, distance } : best;
      }, null);
      if (supply && supply.distance < 520) move = Math.sign(supply.crate.x - bot.x);
      const danger = bot.x + direction * 80 < 38 || bot.x + direction * 80 > WORLD.width - 35;
      if (danger) move = -direction;
      const needsClimb = target.y + target.height < bot.y - 120;
      bot.aiJump -= dt;
      let jumpPressed = false;
      if (bot.grounded && bot.y > BOT_CEILING_Y + 100 && bot.aiJump < 0 && (Math.abs(deltaX) < 700 || needsClimb)) {
        jumpPressed = true;
        bot.aiJump = 0.9 + Math.random() * 1.3;
      }
      if (supply && supply.distance < 380 && supply.crate.y < bot.y - 48 &&
          bot.grounded && bot.y > BOT_CEILING_Y + 100) {
        jumpPressed = true;
        bot.aiJump = 0.7 + Math.random() * 0.6;
      }
      if (platform && !bot.grounded && Math.abs(deltaX) > 100 && needsClimb) move = direction;
      if (!bot.grounded && bot.vy > 60 && bot.jumps < 2 &&
          bot.y + bot.height > LAVA_SURFACE_BASE_Y - 200) jumpPressed = true;
      applyPhysics(bot, { move, jumpPressed, climb: needsClimb }, dt, false);
      bot.aim = Math.atan2(deltaY - 8, deltaX);
      bot.facing = Math.cos(bot.aim) >= 0 ? 1 : -1;
      bot.shotCooldown -= dt;
      const range = bot.class === "SNIPER" ? 880 : 640;
      if (targetResult.distance < range && bot.shotCooldown <= 0) {
        const chance = targetResult.distance < 430 ? 0.86 : 0.63;
        if (Math.random() < chance) fireWeapon(bot, bot.aim, bot.id);
        bot.shotCooldown = bot.class === "SNIPER" ? 1.08 : 0.72 + Math.random() * 0.45;
      }
    }
  }

  function fireWeapon(shooter, angle, ownerId = shooter.id) {
    const weapon = weapons[shooter.weapon] || weapons["PLASMA PISTOL"];
    const muzzleX = shooter.x + shooter.width / 2 + Math.cos(angle) * 26;
    const muzzleY = shooter.y + shooter.height * 0.42 + Math.sin(angle) * 20;
    for (let index = 0; index < weapon.count; index += 1) {
      const spread = weapon.count === 1 ? (Math.random() - 0.5) * weapon.spread : (index - (weapon.count - 1) / 2) * weapon.spread * 0.5;
      const bulletAngle = angle + spread;
      state.bullets.push({
        x: muzzleX, y: muzzleY, vx: Math.cos(bulletAngle) * weapon.speed, vy: Math.sin(bulletAngle) * weapon.speed,
        owner: ownerId, faction: shooter === state.player ? "player" : state.mode === "online" && shooter !== state.player ? "bot" : "bot",
        color: weapon.color, damage: weapon.damage, life: 1.55, weapon: shooter.weapon,
      });
    }
    addParticle(muzzleX, muzzleY, weapon.color, 5, 90);
    if (shooter === state.player) {
      sound(shooter.weapon === "RAIL SNIPER" ? 210 : shooter.weapon === "NEON SHOTGUN" ? 155 : 360, 0.1, "square");
      if (state.socket?.connected && state.mode === "online") {
        state.socket.emit("player:fire", { x: muzzleX, y: muzzleY, aim: angle, weapon: shooter.weapon });
      }
    } else {
      sound(260, 0.06, "square", 0.035);
    }
  }

  function firePlayer() {
    const player = state.player;
    if (!player || player.dead || player.shotCooldown > 0) return;
    if (player.ammo <= 0) {
      equipWeapon("PLASMA PISTOL");
      notify("Munición agotada. Volviste a la pistola de plasma.", "info");
    }
    fireWeapon(player, player.aim, player.id);
    const weapon = weapons[player.weapon] || weapons["PLASMA PISTOL"];
    player.shotCooldown = weapon.cooldown;
    if (player.ammo !== Infinity) {
      player.ammo = Math.max(0, player.ammo - 1);
      player.weaponAmmo[player.weapon] = player.ammo;
    }
  }

  function equipWeapon(name) {
    const player = state.player;
    if (!player || !Object.prototype.hasOwnProperty.call(player.weaponAmmo, name)) return false;
    player.weapon = name;
    player.ammo = player.weaponAmmo[name];
    updateHud();
    return true;
  }

  function segmentHitsRect(x1, y1, x2, y2, left, top, right, bottom) {
    let near = 0;
    let far = 1;
    const dx = x2 - x1;
    const dy = y2 - y1;
    for (const [origin, delta, min, max] of [[x1, dx, left, right], [y1, dy, top, bottom]]) {
      if (Math.abs(delta) < 0.0001) {
        if (origin < min || origin > max) return false;
        continue;
      }
      let first = (min - origin) / delta;
      let last = (max - origin) / delta;
      if (first > last) [first, last] = [last, first];
      near = Math.max(near, first);
      far = Math.min(far, last);
      if (near > far) return false;
    }
    return true;
  }

  function awardKill(entity) {
    if (!entity) return;
    entity.score = (Number(entity.score) || 0) + 1;
    entity.streak = (Number(entity.streak) || 0) + 1;
  }

  function updateBullets(dt) {
    for (let index = state.bullets.length - 1; index >= 0; index -= 1) {
      const bullet = state.bullets[index];
      const previousX = bullet.x;
      const previousY = bullet.y;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      let hit = bullet.life <= 0 || bullet.x < 0 || bullet.x > WORLD.width || bullet.y < 0 || bullet.y > WORLD.height;
      if (!hit) {
        for (const [x, y, width, height] of platforms()) {
          if (segmentHitsRect(previousX, previousY, bullet.x, bullet.y, x - 2, y - 2, x + width + 2, y + height + 2)) {
            hit = true;
            addParticle(bullet.x, bullet.y, bullet.color, 3, 90);
            break;
          }
        }
      }
      if (!hit && bullet.faction === "player") {
        for (const bot of state.bots) {
          if (bot.dead || bot.invulnerable > 0) continue;
          if (segmentHitsRect(previousX, previousY, bullet.x, bullet.y, bot.x - 2, bot.y - 2, bot.x + bot.width + 2, bot.y + bot.height + 2)) {
            const critical = bullet.weapon === "RAIL SNIPER" || Math.random() < (classes[state.player.class]?.critical || 1) * 0.075;
            bot.hp = Math.max(0, bot.hp - bullet.damage * (critical ? classes[state.player.class]?.critical || 1 : 1));
            bot.lastHitBy = state.player;
            bot.lastHitAt = performance.now();
            addParticle(bullet.x, bullet.y, critical ? colors.yellow : bot.color, 10, 180);
            if (state.screenShake && critical) state.shake += 4;
            if (bot.hp <= 0) {
              awardKill(state.player);
              eliminate(bot, state.player.name);
            }
            hit = true;
            break;
          }
        }
        if (!hit && state.mode === "online") {
          for (const remote of state.remotePlayers.values()) {
            if (remote.dead || remote.id === state.player.id) continue;
            if (segmentHitsRect(previousX, previousY, bullet.x, bullet.y, remote.x - 2, remote.y - 2, remote.x + remote.width + 2, remote.y + remote.height + 2)) {
              remote.hp = Math.max(0, remote.hp - bullet.damage);
              addParticle(bullet.x, bullet.y, remote.color || colors.pink, 8, 150);
              if (remote.hp <= 0) {
                remote.hp = 0;
                remote.dead = true;
                awardKill(state.player);
                remote.streak = 0;
                state.socket?.emit("player:elimination", { victimId: remote.id });
              }
              hit = true;
              break;
            }
          }
        }
      } else if (!hit && bullet.faction === "bot") {
        const player = state.player;
        if (player && !player.dead && player.invulnerable <= 0 &&
          segmentHitsRect(previousX, previousY, bullet.x, bullet.y, player.x - 2, player.y - 2, player.x + player.width + 2, player.y + player.height + 2)) {
          player.hp = Math.max(0, player.hp - bullet.damage * (classes[player.class]?.recoil || 1));
          addParticle(bullet.x, bullet.y, colors.pink, 8, 155);
          state.shake += 4;
          const killer = state.bots.find((candidate) => candidate.id === bullet.owner);
          player.lastHitBy = killer || null;
          player.lastHitAt = performance.now();
          if (player.hp <= 0) {
            awardKill(killer);
            eliminate(player, killer?.name || bullet.owner);
          }
          hit = true;
        }
        if (!hit) {
          for (const target of state.bots) {
            if (target.dead || target.invulnerable > 0 || target.id === bullet.owner) continue;
            if (segmentHitsRect(previousX, previousY, bullet.x, bullet.y, target.x - 2, target.y - 2, target.x + target.width + 2, target.y + target.height + 2)) {
              target.hp = Math.max(0, target.hp - bullet.damage * (classes[target.class]?.recoil || 1));
              target.lastHitBy = state.bots.find((candidate) => candidate.id === bullet.owner) || null;
              target.lastHitAt = performance.now();
              addParticle(bullet.x, bullet.y, target.color, 8, 145);
              if (target.hp <= 0) {
                const killer = state.bots.find((candidate) => candidate.id === bullet.owner);
                awardKill(killer);
                eliminate(target, killer?.name || "BOT");
              }
              hit = true;
              break;
            }
          }
        }
      } else if (!hit && bullet.faction === "remote" && bullet.owner !== state.player?.id) {
        const player = state.player;
        if (player && !player.dead && player.invulnerable <= 0 &&
          segmentHitsRect(previousX, previousY, bullet.x, bullet.y, player.x - 2, player.y - 2, player.x + player.width + 2, player.y + player.height + 2)) {
          player.hp = Math.max(0, player.hp - bullet.damage * (classes[player.class]?.recoil || 1));
          addParticle(bullet.x, bullet.y, bullet.color, 7, 140);
          if (player.hp <= 0) eliminate(player, bullet.owner);
          hit = true;
        }
      }
      if (hit) state.bullets.splice(index, 1);
    }
  }

  function eliminate(entity, killerName, cause) {
    if (entity.dead) return;
    entity.dead = true;
    entity.streak = 0;
    addParticle(entity.x + entity.width / 2, entity.y + entity.height / 2, entity.color, 24, 300);
    entity.height = PLAYER_STANDING_HEIGHT;
    entity.crouching = false;
    entity.sliding = false;
    entity.slideTime = 0;
    entity.slideCooldown = 0;
    entity.grounded = false;
    entity.coyote = 0;
    entity.jumps = 0;
    entity.jumpBoostTime = 0;
    entity.climbing = false;
    entity.grapple = null;
    state.shake += 9;
    if (entity === state.player) {
      state.deaths += 1;
      pushFeed(cause === "lava" ? `${entity.name} CAYÓ EN LA LAVA` : `${entity.name} FUE ELIMINADO`, cause === "lava" ? "#ff8c2a" : colors.pink);
      entity.respawnAt = performance.now() + 1700;
      entity.respawnDelay = 1700;
      setTimeout(() => {
        if (!state.active) return;
        if (state.paused) {
          entity.pendingRespawn = true;
          return;
        }
        respawnEntity(entity);
      }, 1700);
    } else {
      pushFeed(cause === "lava" ? `${entity.name} CAYÓ EN LA LAVA` : `${killerName} ELIMINÓ A ${entity.name}`, cause === "lava" ? "#ff8c2a" : state.player?.color || colors.cyan);
      setTimeout(() => {
        if (!state.active || !state.bots.includes(entity)) return;
        if (state.paused) {
          entity.pendingRespawn = true;
          return;
        }
        respawnBot(entity);
      }, 3000);
    }
    sound(120, 0.35, "sawtooth", 0.14);
    updateHud();
  }

  function respawnEntity(entity) {
    const spawn = randomSpawnPoint();
    entity.x = spawn.x;
    entity.y = spawn.y;
    entity.vx = 0;
    entity.vy = 0;
    entity.height = PLAYER_STANDING_HEIGHT;
    entity.hp = entity.maxHp;
    entity.dead = false;
    entity.invulnerable = 2;
    entity.grounded = false;
    entity.climbStamina = classes[entity.class]?.stamina || 240;
    entity.pendingRespawn = false;
    updateHud();
  }

  function respawnBot(entity) {
    const spawn = randomSpawnPoint();
    entity.x = spawn.x;
    entity.y = spawn.y;
    entity.hp = entity.maxHp;
    entity.vx = 0;
    entity.vy = 0;
    entity.height = PLAYER_STANDING_HEIGHT;
    entity.dead = false;
    entity.invulnerable = 1;
    entity.grounded = false;
    entity.climbing = false;
    entity.grapple = null;
    entity.climbStamina = classes[entity.class]?.stamina || 200;
    entity.fatigued = false;
    entity.jumps = 0;
    entity.jumpBoostTime = 0;
    entity.aim = Math.PI;
    entity.shotCooldown = 0.5;
    entity.aiJump = 1.2 + Math.random() * 1.1;
    entity.squash = 1;
    entity.pendingRespawn = false;
  }

  function dropCrate() {
    const x = 180 + Math.random() * (WORLD.width - 360);
    const platform = platformUnderOrNear(x);
    state.crates.push({
      id: `offline-${Math.random().toString(36).slice(2)}`,
      x, y: -60, targetY: platform ? platform[1] - 32 : 590,
      weapon: ["CYBER RIFLE", "NEON SHOTGUN", "RAIL SNIPER"][Math.floor(Math.random() * 3)],
      landed: false, age: 0, phase: Math.random() * 7,
    });
  }

  function makeSyncedCrate(data) {
    const platform = platformUnderOrNear(data.x);
    const targetY = platform ? platform[1] - 32 : 590;
    const age = Math.max(0, (Date.now() - Number(data.createdAt || Date.now())) / 1000);
    const y = Math.min(targetY, -60 + age * 90);
    return {
      id: data.id,
      x: data.x,
      y,
      targetY,
      weapon: data.weapon,
      landed: y >= targetY,
      age,
      phase: age * 2,
    };
  }

  function collectCrateForPlayer(crate) {
    if (!state.player) return;
    const item = weapons[crate.weapon];
    if (!item) return;
    state.player.weapon = crate.weapon;
    state.player.ammo = item.ammo;
    state.player.weaponAmmo[crate.weapon] = item.ammo;
    state.crates = state.crates.filter((current) => current.id !== crate.id);
    pushFeed(`${state.player.name} RECOGIÓ ${crate.weapon}`, item.color);
    notify(`${weaponLabels[crate.weapon] || crate.weapon} equipada`, "success");
    sound(720, 0.22, "sine");
    updateHud();
  }

  function updateCrates(dt) {
    state.gameElapsed += dt;
    if (state.mode === "offline" && state.gameElapsed - state.lastCrateAt > 6) {
      dropCrate();
      state.lastCrateAt = state.gameElapsed;
    }
    for (let index = state.crates.length - 1; index >= 0; index -= 1) {
      const crate = state.crates[index];
      crate.age += dt;
      crate.phase += dt * 2;
      if (!crate.landed) {
        crate.y += 90 * dt;
        if (crate.y >= crate.targetY) {
          crate.y = crate.targetY;
          crate.landed = true;
          sound(430, 0.2, "triangle");
          addParticle(crate.x + 16, crate.y + 18, colors.cyan, 13, 150);
        }
      }
      if (state.player && Math.abs(state.player.x + 15 - (crate.x + 16)) < 42 &&
          Math.abs(state.player.y + 30 - (crate.y + 18)) < 48) {
        if (state.mode === "online" && state.socket?.connected) {
          if (!crate.pending) {
            crate.pending = true;
            state.socket.emit("crate:pickup", { id: crate.id, targetY: crate.targetY }, (result) => {
              if (result?.ok) collectCrateForPlayer(crate);
              else crate.pending = false;
            });
          }
        } else {
          collectCrateForPlayer(crate);
        }
        continue;
      }
      const bot = state.bots.find((candidate) => !candidate.dead &&
        Math.abs(candidate.x + 15 - (crate.x + 16)) < 42 &&
        Math.abs(candidate.y + 30 - (crate.y + 18)) < 48);
      if (bot) {
        bot.weapon = crate.weapon;
        bot.ammo = weapons[crate.weapon].ammo;
        pushFeed(`${bot.name} RECOGIÓ ${crate.weapon}`, bot.color);
        sound(620, 0.14, "triangle", 0.05);
        state.crates.splice(index, 1);
      } else if (crate.age > 28) {
        state.crates.splice(index, 1);
      }
    }
  }

  function updateParticles(dt) {
    for (let index = state.particles.length - 1; index >= 0; index -= 1) {
      const particle = state.particles[index];
      particle.life -= dt;
      particle.vy += 560 * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.985;
      if (particle.life <= 0) state.particles.splice(index, 1);
    }
  }

  function updateNetwork(dt) {
    for (const remote of state.remotePlayers.values()) {
      if (Number.isFinite(remote.targetX)) {
        remote.x += (remote.targetX - remote.x) * Math.min(1, dt * 14);
        remote.y += (remote.targetY - remote.y) * Math.min(1, dt * 14);
        if (Number.isFinite(remote.targetHeight)) {
          remote.height += (remote.targetHeight - remote.height) * Math.min(1, dt * 18);
        }
        if (Number.isFinite(remote.targetAim)) remote.aim = remote.targetAim;
        remote.anim += dt * (Math.abs(remote.targetX - remote.x) > 1 ? 9 : 2);
      }
    }
    const player = state.player;
    if (state.socket?.connected && player && state.mode === "online" && performance.now() - state.lastNetworkAt > 55) {
      state.lastNetworkAt = performance.now();
      state.socket.emit("player:update", {
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        height: player.height,
        crouching: player.crouching,
        sliding: player.sliding,
        facing: player.facing,
        aim: player.aim,
        hp: player.hp,
        score: player.score,
        weapon: player.weapon,
      });
    }
  }

  function update(dt) {
    if (!state.active) {
      if (!state.paused && state.demo) updateDemo(dt);
      return;
    }
    if (state.paused) return;
    const player = state.player;
    if (!player) return;
    state.gameElapsed += dt;
    const mouse = cachedScreenToWorld(state.pointer.x, state.pointer.y);
    state.pointer.worldX = mouse.x;
    state.pointer.worldY = mouse.y;
    let aimX = mouse.x - player.x - player.width / 2;
    let aimY = mouse.y - player.y - player.height / 2;
    if (state.touchAim.active) {
      aimX = state.touchAim.x * 220;
      aimY = state.touchAim.y * 220;
    }
    const desiredAim = Math.atan2(aimY, aimX);
    const aimDelta = Math.atan2(Math.sin(desiredAim - player.aim), Math.cos(desiredAim - player.aim));
    if (state.touchAim.active) {
      player.aim += aimDelta * Math.min(1, dt * 60 * state.sensitivity);
    } else {
      player.aim = desiredAim;
    }
    if (Math.cos(player.aim) >= 0) player.facing = 1;
    else player.facing = -1;
    const jumpPressed = state.jumpQueued;
    state.jumpQueued = false;
    applyPhysics(player, {
      move: moveInput(),
      crouch: crouchInput(),
      sprint: sprintInput(),
      jumpPressed,
      grappleReleased: state.keys.has("grapple-release"),
    }, dt, true);
    if (fireInput()) firePlayer();
    if (state.mode === "offline") updateBots(dt);
    updateBullets(dt);
    updateCrates(dt);
    updateParticles(dt);
    updateLava(dt);
    updateNetwork(dt);
    state.cameraX += (Math.max(0, Math.min(WORLD.width - VIEW.width, player.x + player.width / 2 - VIEW.width / 2)) - state.cameraX) * Math.min(1, dt * 5);
    state.cameraY += (Math.max(0, Math.min(WORLD.height - VIEW.height, player.y + player.height / 2 - VIEW.height / 2)) - state.cameraY) * Math.min(1, dt * 5);
    state.roomCheckTimer += dt;
    if (state.roomCheckTimer > 1) {
      state.roomCheckTimer = 0;
      updateHud();
    }
    state.healthHudTimer += dt;
    if (state.healthHudTimer >= 0.12) {
      state.healthHudTimer = 0;
      updateHealthHud(player);
    }
    state.shake *= Math.pow(0.035, dt);
    if (state.shake < 0.15) state.shake = 0;
  }

  function updateDemoFrame(dt) {
    if (state.active || !state.demo) return;
    if (document.body.dataset.screen === "game") return;
    if (!state.advancedParticles && state.bullets.length > 30) state.bullets.length = 30;
    updateDemo(dt);
  }

  function buildBackgroundGradients() {
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW.height);
    sky.addColorStop(0, "#081426");
    sky.addColorStop(0.52, "#161936");
    sky.addColorStop(1, "#572b45");
    state.bgSky = sky;
    const haze = ctx.createRadialGradient(640, 500, 20, 640, 500, 620);
    haze.addColorStop(0, "rgba(255,104,72,.56)");
    haze.addColorStop(0.45, "rgba(202,58,128,.14)");
    haze.addColorStop(1, "rgba(0,0,0,0)");
    state.bgHaze = haze;
  }

  function drawBackground() {
    if (!state.bgSky) buildBackgroundGradients();
    ctx.fillStyle = state.bgSky;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);

    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = state.bgHaze;
    ctx.fillRect(0, 120, VIEW.width, VIEW.height - 120);
    ctx.restore();

    drawCityLayer(0.12, "#121a33", 215, 165, 0.35);
    drawCityLayer(0.28, "#17223a", 260, 118, 0.65);
    drawCityLayer(0.48, "#201c38", 205, 112, 0.88);

    ctx.save();
    const signCount = state.lowPower ? Math.max(2, Math.ceil(VIEW.width / 220) + 1) : 7;
    for (let index = 0; index < signCount; index += 1) {
      const x = ((index * 217 - state.cameraX * 0.32) % (VIEW.width + 280)) - 100;
      const y = 120 + (index % 3) * 65;
      ctx.fillStyle = index % 2 ? "rgba(0,243,255,.08)" : "rgba(255,42,133,.08)";
      ctx.strokeStyle = index % 2 ? "rgba(0,243,255,.5)" : "rgba(255,42,133,.46)";
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, 104, 67);
      ctx.strokeRect(x, y, 104, 67);
      ctx.fillStyle = "rgba(220,243,255,.74)";
      ctx.font = "700 10px monospace";
      ctx.fillText(["NOVA", "NEON", "AR3NA", "CYBER", "NIGHT"][index % 5], x + 10, y + 26);
      ctx.fillStyle = index % 2 ? colors.cyan : colors.pink;
      ctx.fillRect(x + 10, y + 39, 35 + Math.sin(state.gameElapsed + index) * 6, 3);
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(5,9,19,.8)";
    ctx.lineWidth = 5;
    for (let index = 0; index < 6; index += 1) {
      const x = (index * 260 + 54 - state.cameraX * 0.55) % (VIEW.width + 300);
      ctx.beginPath();
      ctx.moveTo(x - 120, -12);
      ctx.quadraticCurveTo(x, 110 + index % 3 * 30, x + 115, 16);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCityLayer(parallax, color, base, heightRange, windowChance) {
    const offset = (state.cameraX * parallax) % base;
    const first = Math.floor(state.cameraX * parallax / base);
    for (let i = -1; i < VIEW.width / base + 3; i += 1) {
      const index = first + i;
      const x = i * base - offset;
      const height = heightRange + ((index * 37 + 79) % 180);
      const y = VIEW.height - height - (index % 3) * 12;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, base - 8, height);
      ctx.fillStyle = "rgba(0,0,0,.18)";
      ctx.fillRect(x + 5, y + 5, base - 18, height - 10);
      const columns = Math.max(2, Math.floor(base / 28));
      const rows = Math.floor(height / 34);
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const hash = Math.abs(Math.sin((index + 4) * 56.13 + row * 21 + column * 5.2));
          if (hash > windowChance) {
            ctx.fillStyle = hash > 0.8 ? "rgba(255,42,133,.72)" : "rgba(0,243,255,.56)";
            ctx.fillRect(x + 10 + column * 22, y + 15 + row * 28, 6, 12);
          }
        }
      }
    }
  }

  function lavaSurfaceY(x) {
    const t = state.lavaTime;
    return LAVA_SURFACE_BASE_Y +
      Math.sin(x * 0.0062 + t * 0.85) * 7 +
      Math.sin(x * 0.0141 - t * 1.6) * 4 +
      Math.sin(x * 0.0021 + t * 0.35) * 5;
  }

  function acquireLavaParticle() {
    return state.lavaParticlePool.pop() || {};
  }

  function releaseLavaParticle(index) {
    const particle = state.lavaParticles[index];
    state.lavaParticles.splice(index, 1);
    if (state.lavaParticlePool.length < 140) state.lavaParticlePool.push(particle);
  }

  function spawnLavaBubble() {
    const particle = acquireLavaParticle();
    particle.kind = "bubble";
    particle.x = state.cameraX - 60 + Math.random() * (VIEW.width + 120);
    particle.y = LAVA_SURFACE_BASE_Y + 40 + Math.random() * 90;
    particle.r = 2.5 + Math.random() * 4.5;
    particle.vy = -(12 + Math.random() * 22);
    particle.drift = 6;
    particle.phase = Math.random() * 7;
    particle.life = 2.4;
    state.lavaParticles.push(particle);
  }

  function spawnLavaEmber() {
    const particle = acquireLavaParticle();
    const x = state.cameraX - 40 + Math.random() * (VIEW.width + 80);
    particle.kind = "ember";
    particle.x = x;
    particle.y = lavaSurfaceY(x) - 4;
    particle.vx = (Math.random() - 0.5) * 26;
    particle.vy = -(36 + Math.random() * 62);
    particle.size = 1.4 + Math.random() * 2.2;
    particle.life = 1.1 + Math.random() * 1.3;
    particle.maxLife = particle.life;
    particle.phase = Math.random() * 7;
    state.lavaParticles.push(particle);
  }

  function spawnLavaSplash(x, y, count, power) {
    for (let i = 0; i < count; i += 1) {
      const particle = acquireLavaParticle();
      particle.kind = "splash";
      particle.x = x + (Math.random() - 0.5) * 26;
      particle.y = y - 2;
      particle.vx = (Math.random() - 0.5) * power;
      particle.vy = -(90 + Math.random() * power * 0.8);
      particle.size = 2 + Math.random() * 3.4;
      particle.color = Math.random() < 0.5 ? "#ffb347" : "#ff7418";
      particle.life = 0.5 + Math.random() * 0.55;
      particle.maxLife = particle.life;
      state.lavaParticles.push(particle);
    }
    if (state.advancedParticles) {
      for (let i = 0; i < 4; i += 1) {
        const particle = acquireLavaParticle();
        particle.kind = "smoke";
        particle.x = x + (Math.random() - 0.5) * 34;
        particle.y = y - 6 - Math.random() * 12;
        particle.vx = (Math.random() - 0.5) * 14;
        particle.vy = -(24 + Math.random() * 26);
        particle.size = 7 + Math.random() * 10;
        particle.life = 1.2 + Math.random() * 0.9;
        particle.maxLife = particle.life;
        state.lavaParticles.push(particle);
      }
    }
  }

  function bigLavaSplash(x, surface) {
    spawnLavaSplash(x, surface, state.advancedParticles ? 18 : 8, 260);
  }

  function lavaDeath(entity, isPlayer) {
    if (entity.dead) return;
    const surface = lavaSurfaceY(entity.x + entity.width / 2);
    bigLavaSplash(entity.x + entity.width / 2, surface);
    if (state.screenShake) state.shake += 7;
    sound(85, 0.55, "sawtooth", 0.2);
    sound(1250, 0.28, "square", 0.05);
    const shooter = entity.lastHitBy;
    if (shooter && !shooter.dead && shooter !== entity &&
        performance.now() - (entity.lastHitAt || 0) < LAVA_KILL_CREDIT_WINDOW) {
      awardKill(shooter);
    }
    entity.lastHitBy = null;
    eliminate(entity, "LAVA", "lava");
  }

  function updateLava(dt) {
    state.lavaBubbleTimer -= dt;
    if (state.lavaBubbleTimer <= 0) {
      state.lavaBubbleTimer = (state.advancedParticles ? 0.34 : 1.1) + Math.random() * 0.6;
      spawnLavaBubble();
    }
    state.lavaEmberTimer -= dt;
    if (state.lavaEmberTimer <= 0) {
      state.lavaEmberTimer = (state.advancedParticles ? 0.16 : 0.5) + Math.random() * 0.2;
      spawnLavaEmber();
    }
    for (let index = state.lavaParticles.length - 1; index >= 0; index -= 1) {
      const particle = state.lavaParticles[index];
      particle.life -= dt;
      particle.phase += dt;
      if (particle.kind === "bubble") {
        particle.y += particle.vy * dt;
        particle.x += Math.sin(particle.phase * 2) * particle.drift * dt;
        if (particle.y <= lavaSurfaceY(particle.x) + 2 || particle.life <= 0) {
          spawnLavaSplash(particle.x, lavaSurfaceY(particle.x), state.advancedParticles ? 3 : 2, 120);
          releaseLavaParticle(index);
        }
      } else if (particle.kind === "splash") {
        particle.vy += 760 * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        if (particle.life <= 0 || particle.y > lavaSurfaceY(particle.x) + 12) releaseLavaParticle(index);
      } else if (particle.kind === "ember") {
        particle.y += particle.vy * dt;
        particle.x += (particle.vx + Math.sin(particle.phase * 3) * 18) * dt;
        particle.vy *= Math.exp(-0.4 * dt);
        if (particle.life <= 0) releaseLavaParticle(index);
      } else {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.size += 14 * dt;
        if (particle.life <= 0) releaseLavaParticle(index);
      }
    }
    for (const remote of state.remotePlayers.values()) {
      const foot = remote.y + (remote.height || PLAYER_STANDING_HEIGHT);
      const surface = lavaSurfaceY(remote.x + 15);
      if (!remote.lavaWet && foot >= surface) {
        remote.lavaWet = true;
        bigLavaSplash(remote.x + 15, surface);
        sound(95, 0.4, "sawtooth", 0.08);
      } else if (remote.lavaWet && foot < surface - 170) {
        remote.lavaWet = false;
      }
    }
  }

  function drawLava() {
    const t = state.lavaTime;
    const left = state.cameraX - 40;
    const right = state.cameraX + VIEW.width + 40;
    const bottomY = WORLD.height + 120 - state.cameraY;
    const step = 26;

    const path = new Path2D();
    path.moveTo(left - state.cameraX, lavaSurfaceY(left) - state.cameraY);
    for (let x = left + step; x <= right + step; x += step) {
      path.lineTo(x - state.cameraX, lavaSurfaceY(x) - state.cameraY);
    }
    path.lineTo(right + step - state.cameraX, bottomY);
    path.lineTo(left - state.cameraX, bottomY);
    path.closePath();

    const topY = LAVA_SURFACE_BASE_Y - 22 - state.cameraY;
    const base = ctx.createLinearGradient(0, topY, 0, topY + 300);
    base.addColorStop(0, "#ffb347");
    base.addColorStop(0.14, "#ff7418");
    base.addColorStop(0.5, "#e03a08");
    base.addColorStop(1, "#701203");
    ctx.fillStyle = base;
    ctx.fill(path);

    ctx.save();
    ctx.clip(path);
    const blobSpacing = 132;
    for (let i = Math.floor(left / blobSpacing); i * blobSpacing < right; i += 1) {
      const h1 = Math.abs(Math.sin(i * 56.13));
      const h2 = Math.abs(Math.sin(i * 21.7 + 3));
      const bx = i * blobSpacing + h1 * 70 + Math.sin(t * 0.16 + i) * 16 - state.cameraX;
      const by = LAVA_SURFACE_BASE_Y + 55 + h2 * 150 - state.cameraY;
      const br = 16 + h1 * 26;
      ctx.fillStyle = i % 2 ? "rgba(96,12,4,.5)" : "rgba(255,150,60,.2)";
      ctx.beginPath();
      ctx.ellipse(bx, by, br, br * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const particle of state.lavaParticles) {
      if (particle.kind !== "bubble") continue;
      const bx = particle.x - state.cameraX;
      if (bx < -30 || bx > VIEW.width + 30) continue;
      ctx.fillStyle = "rgba(255,190,90,.85)";
      ctx.strokeStyle = "rgba(255,224,130,.9)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, particle.y - state.cameraY, particle.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    const cellSpacing = 64;
    ctx.lineWidth = 2.4;
    for (let i = Math.floor(left / cellSpacing); i * cellSpacing < right; i += 1) {
      const h = Math.abs(Math.sin(i * 12.9898));
      const worldX = i * cellSpacing + h * 22;
      const cx = worldX + Math.sin(t * 0.4 + i * 1.7) * 9 - state.cameraX;
      if (cx < -40 || cx > VIEW.width + 40) continue;
      const cy = lavaSurfaceY(worldX) + 5 - state.cameraY;
      const rx = 20 + h * 10 + Math.sin(t * 0.9 + i) * 3;
      const ry = 8 + h * 4 + Math.sin(t * 1.1 + i * 2) * 1.6;
      const alpha = Math.min(1, 0.72 + Math.sin(t * 1.3 + i * 2.4) * 0.22);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,140,42,${alpha.toFixed(3)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255,211,94,${Math.min(1, alpha + 0.2).toFixed(3)})`;
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,226,120,.95)";
    ctx.lineWidth = 3;
    ctx.shadowBlur = state.lowPower ? 0 : 14;
    ctx.shadowColor = "rgba(255,150,40,.9)";
    ctx.stroke(path);
    ctx.shadowBlur = 0;

    const glowAlpha = 0.15 + Math.sin(t * 2.1) * 0.05;
    const glow = ctx.createLinearGradient(0, LAVA_SURFACE_BASE_Y - 140 - state.cameraY, 0, LAVA_SURFACE_BASE_Y - state.cameraY);
    glow.addColorStop(0, "rgba(255,120,30,0)");
    glow.addColorStop(1, `rgba(255,130,35,${glowAlpha.toFixed(3)})`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, LAVA_SURFACE_BASE_Y - 140 - state.cameraY, VIEW.width, 140);

    for (const particle of state.lavaParticles) {
      if (particle.kind === "bubble") continue;
      const px = particle.x - state.cameraX;
      if (px < -40 || px > VIEW.width + 40) continue;
      const py = particle.y - state.cameraY;
      const lifeRatio = Math.max(0, particle.life / (particle.maxLife || 1));
      ctx.globalAlpha = lifeRatio;
      if (particle.kind === "splash") {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(px, py, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.kind === "ember") {
        ctx.fillStyle = "#ffd35e";
        ctx.shadowBlur = state.lowPower ? 0 : 8;
        ctx.shadowColor = "#ff9a2a";
        ctx.beginPath();
        ctx.arc(px, py, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = `rgba(88,86,96,${(0.28 * lifeRatio).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawLavaPlatformGlow() {
    const pulse = 0.78 + Math.sin(state.lavaTime * 1.6) * 0.12;
    for (const [x, y, width, height] of platforms()) {
      if (x + width < state.cameraX - 40 || x > state.cameraX + VIEW.width + 40) continue;
      const distance = Math.max(0, LAVA_SURFACE_BASE_Y - (y + height));
      if (distance > 140) continue;
      const strength = (1 - distance / 140) * pulse;
      const py = y - state.cameraY;
      const glowHeight = Math.min(height, 60);
      const gradient = ctx.createLinearGradient(0, py + height - glowHeight, 0, py + height);
      gradient.addColorStop(0, "rgba(255,120,30,0)");
      gradient.addColorStop(1, `rgba(255,140,40,${(0.5 * strength).toFixed(3)})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x - state.cameraX, py + height - glowHeight, width, glowHeight);
    }
  }

  function drawPlatform([x, y, width, height], index) {
    const px = x - state.cameraX;
    const py = y - state.cameraY;
    if (px + width < -30 || px > VIEW.width + 30) return;
    const gradient = ctx.createLinearGradient(0, py, 0, py + Math.max(height, 34));
    gradient.addColorStop(0, "#273454");
    gradient.addColorStop(0.17, "#131d32");
    gradient.addColorStop(1, "#080e1b");
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = index % 2 ? colors.cyan : colors.pink;
    ctx.fillStyle = gradient;
    ctx.fillRect(px, py, width, Math.max(height, 34));
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#405273";
    ctx.fillRect(px, py, width, 7);
    ctx.fillStyle = index % 3 ? colors.cyan : colors.pink;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(px + 6, py + 6, Math.min(width - 12, 55), 2);
    ctx.globalAlpha = 0.42;
    for (let k = 1; k < width / 48; k += 1) {
      ctx.fillStyle = "#7283a0";
      ctx.fillRect(px + k * 48, py + 15, 18, 2);
    }
    ctx.globalAlpha = 1;
    for (let k = 0; k < 2; k += 1) {
      ctx.fillStyle = "rgba(1,5,13,.65)";
      ctx.fillRect(px + 14 + k * Math.max(38, width - 42), py + 13, 8, 8);
    }
    if (height > 50) {
      ctx.strokeStyle = "rgba(148,179,213,.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 8, py + 18);
      ctx.lineTo(px + width - 8, py + 18);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCrate(crate) {
    const x = crate.x - state.cameraX;
    const y = crate.y - state.cameraY;
    ctx.save();
    if (!crate.landed) {
      const canopyY = y - 53;
      ctx.strokeStyle = "rgba(0,243,255,.64)";
      ctx.lineWidth = 1;
      for (const dx of [-14, 14]) {
        ctx.beginPath();
        ctx.moveTo(x + 16 + dx, canopyY + 23);
        ctx.lineTo(x + 16, y + 4);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(21,195,224,.3)";
      ctx.strokeStyle = colors.cyan;
      ctx.beginPath();
      ctx.arc(x + 16, canopyY + 20, 25, Math.PI, Math.PI * 2);
      ctx.lineTo(x + 41, canopyY + 23);
      ctx.lineTo(x - 9, canopyY + 23);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.shadowBlur = 16;
    ctx.shadowColor = weapons[crate.weapon]?.color || colors.cyan;
    ctx.fillStyle = "#14223a";
    ctx.fillRect(x, y, 32, 29);
    ctx.strokeStyle = weapons[crate.weapon]?.color || colors.cyan;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, 28, 25);
    ctx.fillStyle = colors.white;
    ctx.fillRect(x + 13, y + 8, 6, 13);
    ctx.fillStyle = weapons[crate.weapon]?.color || colors.cyan;
    ctx.fillRect(x + 8, y + 12, 16, 4);
    ctx.restore();
    if (crate.landed) {
      ctx.fillStyle = "rgba(0,0,0,.72)";
      ctx.fillRect(x - 25, y - 22, 82, 16);
      ctx.fillStyle = weapons[crate.weapon]?.color || colors.cyan;
      ctx.font = "700 9px monospace";
      ctx.fillText(crate.weapon, x - 20, y - 11);
    }
  }

  function drawCharacter(character, isPlayer = false) {
    if (!character || character.dead) return;
    const x = character.x - state.cameraX;
    const y = character.y - state.cameraY;
    if (x < -80 || x > VIEW.width + 80 || y < -80 || y > VIEW.height + 80) return;
    const aim = Number.isFinite(character.aim) ? character.aim : 0;
    const facing = Math.cos(aim) >= 0 ? 1 : -1;
    const lean = Math.sin(character.anim * 0.5) * Math.min(0.09, Math.abs(character.vx || 0) * 0.0002);
    const run = Math.sin(character.anim) * Math.min(1, Math.abs(character.vx || 0) / 240);
    ctx.save();
    if (character.invulnerable > 0 && Math.floor(performance.now() / 100) % 2 === 0) ctx.globalAlpha = 0.55;
    ctx.translate(x + character.width / 2, y + character.height / 2);
    const squash = character.squash || 1;
    const poseScaleY = character.sliding ? 0.56 : character.crouching ? 0.74 : 1;
    ctx.scale((character.sliding ? 1.14 : 1) * squash, poseScaleY * (2 - squash));
    ctx.rotate(lean);
    ctx.shadowBlur = isPlayer ? 20 : 12;
    ctx.shadowColor = character.color || colors.cyan;

    ctx.save();
    ctx.strokeStyle = "#101b2d";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-5, 11);
    ctx.lineTo(-9 + run * 5, 20);
    ctx.lineTo(-11 + run * 8, 23);
    ctx.moveTo(5, 11);
    ctx.lineTo(8 - run * 5, 20);
    ctx.lineTo(11 - run * 8, 23);
    ctx.stroke();
    ctx.strokeStyle = character.color || colors.cyan;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, 11);
    ctx.lineTo(-9 + run * 5, 20);
    ctx.moveTo(5, 11);
    ctx.lineTo(8 - run * 5, 20);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#122137";
    ctx.strokeStyle = character.color || colors.cyan;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-11, -4, 22, 20, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.fillRect(-6, 0, 12, 3);

    ctx.fillStyle = "#17263f";
    ctx.beginPath();
    ctx.roundRect(-10, -19, 20, 17, 6);
    ctx.fill();
    ctx.strokeStyle = character.color || colors.cyan;
    ctx.stroke();

    ctx.save();
    ctx.rotate(aim);
    const weapon = weapons[character.weapon] || weapons["PLASMA PISTOL"];
    ctx.strokeStyle = "#1c2b43";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(2, -5);
    ctx.lineTo(14, -4);
    ctx.stroke();
    ctx.fillStyle = "#17233a";
    ctx.strokeStyle = weapon.color;
    ctx.lineWidth = 1.5;
    if (character.weapon === "CYBER RIFLE") {
      ctx.fillRect(8, -10, 29, 8);
      ctx.strokeRect(8, -10, 29, 8);
      ctx.fillRect(34, -8, 13, 4);
      ctx.fillRect(4, -8, 6, 5);
      ctx.fillStyle = weapon.color;
      ctx.fillRect(16, -12, 9, 2);
      ctx.fillRect(18, -2, 5, 4);
    } else if (character.weapon === "NEON SHOTGUN") {
      ctx.fillRect(7, -12, 27, 11);
      ctx.strokeRect(7, -12, 27, 11);
      ctx.fillRect(31, -9, 17, 5);
      ctx.fillRect(13, -1, 7, 7);
      ctx.fillStyle = weapon.color;
      ctx.fillRect(20, -14, 8, 2);
      ctx.fillRect(25, -4, 5, 2);
    } else if (character.weapon === "RAIL SNIPER") {
      ctx.fillRect(8, -8, 35, 5);
      ctx.strokeRect(8, -8, 35, 5);
      ctx.fillRect(39, -7, 16, 3);
      ctx.fillRect(14, -12, 12, 3);
      ctx.fillRect(17, -11, 6, 1);
      ctx.fillRect(15, -3, 5, 7);
      ctx.fillStyle = weapon.color;
      ctx.fillRect(28, -10, 10, 2);
    } else {
      ctx.fillRect(10, -10, 18, 8);
      ctx.strokeRect(10, -10, 18, 8);
      ctx.fillRect(26, -8, 9, 4);
      ctx.fillRect(15, -3, 5, 6);
      ctx.fillStyle = weapon.color;
      ctx.fillRect(13, -12, 7, 2);
    }
    ctx.fillStyle = weapon.color;
    ctx.fillRect(7, -1, 5, 2);
    ctx.restore();

    ctx.save();
    ctx.scale(facing, 1);
    ctx.fillStyle = "#1b2941";
    ctx.beginPath();
    ctx.roundRect(-10, -31, 21, 17, 7);
    ctx.fill();
    ctx.strokeStyle = character.color || colors.cyan;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = character.color || colors.cyan;
    ctx.shadowBlur = 15;
    ctx.fillRect(1, -25, 8, 4);
    ctx.fillStyle = "rgba(255,255,255,.88)";
    ctx.fillRect(3, -25, 3, 2);
    ctx.restore();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(2,8,17,.82)";
    ctx.fillRect(-19, -43, 38, 5);
    ctx.fillStyle = character.hp > (character.maxHp || 100) * 0.35 ? colors.lime : colors.pink;
    ctx.fillRect(-19, -43, 38 * Math.max(0, character.hp / (character.maxHp || 100)), 3);
    if (isPlayer && (character.climbing || character.climbStamina < (classes[character.class]?.stamina || 240))) {
      const maxStamina = classes[character.class]?.stamina || 240;
      ctx.fillStyle = "rgba(2,8,17,.8)";
      ctx.fillRect(19, -18, 5, 36);
      ctx.fillStyle = character.fatigued ? colors.pink : colors.cyan;
      ctx.fillRect(20, 17 - 34 * Math.max(0, character.climbStamina / maxStamina), 3, 34 * Math.max(0, character.climbStamina / maxStamina));
      ctx.strokeStyle = "rgba(227,246,255,.55)";
      ctx.lineWidth = 1;
      ctx.strokeRect(19, -18, 5, 36);
    }
    ctx.font = "700 9px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#e8f6ff";
    ctx.fillText(character.name, 0, -48);
    const streak = Math.max(0, Math.floor(Number(character.streak) || 0));
    if (streak > 0) {
      const accent = streak >= 10 ? colors.pink : streak >= 5 ? colors.yellow : colors.cyan;
      const streakLabel = `RACHA x${streak}`;
      ctx.save();
      ctx.font = `700 ${Math.min(12, 9 + Math.floor(streak / 5))}px monospace`;
      ctx.textBaseline = "middle";
      const badgeWidth = ctx.measureText(streakLabel).width + 14;
      ctx.fillStyle = "rgba(3,8,20,.92)";
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.shadowColor = accent;
      ctx.shadowBlur = Math.min(20, 7 + streak);
      ctx.beginPath();
      ctx.roundRect(-badgeWidth / 2, -70, badgeWidth, 15, 4);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = accent;
      ctx.fillText(streakLabel, 0, -62.5);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawGrapple(player) {
    if (!player?.grapple) return;
    const x = player.x + player.width / 2 - state.cameraX;
    const y = player.y + player.height / 2 - state.cameraY;
    ctx.save();
    ctx.strokeStyle = "rgba(0,243,255,.8)";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = colors.cyan;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo((x + player.grapple.x - state.cameraX) / 2, y - 40, player.grapple.x - state.cameraX, player.grapple.y - state.cameraY);
    ctx.stroke();
    ctx.restore();
  }

  function drawAim(player) {
    const touchOnly = state.controlMode === "touch" ||
      (state.controlMode === "auto" && window.matchMedia("(pointer: coarse)").matches);
    if (!player || touchOnly) return;
    const x = state.pointer.worldX - state.cameraX;
    const y = state.pointer.worldY - state.cameraY;
    if (x < 0 || y < 0 || x > VIEW.width || y > VIEW.height) return;
    ctx.save();
    ctx.strokeStyle = "rgba(0,243,255,.6)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2 - state.cameraX, player.y + player.height / 2 - state.cameraY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = colors.cyan;
    ctx.shadowColor = colors.cyan;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x + 12, y);
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
    ctx.restore();
  }

  function drawBullets() {
    for (const bullet of state.bullets) {
      const x = bullet.x - state.cameraX;
      const y = bullet.y - state.cameraY;
      const angle = Math.atan2(bullet.vy, bullet.vx);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.shadowBlur = 14;
      ctx.shadowColor = bullet.color;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-18, -2, 24, 4);
      ctx.fillStyle = bullet.color;
      ctx.fillRect(-30, -1, 17, 2);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const particle of state.particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      ctx.shadowBlur = state.lowPower ? 0 : 8;
      ctx.shadowColor = particle.color;
      ctx.fillRect(particle.x - state.cameraX, particle.y - state.cameraY, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function drawDecor() {
    ctx.save();
    ctx.strokeStyle = "rgba(0,243,255,.26)";
    ctx.lineWidth = 1;
    const pulse = Math.sin(performance.now() / 330) * 3;
    for (const x of [35, VIEW.width - 35]) {
      ctx.beginPath();
      ctx.moveTo(x, 255);
      ctx.lineTo(x + (x < VIEW.width / 2 ? 14 : -14), 267 + pulse);
      ctx.lineTo(x, 279);
      ctx.lineTo(x + (x < VIEW.width / 2 ? 14 : -14), 291 - pulse);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#050914";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.translate(state.offsetX, state.offsetY);
    ctx.scale(state.scale, state.scale);
    const shakeX = state.screenShake ? (Math.random() - 0.5) * state.shake : 0;
    const shakeY = state.screenShake ? (Math.random() - 0.5) * state.shake : 0;
    ctx.translate(shakeX, shakeY);
    if (!state.active && state.demo) {
      drawDemo();
      return;
    }
    drawBackground();
    drawLava();
    for (const [index, platform] of platforms().entries()) drawPlatform(platform, index);
    drawLavaPlatformGlow();
    for (const crate of state.crates) drawCrate(crate);
    drawGrapple(state.player);
    drawBullets();
    for (const bot of state.bots) drawCharacter(bot);
    for (const player of state.remotePlayers.values()) drawCharacter(player);
    drawCharacter(state.player, true);
    drawParticles();
    drawAim(state.player);
    drawDecor();
    if (!state.active) drawIdleTitle();
  }

  function drawIdleTitle() {
    const title = "CYBER ARENA";
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "900 26px monospace";
    ctx.shadowBlur = 22;
    ctx.shadowColor = colors.cyan;
    ctx.fillStyle = "rgba(224,250,255,.78)";
    ctx.fillText(title, VIEW.width / 2, 84);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,243,255,.55)";
    ctx.font = "600 10px monospace";
    ctx.fillText("SYSTEM READY  //  WAITING FOR OPERATOR", VIEW.width / 2, 103);
    ctx.restore();
  }

  function frame(time) {
    if (!state.lastTime) state.lastTime = time;
    const dt = Math.min(0.034, (time - state.lastTime) / 1000);
    state.lastTime = time;
    state.lavaTime += dt;
    state.fpsClock += dt;
    state.frameCount += 1;
    if (state.fpsClock >= 0.55) {
      state.fps = Math.round(state.frameCount / state.fpsClock);
      state.frameCount = 0;
      state.fpsClock = 0;
    }
    if (!document.hidden) {
      updateCanvasRect();
      if (state.canvasRect.width > 0 && state.canvasRect.height > 0) {
        update(dt);
        draw();
      }
    }
    requestAnimationFrame(frame);
  }

  function updateTouchLayoutScale() {
    const stage = findElement("#game-stage");
    const sizeInput = findElement("#touch-size");
    const sizeOutput = findElement("#touch-size-value");
    if (stage) stage.style.setProperty("--touch-scale", String(state.touchLayoutScale));
    if (sizeInput) sizeInput.value = String(Math.round(state.touchLayoutScale * 100));
    if (sizeOutput) sizeOutput.value = `${Math.round(state.touchLayoutScale * 100)}%`;
  }

  function saveTouchLayout() {
    try {
      localStorage.setItem("cyber-arena-touch-layout", JSON.stringify({
        scale: state.touchLayoutScale,
        positions: state.touchLayoutPositions,
      }));
    } catch (_error) {}
  }

  function applyTouchLayout() {
    updateTouchLayoutScale();
    for (const control of document.querySelectorAll("[data-touch-control]")) {
      const position = state.touchLayoutPositions[control.id];
      if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
        control.style.left = "";
        control.style.top = "";
        control.style.right = "";
        control.style.bottom = "";
        continue;
      }
      control.style.right = "auto";
      control.style.bottom = "auto";
      control.style.left = `${Math.max(0, Math.min(1, position.x)) * 100}%`;
      control.style.top = `${Math.max(0, Math.min(1, position.y)) * 100}%`;
    }
  }

  function restoreTouchLayout() {
    try {
      const saved = JSON.parse(localStorage.getItem("cyber-arena-touch-layout") || "null");
      if (saved && typeof saved === "object") {
        if (Number.isFinite(saved.scale)) state.touchLayoutScale = Math.max(0.7, Math.min(1.4, saved.scale));
        if (saved.positions && typeof saved.positions === "object") state.touchLayoutPositions = saved.positions;
      }
    } catch (_error) {}
    applyTouchLayout();
  }

  function setTouchLayoutEditing(enabled) {
    state.touchLayoutEditing = Boolean(enabled);
    document.body.dataset.touchLayoutEditing = String(state.touchLayoutEditing);
    const editor = findElement("#touch-layout-editor");
    if (editor) editor.hidden = !state.touchLayoutEditing;
    const trigger = findElement("#action-edit-controls");
    if (trigger) trigger.setAttribute("aria-pressed", String(state.touchLayoutEditing));
  }

  function resetTouchLayout() {
    state.touchLayoutScale = 1;
    state.touchLayoutPositions = {};
    for (const control of document.querySelectorAll("[data-touch-control]")) {
      control.style.left = "";
      control.style.top = "";
      control.style.right = "";
      control.style.bottom = "";
    }
    try { localStorage.removeItem("cyber-arena-touch-layout"); } catch (_error) {}
    applyTouchLayout();
  }

  function setupTouchLayoutDragging() {
    const stage = findElement("#game-stage");
    for (const control of document.querySelectorAll("[data-touch-control]")) {
      control.addEventListener("pointerdown", (event) => {
        if (!state.touchLayoutEditing) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const stageRect = stage.getBoundingClientRect();
        const controlRect = control.getBoundingClientRect();
        const centerX = controlRect.left + controlRect.width / 2;
        const centerY = controlRect.top + controlRect.height / 2;
        control.setPointerCapture(event.pointerId);
        state.touchLayoutPointer = {
          id: event.pointerId,
          element: control,
          offsetX: event.clientX - centerX,
          offsetY: event.clientY - centerY,
          stageWidth: stageRect.width,
          stageHeight: stageRect.height,
          halfWidth: controlRect.width / 2,
          halfHeight: controlRect.height / 2,
        };
      }, true);
    }
    window.addEventListener("pointermove", (event) => {
      const drag = state.touchLayoutPointer;
      if (!drag || drag.id !== event.pointerId) return;
      event.preventDefault();
      const stageRect = stage.getBoundingClientRect();
      const centerX = Math.max(drag.halfWidth, Math.min(
        stageRect.width - drag.halfWidth,
        event.clientX - stageRect.left - drag.offsetX,
      ));
      const centerY = Math.max(drag.halfHeight, Math.min(
        stageRect.height - drag.halfHeight,
        event.clientY - stageRect.top - drag.offsetY,
      ));
      drag.element.style.right = "auto";
      drag.element.style.bottom = "auto";
      drag.element.style.left = `${centerX}px`;
      drag.element.style.top = `${centerY}px`;
      state.touchLayoutPositions[drag.element.id] = {
        x: centerX / Math.max(1, stageRect.width),
        y: centerY / Math.max(1, stageRect.height),
      };
    }, { passive: false });
    window.addEventListener("pointerup", finishTouchLayoutDrag);
    window.addEventListener("pointercancel", finishTouchLayoutDrag);
  }

  function finishTouchLayoutDrag(event) {
    const drag = state.touchLayoutPointer;
    if (!drag || drag.id !== event.pointerId) return;
    state.touchLayoutPointer = null;
    saveTouchLayout();
  }

  function restorePreferences() {
    try {
      const profile = JSON.parse(localStorage.getItem("cyber-arena-profile") || "null");
      if (profile && typeof profile === "object") {
        const nameInput = findElement("#player-name");
        if (typeof profile.name === "string" && nameInput) nameInput.value = profile.name.slice(0, 16);
        if (typeof profile.playerClass === "string" && classes[profile.playerClass]) state.playerClass = profile.playerClass;
        if (typeof profile.color === "string" && /^#[0-9a-f]{6}$/i.test(profile.color)) state.color = profile.color;
        document.querySelectorAll("[data-class]").forEach((element) => {
          const selected = element.dataset.class.toUpperCase() === state.playerClass;
          element.classList.toggle("is-selected", selected);
          element.setAttribute("aria-pressed", String(selected));
        });
        document.querySelectorAll("[data-color]").forEach((element) => {
          const selectedColor = colorChoices[(element.dataset.color || "").toUpperCase()] || element.dataset.color;
          const selected = selectedColor === state.color;
          element.classList.toggle("is-selected", selected);
          element.setAttribute("aria-pressed", String(selected));
        });
      }
      const savedSettings = JSON.parse(localStorage.getItem("cyber-arena-settings") || "null");
      if (savedSettings && typeof savedSettings === "object") {
        document.querySelectorAll("[data-setting]").forEach((element) => {
          if (!(element.dataset.setting in savedSettings)) return;
          const value = savedSettings[element.dataset.setting];
          if (element.type === "checkbox") element.checked = Boolean(value);
          else element.value = String(value);
          setOption(element.dataset.setting, element.type === "checkbox" ? element.checked : element.value);
          const output = document.querySelector(`output[for="${element.id}"]`);
          if (output) output.value = element.dataset.setting === "volume" ? `${element.value}%` : element.value;
        });
      }
      const controlSetting = findElement("#setting-control-mode");
      if (controlSetting) setOption("controlMode", controlSetting.value);
      setPlayerIdentity();
      restoreTouchLayout();
    } catch (_error) {
      setPlayerIdentity();
      restoreTouchLayout();
    }
    restoreBindings();
  }

  window.addEventListener("keydown", (event) => {
    if (state.awaitingKey) {
      event.preventDefault();
      if (event.code === "Escape") {
        endKeyCapture();
        uiSound("back");
      } else {
        assignKey(state.awaitingKey, event.code);
      }
      return;
    }
    const key = event.key.toLowerCase();
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright", "tab"].includes(key)) event.preventDefault();
    state.keys.add(key);
    state.codes.add(event.code);
    if (bindingPressed("jump", key, event.code) && !event.repeat) {
      state.keys.add("jump");
      state.jumpQueued = true;
    }
    if (bindingPressed("pause", key, event.code) && !event.repeat) {
      if (state.active) togglePause();
    }
    if (bindingPressed("scoreboard", key, event.code)) document.body.classList.add("scoreboard-open");
  });
  window.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();
    state.keys.delete(key);
    state.codes.delete(event.code);
    if (bindingPressed("scoreboard", event.key?.toLowerCase(), event.code, -1) || key === "tab") {
      document.body.classList.remove("scoreboard-open");
    }
  });
  canvas.addEventListener("pointermove", (event) => {
    updatePointerPosition(event.clientX, event.clientY);
  });
  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return;
    updatePointerPosition(event.clientX, event.clientY);
    if (state.awaitingKey) return;
    if (bindingPressed("grapple", null, event.code, event.button)) {
      const point = screenToWorld(event.clientX, event.clientY);
      if (state.player) {
        state.player.grapple = { x: point.x, y: point.y };
        sound(660, 0.1, "triangle");
      }
      return;
    }
    if (bindingPressed("fire", null, event.code, event.button)) {
      state.pointer.down = true;
      sound(240, 0.035, "square", 0.025);
    }
  });
  window.addEventListener("pointerup", (event) => {
    if (event.button === 0) state.pointer.down = false;
    if (event.button === 2 && state.player) state.player.grapple = null;
  });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  function updateCanvasRect() {
    state.canvasRect = canvas.getBoundingClientRect();
  }

  function touchStart(event) {
    if (!state.active || state.touchLayoutEditing) return;
    updateCanvasRect();
    const rect = state.canvasRect;
    for (const touch of event.changedTouches) {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      if (x < rect.width * 0.46 && y > rect.height * 0.48) {
        state.touchMove.active = true;
        state.touchMove.id = touch.identifier;
        state.touchMove.originX = x;
        state.touchMove.originY = y;
        state.touchMove.x = 0;
        state.touchMove.y = 0;
        state.touchIds.set(touch.identifier, "move");
      } else if (x > rect.width * 0.5 && y > rect.height * 0.36) {
        state.touchAim.active = true;
        state.touchAim.id = touch.identifier;
        state.touchAim.originX = x;
        state.touchAim.originY = y;
        state.touchAim.x = 0;
        state.touchAim.y = 0;
        state.touchIds.set(touch.identifier, "aim");
      } else if (x < rect.width * 0.5 && y < rect.height * 0.42) {
        state.keys.add("jump");
        state.jumpQueued = true;
        state.touchIds.set(touch.identifier, "jump");
      } else if (x > rect.width * 0.5 && y < rect.height * 0.42) {
        const point = screenToWorld(touch.clientX, touch.clientY);
        if (state.player) state.player.grapple = { x: point.x, y: point.y };
        state.touchIds.set(touch.identifier, "grapple");
      }
    }
    event.preventDefault();
  }

  function touchMove(event) {
    const rect = state.canvasRect || canvas.getBoundingClientRect();
    for (const touch of event.changedTouches) {
      const kind = state.touchIds.get(touch.identifier);
      if (kind === "move") {
        const dx = touch.clientX - rect.left - state.touchMove.originX;
        state.touchMove.x = Math.max(-1, Math.min(1, dx / 54));
        state.touchMove.y = Math.max(-1, Math.min(1, (touch.clientY - rect.top - state.touchMove.originY) / 54));
      } else if (kind === "aim") {
        const dx = touch.clientX - rect.left - state.touchAim.originX;
        const dy = touch.clientY - rect.top - state.touchAim.originY;
        const distance = Math.hypot(dx, dy);
        state.touchAim.x = distance ? dx / distance : 1;
        state.touchAim.y = distance ? dy / distance : 0;
        state.touchAim.fire = distance > 15;
      }
    }
    event.preventDefault();
  }

  function touchEnd(event) {
    for (const touch of event.changedTouches) {
      const kind = state.touchIds.get(touch.identifier);
      if (kind === "move" || state.touchMove.active) state.touchMove = { x: 0, y: 0, active: false };
      if (kind === "aim" || state.touchAim.active) state.touchAim = { x: 0, y: 0, active: false, fire: false };
      if (kind === "jump") state.keys.delete("jump");
      if (kind === "grapple" && state.player) state.player.grapple = null;
      state.touchIds.delete(touch.identifier);
    }
    event.preventDefault();
  }

  canvas.addEventListener("touchstart", touchStart, { passive: false });
  canvas.addEventListener("touchmove", touchMove, { passive: false });
  canvas.addEventListener("touchend", touchEnd, { passive: false });
  canvas.addEventListener("touchcancel", touchEnd, { passive: false });

  function bindVirtualStick(element, kind) {
    if (!element) return;
    let activePointer = null;
    const updateStick = (event) => {
      const rect = element.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.max(1, Math.hypot(dx, dy));
      const limit = Math.max(20, Math.min(rect.width, rect.height) * 0.42);
      const magnitude = Math.min(1, distance / limit);
      if (kind === "move") {
        state.touchMove.x = dx / distance * magnitude;
        state.touchMove.y = dy / distance * magnitude;
      } else {
        state.touchAim.x = dx / distance;
        state.touchAim.y = dy / distance;
        state.touchAim.fire = distance > 11;
      }
    };
    element.addEventListener("pointerdown", (event) => {
      if (state.touchLayoutEditing) return;
      event.preventDefault();
      activePointer = event.pointerId;
      element.setPointerCapture(event.pointerId);
      element.classList.add("is-active");
      if (kind === "move") state.touchMove.active = true;
      else state.touchAim.active = true;
      updateStick(event);
    });
    element.addEventListener("pointermove", (event) => {
      if (event.pointerId === activePointer) updateStick(event);
    });
    const release = (event) => {
      if (event.pointerId !== activePointer) return;
      activePointer = null;
      element.classList.remove("is-active");
      if (kind === "move") state.touchMove = { x: 0, y: 0, active: false };
      else state.touchAim = { x: 0, y: 0, active: false, fire: false };
    };
    element.addEventListener("pointerup", release);
    element.addEventListener("pointercancel", release);
    element.addEventListener("lostpointercapture", release);
  }

  setupTouchLayoutDragging();
  bindVirtualStick(findElement("#touch-move-stick"), "move");
  bindVirtualStick(findElement("#touch-aim-stick"), "aim");

  const jumpButton = findElement("#touch-jump");
  jumpButton?.addEventListener("pointerdown", (event) => {
    if (state.touchLayoutEditing) return;
    event.preventDefault();
    jumpButton.setPointerCapture(event.pointerId);
    state.keys.add("jump");
    state.jumpQueued = true;
    jumpButton.classList.add("is-active");
  });
  const releaseJump = () => {
    state.keys.delete("jump");
    jumpButton?.classList.remove("is-active");
  };
  jumpButton?.addEventListener("pointerup", releaseJump);
  jumpButton?.addEventListener("pointercancel", releaseJump);
  jumpButton?.addEventListener("lostpointercapture", releaseJump);

  const crouchButton = findElement("#touch-crouch");
  const releaseCrouch = () => {
    state.touchCrouchHeld = false;
    crouchButton?.classList.remove("is-active");
  };
  crouchButton?.addEventListener("pointerdown", (event) => {
    if (state.touchLayoutEditing) return;
    event.preventDefault();
    crouchButton.setPointerCapture(event.pointerId);
    state.touchCrouchHeld = true;
    crouchButton.classList.add("is-active");
  });
  crouchButton?.addEventListener("pointerup", releaseCrouch);
  crouchButton?.addEventListener("pointercancel", releaseCrouch);
  crouchButton?.addEventListener("lostpointercapture", releaseCrouch);

  const grappleButton = findElement("#touch-grapple");
  grappleButton?.addEventListener("pointerdown", (event) => {
    if (state.touchLayoutEditing) return;
    event.preventDefault();
    grappleButton.setPointerCapture(event.pointerId);
    if (!state.player) return;
    const angle = state.touchAim.active
      ? Math.atan2(state.touchAim.y, state.touchAim.x)
      : state.player.aim;
    state.player.grapple = {
      x: state.player.x + state.player.width / 2 + Math.cos(angle) * (state.player.class === "GRAPPLER" ? 520 : 390),
      y: state.player.y + state.player.height / 2 + Math.sin(angle) * (state.player.class === "GRAPPLER" ? 520 : 390),
    };
    sound(660, 0.1, "triangle");
  });
  const releaseGrapple = () => {
    if (state.player) state.player.grapple = null;
  };
  grappleButton?.addEventListener("pointerup", releaseGrapple);
  grappleButton?.addEventListener("pointercancel", releaseGrapple);
  grappleButton?.addEventListener("lostpointercapture", releaseGrapple);
  window.addEventListener("resize", fitCanvas);
  window.addEventListener("orientationchange", () => setTimeout(fitCanvas, 120));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.active && !state.paused) togglePause(true);
  });

  window.CyberArena = {
    showScreen,
    notify,
    startOffline,
    startGame,
    loadRooms,
    createOnlineRoom,
    joinOnlineRoom,
    quitToMenu,
    togglePause,
    setOption,
    getState: () => state,
  };

  restorePreferences();
  restoreBindings();
  buildBindingsUi();
  setOption("controlMode", findElement("#setting-control-mode")?.value || "auto");
  fitCanvas();
  showScreen("menu");
  requestAnimationFrame(frame);
})();
