/**
 * 1v1 PvP Real-time Matchmaking and Duel Synchronization Socket Architecture
 */

export function setupDuelSocket(io) {
  const waitingQueue = [];
  const activeRooms = new Map(); // roomId -> { player1, player2, timer, scores }

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Foydalanuvchi ulandi: ${socket.id}`);

    // User joins matchmaking queue
    socket.on('join_queue', (userData) => {
      // Remove previous entry if already in queue
      const existingIdx = waitingQueue.findIndex((p) => p.socketId === socket.id);
      if (existingIdx !== -1) {
        waitingQueue.splice(existingIdx, 1);
      }

      const playerInfo = {
        socketId: socket.id,
        name: userData?.name || `Atlet_${socket.id.slice(0, 4)}`,
        location: userData?.location || 'Toshkent',
        xp: userData?.xp !== undefined ? Number(userData.xp) : 0,
      };

      if (waitingQueue.length > 0) {
        // Match found!
        const opponent = waitingQueue.shift();
        const roomId = `duel_room_${opponent.socketId}_${playerInfo.socketId}`;

        socket.join(roomId);
        const oppSocket = io.sockets.sockets.get(opponent.socketId);
        if (oppSocket) {
          oppSocket.join(roomId);
        }

        const roomState = {
          roomId,
          players: {
            [socket.id]: { ...playerInfo, score: 0 },
            [opponent.socketId]: { ...opponent, score: 0 },
          },
          duration: 60,
          startedAt: Date.now(),
        };

        activeRooms.set(roomId, roomState);

        // Notify both players
        socket.emit('match_found', {
          roomId,
          opponentName: opponent.name,
          opponentLocation: opponent.location,
          opponentXP: opponent.xp,
        });

        if (oppSocket) {
          oppSocket.emit('match_found', {
            roomId,
            opponentName: playerInfo.name,
            opponentLocation: playerInfo.location,
            opponentXP: playerInfo.xp,
          });
        }

        console.log(`[Duel Match] Xona yaratildi: ${roomId} (${playerInfo.name} VS ${opponent.name})`);
      } else {
        waitingQueue.push(playerInfo);
        socket.emit('waiting_in_queue', { position: waitingQueue.length });
      }
    });

    // Leave matchmaking queue
    socket.on('leave_queue', () => {
      const idx = waitingQueue.findIndex((p) => p.socketId === socket.id);
      if (idx !== -1) {
        waitingQueue.splice(idx, 1);
        socket.emit('queue_left');
      }
    });

    // Real-time rep update during duel
    socket.on('update_score', (data) => {
      // Find room user is in
      for (const [roomId, room] of activeRooms.entries()) {
        if (room.players[socket.id]) {
          room.players[socket.id].score = data.score || 0;
          // Broadcast to opponent in the same room
          socket.to(roomId).emit('opponent_score_update', {
            score: data.score,
          });
          break;
        }
      }
    });

    // Match finished event
    socket.on('duel_finish', (data) => {
      for (const [roomId, room] of activeRooms.entries()) {
        if (room.players[socket.id]) {
          io.to(roomId).emit('duel_completed', {
            winner: data.winnerSocketId,
          });
          activeRooms.delete(roomId);
          break;
        }
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`[Socket.io] Foydalanuvchi uzildi: ${socket.id}`);

      // Remove from queue
      const qIdx = waitingQueue.findIndex((p) => p.socketId === socket.id);
      if (qIdx !== -1) {
        waitingQueue.splice(qIdx, 1);
      }

      // Handle active room cleanup & notify opponent
      for (const [roomId, room] of activeRooms.entries()) {
        if (room.players[socket.id]) {
          socket.to(roomId).emit('opponent_disconnected', {
            message: "Raqib aloqani uzdi. Siz g'olib deb topildingiz!",
          });
          activeRooms.delete(roomId);
          break;
        }
      }
    });
  });
}
