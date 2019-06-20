define(
   [
      'Controls/list',
      'Types/source',
      'Controls/context',
      'Core/Deferred'
   ],
   function(lists, sourceLib, contexts, Deferred) {
      describe('Container/Data', function() {

         var sourceData = [
            {id: 1, title: 'Sasha'},
            {id: 2, title: 'Dmitry'},
            {id: 3, title: 'Andrey'},
            {id: 4, title: 'Aleksey'},
            {id: 5, title: 'Sasha'},
            {id: 6, title: 'Ivan'}
         ];

         var sourceDataEdited = [
            {id: 1, title: 'Sasha'},
            {id: 2, title: 'Dmitry'},
            {id: 3, title: 'Andrey'},
            {id: 4, title: 'Petr'},
            {id: 5, title: 'Petr'},
            {id: 6, title: 'Petr'}
         ];

         var source = new sourceLib.Memory({
            idProperty: 'id',
            data: sourceData
         });

         var getDataWithConfig = function(config) {
            var data = new lists.DataContainer(config);
            data.saveOptions(config);
            return data;
         };

         it('update source', function(done) {
            var data = getDataWithConfig({source: source, keyProperty: 'id'});
            var newSource = new sourceLib.Memory({
               idProperty: 'id',
               data: sourceDataEdited
            });
            data._dataOptionsContext = new contexts.ContextOptions();
            data._beforeUpdate({source: newSource, idProperty: 'id'}).addCallback(function(items) {
               try {
                  assert.deepEqual(data._items.getRawData(), sourceDataEdited);
                  done();
               } catch (e) {
                  done(e)
               }
            });
         });

         it('_beforeMount with receivedState', function() {
            var data = getDataWithConfig({source: source, keyProperty: 'id'});
            var newSource = new sourceLib.Memory({
               idProperty: 'id',
               data: sourceData
            });
            data._beforeMount({source: newSource, idProperty: 'id'}, {}, sourceData);

            assert.deepEqual(data._items, sourceData);
            assert.isTrue(!!data._prefetchSource);
         });

         it('_beforeMount with receivedState and prefetchProxy', function() {
            let memory = new sourceLib.Memory({
               idProperty: 'id',
               data: sourceData
            });
            let prefetchSource = new sourceLib.PrefetchProxy({
               target: memory,
               data: {
                  query: sourceData
               }
            });
            let data = getDataWithConfig({source: prefetchSource, keyProperty: 'id'});

            data._beforeMount({source: prefetchSource, idProperty: 'id'}, {}, sourceData);
            assert.isTrue(data._prefetchSource.getOriginal() === memory);
            assert.isTrue(data._prefetchSource !== prefetchSource);
         });

         it('update equal source', function(done) {
            var
               items,
               config = {source: source, keyProperty: 'id'},
               data = getDataWithConfig(config);

            data._beforeMount(config).addCallback(function() {
               items = data._items;

               data._beforeUpdate({source: new sourceLib.Memory({
                  idProperty: 'id',
                  data: sourceDataEdited
               }), idProperty: 'id'}).addCallback(function() {
                  assert.isTrue(data._items === items);
                  done();
               });
            });
         });

         it('update not equal source', function(done) {
            var
               items,
               config = {source: source, keyProperty: 'id'},
               data = getDataWithConfig(config);

            data._beforeMount(config).addCallback(function() {
               items = data._items;

               data._beforeUpdate({source: new sourceLib.Memory({
                  idProperty: 'id',
                  model: 'Types/entity:Record',
                  data: sourceDataEdited
               }), idProperty: 'id'}).addCallback(function() {
                  try {
                     assert.isFalse(data._items === items);
                     done();
                  } catch (e) {
                     done(e);
                  }
               });
            });
         });

         it('data source options tests', function(done) {
            var config = {source: null, keyProperty: 'id'},
               data = getDataWithConfig(config);

            //creating without source
            data._beforeMount(config);

            assert.equal(data._source, null);
            assert.isTrue(!!data._dataOptionsContext);

            //new source received in _beforeUpdate
            data._beforeUpdate({source: source}).addCallback(function() {
               assert.isTrue(data._source === source);
               assert.isTrue(data._dataOptionsContext.source === source);
               assert.isTrue(!!data._dataOptionsContext.prefetchSource);
               done();
            });
         });

         it('itemsChanged', function(done) {
            var config = {source: source, keyProperty: 'id'};
            var data = getDataWithConfig(config);
            var propagationStopped = false;
            var event = {
               stopPropagation: function() {
                  propagationStopped = true;
               }
            };

            data._beforeMount(config).addCallback(function() {
               data._itemsChanged(event, data._items);
               assert.isTrue(propagationStopped);
               done();
            });
         });

         it('filterChanged', function() {
            var config = {source: source, keyProperty: 'id', filter: {test: 'test'}};
            var data = getDataWithConfig(config);

            return new Promise(function(resolve) {
               data._beforeMount(config).addCallback(function() {
                  data._filterChanged(null, {test1: 'test1'});
                  assert.isTrue(config.source === data._dataOptionsContext.prefetchSource);
                  assert.deepEqual(data._filter, {test1: 'test1'});
                  resolve();
               });
            });
         });

         it('query returns error', function(done) {
            var source = {
               query: function() {
                  return Deferred.fail({
                     canceled: false,
                     processed: false,
                     _isOfflineMode: false
                  });
               },
               _mixins: [],
               "[Types/_source/ICrud]": true
            };
            var dataLoadErrbackCalled = false;
            var dataLoadErrback = function() {
               dataLoadErrbackCalled = true;
            };
            var config = {source: source, keyProperty: 'id', dataLoadErrback: dataLoadErrback};
            var data = getDataWithConfig(config);

            data._beforeMount(config).addCallback(function() {
               assert.isTrue(!!data._dataOptionsContext.prefetchSource);
               assert.equal(data._dataOptionsContext.source, source);
               assert.isTrue(dataLoadErrbackCalled);
               done();
            });
         });

         it('_private.createPrefetchSource with error data', function(done) {
            var queryCalled = false;
            var source = {
               query: function() {
                  queryCalled = true;
                  return Deferred.fail(error);
               },
               _mixins: [],
               "[Types/_source/ICrud]": true
            };

            var dataLoadErrbackCalled = false;
            var dataLoadErrback = function() {
               dataLoadErrbackCalled = true;
            };
            var error = new Error('test');

            var config = {source: source, keyProperty: 'id', dataLoadErrback: dataLoadErrback};
            var self = getDataWithConfig(config);
            lists.DataContainer._private.resolveOptions(self, {source:source});

            var promise = lists.DataContainer._private.createPrefetchSource(self, error, dataLoadErrback);
            assert.instanceOf(promise, Promise);
            promise.then(function(result) {
               assert.equal(result.error, error);
               assert.isTrue(dataLoadErrbackCalled);
               assert.isFalse(queryCalled);
               done();
            }).catch(function(error) {
               done(error);
            });
         });

         it('_private.createPrefetchSource with error query result', function(done) {
            var error = new Error('test');
            var queryCalled = false;

            var source = {
               query: function() {
                  queryCalled = true;
                  return Deferred.fail(error);
               },
               _mixins: [],
               "[Types/_source/ICrud]": true
            };
            var dataLoadErrbackCalled = false;
            var dataLoadErrback = function() {
               dataLoadErrbackCalled = true;
            };

            var config = {source: source, keyProperty: 'id', dataLoadErrback: dataLoadErrback};
            var self = getDataWithConfig(config);
            lists.DataContainer._private.resolveOptions(self, {source:source});

            var promise = lists.DataContainer._private.createPrefetchSource(self, undefined, dataLoadErrback);

            assert.instanceOf(promise, Promise);
            promise.then(function(result) {
               assert.equal(result.error, error);
               assert.isTrue(dataLoadErrbackCalled);
               assert.isTrue(queryCalled);
               done();
            }).catch(function(error) {
               done(error);
            });
         });

         it('_private.createPrefetchSource with data', function(done) {
            var data = {test: true};
            var queryCalled = false;

            var source = {
               query: function() {
                  queryCalled = true;
                  return Deferred.success(data);
               },
               _mixins: [],
               "[Types/_source/ICrud]": true
            };
            var dataLoadErrbackCalled = false;
            var dataLoadErrback = function() {
               dataLoadErrbackCalled = true;
            };

            var config = {source: source, keyProperty: 'id', dataLoadErrback: dataLoadErrback};
            var self = getDataWithConfig(config);
            lists.DataContainer._private.resolveOptions(self, {source:source});

            var promise = lists.DataContainer._private.createPrefetchSource(self, data, dataLoadErrback);

            assert.instanceOf(promise, Promise);
            promise.then(function(result) {
               assert.equal(result.data, data);
               assert.isFalse(dataLoadErrbackCalled);
               assert.isFalse(queryCalled);
               done();
            }).catch(function(error) {
               done(error);
            });
         });

         it('_private.createPrefetchSource with data query result', function(done) {
            var data = {test: true};
            var queryCalled = false;

            var source = {
               query: function() {
                  queryCalled = true;
                  return Deferred.success(data);
               },
               _mixins: [],
               "[Types/_source/ICrud]": true
            };
            var dataLoadErrbackCalled = false;
            var dataLoadErrback = function() {
               dataLoadErrbackCalled = true;
            };

            var config = {source: source, keyProperty: 'id', dataLoadErrback: dataLoadErrback};
            var self = getDataWithConfig(config);
            lists.DataContainer._private.resolveOptions(self, {source:source});

            var promise = lists.DataContainer._private.createPrefetchSource(self, undefined, dataLoadErrback);

            assert.instanceOf(promise, Promise);
            promise.then(function(result) {
               assert.equal(result.data, data);
               assert.isFalse(dataLoadErrbackCalled);
               assert.isTrue(queryCalled);
               done();
            }).catch(function(error) {
               done(error);
            });
         });

         it('_private.resolveOptions', function() {
            var self = {
               _options: {
                  filter: {}
               }
            };
            var options = {
               filter: {},
               root: 'test',
               parentProperty: 'testParentProperty'
            };

            lists.DataContainer._private.resolveOptions(self, options);
            assert.deepEqual(self._filter, {testParentProperty: 'test'});
            assert.isTrue(self._filter !== options.filter);


            let filter = {test: 123};
            self._options.filter = filter;
            options.filter = filter;
            lists.DataContainer._private.resolveOptions(self, options);
            //if filter option was not changed, _filter from state will not updated by resolveOptions
            assert.deepEqual(self._filter, {testParentProperty: 'test'});

         });
      });
   });
