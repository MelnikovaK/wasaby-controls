/**
 * Created by kraynovdo on 16.11.2017.
 */
define('js!Controls/List/ListControl/ItemsViewModel',
   ['Core/Abstract', 'js!Controls/List/resources/utils/ItemsUtil', 'Core/core-instance'],
   function(Abstract, ItemsUtil, cInstance) {

      /**
       *
       * @author Крайнов Дмитрий
       * @public
       */
      var _private = {
         //проверка на то, нужно ли создавать новый инстанс рекордсета или же можно положить данные в старый
         isEqualItems: function (oldList, newList) {
            return oldList && cInstance.instanceOfModule(oldList, 'WS.Data/Collection/RecordSet')
               && (newList.getModel() === oldList.getModel())
               && (Object.getPrototypeOf(newList).constructor == Object.getPrototypeOf(newList).constructor)
               && (Object.getPrototypeOf(newList.getAdapter()).constructor == Object.getPrototypeOf(oldList.getAdapter()).constructor)
         }
      };
      var ItemsViewModel = Abstract.extend({

         _display: null,
         _items: null,
         _curIndex: 0,

         constructor: function(cfg) {
            this._options = cfg;
            ItemsViewModel.superclass.constructor.apply(this, arguments);
            this._onCollectionChangeFnc = this._onCollectionChange.bind(this);
            if (cfg.items) {
               this._items = cfg.items;
               this._display = ItemsUtil.getDefaultDisplayFlat(cfg.items, cfg);
               this._display.subscribe('onCollectionChange', this._onCollectionChangeFnc);
            }
         },

         reset: function() {
            this._curIndex = 0;
         },

         isEnd: function() {
            return this._curIndex < this._display.getCount()
         },

         goToNext: function() {
            this._curIndex++;
         },

         getCurrent: function() {
            var dispItem = this._display.at(this._curIndex);
            return {
               getPropValue: ItemsUtil.getPropertyValue,
               idProperty: this._options.idProperty,
               displayProperty: this._options.displayProperty,
               index : this._curIndex,
               item: dispItem.getContents(),
               dispItem: dispItem
            }
         },

         getItemById: function(id, idProperty) {
            return ItemsUtil.getDisplayItemById(this._display, id, idProperty)
         },

         _onCollectionChange: function() {
            this._notify('onListChange');
         },

         setItems: function(items) {
            if (_private.isEqualItems(this._items, items)) {
               this._items.assign(items);
            }
            else {
               if (this._display) {
                  this._display.destroy();
               }
               this._display = ItemsUtil.getDefaultDisplayFlat(items, this._options);
               this._display.subscribe('onCollectionChange', this._onCollectionChangeFnc);
               this._notify('onListChange');
            }

         },
         appendItems: function(items) {
            this._items.append(items);
         },

         prependItems: function(items) {
            this._items.prepend(items);
         }
      });

      return ItemsViewModel;
   });