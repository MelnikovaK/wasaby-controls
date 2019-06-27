/**
 * Created by am.gerasimov on 06.03.2017.
 */
/* global define, beforeEach, afterEach, describe, context, it, assert, $ws */
define(
   [
      'Controls/search',
      'Types/source'
   ],
   function(searchLib, sourceLib) {

      'use strict';

      var data = [
            {
               name: 'Sasha',
               id: 0
            },
            {
               name: 'Aleksey',
               id: 1
            },
            {
               name: 'Dmitry',
               id: 2
            },
            {
               name: 'Dmitry',
               id: 3
            }
         ],
         source = new sourceLib.Memory({
            data: data
         }),
         navigation = {
            source: 'page',
            sourceConfig: {
               pageSize: 10,
               page: 0,
               hasMore: false
            }
         },
         sorting = [{id: 'DESC'}];

      describe('Controls/search:_SearchController', function() {

         it('setFilter', function() {
            var filter = {test: 'test'};
            var searchController = new searchLib._SearchController({});

            searchController.setFilter(filter);
            assert.deepEqual(filter, {test: 'test'});
         });


         it('getFilter', function() {
            var filter = {test: 'test'};
            var searchController = new searchLib._SearchController({});

            searchController.setFilter(filter);
            assert.deepEqual(searchController.getFilter(), {test: 'test'});
         });

         it('search', function(done) {
            var filter = {};
            var aborted = false;
            var searchStarted = false;
            var searchController = new searchLib._SearchController({
               minSearchLength: 3,
               source: source,
               navigation: navigation,
               searchDelay: 50,
               searchParam: 'name',
               filter: filter,
               searchCallback: function(res, resFilter) {
                  assert.equal(res.data.getCount(), 1);
                  assert.equal(res.data.at(0).get('name'), 'Sasha');
                  assert.isFalse(aborted);
                  assert.isTrue(searchStarted);
                  assert.isTrue(filter !== resFilter);
               },
               abortCallback: function() {
                  aborted = true;
               },
               searchStartCallback: function() {
                  searchStarted = true;
               }
            });

            searchController.search('Sasha');
            assert.isFalse(searchStarted);

            setTimeout(function() {
               searchController.search('');
               searchController.search('Sasha');
               done();
            }, 60);
         });

         it('abort', function() {
            var aborted = false;
            var searchController = new searchLib._SearchController({
               minSearchLength: 3,
               source: source,
               searchDelay: 50,
               searchParam: 'name',
               filter: {},
               abortCallback: function() {
                  aborted = true;
               },
            });

            searchController.search('test');
            assert.isFalse(aborted);

            searchController.abort();
            assert.isFalse(aborted);

            searchController.abort(true);
            assert.isTrue(aborted);
         });

         it('search with sorting', function(done) {
            var filter = {};
            var searchController = new searchLib._SearchController({
               minSearchLength: 0,
               source: source,
               sorting: sorting,
               navigation: navigation,
               searchDelay: 0,
               searchParam: 'name',
               filter: filter,
               searchCallback: function(res) {
                  assert.equal(res.data.getCount(), 2);
                  assert.equal(res.data.at(0).get('id'), 3);
                  assert.equal(res.data.at(1).get('id'), 2);
                  done();
               }
            });

            searchController.search('Dmitry');
         });

         it('search forced', function(done) {
            var searchController = new searchLib._SearchController({
               minSearchLength: 3,
               source: source,
               filter: {}
            });

            searchLib._SearchController._private.getSearch(searchController).addCallback(function(search) {
               var searched = false;
               var forced = false;

               let originalSearch = search.search;
               search.search = function(value, force) {
                  searched = true;

                  if (force) {
                     forced = true;
                  }

                  return originalSearch.apply(search, arguments);
               };

               searchController.search('1', true);
               assert.isTrue(searched);
               assert.isTrue(forced);
               done();
               return search;
            });
         });

         it('minSearchLength is null', async function() {
            var searchController = new searchLib._SearchController({
               minSearchLength: null,
               source: source,
               filter: {}
            });

            await searchLib._SearchController._private.getSearch(searchController);

            var searched = false;
            var forced = false;

            let originalSearch = searchController._search.search;
            searchController._search.search = function(value, force) {
               searched = true;

               if (force) {
                  forced = true;
               }
               return originalSearch.apply(searchController._search, arguments);
            };

            searchController.search('t');
            assert.isFalse(searched);
            assert.isFalse(forced);

            searchController.search('test');
            assert.isFalse(searched);
            assert.isFalse(forced);

            searchController.search('t', true);
            assert.isTrue(searched);
            assert.isTrue(forced);
         });
      });
   });
