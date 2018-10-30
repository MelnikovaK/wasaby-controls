/**
 * Created by am.gerasimov on 24.11.2015.
 */
define('SBIS3.CONTROLS/Mixins/ActiveSelectable', [
   "Core/Deferred",
   "Data/type",
   "Core/core-instance",
   "SBIS3.CONTROLS/Utils/ToSourceModel",
   "SBIS3.CONTROLS/Utils/SourceUtil",
   "Controls/Utils/ArraySimpleValuesUtil",
   'Core/helpers/Object/isEmpty'
], function(Deferred, type, cInstance, ToSourceModel, SourceUtil, ArraySimpleValuesUtil, isEmptyObject) {
   var Model = type.Model;

   /**
    * Миксин, добавляющий поведение хранения выбранного элемента
    * @mixin SBIS3.CONTROLS/Mixins/ActiveSelectable
    * @public
    * @author Крайнов Д.О.
    */

   var ActiveSelectable = /**@lends SBIS3.CONTROLS/Mixins/ActiveSelectable.prototype  */{
      $protected: {
         _options: {
            /**
             * @cfg {WS.Data/Entity/Model} Устанавливает выбранным элемент коллекции по переданному экземпляру класса.
             * Устанавливает экземпляр класса {@link WS.Data/Entity/Model} с данными выбранной записи.
             * Опция актуальна, когда контрол находится в режиме единичного выбора значений.
             * @see setSelectedItem
             * @see getSelectedItem
             */
            selectedItem : null
         },
         _loadItemDeferred: null
      },

      before: {
         _modifyOptions: function(opts) {
            if(opts.selectedItem instanceof Model) {
               return opts;
            }
   
            // Для совместимости, удалится при массовом удалении displayField, keyField
            if (opts.displayField) {
               opts.displayProperty = opts.displayField;
            }
            if (opts.keyField) {
               opts.idProperty = opts.keyField;
            }
            
            /* Пре-инициализация selectedItem, если selectedItem пришёл как объект
               требуется проинициализировать, чтобы была возможность построить вёрстку на уровне шаблонизатора */
            if(opts.selectedItem && !isEmptyObject(opts.selectedItem) && opts.selectedItem[opts.idProperty] && opts.selectedItem[opts.displayProperty]) {
               opts.selectedItem = ToSourceModel(
                  [new Model({
                     idProperty: opts.idProperty,
                     rawData: opts.selectedItem
                  })],
                  SourceUtil.prepareSource(opts.dataSource),
                  opts.idProperty
               )[0];
               opts.selectedKey = opts.selectedItem.get(opts.idProperty);
            }

            return opts;
         }
      },

      $constructor: function() {
         if(!cInstance.instanceOfMixin(this, 'SBIS3.CONTROLS/Mixins/Selectable')) {
            throw new Error('Selectable mixin is required');
         }

         this._options.selectedItem = this._options.selectedItem instanceof Model ? this._options.selectedItem : null;
      },
      /**
       * Устанавливает выбранный элемент коллекции.
       * @param {WS.Data/Entity/Model} item Выбранный элемент коллекции.
       * @example
       * <pre>
       *     var selItem = this.getChildControlByName('MyControl').getSelectedItem();
       *       . . .
       *     if (selItem != '') {
       *        NewControl.setSelectedItem(selItem);
       *     }
       * </pre>
       * @see selectedItem
       * @see getSelectedItem
       */
      setSelectedItem: function(item) {
         var isModel = item instanceof Model,
             oldKey = this._options.selectedKey,
             key;


         if(!isModel && !this._options.selectedItem) {
            return;
         }

         this._options.selectedItem = isModel ? item : null;

         key = isModel ? item.get(this._options.idProperty) : null;

         if(key === undefined) {
            throw new Error(this._moduleName + ': record key is undefined.');
         }

         this._options.selectedKey = key;

         this._notifyOnPropertyChanged('selectedItem');
         /* Чтобы корректно работала и синхронищация контекста и стреляло событие */
         this._options.selectedKey = oldKey;
         this.setSelectedKey(key);
      },

      initializeSelectedItem: function() {
         this._options.selectedItem = new Model({idProperty: this._options.idProperty});
      },

      /**
       * Возвращает выбранный элемент коллекции.
       * @param loadItem загружать ли запись, если о ней нет информации в dataSet
       * @returns {null|WS.Data/Entity/Model}
       * @example
       * <pre>
       *     var myItem = this.getChildControlByName('MyControl').getSelectedItem();
       * </pre>
       * @see selectedItem
       * @see setSelectedItem
       */
      getSelectedItem: function(loadItem) {
         this._syncSelectedItem();
         
         if(!loadItem) {
            return this._options.selectedItem;
         } else if (this._loadItemDeferred && !this._loadItemDeferred.isReady()) {
            return this._loadItemDeferred;
         }

         var dResult = new Deferred(),
             selItem, selKey, self = this;
         
         this._loadItemDeferred = dResult;

         selItem = this._options.selectedItem;
         selKey = this._options.selectedKey;

         if(selKey !== null) {
            if (!selItem) {
               var item = this.getItems() && this.getItems().getRecordById(selKey);

               if (item) {
                  dResult.callback(this._options.selectedItem = item);
                  this._notifyOnPropertyChanged('selectedItem');
               } else {
                  this._dataSource.read(selKey).addCallback(function (rec) {
                     dResult.callback(self._options.selectedItem = rec);
                     self._notifyOnPropertyChanged('selectedItem');
                  })
               }
            } else {
               dResult.callback(selItem);
            }
         } else {
            dResult.callback(selItem);
         }

         return dResult;
      },

      /* Синхронизирует выбранные ключи и выбранные записи */
      _syncSelectedItem: function() {
         var selItem = this._options.selectedItem,
             selKey = this._options.selectedKey,
             key;

         if(selItem) {
            key = selItem.get(this._options.idProperty);
         }

         /* При синхронизации запись без ключа считаем невыбранной, т.к. с помощью метода set такую запись установить нельзя,
            т.е. она может только проинициализироваться из контекста */
         /* Ключ может быть строкой или числом, учитываем при проверке */
         if( key && (selKey === null || !ArraySimpleValuesUtil.hasInArray([key], selKey)) ) {
            this._options.selectedItem = null;
            this._notifyOnPropertyChanged('selectedItem');
         }
      }

   };

   return ActiveSelectable;

});