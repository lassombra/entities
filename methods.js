/**
 * Creates a method on an entity.
 * @param targetClass {Function} the entity which needs to have a function added.
 * @param key {String} the name of the method to apply
 * @param func {Function} the actual method to call (can be provided separate on server and client, but needs to be on both)
 */
applyMethod = function applyMethod(targetClass, key, func) {
    // create namespaced function name.  Use $entity$ as the separator in case other environments get similar ideas
    let name = `${targetClass.name}$entity$${key}`;
    // register the method
    Meteor.methods({[name]:func});
    if (Meteor.isClient) {
        addWrappedMethod(targetClass, key, name);
    }
};
/**
 * Actually put the method on the entity object.
 * @param targetClass {Function} the entity which will have the function added to it.
 * @param key {String} the key on the entity to use to access the function
 * @param name {String} the meteor method name.
 */
function addWrappedMethod(targetClass, key, name) {
    //doing it this way creates closure around name.
    function callMethod(...args) {
        return new Promise((resolve, reject) => {
            Meteor.call(name, ...args, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }
    targetClass[key] = callMethod;
}