define(
   [
      'Controls/History/Menu',
      'Types/source',
      'Core/core-clone',
      'Types/entity',
      'Controls/History/Source',
      'Controls/History/Service',
      'Core/Deferred'
   ],
   function(Menu, sourceLib, Clone, entity, HistorySource, HistoryService, Deferred) {
      'use strict';

      let items = [
         {
            id: '1',
            title: 'Запись 1'
         },
         {
            id: '2',
            title: 'Запись 2'
         },
         {
            id: '3',
            title: 'Запись 3'
         }
      ];

      var menuConfig = {
         filter: { id: 'test' },
         viewMode: 'link',
         icon: 'icon-small',
         source: new sourceLib.Memory({
            data: items,
            idProperty: 'id'
         })
      };

      var getHistoryMenu = function(config) {
         var hMenu = new Menu(config);
         hMenu.saveOptions(config);
         return hMenu;
      };

      describe('Controls/History/Menu', function() {
         it('_private.getMetaPinned', function() {
            var item = new entity.Model({
               rawData: {
                  pinned: false
               }
            });

            assert.deepEqual(Menu._private.getMetaPinned(item), {
               $_pinned: true
            });
         });
         it('_beforeMount', function() {
            var menu = getHistoryMenu(menuConfig);
            menu._beforeMount(menuConfig);
            assert.equal(menu._offsetClassName, 'controls-MenuButton_link_small_popup');
         });
         it('_beforeUpdate', function() {
            var menu = getHistoryMenu(menuConfig);
            var newConfig = Clone(menuConfig);
            newConfig.viewMode = 'button';
            menu._beforeUpdate(newConfig);
            assert.equal(menu._offsetClassName, 'controls-MenuButton_button_small_popup');
            newConfig.size = 'm';
            newConfig.icon = '';
            menu._beforeUpdate(newConfig);
            assert.equal(menu._offsetClassName, 'controls-MenuButton_button__m_popup');
         });
         it('_onPinClickHandler', function() {
            var newConfig = Clone(menuConfig);
            newConfig.source = new HistorySource({
               originSource: new sourceLib.Memory({
                  idProperty: 'id',
                  data: items
               }),
               historySource: new HistoryService({
                  historyId: 'TEST_HISTORY_ID'
               }),
               parentProperty: 'parent'
            });
            newConfig.source.update = function() {
               return Deferred.success(false);
            };
            var menu = getHistoryMenu(newConfig);
            menu._children = {
               notificationOpener: {
                  open: (popupOptions) => {
                     assert.deepEqual(popupOptions, {
                        template: 'wml!Controls/Popup/Templates/Notification/Simple',
                        templateOptions: {
                           style: 'error',
                           text: 'Невозможно закрепить более 10 пунктов',
                           icon: 'Alert'
                        }
                     });
                  }
               }
            };
            menu._onPinClickHandler('pinClicked', [new entity.Model({
               rawData: {
                  pinned: false
               }
            })]);
         });
      });
   }
);
