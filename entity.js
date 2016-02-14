let _setupAutorun = Symbol();
let _autorun = Symbol();
/**
 * This is the real power of this system.  All of the other stuff is convenience for access.
 * This piece actually maps everything to a mongo collection on the server.  For right now, it's "insecure" as
 * there is no mechanism to do permissions checking on the server.  I am looking at a couple of ways of implementing
 * something to do that, but for now, it's not available.  If the insecure package is missing, it will simply fail
 * as it is currently not implementing any kind of security.
 * @param entityConstructor {Function} the constructor function to mixin entity behavior to.
 * @param collection {Meteor.Collection} the meteor collection this will all operate on.
 */
entityCreate = function entityCreate(constructor, collection) {
    check(constructor, Function);
    check(collection, Mongo.Collection);
    // if we passed the checks, we are ready to proceed.
    addFind(constructor, collection);
    addReset(constructor.prototype);
    addSave(constructor.prototype, collection);
};
function addFind(constructor, collection) {
    constructor.findOne = function findOne(query) {
        let entity = collection.findOne(query, {fields: {_id: 1}});
        return entity && load(entity._id);
    };
    constructor.fetch = function fetch(query) {
        let entities = collection.find(query, {fields: {_id:1}}).fetch();
        return entities.length > 0 && entities.map(entity => {
            return load(entity._id);
        });
    };
    function load(_id) {
        // make sure we have the entities available to choose from.
        if (!constructor.prototype[_entities]) {
            constructor.prototype[_entities] = {};
        }
        if (!constructor.prototype[_entities][_id]) {
            let entity = new constructor();
            entity._id = _id;
            entity[_setupAutorun]();
        }
    }
    constructor.prototype[_setupAutorun] = function() {
        if (!this[_autorun] && this._id) {
            this[_autorun] = Tracker.autorun((c) => {
                let databaseVersion = collection.findOne({_id},
                    {fields: entity.prototype[_fields]});
                if (databaseVersion) {
                    _.each(_.keys(databaseVersion), key => {
                        if (databaseVersion[key] !== this[_values][key]) {
                            this[_values][key] = databaseVersion[key];
                            delete this[_currentValues][key];
                            this[_dependencies][key].changed();
                            if (this[_update][key] !== undefined) {
                                delete this[_update][key];
                            }
                        }
                    });
                } else {
                    // TODO: this is deleted, mark it as such
                    // remove from the entities map so that it can be re-loaded.
                    delete constructor.prototype[_entities][_id];
                    c.stop();
                }
            });
        }
    }
}
function addReset(proto) {
    proto.reset = function reset() {
        // we fire off the changed alert if the value that will be coming
        // back from get would change.  We ONLY fire the ones that actually change though.
        _.each(_.keys(this[_currentValues]), key => {
            if (this[_currentValues][key] !== this[_values][key]) {
                this[_dependencies][key].changed();
            }
        });
        // clear the unsaved data.
        this[_currentValues] = {};
        this[_update] = {};
    }
}
function addSave(proto, collection) {
    proto.save = function() {
        // if we are modifying an already existing entity, just proceed.
        if (this._id) {
            collection.update({_id: this._id},
                {$set: this[_update]});
            // technically not necessary as the autorun will handle it, but we want to set it up just in case.
            this[_update] = {};
        } else {
            // we have to set up some things to make sure we don't end up with a duplicate entity.
            let _id = Random.id();
            this._id = random.id();
            // this line should grab _entities from the prototype which is a shared map
            this[_entities][_id] = this;
            this[_update]._id = _id;
            collection.insert(this[_update]);
            this[_update] = {};
            this[_setupAutorun]();
        }
    }
}