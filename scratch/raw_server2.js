const net = require('net');
const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    console.log(data.toString('utf-8'));
    try { socket.write('HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n'); socket.end(); } catch (e) {}
  });
});
server.listen(8080, () => {});
