/**
 * Creates a new publication on the entity.  The paired function on the client will subscribe appropriately.
 * @param entity {Function} An entity constructor to add the subscribe function to.
 * @param key {String} the key for the property on the entity constructor
 * @param func {Function} the actual function that will be called.
 */
applyPublication = function applyPublication(entity, key, func) {
    // create namespaced publication name.  Use $entityPub$ as the separator in case other environments get similar ideas
    let name = `${entity.name}$entityPub$${key}`;
    if (Meteor.isServer) {
        Meteor.publish(name, func);
    }
    if (Meteor.isClient) {
        addWrappedSubscription(entity, key, name);
    }
};
/**
 * Wrap a subscription in a well named function and attach to entity
 * @param entity {Function} constructor to attach to
 * @param key {String} name on constructor
 * @param name {String} publication name.
 */
function addWrappedSubscription(entity, key, name) {
    function subscribe(...args) {
        return Meteor.subscribe(name, ...args);
    }
    entity[key] = subscribe;
}