define('Controls-demo/List/EditAndRemoveOperations', [
   'Core/Control',
   'tmpl!Controls-demo/List/EditAndRemoveOperations/EditAndRemoveOperations',
   'WS.Data/Source/Memory',
   'WS.Data/Entity/Record',
   'Core/Deferred',
   'Controls/Validate/Validators/IsRequired'
], function (Control,
             template,
             MemorySource,
             Record,
             Deferred
) {
   'use strict';

   var counter = 10;

   var srcData = [
      {
         id: 1,
         title: 'Не открывается на редактирование',
         description: 'Другое название 1'
      },
      {
         id: 2,
         title: 'Открывается другая запись',
         description: 'Описание вот такое'
      },
      {
         id: 3,
         title: 'Обычная запись 0',
         description: 'Хватит страдать'
      },
      {
         id: 4,
         title: 'Обычная запись1',
         description: 'йцукен'
      },
      {
         id: 5,
         title: 'Обычная запись2',
         description: 'йцукен'
      },
      {
         id: 6,
         title: 'Обычная запись3',
         description: 'йцукен'
      }
   ],
   srcData2 = [
      {
         id: 1,
         title: 'Notebook ASUS X550LC-XO228H 6'
      },
      {
         id: 2,
         title: 'Notebook Lenovo IdeaPad G5030 (80G0001FRK) 7'
      }
   ],
   srcData3 = [
      {
         id: 1,
         title: 'Notebook Lenovo G505 59426068 8'
      },
      {
         id: 2,
         title: 'Lenovo 9'
      }
   ],
   srcData4 = [
      {
         id: 1,
         title: 'Notebook Lenovo G505 59426068 14'
      },
      {
         id: 2,
         title: 'редактирование стартует по опции'
      }
   ],
   srcData5 = [
      {
         id: 1,
         title: 'Notebook ASUS X550LC-XO228H 16'
      },
      {
         id: 2,
         title: 'Notebook Lenovo IdeaPad G5030 (80G0001FRK) 17'
      }
   ];


   var EditInPlace = Control.extend({
      _template: template,
      _itemActions: null,
      editingConfig: null,
      _editOnClick: true,
      _singleEdit: false,
      _autoAdd: false,
      _editingItem: Record.fromObject({ id: 2, title: 'редактирование стартует по опции', description: 'а может и не стартует', randomField: 'поле, которого нет'}),
      _addItem: Record.fromObject({ id: 3, title: 'добавление стартует по опции', description: 'а может и не стартует', randomField: 'поле, которого нет'}),
      _showAction: function(action, item) {
         if (item.get('id') === 1 && action.id === 0) { //первую запись всё равно нельзя редактировать
            return false;
         }
         if (this.__editingItem === item) {
            if (action.id === 3) {
               return true;
            }
            return false;
         }
         if (action.id === 3) {
            return false;
         }
         return true;
      },
      _beforeMount: function() {
         this._showAction = this._showAction.bind(this);
         this._itemActions =  [
            {
               id: 0,
               icon: 'icon-Edit icon-primary',
               title: 'edit',
               main: true,
               style: 'bordered',
               handler: function(item){
                 this._children.list.editItem({item: item});
               }.bind(this)
            },
            {
               id: 1,
               icon: 'icon-Erase icon-error',
               title: 'delete',
               style: 'bordered',
               main: true,
               handler: function(item){
                  this._children.list.removeItems([item.get('id')]);
               }.bind(this)
            },
            {
               id: 3,
               icon: 'icon-ArrowDown icon-error',
               title: 'я прикладная операция и появляюсь только если запись редактируется',
               main: true,
               style: 'bordered',
               handler: function(item){
                  if (confirm('Обязательно нажимать было?')) {
                     alert('У меня для вас плохие новости')
                  }
               }.bind(this)
            }
         ];

         this._viewSource = new MemorySource({
            keyProperty: 'id',
            data: srcData
         });
         this._viewSource2 = new MemorySource({
            keyProperty: 'id',
            data: srcData2
         });
         this._viewSource3 = new MemorySource({
            keyProperty: 'id',
            data: srcData3
         });
         this._viewSource4 = new MemorySource({
            keyProperty: 'id',
            data: srcData4
         });
         this._viewSource5 = new MemorySource({
            keyProperty: 'id',
            data: srcData5
         });
      },
      _beforeItemsRemove: function(event, items) {
         return this._children.popupOpener.open({
            message: 'Remove items?',
            type: 'yesno'
         });
      },
      _onBeginEdit: function(e, itemObj) {
         var item = itemObj.item;
         this.__editingItem = item;
         switch (item.get('id')) {
            case 1:
               return 'Cancel';
            case 2:
               return {
                  item:Record.fromObject({
                     id: 2,
                     title: 'Другая запись',
                     description: 'Описание вот такое'
                  })
               } ;
            // case 3:
            //    var def = new Deferred();
            //    def.addCallback(function(){
            //       return {
            //          item:Record.fromObject({
            //             id: 3,
            //             title: 'Запись из Deferred',
            //             description: 'Хватит страдать'
            //          })
            //       }
            //    });
            //    setTimeout(function() {
            //       def.callback();
            //    }, 3000);
            //    return def;
         }
      },

      _onEndEdit: function() {
         this.__editingItem = undefined;
      },

      _onBeginAdd: function(e, item) {
         return {
               item: Record.fromObject({
                  id: counter++,
                  title: '',
                  description: 'описание',
                  extraField: 'поле, которого нет у остальных itemов'
               })
            };
      },

      _cancelBeginAdd: function() {
         return 'Cancel';
      },

      _deferredBeginAdd: function() {
         var
            options = {
               item: Record.fromObject({
                  id: 3,
                  title: '',
                  description: 'описание',
                  extraField: 'поле, которого нет у остальных itemов'
               })
            },
            def = new Deferred();
         setTimeout(function() {
            def.callback(options);
         }, 2000);
         return def;
      }
   });
   return EditInPlace;
});