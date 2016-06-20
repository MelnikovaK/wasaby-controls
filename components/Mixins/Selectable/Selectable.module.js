/**
 * Created by iv.cheremushkin on 14.08.2014.
 */

define('js!SBIS3.CONTROLS.Selectable', ['js!WS.Data.Utils', 'js!WS.Data.Collection.IBind'], function(Utils, IBindCollection) {

   /**
    * Миксин, добавляющий поведение хранения выбранного элемента. Всегда только одного.
    * @mixin SBIS3.CONTROLS.Selectable
    * @author Крайнов Дмитрий Олегович
    * @public
    */

   var Selectable = /**@lends SBIS3.CONTROLS.Selectable.prototype  */{
       /**
        * @event onSelectedItemChange Происходит при смене выбранного элемента коллекции.
        * @param {$ws.proto.EventObject} eventObject Дескриптор события.
        * @param {String} id Идентификатор выбранного элемента коллекции.
        * @example
        * <pre>
        *     RadioButtonGroup.subscribe('onSelectedItemChange', function(event, id){
        *        TextBox.setText('Selected item id: ', id);
        *     })
        * </pre>
        * @see selectedKey
        * @see setSelectedKey
        * @see getSelectedKey
        * @see SBIS3.CONTROLS.DSMixin#keyField
        */
      $protected: {
          /*не различаются события move и remove/add при смене пор номеров, поэтому используем этот флаг, см ниже*/
          _isMove: false,
          _isMoveKey: null,
          _selectMode: 'index',
          _options: {
             /**
              * @cfg {String} Устанавливает выбранным элемент коллекции по переданному индексу (порядковому номеру).
              * @remark
              * Любой элемент коллекции можно выбрать либо по его {@link SBIS3.CONTROLS.DSMixin#keyField идентификатору},
              * либо его по индексу (порядковому номеру) в коллекции.
              * Для определения выбранного элемента необходимо указать его порядковый номер в коллекции.
              * @example
              * <pre>
              *     <option name="selectedIndex">1</option><!-- Устанавливаем выбранным элемент коллекции, который идет первым в списке -->
              * </pre>
              * @see setSelectedIndex
              * @see getSelectedIndex
              * @see onSelectedItemChange
              */
             selectedIndex: null,
             /**
              * @cfg {String} Устанавливает выбранным элемент коллекции по переданному идентификатору - {@link SBIS3.CONTROLS.DSMixin#keyField ключевому полю} элемента коллекции.
              * @remark
              * Установить новый идентификатор элемента коллекции можно с помощью метода {@link setSelectedKey},
              * получить идентификатор элемента коллекции можно с помощью метода {@link getSelectedKey}.
              * @example
              * <pre>
              *     <option name="selectedKey">3</option>
              * </pre>
              * @see setSelectedKey
              * @see getSelectedKey
              * @see onSelectedItemChange
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
              * @see SBIS3.CONTROLS.DSMixin#keyField
              */
            allowEmptySelection : true
         }
      },

      $constructor: function() {
         this._publish('onSelectedItemChange');
      },


      _prepareSelectedConfig: function(index, key) {




         // FIXME key !== null && index === -1 - проверка для выпуска 3.7.3.100
         // иначе, если сначала установить ключ, а потом сорс не будет отрисовываться выбранный эелемент
         if ((typeof index == 'undefined') || (index === null) || (key !== null && index === -1)) {
            if (typeof key != 'undefined') {
               this._selectMode = 'key';
               this._options.selectedIndex = this._getItemIndexByKey(key);
            }
            else {
               this._options.selectedIndex = undefined;
            }
         }
         else {
            this._selectMode = 'index';
            if (this._getItemsProjection().getCount()) {
               this._options.selectedIndex = index;
               this._setKeyByIndex();
            }
            else {
               this._options.selectedIndex = undefined;
            }
         }
         if (!this._options.allowEmptySelection && this._isEmptyIndex()) {
            if (this._getItemsProjection().getCount()) {
               this._selectMode = 'index';
               this._options.selectedIndex = 0;
               this._setKeyByIndex();
            }
         }
      },

      before : {
         setDataSource: function() {
            this._options.selectedIndex = -1;
         },
         setItems: function() {
            this._options.selectedIndex = -1;
         },
         destroy: function () {
            this._resetUtilityEnumerator();
         }
      },

      after : {
         _setItemsEventHandlers : function() {
            if (!this._onProjectionCurrentChange) {
               this._onProjectionCurrentChange = onProjectionCurrentChange.bind(this);
            }
            this.subscribeTo(this._getItemsProjection(), 'onCurrentChange', this._onProjectionCurrentChange);

            if (!this._onProjectionChange) {
               this._onProjectionChange = onCollectionChange.bind(this);
            }
            this.subscribeTo(this._getItemsProjection(), 'onCollectionChange', this._onProjectionChange);
         },
         _drawItemsCallback: function() {
            this._drawSelectedItem(this._options.selectedKey, this._options.selectedIndex);
         },
         _unsetItemsEventHandlers : function() {
            if (this._utilityEnumerator) {
               this._utilityEnumerator.unsetObservableCollection(
                  this._getItemsProjection()
               );
            }
            this._utilityEnumerator = undefined;
            if (this._getItemsProjection() && this._onProjectionCurrentChange) {
               this.unsubscribeFrom(this._getItemsProjection(), 'onCurrentChange', this._onProjectionCurrentChange);
            }
            if (this._getItemsProjection() && this._onProjectionChange) {
               this.unsubscribeFrom(this._getItemsProjection(), 'onCollectionChange', this._onProjectionChange);
            }
         },
         _itemsReadyCallback: function() {
            this._prepareSelectedConfig(this._options.selectedIndex, this._options.selectedKey);
            this._selectInProjection();
         },
         /**
          * todo Удалить, когда будет выполнена указанная ниже задача
          * Задача в разработку от 28.04.2016 №1172779597
          * В деревянной проекции необходима возможность определять, какие элементы создаются развернутыми. Т...
          * https://inside.tensor.ru/opendoc.html?guid=6f1758f0-f45d-496b-a8fe-fde7390c92c7
          * @private
          */
         redraw: function() {
            if (this._utilityEnumerator) {
               this._utilityEnumerator.reIndex();
            }
         }
      },

      _getUtilityEnumerator: function() {
         if (!this._utilityEnumerator) {
            this._utilityEnumerator = this._getItemsProjection().getEnumerator();
            this._utilityEnumerator.setObservableCollection(this._getItemsProjection());
         }
         return this._utilityEnumerator;
      },

      _resetUtilityEnumerator: function(){
         if (this._utilityEnumerator) {
            this._utilityEnumerator.unsetObservableCollection(
               this._getItemsProjection()
            );
         }
         this._utilityEnumerator = undefined;
      },

      //TODO переписать метод
      _setSelectedIndex: function(index, id) {
         this._drawSelectedItem(id, index);
         this._notifySelectedItem(id, index)
      },
      /**
       * Устанавливает выбранным элемент коллекции по переданному идентификатору.
       * @remark
       * Для возвращения коллекции к состоянию без выбранного элемента нужно передать null.
       * @param {String} id Идентификатор элемента, который нужно установить в качестве выбранного.
       * Идентификатором элемента коллекции служит значение его {@link SBIS3.CONTROLS.DSMixin#keyField ключевого поля}.
       * @example
       * <pre>
       *     var newKey = (someValue > 0) ? 'positive' : 'negative';
       *     myComboBox.setSelectedKey(newKey);
       * </pre>
       * @see selectedKey
       * @see getSelectedKey
       * @see SBIS3.CONTROLS.DSMixin#keyField
       * @see onSelectedItemChange
       */
      setSelectedKey : function(id) {
         this._options.selectedKey = id;
         if (this._getItemsProjection()) {
            this._prepareSelectedConfig(undefined, id);
            this._selectInProjection();
         } else {
            this._setSelectedIndex(null, id);
         }
      },

      /**
       * Устанавливает выбранным элемент коллекции по переданному индексу (порядковому номеру).
       * @param index Индекс выбранного элемента коллекции.
       * @example
       * <pre>
       *    this._getControlOrdersList().setSelectedIndex(0);
       * </pre>
       * @see selectedIndex
       * @see getSelectedIndex
       */
      setSelectedIndex: function(index) {
         if (this._getItemsProjection()) {
            this._prepareSelectedConfig(index);
            this._getItemsProjection().setCurrentPosition(index);
         }
      },
      /**
       * Возвращает идентификатор выбранного элемента коллекции.
       * Идентификатором элемента коллекции служит значение его {@link SBIS3.CONTROLS.DSMixin#keyField ключевого поля}.
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
       * @see SBIS3.CONTROLS.DSMixin#keyField
       */
      getSelectedKey : function() {
         return this._options.selectedKey;
      },

      /**
       * Возвращает индекс (порядковый номер) выбранного элемента коллекции.
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
         return this._options.selectedIndex;
      },

      _drawSelectedItem : function() {
         /*Method must be implemented*/
      },

      _getItemValue: function(value, keyField) {
         if(value && typeof value === 'object') {
            return Utils.getItemPropertyValue(value, keyField );
         }
         return value;
      },

      _getItemIndexByKey: function(id) {
         if(this._options.keyField) {
            return this._getUtilityEnumerator().getIndexByValue(
               this._options.keyField,
               id
            );
         } else {
            var index;
            this._getItemsProjection().each(function(value, i){
               if(value.getContents() === id){
                  index = i;
               }
            });
            return index;
         }
      },

      _notifySelectedItem : function(id, index) {
         this._notifyOnPropertyChanged('selectedKey');
         this._notifyOnPropertyChanged('selectedIndex');
         this._notify('onSelectedItemChange', id, index);
      },

      _setKeyByIndex: function() {
         if(this._hasItemByIndex()) {
            var item = this._getItemsProjection().at(this._options.selectedIndex);
            this._options.selectedKey = item.getContents().getId();
         }
      },

      _hasItemByIndex: function() {
         return (typeof this._options.selectedIndex != 'undefined') && (this._options.selectedIndex !== null) && (typeof this._getItemsProjection().at(this._options.selectedIndex) != 'undefined');
      },

      _isEmptyIndex: function() {
         return this._options.selectedIndex === null || typeof this._options.selectedIndex == 'undefined' || this._options.selectedIndex == -1;
      },

      _selectInProjection: function (){
         if (this._hasItemByIndex()) {
            this._getItemsProjection().setCurrentPosition(this._options.selectedIndex);
         } else {
            this._getItemsProjection().setCurrentPosition(-1);
         }
      }
   };

   var onCollectionChange = function (event, action, newItems, newItemsIndex, oldItems) {
      switch (action) {
         case IBindCollection.ACTION_ADD:
         case IBindCollection.ACTION_REMOVE:
         case IBindCollection.ACTION_MOVE:
         case IBindCollection.ACTION_REPLACE:
         case IBindCollection.ACTION_RESET:
            this._resetUtilityEnumerator();

            var indexByKey = this._getItemIndexByKey(this._options.selectedKey),
                itemsProjection = this._getItemsProjection(),
                oldIndex = this._options.selectedIndex,
                oldKey = this._options.selectedKey,
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
                     if (!this._isEmptyIndex()) {
                        if (this._options.selectedIndex > count - 1) {
                           this._options.selectedIndex = 0;
                        }
                        if (oldItems.length == 1 && action == IBindCollection.ACTION_REMOVE && oldItems[0].getContents().getId() == this._options.selectedKey) {
                           this._isMove = true;
                           this._isMoveKey = this._options.selectedKey;
                        }
                        this._setKeyByIndex();
                     } else if (!this._options.allowEmptySelection) {
                        this._options.selectedIndex = 0;
                        this._setKeyByIndex();
                     }
                  } else {
                     this._options.selectedIndex = -1;
                     this._options.selectedKey = null;
                  }

               }
            }
            //TODO защита от логики деревянной проекции: добавил проверку на изменение selectedIndex и selectedKey, т.к. при вызове toggleNode
            //в узле стреляет либо action_remove, либо action_add листьев и мы всегда попадали сюда. и всегда делали _setSelectedIndex,
            //что приводило к лишнему событию onSelectedItemChanged, чего быть не должно.
            //Ошибка остается актуальной для rightNavigationPanel, где мы сначала делаем toggleNode, у нас меняется индекс и нижеописанная проверка проходит(хотя
            //по факту активный элемент не изменился) => стреляет onSelectedItemChanged, после из listView стреляет setSelectedKey из которого так же стреляет onSelectedItemChanged
            //выписал на это ошибку в 373.200

            if (action !== IBindCollection.ACTION_REPLACE && (this._options.selectedIndex !== oldIndex || this._options.selectedKey !== oldKey)) {
               this._setSelectedIndex(this._options.selectedIndex, this._options.selectedKey);
            }
      }
   };

   var onProjectionCurrentChange = function (event, newCurrent, oldCurrent, newPosition) {
      this._setSelectedIndex(
         newPosition,
         this._getItemValue(newCurrent ? newCurrent.getContents() : null, this._options.keyField)
      );
   };

   return Selectable;

});