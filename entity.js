let _setupAutorun = Symbol();
_init = Symbol();
/**
 * This is the real power of this system.  All of the other stuff is convenience for access.
 * This piece actually maps everything to a mongo collection on the server.  For right now, it's "insecure" as
 * there is no mechanism to do permissions checking on the server.  I am looking at a couple of ways of implementing
 * something to do that, but for now, it's not available.  If the insecure package is missing, it will simply fail
 * as it is currently not implementing any kind of security.
 * @param targetClass {Function} the constructor function to mixin entity behavior to.
 * @param collection {Meteor.Collection} the meteor collection this will all operate on.
 */
entityCreate = function entityCreate(targetClass, collection) {
    check(targetClass, Function);
    check(collection, Mongo.Collection);
    // if we passed the checks, we are ready to proceed.
    if (Meteor.isClient) {
        targetClass[_entity].collection = collection;
        addFunctions(targetClass);
        addFind(targetClass);
        return targetClass;
    }
};
/**
 * These are functions that are needed to exist on the prototype.  They are
 * mixed in using Symbol() so that I don't have a chance of polluting the namespace
 * of the target function.
 * @param targetClass
 */
function addFunctions(targetClass) {
    targetClass.prototype[_setupAutorun] = function() {
        this[_init]();
        if (!this[_entity].autorun && targetClass[_entity].collection && this._id) {
            this[_entity].autorun = Tracker.autorun(() => {
                let databaseEntry = targetClass[_entity].collection.findOne(
                    {_id: this._id},
                    {fields: targetClass[_entity].fields}
                );
                if (databaseEntry) {
                    // this is pretty straight forward, loop over keys in the database entry
                    _.each(_.keys(databaseEntry), key => {
                        // make sure the key is in fields.  If it isn't, we don't care about it.
                        // this should really only filter out _id as anything else should automatically
                        // get filtered out by the fields option passed to the query.
                        if (key in targetClass[_entity].fields) {
                            // check if this is a change.  If it is not, we don't do anything with it.
                            if (this[_entity].values[key] !== databaseEntry[key]) {
                                // update the cached version of the database entry
                                this[_entity].values[key] = databaseEntry[key];
                                // cleanup the pending values and the update object.
                                // note that this update might not have come from this client
                                // so we check that there is something to update first.
                                if (_.has(this[_entity].currentValues, key)) {
                                    delete this[_entity].currentValues[key];
                                }
                                if (_.has(this[_entity].update, key)) {
                                    delete this[_entity].update[key];
                                }
                            }
                        }
                    });
                } else {
                    //TODO: mark this entity as deleted.
                    delete targetClass[_entity].entities[this._id];
                    this[_entity].autorun.stop();
                }
            });
        }
    };
    targetClass.prototype[_init] = function() {
        // generic boilerplate code.  Creates an object on the instance
        // which houses all of my fields.
        if (!this[_entity]) {
            this[_entity] = {
                // most recently set values
                currentValues: {},
                // values currently in mongo
                values: {},
                // updates pending on mongo (effectively the Unit of Work)
                update: {},
                // a map of dependencies
                dependencies: {}
            };
            // fill the dependency map as it is not permitted or even possible really to add
            // fields after the first instantiation, this is definitely safe.
            _.each(_.keys(targetClass[_entity].fields), key => {
                this[_entity].dependencies[key] = new Tracker.Dependency();
            });
        }
    }
}
/**
 * Add find functions to the constructor function.  I call it a class simply because
 * it's designed to work well with ES6 classes.  The mixin functionality is straight forward.
 * load is the best function.  Note that this is done as a closure such that load is known only to
 * these two public functions.
 * @param targetClass
 */
function addFind(targetClass) {
    targetClass.findOne = function(query) {
        let result = targetClass[_entity].collection.findOne(
            query,
            {fields: {_id: 1}}
        );
        if (result) {
            return load(result._id);
        }
    };
    targetClass.fetch = function(query) {
        let results = targetClass[_entity].collection.find(
            query,
            {fields: {_id: 1}}
        ).fetch();
        if (results.length > 0) {
            return _.map(results, result => load(result._id));
        }
    };
    function load(_id) {
        if (!targetClass[_entity].entities) {
            targetClass[_entity].entities = {};
        }
        if (!targetClass[_entity].entities[_id]) {
            let entity = new targetClass();
            entity._id = _id;
            entity[_setupAutorun]();
            targetClass[_entity].entities[_id] = entity;
        }
        return targetClass[_entity].entities[_id];
    }
}
function addReset(targetClass) {
}
function addSave(targetClass, collection) {
}