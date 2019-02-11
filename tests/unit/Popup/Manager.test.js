define(
   [
      'Controls/Popup/Manager',
      'Controls/Popup/Manager/ManagerController',
      'Controls/Popup/Manager/Container',
      'Controls/Popup/Opener/BaseController'
   ],

   function(ManagerConstructor, ManagerController, ManagerContainer, BaseController) {
      'use strict';

      function getManager() {
         let Manager = new ManagerConstructor();
         let Container = new ManagerContainer();
         Manager._afterMount();
         Container._afterMount();
         return Manager;
      }

      before(() => {
         BaseController.prototype._checkContainer = () => true;
      });

      describe('Controls/Popup/Manager/ManagerController', () => {
         it('initialize', function() {
            // Manager and container doesn't initialized
            ManagerController._manager = undefined;
            assert.equal(ManagerController.find(), false);
         });

         it('callMethod', () => {
            getManager();
            let arg0 = '1';
            let arg1 = '2';
            let methodName;

            let baseMethod = ManagerController._callManager;

            ManagerController._callManager = (method, args) => {
               assert.equal(methodName, method);
               assert.equal(args[0], arg0);
               assert.equal(args[1], arg1);
            };

            for (methodName of ['find', 'remove', 'update', 'show', 'reindex']) {
               ManagerController[methodName](arg0, arg1);
            }

            ManagerController._callManager = baseMethod;
         });
      });

      describe('Controls/Popup/Manager', function() {
         var id, element;
         let Manager = getManager();

         it('initialize', function() {
            let Manager = getManager();
            assert.equal(Manager._popupItems.getCount(), 0);
         });

         it('append popup', function() {
            let Manager = getManager();
            id = Manager.show({
               testOption: 'created'
            }, new BaseController());
            assert.equal(Manager._popupItems.getCount(), 1);
            element = Manager.find(id);
            assert.equal(element.popupOptions.testOption, 'created');
         });

         it('getMaxZIndexPopupIdForActivate', function() {
            let Manager = getManager();
            let id1 = Manager.show({}, new BaseController());
            let id2 = Manager.show({ autofocus: false }, new BaseController());
            let id3 = Manager.show({}, new BaseController());

            let maxPopupId = Manager._private.getMaxZIndexPopupIdForActivate(Manager._popupItems);
            assert.equal(maxPopupId, id3);
            Manager.remove(id3);

            maxPopupId = Manager._private.getMaxZIndexPopupIdForActivate(Manager._popupItems);
            assert.equal(maxPopupId, id1);
            Manager.remove(id1);

            maxPopupId = Manager._private.getMaxZIndexPopupIdForActivate(Manager._popupItems);
            assert.equal(maxPopupId, null);
         });

         it('find popup', () => {
            let Manager = getManager();
            id = Manager.show({
               testOption: 'created'
            }, new BaseController());
            element = Manager.find(id);
            assert.equal(element.popupOptions.testOption, 'created');
            element.popupState = 'destroyed';
            element = Manager.find(id);
            assert.equal(element, null);
         });

         it('update popup', function() {
            // todo: убрать по https://online.sbis.ru/opendoc.html?guid=17de8adc-d754-4e3d-83a0-996a7da49b81
            if(typeof window === 'undefined')
               this.skip();
            let Manager = getManager();
            id = Manager.show({
               testOption: 'created'
            }, new BaseController());
            element = Manager.find(id);
            element.popupState = 'created';
            id = Manager.update(id, {
               testOption: 'updated'
            });
            assert.equal(element.popupOptions.testOption, 'updated');
         });

         it('fireEventHandler', function() {
            // todo: убрать по https://online.sbis.ru/opendoc.html?guid=17de8adc-d754-4e3d-83a0-996a7da49b81
            if(typeof window === 'undefined')
               this.skip();
            let Manager = getManager();
            let eventOnCloseFired = false;
            id = Manager.show({
               testOption: 'created'
            }, new BaseController());
            var eventCloseFired = false;
            element = Manager.find(id);
            element.popupState = 'created';
            Manager.update(id, {
               eventHandlers: {
                  onClose: function() {
                     eventCloseFired = true;
                  }
               },
               _events: {
                  onClose: () => {
                     eventOnCloseFired = true;
                  },
                  onResult: (event, args) => {
                     assert.equal(args[0], '1');
                     assert.equal(args[1], '2');
                  }
               }
            });

            Manager._private.fireEventHandler.call(Manager, id, 'onClose');

            assert.isTrue(eventCloseFired, 'event is not fired.');
            assert.isTrue(eventOnCloseFired, 'event is not fired.');

            Manager._private.fireEventHandler.call(Manager, id, 'onResult', '1', '2');
         });

         it('remove popup', function() {
            let Manager = getManager();
            id = Manager.show({
               testOption: 'created'
            }, new BaseController());
            Manager.remove(id);
            assert.equal(Manager._popupItems.getCount(), 0);
         });

         it('remove popup and check event', function() {
            let Manager = getManager();
            let eventCloseFired = false;
            let eventOnCloseFired = false;
            id = Manager.show({
               eventHandlers: {
                  onClose: function() {
                     eventCloseFired = true;
                  }
               },
               _events: {
                  onClose: () => {
                     eventOnCloseFired = true;
                  }
               }
            }, new BaseController());
            Manager.remove(id);
            assert.equal(eventCloseFired, true);
            assert.equal(eventOnCloseFired, true);
         });

         it('add modal popup', function() {
            let Manager = getManager();
            let id1 = Manager.show({
               isModal: false,
               testOption: 'created'
            }, new BaseController());

            Manager.show({
               isModal: true,
               testOption: 'created'
            }, new BaseController());

            let indices = Manager._popupItems.getIndicesByValue('isModal', true);
            assert.equal(indices.length, 1);
            assert.equal(indices[0], 1);

            Manager.remove(id1);

            indices = Manager._popupItems.getIndicesByValue('isModal', true);
            assert.equal(indices.length, 1);
            assert.equal(indices[0], 0);
         });

         it('add maximized popup', function() {
            let Manager = getManager();
            let id0 = Manager.show({
               isModal: false,
               maximize: true,
               testOption: 'created'
            }, new BaseController());

            assert.equal(Manager._hasMaximizePopup, true);

            let id1 = Manager.show({
               isModal: true,
               testOption: 'created'
            }, new BaseController());

            assert.equal(Manager._popupItems.at(1).hasMaximizePopup, true);

            Manager.remove(id0);

            assert.equal(Manager._hasMaximizePopup, false);

            let id2 = Manager.show({
               isModal: true,
               testOption: 'created'
            }, new BaseController());

            assert.equal(Manager._popupItems.at(1).hasMaximizePopup, false);
         });

         it('popup deactivated', () => {
            let Manager = getManager();
            let isDeactivated = false;
            let controller = {
               popupDeactivated: () => {
                  isDeactivated = true;
               },
               getDefaultConfig: () => ({}),
               POPUP_STATE_INITIALIZING: 'initializing'
            };
            let id = Manager.show({
               closeByExternalClick: true
            }, controller);


            let baseFinishPendings = Manager._private.finishPendings;
            Manager._private.finishPendings = (popupId, popupCallback, pendingCallback, pendingsFinishedCallback) => {
               pendingsFinishedCallback();
            };
            Manager._private.popupDeactivated(id);
            assert.equal(isDeactivated, true);

            isDeactivated = false;
            let item = Manager.find(id);
            item.popupOptions.closeByExternalClick = false;
            Manager._private.popupDeactivated(id);
            assert.equal(isDeactivated, false);

            Manager._private.finishPendings = baseFinishPendings;
         });

         it('managerPopupMaximized notified', function() {
            let popupOptions = {
               isModal: false,
               maximize: false,
               testOption: 'created'
            };
            let Manager = getManager();
            var isMaximizeNotified;
            Manager._private._notify = function(event, args, params) {
               isMaximizeNotified = event === 'managerPopupMaximized';
               assert.isTrue(popupOptions === args[0].popupOptions);
               assert.isTrue(params.hasOwnProperty('bubbling'));
            };
            let id0 = Manager.show(popupOptions, new BaseController());
            Manager._private.popupMaximized(id0);
            assert.isTrue(isMaximizeNotified);
         });
         it('managerPopupUpdated notified', function() {
            let popupOptions = {
               isModal: false,
               maximize: false,
               testOption: 'created'
            };
            let Manager = getManager();
            var isUpdateNotified;
            Manager._private._notify = function(event, args, params) {
               isUpdateNotified = event === 'managerPopupUpdated';
               assert.isTrue(popupOptions === args[0].popupOptions);
               assert.isTrue(params.hasOwnProperty('bubbling'));
            };
            let id0 = Manager.show(popupOptions, new BaseController());
            Manager._private.popupUpdated(id0);
            assert.isTrue(isUpdateNotified);
         });
         it('managerPopupDestroyed notified', function() {
            let popupOptions = {
               testOption: 'created'
            };
            let Manager = getManager();
            var isDestroyNotified;
            Manager._notify = function(event, args, params) {
               isDestroyNotified = event === 'managerPopupDestroyed';
               assert.isTrue(popupOptions === args[0].popupOptions);
               assert.isTrue(params.hasOwnProperty('bubbling'));
            };
            id = Manager.show(popupOptions, new BaseController());
            Manager.remove(id);
            assert.isTrue(isDestroyNotified);
         });
         it('isIgnoreActivationArea', function() {
            let focusedContainer = {
               classList: {
                  contains: function(str) {
                     if (str === 'controls-Popup__isolatedFocusingContext') {
                        return true;
                     }
                     return false;
                  }
               }
            };
            let focusedArea = {};
            let Manager = getManager();
            var firstResult = Manager._private.isIgnoreActivationArea(focusedContainer);
            assert.equal(firstResult, true);
            var secondResult = Manager._private.isIgnoreActivationArea(focusedArea);
            assert.equal(secondResult, false);
         });
         it('managerPopupCreated notified', function() {
            let isPopupOpenedEventTriggered = false;
            let popupOptions = {
               isModal: false,
               maximize: false,
               testOption: 'created',
               _events: {
                  onOpen: () => {
                     isPopupOpenedEventTriggered = true;
                  }
               }
            };
            let Manager = getManager();
            var isCreateNotified;
            Manager._notify = function(event, args, params) {
               isCreateNotified = event === 'managerPopupCreated';
               assert.isTrue(popupOptions === args[0].popupOptions);
               assert.isTrue(params.hasOwnProperty('bubbling'));
            };
            let id0 = Manager.show(popupOptions, new BaseController());
            Manager._private.popupCreated.call(Manager, id0);
            assert.isTrue(isCreateNotified);
            assert.isTrue(isPopupOpenedEventTriggered);
         });
      });
   }
);
