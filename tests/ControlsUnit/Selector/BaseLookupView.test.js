/**
 * Created by am.gerasimov on 31.05.2018.
 */
define([
   'Controls/_lookup/BaseLookupView',
   'Types/entity',
   'Types/collection',
   'Env/Env'
], function(Lookup, entity, collection, Env) {

   function getItems(countItems) {
      for (var items = []; countItems; countItems--) {
         items.push(new entity.Model({
            rawData: {id: countItems},
            keyProperty: 'id'
         }));
      }

      return new collection.List({
         items: items
      });
   }

   describe('Controls/_lookup/BaseLookupView', function() {
      it('_beforeMount', function() {
         var lookup = new Lookup();
         lookup._beforeMount({multiLine: true, maxVisibleItems: 10, readOnly: true, multiSelect: true});
         assert.equal(lookup._maxVisibleItems, 10);

         lookup._beforeMount({items: getItems(5), readOnly: true, multiSelect: true});
         assert.equal(lookup._maxVisibleItems, 5);

         lookup._beforeMount({items: getItems(5), readOnly: true});
         assert.equal(lookup._maxVisibleItems, 1);

         lookup._beforeMount({items: getItems(5), value: 'test'});
         assert.equal(lookup._maxVisibleItems, 1);
         assert.equal(lookup._inputValue, 'test');
      });

      it('_afterUpdate', function() {
         let configActivate;
         let activated = false;
         let lookup = new Lookup();

         lookup._needSetFocusInInput = true;
         lookup._options.items = getItems(0);
         lookup.activate = function(config) {
            configActivate = config;
            activated = true;
         };

         lookup._afterUpdate();
         assert.isFalse(activated);
         assert.isFalse(lookup._needSetFocusInInput);

         lookup._needSetFocusInInput = true;
         lookup._active = true;
         lookup._afterUpdate();
         assert.isTrue(activated);
         assert.isFalse(lookup._needSetFocusInInput);
         assert.equal(configActivate, undefined);
      });

      it('_beforeUpdate', function() {
         var
            isCalculatingSizes = false,
            items = new collection.List(),
            lookup = new Lookup(),
            isInputActive = true;

         lookup._suggestState = true;
         lookup._isInputActive = function() {
            return isInputActive;
         };
         lookup._calculatingSizes = function() {
            isCalculatingSizes = true;
         };

         lookup._listOfDependentOptions = ['multiLine', 'readOnly'];
         lookup._inputValue = lookup._options.value = '';
         lookup._beforeUpdate({value: 'test'});
         assert.equal(lookup._inputValue, 'test');
         assert.isFalse(isCalculatingSizes);
         assert.isTrue(lookup._suggestState);

         isInputActive = false;
         lookup._options.items = items;
         lookup._beforeUpdate({
            items: items,
            multiLine: true,
            value: ''
         });

         assert.equal(lookup._inputValue, 'test');
         assert.isTrue(isCalculatingSizes);
         assert.isFalse(lookup._suggestState);

         isCalculatingSizes = false;
         lookup._options.value = 'diff with new value';
         lookup._beforeUpdate({
            items: items,
            readOnly: !lookup._options.readOnly,
            value: ''
         });

         assert.equal(lookup._inputValue, '');
         assert.isTrue(isCalculatingSizes);
      });

      it('_changeValueHandler', function() {
         var
            newValue = [],
            lookup = new Lookup();

         lookup._notify = function(event, value) {
            if (event === 'valueChanged') {
               newValue = value;
            }
         };
         lookup._changeValueHandler(null, 1);
         assert.deepEqual(newValue, [1]);
      });

      it('_choose', function() {
         var itemAdded = false;
         var lookup = new Lookup();
         var isActivated = false;

         lookup.saveOptions({});
         lookup._isInputVisible = false;
         lookup._notify = function() {
            itemAdded = true;
         };
         lookup.activate = function() {
            isActivated = true;

            // activate input before add.
            assert.isFalse(itemAdded);
         };

         lookup._beforeMount({ multiLine: true });

         lookup._options.multiSelect = false;
         lookup._choose();
         assert.isTrue(itemAdded);
         assert.isTrue(lookup._needSetFocusInInput);
         assert.isFalse(isActivated);

         itemAdded = false;
         isActivated = false;
         lookup._needSetFocusInInput = false;
         lookup._options.multiSelect = true;
         lookup._choose();
         assert.isFalse(lookup._needSetFocusInInput);
         assert.isTrue(isActivated);
      });

      it('_deactivated', function() {
         var lookup = new Lookup();
         lookup._suggestState = true;
         lookup._deactivated();
         assert.isFalse(lookup._suggestState);
      });

      it('_suggestStateChanged', function() {
         var lookup = new Lookup();

         lookup._suggestState = true;
         lookup._suggestStateChanged();
         assert.isFalse(lookup._suggestState);

         lookup._suggestState = true;
         lookup._isInputVisible = function() {
            return true;
         };
         lookup._suggestStateChanged();
         assert.isTrue(lookup._suggestState);

         lookup._infoboxOpened = true;
         lookup._suggestStateChanged();
         assert.isFalse(lookup._suggestState);
      });

      it('_determineAutoDropDown', function() {
         var lookup = new Lookup();

         lookup._isInputVisible = function() {
            return false;
         };
         lookup._options.autoDropDown = true;
         assert.isFalse(lookup._determineAutoDropDown());

         lookup._isInputVisible = function() {
            return true;
         };
         assert.isTrue(lookup._determineAutoDropDown());

         lookup._options.autoDropDown = false;
         assert.isFalse(lookup._determineAutoDropDown());
      });

      it('_onClickShowSelector', function() {
         var lookup = new Lookup();

         lookup._suggestState = true;
         lookup._onClickShowSelector();

         assert.isFalse(lookup._suggestState);
      });

      it('_onClickClearRecords', function() {
         var
            configActivate,
            activated = false,
            lookup = new Lookup();

         lookup.activate = function(config) {
            configActivate = config;
            activated = true;
         };

         lookup._onClickClearRecords();
         assert.isTrue(activated);
         assert.equal(configActivate, undefined);
      });

      it('_keyDown', function() {
         var
            isNotifyShowSelector= false,
            isNotifyRemoveItems = false,
            lookup = new Lookup(),
            eventBackspace = {
               nativeEvent: {
                  keyCode: Env.constants.key.backspace
               }
            },
            eventNotBackspace = {
               nativeEvent: {}
            },
            eventF2 = {
               nativeEvent: {
                  keyCode: 113
               }
            };

         lookup._notify = function(eventName, result) {
            if (eventName === 'removeItem') {
               isNotifyRemoveItems = true;
               assert.equal(lookup._options.items.at(lookup._options.items.getCount() - 1), result[0]);
            } else if (eventName === 'showSelector') {
               isNotifyShowSelector = true;
            }
         };

         lookup._beforeMount({
            value: ''
         });
         lookup._options.items = getItems(0);
         lookup._keyDown(null, eventBackspace);
         assert.isFalse(isNotifyRemoveItems);

         lookup._options.items = getItems(5);
         lookup._keyDown(null, eventNotBackspace);
         assert.isFalse(isNotifyRemoveItems);

         lookup._keyDown(null, eventBackspace);
         assert.isTrue(isNotifyRemoveItems);
         isNotifyRemoveItems = false;

         lookup._beforeMount({
            value: 'not empty valeue'
         });
         lookup._keyDown(null, eventBackspace);
         assert.isFalse(isNotifyRemoveItems);
         assert.isFalse(isNotifyShowSelector);

         lookup._keyDown(null, eventF2);
         assert.isTrue(isNotifyShowSelector);
      });

      it('_openInfoBox', function() {
         var
            config = {},
            isNotifyOpenPopup = false,
            lookup = new Lookup();

         lookup._suggestState = true;
         lookup._getContainer = function() {
            return {offsetWidth: 100};
         };
         lookup._notify = function(eventName) {
            if (eventName === 'openInfoBox') {
               isNotifyOpenPopup = true;
            }
         };

         lookup._openInfoBox(null, config);
         assert.deepEqual(config, {
            width: 100
         });
         assert.isFalse(lookup._suggestState);
         assert.isTrue(lookup._infoboxOpened);
         assert.isTrue(isNotifyOpenPopup);
      });

      it('_closeInfoBox', function() {
         var
            isNotifyClosePopup = false,
            lookup = new Lookup();

         lookup._infoboxOpened = true;
         lookup._notify = function(eventName) {
            if (eventName === 'closeInfoBox') {
               isNotifyClosePopup = true;
            }
         };

         lookup._closeInfoBox();
         assert.isFalse(lookup._infoboxOpened);
         assert.isTrue(isNotifyClosePopup);
      });

      it('private:resetInputValue', function() {
         var
            isValueChanged = false,
            self = {
               _inputValue: '',
               _notify: function(eventName) {
                  if (eventName === 'valueChanged') {
                     isValueChanged = true;
                  }
               }
            };

         Lookup._private.resetInputValue(self);
         assert.isFalse(isValueChanged);

         self._inputValue = 'notEmpty';
         Lookup._private.resetInputValue(self);
         assert.equal(self._inputValue, '');
         assert.isTrue(isValueChanged);
      });

      it('private:activate', function() {
         let
            isActivate = false,
            self = {
               _needSetFocusInInput: false,
               _options: {
                  multiSelect: false
               },
               activate: function(config) {
                  assert.deepEqual(config, {enableScreenKeyboard: true});
                  isActivate = true;
               }
            }

         Lookup._private.activate(self);
         assert.isFalse(isActivate);
         assert.isTrue(self._needSetFocusInInput);

         self._needSetFocusInInput = false;
         self._options.multiSelect = true;
         Lookup._private.activate(self);
         assert.isTrue(isActivate);
         assert.isFalse(self._needSetFocusInInput);
      });

      it('_isInputActive', function() {
         let
            inputIsVisible = true,
            lookup = new Lookup();

         lookup._isInputVisible = function() {
            return inputIsVisible;
         };

         assert.isTrue(lookup._isInputActive({readOnly: false}));
         assert.isFalse(lookup._isInputActive({readOnly: true}));

         inputIsVisible = false;
         assert.isFalse(lookup._isInputActive({readOnly: false}));
         assert.isFalse(lookup._isInputActive({readOnly: true}));
      });

      it('_isShowCollection', function() {
         let lookup = new Lookup();

         lookup._maxVisibleItems = 1;
         lookup._options = {
            items: getItems(1),
            readOnly: false
         };

         assert.isTrue(!!lookup._isShowCollection());

         lookup._maxVisibleItems = null;
         assert.isFalse(!!lookup._isShowCollection());

         lookup._options.readOnly = true;
         assert.isTrue(!!lookup._isShowCollection());

         lookup._options.items = getItems(0);
         assert.isFalse(!!lookup._isShowCollection());
      });

      it('_itemClick', function() {
         let
            isNotifyItemClick = false,
            lookup = new Lookup();

         lookup._suggestState = true;
         lookup._notify = function(eventName) {
            if (eventName === 'itemClick') {
               isNotifyItemClick = true;
            }
         };

         lookup._itemClick();
         assert.isFalse(lookup._suggestState);
         assert.isTrue(isNotifyItemClick);
      });

      it('_getContainer', function() {
         let
            container,
            lookup = new Lookup();

         if (window && window.jQuery) {
            lookup._container = 'notJQuery';
            assert.equal(lookup._getContainer(), 'notJQuery');

            lookup._container = container = new window.jQuery('div');
            assert.equal(lookup._getContainer(), container[0]);
         }
      });

      it('_crossClick', () => {
         const lookup = new Lookup();
         const sandbox = sinon.createSandbox();

         sandbox.stub(lookup, '_notify');
         lookup.saveOptions({
            multiSelect: false
         });

         lookup._crossClick({}, 'testItem');

         sinon.assert.calledWith(lookup._notify, 'removeItem');
         assert.isTrue(lookup._needSetFocusInInput);
      });
   });
});
