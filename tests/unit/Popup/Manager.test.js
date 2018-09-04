define(
   [
      'Controls/Popup/Manager',
      'Controls/Popup/Manager/ManagerController',
      'Controls/Popup/Manager/Container',
      'Controls/Popup/Opener/BaseController'
   ],

   function (ManagerConstructor, ManagerController, ManagerContainer, BaseController) {
      'use strict';

      function getManager() {
         let Manager = new ManagerConstructor();
         let Container = new ManagerContainer();
         Manager._afterMount();
         Container._afterMount();
         return Manager;
      }

      before(() => {
         BaseController.prototype._checkContainer = () => { return true; };
      });

      describe('Controls/Popup/Manager/ManagerController', () => {
         it('initialize', function() {
            //Manager and container doesn't initialized
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

      describe('Controls/Popup/Manager', function () {
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

         it('update popup', function() {
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
            let Manager = getManager();
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
               }
            });
            
            Manager._private.fireEventHandler(id, 'onClose');
            
            assert.isTrue(eventCloseFired, 'event is not fired.');
         });

         it('remove popup', function() {
            let Manager = getManager();
            id = Manager.show({
               testOption: 'created'
            }, new BaseController());
            Manager.remove(id);
            assert.equal(Manager._popupItems.getCount(), 0);
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
         it('managerPopupMaximized notified', function() {

            let Manager = getManager();
            var isMaximizeNotified;
            Manager._private._notify = function(event) {
               isMaximizeNotified = event === 'managerPopupMaximized';
            };
            let id0 = Manager.show({
               isModal: false,
               maximize: false,
               testOption: 'created'
            }, new BaseController());
            let id1 = 'emptyElement';
            let popupResult = Manager._private.popupMaximized(id0);
            assert.isTrue(popupResult);
            assert.isTrue(isMaximizeNotified);
            popupResult = Manager._private.popupMaximized(id1);
            assert.isFalse(popupResult);

         });
         it('managerPopupUpdated notified', function() {

            let Manager = getManager();
            var isUpdateNotified;
            Manager._private._notify = function(event) {
               isUpdateNotified = event === 'managerPopupUpdated';
            };
            let id0 = Manager.show({
               isModal: false,
               maximize: false,
               testOption: 'created'
            }, new BaseController());
            Manager._private.popupUpdated(id0);
            assert.isTrue(isUpdateNotified);

         });
         it('managerPopupDestroyed notified', function() {

            let Manager = getManager();
            var isDestroyNotified;
            Manager._notify = function(event) {
               isDestroyNotified = event === 'managerPopupDestroyed';
            };
            id = Manager.show({
               testOption: 'created'
            }, new BaseController());
            Manager.remove(id);
            assert.isTrue(isDestroyNotified);

         });
         it('managerPopupCreated notified', function() {

            let Manager = getManager();
            var isCreateNotified;
            Manager._private._notify = function(event) {
               isCreateNotified = event === 'managerPopupCreated';
            };
            let id0 = Manager.show({
               isModal: false,
               maximize: false,
               testOption: 'created'
            }, new BaseController());
            let id1 = 'emptyElement';
            let popupResult = Manager._private.popupCreated(id0);
            assert.isTrue(popupResult);
            assert.isTrue(isCreateNotified);
            popupResult = Manager._private.popupCreated(id1);
            assert.isFalse(popupResult);

         });
      });
   }
);