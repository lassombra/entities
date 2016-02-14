// Write your tests here!
// Here is an example.

let coll = new Meteor.Collection('entity-test-info');
class MyEntity {
  get calculated() {
    return this.stored + 1;
  }
}
Wrapped = Entity.wrap(MyEntity, {
  stored: Number,
  differentName: {
    check: String,
    saveField: 'regularName'
  },
  simpleString: String
}, {
  collection: coll,
  methodMap: {
    doSomething() {
      if (Meteor.isServer) {
        Meteor._sleepForMs(2000);
        return true;
      } else {
        return false;
      }
    }
  },
  publicationMap: {
    loadStuff() {
      return coll.find();
    }
  }
});
if (Meteor.isServer) {
  coll.update({id:1},{id:1, stored: 75, regularName: 'somethingHere', simpleString: 'somethingElse'},{upsert:true});
}
if (Meteor.isClient) {
  Tinytest.add('Entity - method returns promise', function(test) {
    let promise = Wrapped.doSomething();
    test.isTrue(promise instanceof Promise);
  });
  Tinytest.add('Entity - publication wrapped and returns subscription ID', test => {
    let result = Wrapped.loadStuff();
    test.isNotUndefined(result.subscriptionId);
    test.isNotUndefined(result.ready);
    test.isNotUndefined(result.subscriptionId);
  });
  Wrapped.loadStuff({
    onReady() {
      Tinytest.add('Entity - findOne is idempotent (returns the same each time)', function (test) {
        test.equal(Wrapped.findOne({id:1}), Wrapped.findOne({id:1}));
        test.isNotUndefined(Wrapped.findOne({id:1}));
      });
      Tinytest.add('Entity - mapped parameter name works', test => {
        let entity = Wrapped.findOne({id:1});
        test.equal(entity.differentName, 'somethingHere');
      });
      Tinytest.add('Entity - simple parameter works', test => {
        let entity = Wrapped.findOne({id:1});
        test.equal(entity.simpleString, 'somethingElse');
      })
      Tinytest.addAsync('Entity - change triggers dependency', (test, next) => {
        let dependencyFired = false;
        let entity = Wrapped.findOne({id:1});
        test.isNotUndefined(entity);
        Tracker.autorun(() => {
          dependencyFired = true;
          let stored = entity.stored;
        });
        dependencyFired = false;
        entity.stored = entity.stored + 7;
        Tracker.afterFlush(() => {
          test.isTrue(dependencyFired);
          next();
        });
      });
      Tinytest.add('Entity - calculated prototypes on entity work', test => {
        let entity = Wrapped.findOne({id: 1});
        test.isNotUndefined(entity);
        test.equal(entity.stored + 1, entity.calculated);
      });
      Tinytest.addAsync('Entity - changes to underlying data update entity', (test, next) => {
        let entity = Wrapped.findOne({id:1});
        test.isNotUndefined(entity);
        var dependencyFired = false;
        Tracker.autorun(() => {
          dependencyFired = true;
          let stored = entity.stored;
        });
        dependencyFired = false;
        coll.update({_id: entity._id},{$set: {stored: entity.stored * 7}});
        Tracker.afterFlush(() => {
          test.isTrue(dependencyFired);
          next();
        });
      });
      Tinytest.addAsync('Entity - entities throw errors when removed from mongo', (test, next) => {
        let entity = Wrapped.findOne({id: 1});
        test.isNotUndefined(entity);
        var autorun = undefined;
        Tracker.autorun((c) => {
          autorun = c;
          let stored = entity.stored;
        });
        coll.remove({_id: entity._id});
        Tracker.afterFlush(() => {
          test.isTrue(autorun.stopped);
          next();
        });
      });
    }
  });
}
