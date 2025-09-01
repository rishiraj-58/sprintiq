// Simple Socket.IO server to deliver real-time notifications (ESM)
import http from 'http';
import { Server } from 'socket.io';

const port = process.env.PORT || 4001;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/notify') {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        const body = JSON.parse(data || '{}');
        const { userId, notification } = body || {};
        if (userId && notification) {
          io.to(userId).emit('new_notification', notification);
          res.statusCode = 204;
          res.end();
        } else {
          res.statusCode = 400;
          res.end('Invalid payload');
        }
      } catch (e) {
        res.statusCode = 400;
        res.end('Bad JSON');
      }
    });
    return;
  }
  res.statusCode = 200;
  res.end('OK');
});

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000", // Development
      "https://sprintiq-git-main-rishiraj-58.vercel.app", // Vercel deployment (update with your actual Vercel URL)
      "https://sprintiq.vercel.app" // Production Vercel URL (update if different)
    ],
  },
});

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(userId);
  }

  socket.on('join', (id) => {
    if (id) socket.join(id);
  });

  // Server receives an event to forward to a user room
  socket.on('send_notification', ({ userId: targetId, notification }) => {
    if (targetId && notification) {
      io.to(targetId).emit('new_notification', notification);
    }
  });
});

server.listen(port, () => {
  console.log(`🔔 Socket.IO server listening on port ${port}`);
});


