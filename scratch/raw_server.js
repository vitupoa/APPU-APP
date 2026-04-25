const net = require('net');

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    console.log(data.toString('utf-8'));
    socket.write('HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n');
    socket.end();
  });
});

server.listen(8080, () => {
  console.log('Server bound');
});
