module.exports = function (barry) {
  var clientCount = barry.service('client/count', new barry.ScalarService);

  clientCount.value = 0;
  barry.transport.on('connection', function (socket) {
    clientCount.value++;
    socket.on('disconnect', function () {
      clientCount.value--;
    });
  });
};
