/**
 * Created by iv.cheremushkin on 14.08.2014.
 */

define('js!SBIS3.CONTROLS.Selectable', [
   'js!WS.Data/Utils',
   'js!WS.Data/Collection/IBind',
   'Core/core-instance',
   'js!WSControls/Controllers/BaseListSelector',
   'js!WSControls/Controllers/RecordsetListSelector'
], function(Utils, IBindCollection, cInstance, BaseListSelector, RecordsetListSelector) {

   /**
    * Миксин, добавляющий поведение хранения выбранного элемента. Всегда только одного.
    * @mixin SBIS3.CONTROLS.Selectable
    * @author Крайнов Дмитрий Олегович
    * @public
    */

   var Selectable = /**@lends SBIS3.CONTROLS.Selectable.prototype  */{
       /**
        * @event onSelectedItemChange Происходит при смене выбранного элемента коллекции.
        * @param {Core/EventObject} eventObject Дескриптор события.
        * @param {String|Number} id Идентификатор (значение поля первичного ключа) выбранного элемента коллекции.
        * @param {String} index Порядковый номер выбранного элемента коллекции среди других элементов источника данных.
        * @example
        * <pre>
        *     RadioButtonGroup.subscribe('onSelectedItemChange', function(event, id){
        *        TextBox.setText('Selected item id: ', id);
        *     })
        * </pre>
        * @see selectedKey
        * @see setSelectedKey
        * @see getSelectedKey
        * @see SBIS3.CONTROLS.DSMixin#idProperty
        */
      $protected: {
          /*не различаются события move и remove/add при смене пор номеров, поэтому используем этот флаг, см ниже*/
          _isMove: false,
          _isMoveKey: null,
          _curHash: undefined,
          _selectorInstance: null,
          _options: {
             /**
              * @cfg {String} Устанавливает выбранным элемент коллекции по переданному индексу (порядковому номеру).
              * @remark
              * <ol>
              *    <li>Элемент будет выбран по переданному идентификатору только при условии, что для контрола установлен источник данных в опции {@link SBIS3.CONTROLS.DSMixin#dataSource}.</li>
              *    <li>Установить новый идентификатор элемента коллекции можно с помощью метода {@link setSelectedIndex}, а получить идентификатор - с помощью метода {@link getSelectedIndex}.</li>
              * </ol>
              * @example
              * Производим связывание опции с полем контекста через атрибут bind. Подробнее о связывании значения опций контролов с полями контекста вы можете прочитать <a href="https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/core/context/">здесь</a>.
              * <pre>
              *     <option name="selectedIndex" bind="record/Индекс"></option>
              * </pre>
              * @see setSelectedIndex
              * @see getSelectedIndex
              * @see onSelectedItemChange
              * @see selectedKey
              */
             selectedIndex: null,
             /**
              * @cfg {String|Number} Устанавливает выбранным элемент коллекции по переданному идентификатору - значению {@link SBIS3.CONTROLS.DSMixin#idProperty ключевого поля} элемента коллекции.
              * @remark
              * <ol>
              *    <li>Элемент будет выбран по переданному идентификатору только при условии, что для контрола установлен источник данных в опции {@link SBIS3.CONTROLS.DSMixin#dataSource}.</li>
              *    <li>Установить новый идентификатор элемента коллекции можно с помощью метода {@link setSelectedKey}, а получить идентификатор - с помощью метода {@link getSelectedKey}.</li>
              * </ol>
              * @example
              * Производим связывание опции с полем контекста через атрибут bind. Подробнее о связывании значения опций контролов с полями контекста вы можете прочитать <a href="https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/core/context/">здесь</a>.
              * <pre>
              *     <option name="selectedKey" bind="record/Идентификатор"></option>
              * </pre>
              * @see setSelectedKey
              * @see getSelectedKey
              * @see onSelectedItemChange
              * @see selectedIndex
              */
             selectedKey: null,
             /**
              * @cfg {Boolean} Разрешить отсутствие выбранного элемента в группе
              * @example
              * <pre>
              *     <option name="allowEmptySelection">false</option>
              * </pre>
              * @remark
              * Опция нужна, например, для создания пустой группы радиокнопок - без выбранного элемента.
              * При этом после задания значения вернуть коллекцию к состоянию без выбранного элемента можно только
              * методом {@link setSelectedKey}.
              * @see selectedKey
              * @see setSelectedKey
              * @see getSelectedKey
              * @see SBIS3.CONTROLS.DSMixin#idProperty
              */
            allowEmptySelection : true
         }
      },

      $constructor: function() {
         this._publish('onSelectedItemChange');
      },

      before : {
         setDataSource: function(source, noLoad) {
            /* При установке источника без перезагрузки
               не надо сбрасывать selectedIndex, иначе, при серверной вёрстке
               не произойдёт выделения записи. Запись выделяется при создании проекции,
               которая в обычном случае создаётся после загрузки, а при серверной вёрстке
               она создаётся в конструкторе. */
            if(!noLoad) {
               this._options.selectedIndex = -1;
               this._curHash = undefined;
            }
         },
         setItems: function() {
            this._options.selectedIndex = -1;
            this._curHash = undefined;
         }
      },

      after : {
         _setItemsEventHandlers : function() {
            if (!this._onSelectorCurrentChange) {
               this._onSelectorCurrentChange = onSelectorCurrentChange.bind(this);
            }
            this.subscribeTo(this._selectorInstance, 'onSelectedItemChange', this._onSelectorCurrentChange);

            if (!this._onProjectionChange) {
               this._onProjectionChange = onCollectionChange.bind(this);
            }
            this.subscribeTo(this._getItemsProjection(), 'onCollectionChange', this._onProjectionChange);
         },
         _drawItemsCallback: function(lightVer) {
            //Медленная отрисовка настолько медленная, что в некоторых случаях успевают задестроить компонент, который сейчас отрисовывается
            //Подробности в https://inside.tensor.ru/opendoc.html?guid=9a83c03c-1058-48ef-8f62-d3f6cf32d793&des=
            if (!this.isDestroyed()){
               this._drawSelectedItem(this.getSelectedKey(), this.getSelectedIndex(), lightVer);
            }
         },
         _unsetItemsEventHandlers : function() {
            if (this._onSelectorCurrentChange && this._onSelectorCurrentChange) {
               this.unsubscribeFrom(this._onSelectorCurrentChange, 'onSelectedItemChange', this._onSelectorCurrentChange);
            }
            if (this._getItemsProjection() && this._onProjectionChange) {
               this.unsubscribeFrom(this._getItemsProjection(), 'onCollectionChange', this._onProjectionChange);
            }
         },
         _itemsReadyCallback: function() {

            if (this.getItems() && cInstance.instanceOfModule(this.getItems(), 'WS.Data/Collection/RecordSet')) {
               this._selectorInstance = new RecordsetListSelector({
                  selectedIndex : this._options.selectedIndex,
                  selectedKey : this._options.selectedKey,
                  allowEmptySelection: this._options.allowEmptySelection,
                  projection: this._getItemsProjection()
               });
            }
            else {
               this._selectorInstance = new BaseListSelector({
                  selectedIndex : this._options.selectedIndex,
                  allowEmptySelection: this._options.allowEmptySelection,
                  projection: this._getItemsProjection()
               });
            }
         },
         destroy : function() {
            this._selectorInstance.destroy();
         }
      },


      //TODO переписать метод
      _setSelectedIndex: function(index, id) {
         this._drawSelectedItem(id, index);
         this._notifySelectedItem(id, index);
      },
      /**
       * Устанавливает выбранным элемент коллекции по переданному идентификатору.
       * @remark
       * Метод актуален для использования при условии, что для контрола установлен источник данных в опции {@link SBIS3.CONTROLS.DSMixin#dataSource} и поле первичного ключа в опции {@link SBIS3.CONTROLS.DSMixin#idProperty}.
       * Для возвращения коллекции к состоянию без выбранного элемента нужно передать null.
       * При использовании метода происходит событие {@link onSelectedItemChange}.
       * @param {String|Number} id Идентификатор элемента, который нужно установить в качестве выбранного.
       * Идентификатором элемента коллекции служит значение его {@link SBIS3.CONTROLS.DSMixin#idProperty ключевого поля}.
       * @example
       * <pre>
       *     var newKey = (someValue > 0) ? 'positive' : 'negative';
       *     myComboBox.setSelectedKey(newKey);
       * </pre>
       * @see selectedKey
       * @see getSelectedKey
       * @see SBIS3.CONTROLS.DSMixin#idProperty
       * @see onSelectedItemChange
       */
      setSelectedKey : function(id) {
         this._options.selectedKey = id;
         if (this._selectorInstance) {
            this._selectorInstance.setSelectedKey(id);
         }
      },

      /**
       * Устанавливает выбранным элемент коллекции по переданному индексу (порядковому номеру).
       * @remark
       * Метод актуален для использования при условии, что для контрола установлен источник данных в опции {@link SBIS3.CONTROLS.DSMixin#dataSource} и поле первичного ключа в опции {@link SBIS3.CONTROLS.DSMixin#idProperty}.
       * @param {String|Number} index Индекс выбранного элемента коллекции.
       * @example
       * <pre>
       *    this._getControlOrdersList().setSelectedIndex(0);
       * </pre>
       * @see selectedIndex
       * @see getSelectedIndex
       */
      setSelectedIndex: function(index) {
         this._options.selectedIndex = index;
         if (this._selectorInstance) {
            this._selectorInstance.setSelectedIndex(index);
         }
      },
      /**
       * Возвращает идентификатор выбранного элемента коллекции.
       * Идентификатором элемента коллекции служит значение его {@link SBIS3.CONTROLS.DSMixin#idProperty ключевого поля}.
       * @return {String|Number} Первичный ключ выбранного элемента коллекции.
       * @example
       * <pre>
       *     var key = myComboBox.getSelectedKey();
       *     if (key !== 'old') {
       *        myComboBox.setSelectedKey('newKey');
       *     }
       * </pre>
       * @see selectedKey
       * @see setSelectedKey
       * @see onSelectedItemChange
       * @see SBIS3.CONTROLS.DSMixin#idProperty
       */
      getSelectedKey : function() {
         if (this._selectorInstance && cInstance.instanceOfModule(this._selectorInstance, 'WSControls/Controllers/RecordsetListSelector')) {
            return this._selectorInstance.getSelectedKey();
         }
         else {
            return this._options.selectedKey;
         }
      },

      /**
       * Возвращает индекс (порядковый номер) выбранного элемента коллекции.
       * @return {String|Number} Индекс выбранного элемента коллекции.
       * @example
       * <pre>
       *    index = list.getSelectedIndex();
       *    if (index > -1 && index < items.getCount()) {
       *       return items.at(index);
       *    }
       * </pre>
       * @see selectedIndex
       * @see setselectedIndex
       * @see onSelectedItemChange
       */
      getSelectedIndex : function() {
         if (this._selectorInstance) {
            return this._selectorInstance.getSelectedIndex();
         }
         else {
            return this._options.selectedIndex;
         }
      },

      /**
       * Возвращает выбранный элемент коллекции.
       * @returns {WS.Data|Entity|Model}
       * @example
       * <pre>
       *     var myItem = this.getChildControlByName('MyControl').getSelectedItem();
       * </pre>
       */
       /*
        TODO в отличие от multiselectable при хождении по папкам/фильтрации запоминания элемента не будет
        но это вроде и правильно, а в мультиселекте неправильно хранить выдление при хождении по папкам, это логика
        TreeView
       */
      getSelectedItem : function() {
         var
             selKey = this.getSelectedKey(),
             items = this.getItems();

         return selKey && items ? items.getRecordById(selKey) : null;
      },

      _drawSelectedItem : function() {
         /*Method must be implemented*/
      },

      _getItemValue: function(value, idProperty) {
         if(value && typeof value === 'object') {
            return Utils.getItemPropertyValue(value, idProperty );
         }
         return value;
      },

      _getItemIndexByKey: function(id) {
         var projItem = this._getItemProjectionByItemId(id);
         return this._getItemsProjection().getIndex(projItem);
      },

      _notifySelectedItem : function(id, index) {
         this._notifyOnPropertyChanged('selectedKey');
         this._notifyOnPropertyChanged('selectedIndex');
         this._notify('onSelectedItemChange', id, index);
      },

      _getKeyByIndex: function(index) {
         if(this._hasItemByIndex(index)) {
            var itemContents = this._getItemsProjection().at(index).getContents();
            if (cInstance.instanceOfModule(itemContents, 'WS.Data/Entity/Model')) {
               return itemContents.getId();
            }
         }
      },

      _hasItemByIndex: function(index) {
         return (typeof index != 'undefined') && (index !== null) && (typeof this._getItemsProjection().at(index) != 'undefined');
      },

      _isEmptyIndex: function(index) {
         return index === null || typeof index == 'undefined' || index == -1;
      }
   };

   var onCollectionChange = function (event, action, newItems, newItemsIndex, oldItems) {
      switch (action) {
         case IBindCollection.ACTION_ADD:
         case IBindCollection.ACTION_REMOVE:
         case IBindCollection.ACTION_MOVE:
         case IBindCollection.ACTION_REPLACE:
         case IBindCollection.ACTION_RESET:
            var indexByKey = this._getItemIndexByKey(this._options.selectedKey),
                itemsProjection = this._getItemsProjection(),
                count;

            //В начале проверим наш хак на перемещение, а потом все остальное
            //суть в том что при удалении, мы ставим курсор на следующую запись
            //но при перемещении тоже происходит удаление - курсор перемещается на следующую, а должен устанавливаться на переносимую запись
            //в итоге если мы следующим событием после того, где поставили флаг получаем add той же записи, то это было перемещение и ставим курсор
            if (this._isMove && action == IBindCollection.ACTION_ADD && newItems.length == 1 && this._isMoveKey == newItems[0].getContents().getId()) {
               this._options.selectedKey = this._isMoveKey;
               this._options.selectedIndex = itemsProjection.getIndex(newItems[0]);
               this._isMove = false;
               this._isMoveKey = null;
            }
            else {
               this._isMove = false;
               this._isMoveKey = null;
               if (indexByKey >= 0) {
                  this._options.selectedIndex = indexByKey;
               } else {

                  count = itemsProjection.getCount();
                  if (count > 0) {
                     if (!this._isEmptyIndex(this._options.selectedIndex)) {
                        if (this._options.selectedIndex > count - 1) {
                           this._options.selectedIndex = count - 1;
                        }
                        if (oldItems.length == 1 && action == IBindCollection.ACTION_REMOVE && oldItems[0].getContents().getId() == this._options.selectedKey) {
                           this._isMove = true;
                           this._isMoveKey = this._options.selectedKey;
                        }
                        this._options.selectedKey = this._getKeyByIndex(this._options.selectedIndex);
                     } else if (!this._options.allowEmptySelection) {
                        this._options.selectedIndex = 0;
                        this._options.selectedKey = this._getKeyByIndex(this._options.selectedIndex);
                     }
                  } else {
                     this._options.selectedIndex = -1;
                     this._options.selectedKey = null;
                  }

               }
            }
            var newHash;
            if (this._getItemsProjection()) {
               var curItem = this._getItemsProjection().at(this._options.selectedIndex);
               if (curItem) {
                  newHash = curItem.getHash();
               }
            }

            if (action !== IBindCollection.ACTION_REPLACE && (newHash !== this._curHash)) {
               this._setSelectedIndex(this._options.selectedIndex, this._options.selectedKey);
               this._curHash = newHash;
            }
      }
   };

   var onSelectorCurrentChange = function (event, index, key) {
      this._setSelectedIndex(index, key);
   };

   return Selectable;

});