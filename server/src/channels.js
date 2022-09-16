let storeClients = {};
let oldRecords = {};
Array.prototype.unique = function () {
  var a = this.concat();
  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (a[i] === a[j])
        a.splice(j--, 1);
    }
  }

  return a;
};

module.exports = function (app) {
  if (typeof app.channel !== 'function') {
    // If no real-time functionality has been configured just return
    return;
  }

  app.on('connection', connection => {
    // On a new real-time connection, add it to the anonymous channel
    app.channel('anonymous').join(connection);
    storeClients[connection.handleSocket.id] = connection.handleSocket;
  });
  app.on('disconnect', connection => {
    delete storeClients[connection.handleSocket.id];
  });

  app.on('login', (authResult, { connection }) => {
    // connection can be undefined if there is no
    // real-time connection, e.g. when logging in via REST
    if (connection) {
      // Obtain the logged in user from the connection
      // const user = connection.user;

      // The connection is no longer anonymous, remove it
      app.channel('anonymous').leave(connection);

      // Add it to the authenticated user channel
      app.channel('authenticated').join(connection);

      // Channels can be named anything and joined on any condition 

      // E.g. to send real-time events only to admins use
      // if(user.isAdmin) { app.channel('admins').join(connection); }

      // If the user has joined e.g. chat rooms
      // if(Array.isArray(user.rooms)) user.rooms.forEach(room => app.channel(`rooms/${room.id}`).join(connection));

      // Easily organize users by email and userid for things like messaging
      // app.channel(`emails/${user.email}`).join(connection);
      // app.channel(`userIds/${user.id}`).join(connection);
    }
  });

  // eslint-disable-next-line no-unused-vars
  app.publish((data, hook) => {
    // Here you can add event publishers to channels set up in `channels.js`
    // To publish only for a specific event use `app.publish(eventname, () => {})`

    console.log('Publishing all events to all authenticated users. See `channels.js` and https://docs.feathersjs.com/api/channels.html for more information.'); // eslint-disable-line

    // e.g. to publish all service events to all authenticated users use
    return app.channel('authenticated');
  });

  // Here you can also add service specific event publishers
  // e.g. the publish the `users` service `created` event to the `admins` channel
  // app.service('users').publish('created', () => app.channel('admins'));

  // With the userid and email organization from above you can easily select involved users
  // app.service('messages').publish(() => {
  //   return [
  //     app.channel(`userIds/${data.createdBy}`),
  //     app.channel(`emails/${data.recipientEmail}`)
  //   ];
  // });

  async function checkRecord() {
    let sendData = {
      add: [],
      del: [],
      updated: []
    };
    const allRecords = await app.service('grid').find();
    const allRecordObj = {};
    for (let record of allRecords) {
      allRecordObj[record.id] = record;
    }
    const oldRecordIdList = Object.keys(oldRecords);
    const allRecordIdList = Object.keys(allRecordObj);
    const idList = oldRecordIdList.concat(allRecordIdList).unique();

    for (let id of idList) {
      if (allRecordObj[id]) {
        if (oldRecords[id]) {
          for (let field in allRecordObj[id]) {
            let value = allRecordObj[id][field];

            if ('object' === typeof (value)) {
              value = value.toString();
            }
            if (value != oldRecords[id][field]) {
              sendData.updated.push(allRecordObj[id]);
              break;
            }
          }
        } else {
          sendData.add.push(allRecordObj[id]);
        }
      } else {
        sendData.del.push(id);
      }
    }

    // try {
    //   app.service('grid').emit('updateData', '123123123123');
    //   // for (let connectionId in storeClients) {
    //   //   try {
    //   //     storeClients[connectionId].emit('updateData', sendData);
    //   //   } catch (e) {
    //   //     console.log(e);
    //   //   }
    //   // }
    // } catch (e) {
    //   console.log(e);
    // }
    if (sendData.add.length > 0 || sendData.del.length > 0 || sendData.updated.length > 0) {
      for (let connectionId in storeClients) {
        try {
          storeClients[connectionId].emit('updateData', sendData);
        } catch (e) {
          console.log(e);
        }
      }
    }
    oldRecords = allRecordObj;

    await new Promise(r => setTimeout(r, 1000));

    checkRecord();
  }
  checkRecord();
};
