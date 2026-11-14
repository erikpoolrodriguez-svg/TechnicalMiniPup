const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");
const http = require("node:http");
const { Server } = require("socket.io");

const PORT = Number(process.env.PORT) || 5000;
const TICK_RATE = 60;
const MAX_ROOMS = 100;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  serveClient: true,
  cors: { origin: true, methods: ["GET", "POST"] },
  maxHttpBufferSize: 16_384,
});

app.use(express.json({ limit: "16kb" }));
app.get("/favicon.ico", (_request, response) => response.status(204).end());
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

const rooms = new Map();
const playersBySocket = new Map();
const CLASS_NAMES = new Set(["RUNNER", "TANK", "SNIPER", "GRAPPLER"]);
const MAP_NAMES = new Set(["NEON DISTRICT", "SKYLINE", "GRID ZERO"]);
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";

function cleanText(value, maxLength, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/[<>]/g, "").trim().slice(0, maxLength) || fallback;
}

function makeCode() {
  let code = "";
  for (let i = 0; i < 4; i += 1) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

function publicRoom(room) {
  return {
    id: room.id,
    name: room.name,
    players: room.players.size,
    maxPlayers: room.maxPlayers,
    map: room.map,
    privacy: room.privacy,
    code: room.privacy === "private" ? room.code : "",
    ping: room.ping,
  };
}

function publicRooms() {
  return [...rooms.values()]
    .filter((room) => room.privacy === "public" && room.players.size < room.maxPlayers)
    .map(publicRoom);
}

function emitRoomLists() {
  io.emit("rooms:list", publicRooms());
}

function makeRoom({ name, maxPlayers, map, privacy }) {
  if (rooms.size >= MAX_ROOMS) throw new Error("El servidor alcanzó su límite de salas.");
  let id;
  do {
    id = crypto.randomBytes(4).toString("hex").toUpperCase();
  } while (rooms.has(id));

  let code = "";
  if (privacy === "private") {
    do {
      code = makeCode();
    } while ([...rooms.values()].some((room) => room.code === code));
  }

  const room = {
    id,
    name: cleanText(name, 32, "NUEVA ARENA"),
    maxPlayers,
    map,
    privacy,
    code,
    ping: 18 + crypto.randomInt(35),
    players: new Map(),
    crates: new Map(),
    nextCrateAt: Date.now() + 6000,
    createdAt: Date.now(),
  };
  rooms.set(id, room);
  return room;
}

function leaveRoom(socket, announce = true) {
  const previous = playersBySocket.get(socket.id);
  if (!previous) return;
  const room = rooms.get(previous.roomId);
  playersBySocket.delete(socket.id);
  if (!room) return;
  room.players.delete(socket.id);
  socket.leave(room.id);
  if (announce) {
    io.to(room.id).emit("room:player-left", { id: socket.id });
    io.to(room.id).emit("room:state", {
      room: publicRoom(room),
      players: [...room.players.values()],
    });
  }
  if (room.players.size === 0) rooms.delete(room.id);
  emitRoomLists();
}

function joinRoom(socket, room, player) {
  if (room.players.size >= room.maxPlayers) throw new Error("La sala está llena.");
  leaveRoom(socket);
  const playerClass = CLASS_NAMES.has(player.class) ? player.class : "RUNNER";
  const maxHp = playerClass === "TANK" ? 130 : 100;
  const safePlayer = {
    id: socket.id,
    name: cleanText(player.name, 18, "PLAYER"),
    class: playerClass,
    color: /^#[0-9a-f]{6}$/i.test(player.color) ? player.color : "#00f3ff",
    x: 160,
    y: 160,
    vx: 0,
    vy: 0,
    width: 30,
    height: 44,
    crouching: false,
    sliding: false,
    facing: 1,
    aim: 0,
    hp: maxHp,
    maxHp,
    score: 0,
    streak: 0,
    weapon: "PLASMA PISTOL",
    updatedAt: Date.now(),
  };
  room.players.set(socket.id, safePlayer);
  playersBySocket.set(socket.id, { roomId: room.id });
  socket.join(room.id);
  socket.emit("room:joined", {
    room: publicRoom(room),
    playerId: socket.id,
    players: [...room.players.values()],
    crates: [...room.crates.values()],
  });
  io.to(room.id).emit("room:player-joined", safePlayer);
  io.to(room.id).emit("room:state", {
    room: publicRoom(room),
    players: [...room.players.values()],
  });
  emitRoomLists();
}

app.get("/api/rooms", (_request, response) => {
  response.json(publicRooms());
});

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, rooms: rooms.size, players: playersBySocket.size });
});

io.on("connection", (socket) => {
  socket.emit("rooms:list", publicRooms());

  socket.on("rooms:request", () => {
    socket.emit("rooms:list", publicRooms());
  });

  socket.on("room:create", (payload = {}, acknowledge = () => {}) => {
    try {
      const maxPlayers = Math.max(2, Math.min(6, Math.floor(Number(payload.maxPlayers) || 6)));
      const map = MAP_NAMES.has(payload.map) ? payload.map : "NEON DISTRICT";
      const privacy = payload.privacy === "private" ? "private" : "public";
      const room = makeRoom({ name: payload.name, maxPlayers, map, privacy });
      joinRoom(socket, room, payload.player || {});
      acknowledge({ ok: true, room: publicRoom(room) });
    } catch (error) {
      acknowledge({ ok: false, error: error.message || "No se pudo crear la sala." });
    }
  });

  socket.on("room:join", (payload = {}, acknowledge = () => {}) => {
    let room;
    if (typeof payload.code === "string" && payload.code.trim()) {
      const code = payload.code.trim().toUpperCase();
      room = [...rooms.values()].find(
        (candidate) => candidate.privacy === "private" && candidate.code === code,
      );
    } else if (typeof payload.id === "string") {
      room = rooms.get(payload.id);
    }
    if (!room) {
      acknowledge({ ok: false, error: "No encontramos esa sala." });
      return;
    }
    try {
      joinRoom(socket, room, payload.player || {});
      acknowledge({ ok: true, room: publicRoom(room) });
    } catch (error) {
      acknowledge({ ok: false, error: error.message || "No se pudo entrar a la sala." });
    }
  });

  socket.on("room:leave", () => leaveRoom(socket));

  socket.on("player:update", (payload = {}) => {
    const membership = playersBySocket.get(socket.id);
    if (!membership) return;
    const room = rooms.get(membership.roomId);
    const player = room?.players.get(socket.id);
    if (!player) return;
    const now = Date.now();
    if (now - player.updatedAt < 25) return;
    player.updatedAt = now;
    if (Number.isFinite(payload.x)) player.x = Math.max(-1000, Math.min(4000, payload.x));
    if (Number.isFinite(payload.y)) player.y = Math.max(-1000, Math.min(3000, payload.y));
    if (Number.isFinite(payload.vx)) player.vx = Math.max(-620, Math.min(620, payload.vx));
    if (Number.isFinite(payload.vy)) player.vy = Math.max(-900, Math.min(900, payload.vy));
    player.sliding = payload.sliding === true;
    player.crouching = player.sliding || payload.crouching === true;
    player.height = player.sliding ? 24 : player.crouching ? 30 : 44;
    if (Number.isFinite(payload.facing)) player.facing = payload.facing < 0 ? -1 : 1;
    if (Number.isFinite(payload.aim)) player.aim = payload.aim;
    if (Number.isFinite(payload.hp)) player.hp = Math.max(0, Math.min(player.maxHp, payload.hp));
    if (Number.isFinite(payload.score)) player.score = Math.max(0, Math.min(9999, payload.score));
    if (typeof payload.weapon === "string") player.weapon = cleanText(payload.weapon, 24, player.weapon);
  });

  socket.on("player:fire", (payload = {}) => {
    const membership = playersBySocket.get(socket.id);
    if (!membership) return;
    const room = rooms.get(membership.roomId);
    if (!room) return;
    const now = Date.now();
    const player = room.players.get(socket.id);
    if (!player || (player.lastShotAt && now - player.lastShotAt < 60)) return;
    player.lastShotAt = now;
    socket.to(room.id).emit("player:fire", {
      id: socket.id,
      x: Number.isFinite(payload.x) ? Math.max(-1000, Math.min(4000, payload.x)) : player.x,
      y: Number.isFinite(payload.y) ? Math.max(-1000, Math.min(3000, payload.y)) : player.y,
      aim: Number.isFinite(payload.aim) ? payload.aim : player.aim,
      weapon: cleanText(payload.weapon, 24, "PLASMA PISTOL"),
      color: player.color,
    });
  });

  socket.on("player:elimination", (payload = {}) => {
    const membership = playersBySocket.get(socket.id);
    const room = rooms.get(membership?.roomId);
    if (!room) return;
    const victimId = typeof payload.victimId === "string" ? payload.victimId : "";
    const victim = room.players.get(victimId);
    if (!victim || victimId === socket.id) return;
    victim.hp = 0;
    victim.streak = 0;
    const killer = room.players.get(socket.id);
    killer.score += 1;
    killer.streak = Math.min(9999, (killer.streak || 0) + 1);
    io.to(room.id).emit("player:elimination", {
      killerId: socket.id,
      victimId,
      killerName: killer.name,
      victimName: victim.name,
      killerScore: killer.score,
      killerStreak: killer.streak,
      victimStreak: victim.streak,
    });
  });

  socket.on("crate:pickup", (payload = {}, acknowledge = () => {}) => {
    const membership = playersBySocket.get(socket.id);
    const room = rooms.get(membership?.roomId);
    const player = room?.players.get(socket.id);
    const crateId = typeof payload.id === "string" ? payload.id : "";
    const crate = room?.crates.get(crateId);
    if (!room || !player || !crate) {
      acknowledge({ ok: false });
      return;
    }
    const targetY = Number.isFinite(payload.targetY) ? Math.max(0, Math.min(800, payload.targetY)) : 570;
    const distance = Math.hypot(player.x + 15 - crate.x, player.y + 22 - targetY);
    if (distance > 110) {
      acknowledge({ ok: false });
      return;
    }
    room.crates.delete(crateId);
    acknowledge({ ok: true, id: crateId });
    io.to(room.id).emit("crate:picked", { id: crateId, playerId: socket.id });
  });

  socket.on("disconnect", () => leaveRoom(socket));
});

setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    if (room.players.size === 0) continue;
    for (const [id, crate] of room.crates) {
      if (now - crate.createdAt > 28_000) room.crates.delete(id);
    }
    if (now >= room.nextCrateAt && room.crates.size < 3) {
      const crate = {
        id: crypto.randomBytes(5).toString("hex").toUpperCase(),
        x: 180 + crypto.randomInt(1840),
        weapon: ["CYBER RIFLE", "NEON SHOTGUN", "RAIL SNIPER"][crypto.randomInt(3)],
        createdAt: now,
      };
      room.crates.set(crate.id, crate);
      io.to(room.id).emit("crate:spawn", crate);
      room.nextCrateAt = now + 6000;
    }
    io.to(room.id).emit("game:sync", {
      at: now,
      players: [...room.players.values()].map(({ id, name, class: playerClass, color, x, y, vx, vy, height, crouching, sliding, facing, aim, hp, maxHp, score, streak, weapon }) => ({
        id,
        name,
        class: playerClass,
        color,
        x,
        y,
        vx,
        vy,
        height,
        crouching,
        sliding,
        facing,
        aim,
        hp,
        maxHp,
        score,
        streak,
        weapon,
      })),
    });
  }
}, 1000 / TICK_RATE).unref();

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Cyber Arena 2D listening on port ${PORT}`);
});
