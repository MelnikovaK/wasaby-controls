define(
   [
      'Controls/Button/Menu',
      'WS.Data/Source/Memory',
      'Core/core-clone'
   ],
   (MenuButton, Memory, Clone) => {
      describe('MenuButton', () => {
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
               title: 'Запись 3',
               icon: 'icon-medium icon-Doge icon-primary'
            },
            {
               id: '4',
               title: 'Запись 4'
            },
            {
               id: '5',
               title: 'Запись 5'
            },
            {
               id: '6',
               title: 'Запись 6'
            },
            {
               id: '7',
               title: 'Запись 7'
            },
            {
               id: '8',
               title: 'Запись 8'
            }
         ];

         let config = {
            icon: 'icon-medium icon-Doge icon-primary',
            viewMode: 'link',
            style: 'secondary',
            showHeader: true,
            keyProperty: 'id',
            source: new Memory({
               idProperty: 'id',
               data: items
            })
         };

         let menu = new MenuButton(config);

         it('check item click', () => {
            menu._notify = (e) => {
               assert.equal(e, 'onMenuItemActivate');
            };
            menu._onItemClickHandler('itemClick', [{
               id: '1',
               title: 'Запись 1'
            }]);
         });

         it('_beforeMount', () => {
            menu._beforeMount(config);
            assert.equal(menu._offsetClassName, 'controls-MenuButton_link_iconSize-medium_popup');
         });

         it('_beforeUpdate', function() {
            let newOptions = Clone(config);
            newOptions.icon = 'icon-small icon-Doge icon-primary';
            newOptions.viewMode = 'link';
            menu._beforeUpdate(newOptions);
            assert.equal(menu._offsetClassName, 'controls-MenuButton_link_iconSize-small_popup');
            newOptions.icon = 'icon-small icon-Doge icon-primary';
            newOptions.viewMode = 'button';
            menu._beforeUpdate(newOptions);
            assert.equal(menu._offsetClassName, 'controls-MenuButton_button_iconSize-small_popup');
            newOptions.showHeader = false;
            newOptions.viewMode = 'link';
            menu._beforeUpdate(newOptions);
            assert.equal(menu._offsetClassName, 'controls-MenuButton_link_iconSize-small_duplicate_popup');
         });
      });
   }
);
