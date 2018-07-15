let dbPromise =  idb.open('restaurantsDB', 1, function(upgradeDb) {
      let keyVal = upgradeDb.createObjectStore('restaurantsOS');
      ketVal.put('world', 'hello');
    });