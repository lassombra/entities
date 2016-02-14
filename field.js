/**
 * Places a single field on an entity function.  This field will do the special work of providing accessors to
 * retrieve and modify the field.  It will also handle making sure that the dependencies are set up properly.
 *
 * Note that this must lazily configure the entity as when we get decorator support, this will ALWAYS get called
 * before the entity is turned into an actual entity with dependencies and all of that.  For that reason, we expect
 * the entity to be initialized somewhere between when this function is called and when the accessors are called.
 * @param entity {Function} The constructor function to attach this field to
 * @param key {String} the key for the field
 * @param field {Object} Either an object of form {check: checkPattern, saveField: 'keyToSaveInMongo'} or just a checkPattern
 */
applyField = function applyField(targetClass, key, field) {
    if (Meteor.isClient) {
        // name is what will be used throughout to reference this field.
        // key will always be what gets exposed on the prototype.
        let name = key;
        let checkRule = field;
        if (!!field.saveField) {
            name = field.saveField;
            checkRule = field.check;
        }
        if (!targetClass[_entity]) {
            targetClass[_entity] = {};
        }
        if (!targetClass[_entity].fields) {
            targetClass[_entity].fields = {};
        }
        // make sure the entity knows that it cares about this field
        // by setting it to 1 we can just use fields in a mongo query
        targetClass[_entity].fields[name] = 1;
        // compose accessors onto entity.  Will be accessed via entity.key
        createAccessors(targetClass, key, name, checkRule)
    }
};
/**
 * creates get and set and puts them on entity prototype.
 * @param targetConstructor {Function} entity to apply this to
 * @param key {String} name of field to create
 * @param name {String} name of mongo field
 * @param checkRule {MatchPattern} rule to pass to check
 */
function createAccessors(targetConstructor, key, name, checkRule) {
    function get() {
        // init is a function on _entity which will make sure that
        // everything is setup
        this[_init]();
        // setup dependency even if we don't return anything.
        // that just means we will want to know when we do have something.
        this[_entity].dependencies[name].depend();
        return this[_entity].currentValues[name]
            || this[_entity].values[name];
    }
    function set(value) {
        check(value, checkRule);
        this[_init]();
        let current = this[_entity].currentValues[name]
            || this[_entity].values[name];
        if (value !== current) {
            this[_entity].currentValues[name] = value;
            this[_entity].update[name] = _.clone(value);
            this[_entity].dependencies[name].changed();
        }
    }
    Object.defineProperty(targetConstructor.prototype, key, {
        get, set
    });
}