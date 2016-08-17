/**
 * Created by am.gerasimov on 28.01.2016.
 */
define('js!SBIS3.CONTROLS.SyncSelectionMixin', ['js!WS.Data/Entity/Model'], function(Model) {

   /**
    * Миксин, добавляющий синхронизацию выбранных элементов
    * @remark
    * selectedItem всегда смотрит на первый элемент из selectedItems
    * selectedKey всегда смотрит на перывй элемент из selectedKeys
    * @mixin SBIS3.CONTROLS.SyncSelectionMixin
    * @public
    * @author Крайнов Дмитрий Олегович
    */

   var PROPS_TO_SYNC = {
      selectedItem: true,
      selectedItems: true,
      selectedKeys: true,
      selectedKey: true
   };

   var SyncSelectionMixin = /**@lends SBIS3.CONTROLS.SyncSelectionMixin.prototype  */{
      $constructor: function() {
         /* Если уже в конструкторе есть selectedItem, то синхронизируем с selectedItems */
         if(this._options.selectedItem instanceof Model) {
            this.initializeSelectedItems();
            this._options.selectedItems.assign([this._options.selectedItem]);
            /* Если уже в конструкторе есть selectedKey, то синхронизируем с selectedKeys */
         } else if(this._options.selectedKey) {
            this._options.selectedKeys = [this._options.selectedKey];
         }
         /* Почему событие onPropertyChanged: если изменить св-во контрола в событии onPropertyChanged,
            то корректно произойдёт синхронизация с контекстом  */
         this.subscribe('onPropertyChanged', function(e, propName) {
            var propValue, item;

            if (PROPS_TO_SYNC[propName]) {
               propValue = this.getProperty(propName);

               /* При изменении свойств
                     1) selectedItem
                     2) selectedKey
                  надо установить новый набор selectedItems, selectedKeys по правилу:
                  selectedItem === selectedItems.at(0), selectedKey === selectedKeys[0]

                     3)selectedItems
                     4)selectedKeys
                  надо установить новые selectedItem, selectedKey по правилу:
                  selectedItems.at(0) === selectedItem, selectedKeys[0] === selectedKey

                  ВАЖНО: При изменении selectedItems и selectedKeys св-ва selectedItem и selectedKey устанавливаются напрямую,
                  иначе будет зацикливание, поэтому для корректной отрисовки надо переопределять метод drawSelectedItems, а не
                  drawSelectedItem.
                */
               switch (propName) {
                  case 'selectedItem':
                     if($ws.helpers.instanceOfModule(propValue, 'WS.Data/Entity/Model')) {
                        this.setSelectedItems([propValue]);
                     } else {
                        this.clearSelectedItems();
                     }
                     break;
                  case 'selectedKey':
                     if(propValue === null) {
                        this.clearSelectedItems();
                     } else {
                        this.setSelectedKeys([propValue]);
                     }
                     break;
                  case 'selectedItems':
                     item = propValue && propValue.at(0);
                     if(item) {
                        this._options.selectedItem = item;
                        this._options.selectedKey = item.getId();
                     } else {
                        this._options.selectedItem = null;
                        this._options.selectedKey = null;
                     }
                     this._notify('onSelectedItemChange', this._options.selectedKey, this._options.selectedIndex);
                     break;
                  case 'selectedKeys':
                     this._options.selectedKey = propValue.length ? propValue[0] : null;
                     this._notify('onSelectedItemChange', this._options.selectedKey, this._options.selectedIndex);
                     break;
               }
            }
         });
      },

      around: {
         setSelectedItem: function (parentFunc, item) {
            var hasRequiredFields,
                isModel = item && $ws.helpers.instanceOfModule(item, 'WS.Data/Entity/Model'),
                currentSelItem = this._options.selectedItem,
                self = this;

            /* Т.к. ключ может быть как 0, а ключевое поле как '', то надо проверять на null/undefined */
            function isEmpty(val) {
               return val === null || val === undefined;
            }

            function isEmptyItem(item) {
               return isEmpty(item.get(self._options.displayField)) && isEmpty(item.get(self._options.keyField));
            }

            if (isModel) {
               /* Проверяем запись на наличие ключевых полей */
               hasRequiredFields = !isEmptyItem(item);

               if (hasRequiredFields) {
                  /* Если запись собралась из контекста, в ней может не быть поля с первичным ключем */
                  if (!item.getIdProperty()) {
                     item.setIdProperty(this._options.keyField);
                  }
                  /* Если передали пустую запись и текущая запись тоже пустая, то не устанавливаем её */
               } else if(currentSelItem && isEmptyItem(currentSelItem)) {
                  return false;
               }
            }

            /* Вызываем родительский метод, если:
             1) передали запись с обязательными полями
             2) передали null
             3) передали запись без ключевых полей, но у нас есть выделенные ключи,
             такое может произойти, когда запись сбрасывается через контекст */
            if (hasRequiredFields ||
                item === null ||
                (!hasRequiredFields && !this._isEmptySelection() && isModel)) {
               parentFunc.call(this, item);
            }
         }
      }
   };

   return SyncSelectionMixin;

});