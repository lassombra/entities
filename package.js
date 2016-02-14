Package.describe({
  name: 'lassombra:entities',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use(
    [
      'ecmascript',
      'tracker',
      'underscore',
      'check',
      'mongo',
      'random'
    ]);
  api.addFiles(
    [
      'entities.js',
      'field.js',
      'methods.js',
      'publications.js',
      'entity.js'
    ]);
  api.export('Entity');
});

Package.onTest(function(api) {
  api.use(
  [
    'ecmascript',
    'tinytest',
    'tracker',
    'insecure'
  ]);
  api.use('lassombra:entities');
  api.addFiles('entities-tests.js');
});
