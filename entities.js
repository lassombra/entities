/*
 * Yay for Symbol().  It lets me create various symbols that will be used throughout this package and they will
 * NEVER conflict with other behavior.  This is the mixin authors best friend, really!
 */
_entity = Symbol();

// export
Entity = {};

/**
 * Wraps a constructor function (or ES6 class) with entity behavior.
 * @param entityConstructor {Function} the constructor to modify.  Note, that the constructor will be returned.
 * @param fieldMap {Object} the map of fields.  Format is of the type {field: checkParamters}.  Can be
 *  {field: {check: checkParamters, saveField: 'keyToSaveInMongo'}}.  Both will be accepted.
 * @param methodMap {Object} a simple map of Meteor methods to wrap on this object.  See Method wrap later for syntax and information.
 * @param publicationMap {Object} a simple map of Meteor publications to publish for this object.
 * @param collection {Meteor.Collection} the Meteor collection which will persist this object.
 * @return {Function} originally passed in constructor.  Will have a modified prototype and will have some static fields.
 */
Entity.wrap = function(entityConstructor, fieldMap, {methodMap = undefined, publicationMap = undefined, collection = undefined}) {
    _.each(_.keys(fieldMap), key => applyField(entityConstructor, key, fieldMap[key]));
    if (methodMap) {
        Entity.addMethods(entityConstructor, methodMap);
    }
    if (publicationMap) {
        Entity.addPublications(entityConstructor, publicationMap);
    }
    return entityCreate(entityConstructor, collection);
};

/**
 * Creates a methods on an entity.  This is a convenience function for example if you don't want to use
 * the rest of the entity behavior but want a nice promise and strongly named interface to methods (namespaced methods, yay)
 * @param entity {Function} the entity which needs to have a function added.
 * @param methodMap {Object} object in the form {key: function} which will be converted
 */
Entity.addMethods = function(entity, methodMap) {
    _.each(_.keys(methodMap), key => applyMethod(entity, key, methodMap[key]));
};

/**
 * Creates publications on a function.  This is a convenience function for providing namespaced publications without
 * having to use the rest of the entity behavior.
 * @param entity {Function} the entity which needs to have a function added.
 * @param publicationMap {Object} object in the form {key: function} which will be converted
 */
Entity.addPublications = function(entity, publicationMap) {
    _.each(_.keys(publicationMap), key => applyPublication(entity, key, publicationMap[key]));
};