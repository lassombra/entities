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
applyField = function applyField(entity, key, field) {
    if (Meteor.isClient) {
        // name is what will be used throughout to reference this field.
        // key will always be what gets exposed on the prototype.
        let name = key;
        let checkRule = field;
        if (!!field.saveField) {
            name = field.saveField;
            checkRule = field.check;
        }
        // make sure the entity knows that it cares about this field
        // fields may not exist yet.
        if (!entity.prototype[_fields]) {
            entity.prototype[_fields] = {};
        }
        // by setting the key on fields to 1, fields can be later passed to a mongo selector as is.
        entity.prototype[_fields][name] = 1;
        // compose accessors onto entity.  Will be accessed via entity.key
        createAccessors(entity, key, name, checkRule)
    }
};
/**
 * creates get and set and puts them on entity prototype.
 * @param entity {Function} entity to apply this to
 * @param key {String} name of field to create
 * @param name {String} name of mongo field
 * @param checkRule {Object|Function} rule to pass to check
 */
function createAccessors(entity, key, name, checkRule) {
    function get() {
        //register a dependency, even if we don't return a value.
        entity[_dependencies][name].depend();
        return entity[_currentValues][name] !== undefined ?
            entity[_currentValues][name] : entity[_values][name];
    }
    function set(value) {
        check(value, checkRule);
        let current = entity[_currentValues][name] !== undefined ?
            entity[_currentValues][name] : entity[_values][name];
        if (current !== value) {
            entity[_currentValues][name] = value;
            entity[_dependencies][name].changed();
            entity[_update][name] = _.clone(value);
        }
    }
    Object.defineProperty(entity.prototype, key, {
        get, set
    });
}