define(['Controls/suggest', 'Types/collection', 'Types/entity', 'Env/Env', 'Controls/history', 'Core/Deferred'], function(suggestMod, collection, entity, Env, history, Deferred) {

   describe('Controls.Container.Suggest.Layout', function() {
      var IDENTIFICATORS = [1, 2, 3];

      var hasMoreTrue = {
         hasMore: true
      };
      var hasMoreFalse = {
         hasMore: false
      };

      var getComponentObject = function() {
         var self = {};
         self._options = {};
         self._options.suggestTemplate = {};
         self._options.footerTemplate = {};
         return self;
      };

      var getContainer = function(size) {
         return {
            getBoundingClientRect: function() {
               return {
                  toJSON: function() {
                     return size;
                  }
               };
            }
         };
      };

      var getDropDownContainer = function(height) {
         return {
            getBoundingClientRect: function() {
               return {
                  bottom: 0,
                     top: 0,
                     height: height
               };
            }
         };
      };

      let getRecentKeys = suggestMod._InputController._private.getRecentKeys;

      suggestMod._InputController._private.getRecentKeys = function() {
         return Deferred.success(IDENTIFICATORS);
      };

      var getHistorySource = suggestMod._InputController._private.getHistoryService;

      suggestMod._InputController._private.getHistoryService = function() {
         return {
            addCallback: function(func) {
               func({
                  update: function(item) {
                     item._isUpdateHistory = true;
                  }
               });
            }
         }
      };

      it('Suggest::getHistoryService', function(done) {
         getHistorySource({_options: {historyId: 'TEST_HISTORY_ID_GET_SOURCE'}}).addCallback(function(historyService) {
            assert.equal(12, historyService._recent);
            assert.equal('TEST_HISTORY_ID_GET_SOURCE', historyService._historyId);
            done();
         });
      });

      it('Suggest::_private.hasMore', function() {
         assert.isTrue(suggestMod._InputController._private.hasMore(hasMoreTrue));
         assert.isFalse(suggestMod._InputController._private.hasMore(hasMoreFalse));
      });

      it('Suggest::_private.shouldShowFooter', function () {
         var self = getComponentObject();
         self._options.footerTemplate = 'anyTemplate';
         assert.isTrue(!!suggestMod._InputController._private.shouldShowFooter(self, hasMoreTrue));
         assert.isFalse(!!suggestMod._InputController._private.shouldShowFooter(self, hasMoreFalse));
      });

      it('Suggest::_private.suggestStateNotify', function () {
         var self = getComponentObject();
         var stateNotifyed = false;
         self._options.suggestState = true;
         self._notify = function(eventName, args) {
            stateNotifyed = true;
         };
         self._forceUpdate = function () {};
         suggestMod._InputController._private.suggestStateNotify(self, true);
         assert.isFalse(stateNotifyed);

         suggestMod._InputController._private.suggestStateNotify(self, false);
         assert.isTrue(stateNotifyed);
      });

      it('Suggest::_private.close', function() {
         var self = getComponentObject();
         var state;
         self._options.suggestState = true;
         self._notify = function(eventName, args) {
            state = args[0];
         };
         suggestMod._InputController._private.close(self);
         assert.isFalse(state);
      });

      it('Suggest::_close', function() {
         var suggestComponent = new suggestMod._InputController();
         suggestComponent._loading = true;
         suggestComponent._showContent = true;

         suggestComponent._close();
         assert.equal(suggestComponent._loading, null);
         assert.equal(suggestComponent._showContent, false);
      });

      it('Suggest::_private.open', function (done) {
         var self = getComponentObject();
         var state;
         self._options.suggestState = false;
         self._inputActive = true;
         self._notify = function(eventName, args) {
            state = args[0];
         };
         self._forceUpdate = function () {};
         suggestMod._InputController._private.open(self);
         self._dependenciesDeferred.addCallback(function() {
            assert.isTrue(state);

            state = false;
            self._options.suggestState = false;
            suggestMod._InputController._private.open(self);
            self._inputActive = false;
            self._dependenciesDeferred.addCallback(function() {
               assert.isFalse(state);
               done();
            });
         });
      });

      it('Suggest::_private.shouldSearch', function () {
         var self = getComponentObject();
         self._options.minSearchLength = 3;

         self._inputActive = true;
         assert.isTrue(suggestMod._InputController._private.shouldSearch(self, 'test'));
         assert.isFalse(suggestMod._InputController._private.shouldSearch(self, 't'));

         self._inputActive = false;
         assert.isFalse(suggestMod._InputController._private.shouldSearch(self, 'test'));
         assert.isFalse(suggestMod._InputController._private.shouldSearch(self, 't'));
      });

      it('Suggest::_private.shouldShowSuggest', function () {
         var self = getComponentObject();
         var result = {
            data: new collection.List({items: [1,2,3]})
         };
         var emptyResult = {
            data: new collection.List()
         };

         //case 1. emptyTemplate - is null/undefined, searchValue - is empty string/null
         assert.isTrue(!!suggestMod._InputController._private.shouldShowSuggest(self, result));
         assert.isFalse(!!suggestMod._InputController._private.shouldShowSuggest(self, emptyResult));

         //case 2. emptyTemplate is set, searchValue - is empty string/null
         self._options.emptyTemplate = {};
         assert.isTrue(!!suggestMod._InputController._private.shouldShowSuggest(self, result));
         assert.isTrue(!!suggestMod._InputController._private.shouldShowSuggest(self, emptyResult));

         //case 3. emptyTemplate is set, searchValue - is set
         self._searchValue = 'test';
         assert.isTrue(!!suggestMod._InputController._private.shouldShowSuggest(self, result));
         assert.isTrue(!!suggestMod._InputController._private.shouldShowSuggest(self, emptyResult));

         //case 4. emptyTemplate is set, search - is empty string, historyId is set
         self._searchValue = '';
         self._options.historyId = '123';
         assert.isFalse(!!suggestMod._InputController._private.shouldShowSuggest(self, emptyResult));
         assert.isTrue(!!suggestMod._InputController._private.shouldShowSuggest(self, result));

         //emptyTemplate is set, search - is set, historyId is set
         self._searchValue = '123';
         self._options.historyId = '123';
         assert.isTrue(!!suggestMod._InputController._private.shouldShowSuggest(self, emptyResult));
         assert.isTrue(!!suggestMod._InputController._private.shouldShowSuggest(self, result));

         //case 6. emptyTemplate is null/undefined, search - is empty string, historyId is set
         self._options.emptyTemplate = null;
         assert.isFalse(!!suggestMod._InputController._private.shouldShowSuggest(self, emptyResult));
         assert.isTrue(!!suggestMod._InputController._private.shouldShowSuggest(self, result));
      });

      it('Suggest::_private.prepareFilter', function() {
         var self = getComponentObject();
         self._searchValue = 'dassdaasd';
         self._options.searchParam = 'searchParam';
         self._options.minSearchLength = 3;

         var resultFilter = {
            currentTab: 1,
            searchParam: 'test',
            filterTest: 'filterTest'
         };

         var filter = suggestMod._InputController._private.prepareFilter(self, {filterTest: 'filterTest'}, 'test', 1, [1, 2]);
         assert.deepEqual(filter, resultFilter);

         self._searchValue = '';
         resultFilter.historyKeys = [1, 2];
         filter = suggestMod._InputController._private.prepareFilter(self, {filterTest: 'filterTest'}, 'test', 1, [1, 2]);
         assert.deepEqual(filter, resultFilter);
      });

      it('Suggest::_private.setFilter', function() {
         var self = getComponentObject();
         self._options.searchParam = 'searchParam';
         self._searchValue = 'test';
         self._tabsSelectedKey = 1;
         var filter = {
            test: 'test'
         };
         var resultFilter = {
            searchParam: 'test',
            test: 'test',
            currentTab: 1
         };
         suggestMod._InputController._private.setFilter(self, filter);
         assert.deepEqual(self._filter, resultFilter);
      });

      it('Suggest::_searchEnd', function() {
         var suggest = new suggestMod._InputController();
         var errorFired = false;
         var options = {
           searchDelay: 300
         };
         suggest.saveOptions(options);
         suggest._searchDelay = 0;
         suggest._children = {};

         try {
            suggest._searchEnd();
         } catch (e) {
            errorFired = true;
         }

         assert.equal(options.searchDelay, suggest._searchDelay);
         assert.isFalse(errorFired);
      });

      it('Suggest::_private.searchErrback', function(done) {
         var self = getComponentObject();
         self._forceUpdate = function() {};

         self._loading = null;
         suggestMod._InputController._private.searchErrback(self, {canceled: true});
         assert.isTrue(self._loading === null);

         self._loading = true;
         suggestMod._InputController._private.searchErrback(self, {canceled: false});
         assert.isFalse(self._loading);

         self._forceUpdate = function() {
            assert.equal(self._emptyTemplate(), '<div class="controls-Suggest__empty"> Справочник недоступен </div>');
            done();
         };
         self._loading = true;
         suggestMod._InputController._private.searchErrback(self, {canceled: true});
         assert.isFalse(self._loading);
      });

      it('Suggest::_private.setSearchValue', function() {
         var self = {};

         suggestMod._InputController._private.setSearchValue(self, 'test');
         assert.equal(self._searchValue, 'test');

         suggestMod._InputController._private.setSearchValue(self, '');
         assert.equal(self._searchValue, '');
      });

      it('Suggest::_searchErrback', function() {
         var suggest = new suggestMod._InputController();
         suggest._loading = true;
         suggest._searchErrback({canceled: true});
         assert.isFalse(suggest._loading);
      });

      it('Suggest::check footer template', function(done) {
         var footerTpl;

         requirejs(['Controls/suggestPopup'], function(result) {
            footerTpl = result.FooterTemplate;

            assert.equal(footerTpl(), '<div class="controls-Suggest__footer"></div>');
            assert.equal(footerTpl({showMoreButtonTemplate: 'testShowMore'}), '<div class="controls-Suggest__footer">testShowMore</div>');
            assert.equal(footerTpl({showMoreButtonTemplate: 'testShowMore', showSelectorButtonTemplate: 'testShowSelector'}), '<div class="controls-Suggest__footer">testShowMoretestShowSelector</div>');
            done();
         });
      });

      it('Suggest::showAllClick', function() {
         var suggest = new suggestMod._InputController();
         var stackOpened = false;

         suggest._notify = () => {return false};
         suggest._showContent = true;
         suggest._children = {
            stackOpener: {
               open: () => {
                  stackOpened = true;
               }
            }
         };

         suggest._showAllClick();

         assert.isFalse(stackOpened);
         assert.isFalse(suggest._showContent);
      });

      it('Suggest::_inputActivated/inputClicked with autoDropDown', function() {
         var self = getComponentObject();
         var suggestComponent = new suggestMod._InputController();
         var suggestState = false;

         self._options.searchParam = 'searchParam';
         self._options.autoDropDown = true;
         self._options.minSearchLength = 3;
         self._options.readOnly = true;
         self._options.historyId = 'testFieldHistoryId';
         self._options.keyProperty = 'Identificator';

         suggestComponent._searchDelay = 300;
         suggestComponent.saveOptions(self._options);
         suggestMod._InputController._private.setFilter(suggestComponent, {});
         suggestComponent._notify = function(event, val) {
            if (event === 'suggestStateChanged') {
               suggestState = val[0];
            }
         };

         suggestComponent._inputActivated();
         assert.equal(suggestComponent._searchDelay, 300);
         suggestComponent._options.readOnly = false;


         return new Promise(function(resolve) {
            suggestComponent._inputActivated();
            assert.equal(suggestComponent._searchDelay, 0);

            suggestComponent._dependenciesDeferred.addCallback(function() {
               assert.isTrue(suggestState);
               assert.deepEqual(suggestComponent._filter['historyKeys'], IDENTIFICATORS);

               suggestComponent._changeValueHandler(null, '');
               assert.isTrue(suggestState);
               assert.equal(suggestComponent._searchValue, '');

               suggestComponent._close();
               suggestComponent._filter = {};
               suggestComponent._inputClicked();

               suggestComponent._dependenciesDeferred.addCallback(function() {
                  assert.isTrue(suggestState);
                  assert.deepEqual(suggestComponent._filter['historyKeys'], IDENTIFICATORS);

                  suggestComponent._close();
                  self._options.readOnly = true;
                  suggestComponent._inputActivated();
                  suggestComponent._dependenciesDeferred.addCallback(function() {
                     assert.isFalse(suggestState);

                     suggestComponent._inputClicked();
                     suggestComponent._dependenciesDeferred.addCallback(function() {
                        assert.isFalse(suggestState);

                        suggestComponent._options.historyId = '';
                        suggestComponent._filter = {};
                        suggestComponent._options.readOnly = false;
                        suggestComponent._inputActivated();

                        suggestComponent._dependenciesDeferred.addCallback(function() {
                           assert.isTrue(suggestState);
                           assert.deepEqual(suggestComponent._filter, {searchParam: ''});

                           suggestComponent._options.suggestState = true;
                           suggestComponent._filter = {};
                           suggestComponent._inputActivated();

                           suggestComponent._dependenciesDeferred.addCallback(function() {
                              assert.deepEqual(suggestComponent._filter, {});
                              resolve();
                           });
                        });
                     });
                  });
               });
            });
         });
      });

      it('Suggest::_changeValueHandler', function() {
         var self = getComponentObject();
         var suggestComponent = new suggestMod._InputController();

         self._options.searchParam = 'searchParam';
         self._options.keyProperty = 'Identificator';
         self._options.minSearchLength = 3;
         self._options.searchDelay = 300;

         suggestComponent.saveOptions(self._options);
         suggestComponent._inputActive = true;
         suggestComponent._searchDelay = 0;

         suggestComponent._changeValueHandler(null, 't');
         assert.equal(suggestComponent._searchValue, '');
         assert.equal(suggestComponent._searchDelay, 300);

         suggestComponent._changeValueHandler(null, 'te');
         assert.equal(suggestComponent._searchValue, '');

         suggestComponent._changeValueHandler(null, 'test');
         assert.equal(suggestComponent._searchValue, 'test');

         self._options.trim = true;
         suggestComponent._changeValueHandler(null, '  ');
         assert.equal(suggestComponent._searchValue, '');

         self._options.historyId = 'testFieldHistoryId';
         self._options.autoDropDown = true;
         suggestComponent._changeValueHandler(null, 'te');
         assert.equal(suggestComponent._searchValue, '');
         assert.deepEqual(suggestComponent._filter.historyKeys, IDENTIFICATORS);
         self._options.historyId = '';
         suggestComponent._changeValueHandler(null, 'test');
         assert.deepEqual(suggestComponent._filter, {searchParam: 'test'});
         suggestComponent._changeValueHandler(null, 'te');
         assert.deepEqual(suggestComponent._filter, {searchParam: '', historyKeys: IDENTIFICATORS});
      });

      it('Suggest::_private.loadDependencies', function(done) {
         var self = getComponentObject();

         suggestMod._InputController._private.loadDependencies(self).addCallback(function() {
            assert.isTrue(self._dependenciesDeferred.isReady());
            done();
         });
      });

      it('Suggest::_private.processResultData', function() {
         var self = getComponentObject();
         self._notify = function() {};
         var queryRecordSet = new collection.RecordSet({
            rawData: [{id: 1}, {id: 2}, {id: 3}],
            idProperty: 'id'
         });
         queryRecordSet.setMetaData({
            results: new entity.Model({
               rawData: {
                  tabsSelectedKey: 'testId',
                  switchedStr: 'testStr'
               }
            })
         });

         suggestMod._InputController._private.processResultData(self, {data: queryRecordSet});

         assert.equal(self._searchResult.data, queryRecordSet);
         assert.equal(self._tabsSelectedKey, 'testId');
         assert.equal(self._misspellingCaption, 'testStr');

         var queryRecordSetEmpty = new collection.RecordSet();
         queryRecordSetEmpty.setMetaData({
            results: new entity.Model({
               rawData: {
                  tabsSelectedKey: 'testId2',
                  switchedStr: 'testStr2'
               }
            })
         });
         self._suggestMarkedKey = 'test';
         suggestMod._InputController._private.processResultData(self, {data: queryRecordSetEmpty});

         assert.equal(self._suggestMarkedKey, null);
         assert.notEqual(self._searchResult.data, queryRecordSet);
         assert.equal(self._searchResult.data, queryRecordSetEmpty);
         assert.equal(self._tabsSelectedKey, 'testId2');
         assert.equal(self._misspellingCaption, 'testStr2');
      });

      it('Suggest::_tabsSelectedKeyChanged', function() {
         var suggestComponent = new suggestMod._InputController();
         var suggestActivated = false;
         var updated = false;
         suggestComponent.activate = function() {
            suggestActivated = true;
         };
         suggestComponent._forceUpdate = function() {
            updated = true;
         };
         suggestComponent._filter = {};
         suggestComponent._filter.currentTab = null;
         suggestComponent._tabsSelectedKey = 'checkChanged';

         /* tabSelectedKey not changed, filter must be not changed too */
         suggestComponent._tabsSelectedKeyChanged('checkChanged');
         assert.equal(suggestComponent._filter.currentTab, null);
         assert.isTrue(updated);

         /* tabSelectedKey changed, filter must be changed */
         suggestComponent._suggestMarkedKey = 'test';
         suggestComponent._tabsSelectedKeyChanged('test');
         assert.equal(suggestComponent._filter.currentTab, 'test');
         assert.isTrue(suggestActivated);
         assert.isTrue(suggestComponent._suggestMarkedKey === null);
      });

      it('Suggest::searchDelay on tabChange', function() {
         var suggestComponent = new suggestMod._InputController();
         suggestComponent.activate = function() {};

         suggestComponent._tabsSelectedKeyChanged('test');
         assert.equal(suggestComponent._searchDelay, 0);
      });

      it('Suggest::_beforeUpdate', function() {
         var options = {
            emptyTemplate: 'anyTpl',
            footerTemplate: 'anyTp',
            suggestState: true,
            value: '',
            trim: true,
            searchParam: 'testSearchParam',
            minSearchLength: 3
         };
         suggestMod._InputController._private.loadDependencies = function() {return Deferred.success(true)};
         var suggestComponent = new suggestMod._InputController(options);
         suggestComponent.saveOptions(options);
         suggestComponent._loading = true;
         suggestComponent._showContent = true;
         suggestComponent._dependenciesDeferred = true;
         suggestComponent._inputActive = true;
         suggestComponent._suggestMarkedKey = 'test'

         suggestComponent._beforeUpdate({suggestState: false, emptyTemplate: 'anotherTpl', footerTemplate: 'anotherTpl',  value: 'te'});
         assert.isFalse(suggestComponent._showContent, null);
         assert.equal(suggestComponent._loading, null);
         assert.equal(suggestComponent._dependenciesDeferred, null);
         assert.equal(suggestComponent._searchValue, '');
         assert.equal(suggestComponent._filter, null);
         assert.equal(suggestComponent._suggestMarkedKey, null);

         suggestComponent._beforeUpdate({suggestState: false, emptyTemplate: 'anotherTpl', footerTemplate: 'anotherTpl', value: '   '});
         assert.equal(suggestComponent._filter, null);
         assert.equal(suggestComponent._searchValue, '');

         suggestComponent._beforeUpdate({suggestState: false, emptyTemplate: 'anotherTpl', footerTemplate: 'anotherTpl', value: 'test'});
         assert.deepEqual(suggestComponent._filter, {testSearchParam: 'test'});
         assert.equal(suggestComponent._searchValue, 'test');

         suggestComponent._options.value = 'test';
         suggestComponent._beforeUpdate({suggestState: false, emptyTemplate: 'anotherTpl', footerTemplate: 'anotherTpl',  value: ''});
         assert.deepEqual(suggestComponent._filter, {testSearchParam: ''});
         assert.equal(suggestComponent._searchValue, '');
      });

      it('Suggest::_updateSuggestState', function() {
         var compObj = getComponentObject();
         compObj._options.fitler = {};
         compObj._options.searchParam = 'testSearchParam';
         compObj._options.minSearchLength = 3;
         compObj._options.historyId = 'historyField';


         var suggestComponent = new suggestMod._InputController();

         suggestComponent.saveOptions(compObj._options);
         suggestComponent._searchValue = 'te';
         suggestComponent._historyKeys = [1, 2];
         suggestComponent._inputActive = true;

         compObj._options.autoDropDown = true;
         //compObj._options.suggestState = true;
         suggestMod._InputController._private.updateSuggestState(suggestComponent);
         assert.deepEqual(suggestComponent._filter, {testSearchParam: 'te', historyKeys: suggestComponent._historyKeys});

         suggestComponent._searchValue = 'test';
         suggestMod._InputController._private.updateSuggestState(suggestComponent);
         assert.deepEqual(suggestComponent._filter, {testSearchParam: 'test'});

         compObj._options.autoDropDown = false;
         compObj._options.minSearchLength = 10;
         suggestComponent._filter = {};
         suggestMod._InputController._private.updateSuggestState(suggestComponent);
         assert.deepEqual(suggestComponent._filter, {});
      });

      it('Suggest::_missSpellClick', function() {
         var
            value,
            suggestComponent = new suggestMod._InputController();

         suggestComponent.activate = function() {
            suggestComponent._inputActive = true;
         }
         suggestComponent._notify = function(event, val) {
            if (event === 'valueChanged') {
               value = val[0];
            }
         };
         suggestComponent._options.minSearchLength = 3;
         suggestComponent._misspellingCaption = 'test';
         suggestComponent._missSpellClick();

         assert.equal(value, 'test');
         assert.equal(suggestComponent._misspellingCaption, '');
         assert.equal(suggestComponent._searchValue, 'test');
         assert.isTrue(suggestComponent._inputActive);
      });

      it('Suggest::_private.setMissSpellingCaption', function() {
         var self = {};

         suggestMod._InputController._private.setMissSpellingCaption(self, 'test');
         assert.equal(self._misspellingCaption, 'test');
      });

      it('Suggest::_select', function() {
         var
            item = {
               _isUpdateHistory: false
            },
            suggestComponent = new suggestMod._InputController();

         suggestComponent._inputActive = true;
         suggestComponent._notify = function(eventName) {
            if (eventName === 'choose') {
               assert.isFalse(suggestComponent._inputActive);
            }
         };
         suggestComponent._select(item);
         assert.isFalse(item._isUpdateHistory);
         assert.isFalse(suggestComponent._inputActive);

         suggestComponent._options.historyId = 'testFieldHistoryId';
         suggestComponent._select(item);
         assert.isTrue(item._isUpdateHistory);
      });

      it('Suggest::_markedKeyChangedHandler', function() {
         var suggestComponent = new suggestMod._InputController();
         suggestComponent._markedKeyChangedHandler(null, 'test');
         assert.equal(suggestComponent._suggestMarkedKey, 'test');

         suggestComponent._markedKeyChangedHandler(null, 'test2');
         assert.equal(suggestComponent._suggestMarkedKey, 'test2');
      });


      it('Suggest::_keyDown', function() {
         var suggestComponent = new suggestMod._InputController();
         var eventPreventDefault = false;
         var eventStopPropagation = false;
         var suggestStateChanged = false;
         var eventTriggered = false;
         suggestComponent._children = {
            inputKeydown: {
               start: function() {
                  eventTriggered = true;
               }
            }
         };

         suggestComponent._notify = (event) => {
            if (event === 'suggestStateChanged') {
               suggestStateChanged = true;
            }
         };

         function getEvent(keyCode) {
            return {
               nativeEvent: {
                  keyCode: keyCode
               },
               preventDefault: () => {
                  eventPreventDefault = true;
               },
               stopPropagation: () => {
                  eventStopPropagation = true;
               }
            };
         }
         suggestComponent._keydown(getEvent(Env.constants.key.down));
         assert.isFalse(eventPreventDefault);
         assert.isFalse(eventStopPropagation);

         suggestComponent._options.suggestState = true;

         suggestComponent._keydown(getEvent(Env.constants.key.down));
         assert.isTrue(eventPreventDefault);
         assert.isTrue(eventStopPropagation);
         eventPreventDefault = false;

         suggestComponent._keydown(getEvent(Env.constants.key.up));
         assert.isTrue(eventPreventDefault);
         eventPreventDefault = false;

         suggestComponent._keydown(getEvent(Env.constants.key.enter));
         assert.isFalse(eventPreventDefault);
         eventPreventDefault = false;

         suggestComponent._suggestMarkedKey = 'test';
         suggestComponent._keydown(getEvent(Env.constants.key.enter));
         assert.isTrue(eventPreventDefault);

         eventPreventDefault = false;
         suggestComponent._keydown(getEvent('test'));
         assert.isFalse(eventPreventDefault);
         assert.isTrue(eventTriggered);

         eventPreventDefault = false;
         suggestComponent._keydown(getEvent(Env.constants.key.esc));
         assert.isTrue(suggestStateChanged);
      });

      it('Suggest::_private.openWithHistory', function () {
         var suggestComponent = new suggestMod._InputController();

         suggestComponent._filter = {};
         suggestComponent._historyKeys = [7, 8];
         suggestComponent._searchValue = '';
         suggestComponent._options.minSearchLength = 3;
         suggestComponent._options.searchParam = 'search';
         suggestMod._InputController._private.openWithHistory(suggestComponent);
         assert.deepEqual(suggestComponent._filter, {search: '', historyKeys: [7, 8]});
      });

      it('Suggest::_private.getRecentKeys', function() {
         let self = {};
         suggestMod._InputController._private.getHistoryService = function() {
            let hService = { query: () => { return new Deferred.fail(new Error('History Service')); } };
            return new Deferred.success(hService);
         };
         return new Promise(function(resolve) {
            getRecentKeys(self).addCallback(function(keys) {
               assert.deepEqual([], keys);
               resolve();
            });
         });
      });

      it('Suggest::_inputClicked', function() {
         var suggestComponent = new suggestMod._InputController();

         suggestComponent._inputClicked();
         assert.isTrue(suggestComponent._inputActive);
      });
   });
});
