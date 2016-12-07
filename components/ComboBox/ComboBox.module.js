define('js!SBIS3.CONTROLS.ComboBox', [
   "Core/constants",
   "Core/Deferred",
   "js!SBIS3.CONTROLS.TextBox",
   "html!SBIS3.CONTROLS.ComboBox",
   "html!SBIS3.CONTROLS.ComboBox/resources/ComboBoxPicker",
   "js!SBIS3.CONTROLS.PickerMixin",
   "js!SBIS3.CONTROLS.ItemsControlMixin",
   "js!WS.Data/Collection/RecordSet",
   "js!WS.Data/Display/Display",
   "js!SBIS3.CONTROLS.Selectable",
   "js!SBIS3.CONTROLS.DataBindMixin",
   "js!SBIS3.CONTROLS.SearchMixin",
   "js!SBIS3.CONTROLS.ScrollContainer",
   "js!SBIS3.CORE.MarkupTransformer",
   "html!SBIS3.CONTROLS.ComboBox/resources/ComboBoxArrowDown",
   "html!SBIS3.CONTROLS.ComboBox/resources/ItemTemplate",
   "html!SBIS3.CONTROLS.ComboBox/resources/ItemContentTemplate",
   "Core/core-instance"
], function ( constants, Deferred,TextBox, dotTplFn, dotTplFnPicker, PickerMixin, ItemsControlMixin, RecordSet, Projection, Selectable, DataBindMixin, SearchMixin, ScrollContainer, MarkupTransformer, arrowTpl, ItemTemplate, ItemContentTemplate, cInstance) {
   'use strict';
   /**
    * Класс контрола "Комбинированный выпадающий список" с возможностью ввода значения с клавиатуры.
    * <br/>
    * Особенности работы с контролом:
    * <ul>
    *    <li>Для работы контрола необходим источник данных, его можно задать либо в опции {@link items}, либо методом {@link setDataSource}.</li>
    *    <li>Среди полей источника данных необходимо указать какое является ключевым - {@link keyField}, и из какого поля будем отображать данные в выпадающий блок - {@link displayField}.</li>
    *    <li>При отсутствии данных будет выведен текст опции {@link emptyHTML}.</li>
    *    <li>Контрол по умолчанию позволяет {@link editable вручную вводить значение}.</li>
    * </ul>
    * <br/>
    * Вы можете связать опцию items с полем контекста, в котором хранятся данные с типом значения перечисляемое - {@link WS.Data/Types/Enum}. Если эти данные хранят состояние выбранного значения, то в контрол будет установлено выбранное значение.
    * <pre>
    *    <component data-component="SBIS3.CONTROLS.ComboBox">
    *       <options name="items" type="array" bind="record/MyEnumField"></options>
    *       <option name="keyField">@Идентификатор</option>
    *       <option name="displayField">Описание</option>
    *    </component>
    * </pre>
    *
    * @class SBIS3.CONTROLS.ComboBox
    * @extends SBIS3.CONTROLS.TextBox
    *
    * @author Крайнов Дмитрий Олегович
    *
    * @demo SBIS3.CONTROLS.Demo.MyComboBox Пример 1. Выпадающий список, для которого установлен набора данных в опции items.
    * @demo SBIS3.CONTROLS.Demo.MyComboBoxDS Пример 2. Выпадающий список, для которого установлен источник данных в опции dataSource.
    *
    * @mixes SBIS3.CONTROLS.PickerMixin
    * @mixes SBIS3.CONTROLS.ItemsControlMixin
    * @mixes SBIS3.CONTROLS.Selectable
    * @mixes SBIS3.CONTROLS.DataBindMixin
    * @mixes SBIS3.CONTROLS.SearchMixin
    *
    * @cssModifier controls-ComboBox__ellipsis При нехватке ширины текст в поле ввода оборвётся многоточием.
    * <b>Важно:</b> при добавлении этого класса сломается "Базовая линия".
    *
    * @public
    * @control
    * @category Inputs
    * @initial
    * <component data-component='SBIS3.CONTROLS.ComboBox'>
    *     <options name="items" type="array">
    *        <options>
    *            <option name="key">1</option>
    *            <option name="title">Пункт1</option>
    *         </options>
    *         <options>
    *            <option name="key">2</option>
    *            <option name="title">Пункт2</option>
    *         </options>
    *      </options>
    *      <option name="keyField">key</option>
    * </component>
    */

   function getRecordsForRedrawCB(projection, cfg){
      var itemsProjection;

      itemsProjection = cfg._getRecordsForRedrawSt.apply(this, arguments);
      if (cfg.emptyValue){
         itemsProjection.unshift(getEmptyProjection(cfg));
      }
      return itemsProjection;
   }

   function getEmptyProjection(cfg) {
      var rawData = {},
         emptyItemProjection,
         rs;
      rawData[cfg.keyField] = null;
      rawData[cfg.displayField] = 'Не выбрано';
      rawData.isEmptyValue = true;

      rs = new RecordSet({
         rawData: [rawData],
         idProperty: cfg.keyField
      });

      emptyItemProjection = Projection.getDefaultDisplay(rs).at(0);
      cfg._emptyRecord = emptyItemProjection.getContents();
      return emptyItemProjection;
   }

   var ComboBox = TextBox.extend([PickerMixin, ItemsControlMixin, Selectable, DataBindMixin, SearchMixin], /** @lends SBIS3.CONTROLS.ComboBox.prototype */{
      _dotTplFn: dotTplFn,
      _dotTplFnPicker: dotTplFnPicker,
      /**
       * @typedef {Object} ItemsComboBox
       * @property {String} title Текст пункта меню.
       * @property {String} key Ключ пункта меню.
       * @translatable title
       */
      /**
       * @cfg {ItemsComboBox[]} Набор исходных данных, по которому строится отображение
       * @name SBIS3.CONTROLS.ComboBox#items
       * @remark
       * !Важно: данные для выпадающего списка можно задать либо в этой опции,
       * либо через источник данных методом {@link setDataSource}.
       * @example
       * <pre class="brush:xml">
       *     <options name="items" type="array">
       *        <options>
       *            <option name="key">1</option>
       *            <option name="title">Пункт1</option>
       *         </options>
       *         <options>
       *            <option name="key">2</option>
       *            <option name="title">Пункт2</option>
       *         </options>
       *      </options>
       *      <!--необходимо указать какое из наших полей является ключевым-->
       *      <option name="keyField">key</option>
       * </pre>
       * @see keyField
       * @see displayField
       * @see setDataSource
       * @see getDataSet
       */

      $protected: {
         //если поменяли текст до того, как были установлены items. То мы не сможем проставить соответсвующий ключ из набора
         //это надо будет сделать после уставноки items, а этот флаг используем для понимания
         _delayedSettingTextByKey: false,
         //В зависимости от этого флага по разному будет работать отрисовка выделенного
         //если он true, то при условии ключа null текст будет оцищаться
         //нельзя всегда очищать текст, потому что при ручном вводе текста, даже при пустом ключе текст стирать не надо
         _isClearing: false,
         _keysWeHandle: [constants.key.up, constants.key.down, constants.key.enter, constants.key.esc],
         _options: {
            _emptyRecord: undefined,
            _getRecordsForRedraw: getRecordsForRedrawCB,
            _defaultItemTemplate: ItemTemplate,
            _defaultItemContentTemplate: ItemContentTemplate,
            searchDelay: 0,
            startCharacter: 1,
            focusOnActivatedOnMobiles: false,
            /**
             * @cfg {String} Шаблон отображения каждого элемента коллекции
             * @example
             * <pre class="brush:xml">
             *     <option name="itemTemplate">
             *         <div data-key="{{=it.item.getId()}}" class="controls-ComboBox__itemRow js-controls-ComboBox__itemRow">
             *             <div class="genie-colorComboBox__itemTitle">
             *                 {{=it.displayField}}
             *             </div>
             *         </div>
             *     </option>
             * </pre>
             */
            itemTemplate: '',
            afterFieldWrapper: arrowTpl,
            /**
             * @cfg {Boolean} Возможность ручного ввода текста
             * @remark
             * При включённой опции в случае отсутствия среди пунктов выпадающего списка нужного контрол позволяет
             * задать своё значение вводом с клавиатуры.
             * @example
             * <pre class="brush:xml">
             *     <option name="editable">false</option>
             * </pre>
             * @see items
             * @see isEditable
             * @see setEditable
             * @see textTransform
             * @see inputRegExp
             * @see maxLength
             */
            editable: true,
            /**
             * @cfg {Boolean} Присутствует пустое значение или нет
             * @noShow
             */
            emptyValue: false,
            /**
             * @cfg {String} Форматирование значений в списке
             * @noShow
             */
            valueFormat: '',
            /*
               @cfg {Boolean} Автоматически фильтровать пункты выпадающего списка по введеной строке 
            */
            autocomplete: false
         }
      },

      $constructor: function () {
         var self = this;
         self.getContainer().addClass('controls-ComboBox');
         if (!this._options.displayField) {
            //TODO по умолчанию поле title???
            this._options.displayField = 'title';
         }

         if (this._options.autocomplete){
            this.subscribe('onSearch', this._onSearch);
            this.subscribe('onReset', this._onResetSearch);
         }

         this._container.click(function (e) {
            var target = $(e.target),
               isArrow = target.hasClass('js-controls-ComboBox__arrowDown');
            if (isArrow || target.hasClass('controls-TextBox__afterFieldWrapper') || self.isEditable() === false) {
               if (self.isEnabled()) {
                  self.togglePicker();
                  // Что бы не открывалась клавиатура на айпаде при клике на стрелку 
                  if (isArrow) {
                     e.preventDefault();
                  }
               }
            }
         });
         this.reload();
      },

      init : function() {
         ComboBox.superclass.init.apply(this, arguments);
         if (this._options.selectedIndex !== undefined && this._options.selectedIndex !== null) {
            //this._drawSelectedItem(this._options.selectedKey, this._options.selectedIndex);
         } else {
            if (this._options.text) {
               this._setKeyByText();
            }
         }
      },

      _searchFilter: function(model){
         //TODO: Обобщить поиск с автодополнением и строкой поиска
         //Сделать общую точку входа для поиска, для понимания где искать на источнике или на проекции
         var itemText = model.get(this._options.displayField).toLowerCase(),
             text = this.getText().toLowerCase();
         if (itemText.match(text)){
            return true;
         }
         return false;
      },

      _onSearch: function(){
         this.setSelectedIndex(-1);
         this._getItemsProjection().setFilter(this._searchFilter.bind(this));
         this.redraw();
         this.showPicker();
      },

      _onResetSearch: function(){
         this.setSelectedIndex(-1);
         this._getItemsProjection().setFilter(null);
         this.redraw();
      },

      _keyboardHover: function (e) {
         var
            selectedKey = this.getSelectedKey(),
            selectedItem, newSelectedItem, newSelectedItemId;
         if (this._picker) {
            if(!this._picker.isVisible() && e.which === constants.key.esc ){
               return true;
            }

            var
               items = $('.controls-ListView__item', this._picker.getContainer().get(0));

            selectedItem = $('.controls-ComboBox__itemRow__selected', this._picker.getContainer());
            //навигация по стрелкам
            if (e.which === constants.key.up) {
               newSelectedItem = selectedKey ? selectedItem.prev('.controls-ListView__item') : items.eq(0);
            } else if (e.which === constants.key.down) {
               newSelectedItem = selectedKey ? selectedItem.next('.controls-ListView__item') : items.eq(0);
            }
            if (newSelectedItem && newSelectedItem.length) {
               newSelectedItemId = newSelectedItem.data('id');
               this.setSelectedKey(newSelectedItemId);
               this._scrollToItem(newSelectedItemId);
               this.setActive(true); // После подскролливания возвращаем фокус в контейнер компонента
            }
         }
         else {
            if (this.getItems()) {
               var num = null, i = 0, nextRec, prevRec;
               if (this.getItems().getCount()) {
                  if (selectedKey) {
                     this.getItems().each(function (rec) {
                        if (rec.getId() == selectedKey) {
                           num = i;
                        }
                        i++;
                     });
                     if (num !== null) {
                        if (num == 0) {
                           nextRec = this.getItems().at(num + 1);
                           prevRec = this.getItems().at(0)
                        }
                        else if (num == this.getItems().getCount() - 1) {
                           nextRec = this.getItems().at(this.getItems().getCount() - 1);
                           prevRec = this.getItems().at(num - 1)
                        }
                        else {
                           nextRec = this.getItems().at(num + 1);
                           prevRec = this.getItems().at(num - 1)
                        }
                     }
                  }
                  else {
                     prevRec = this.getItems().at(0);
                     nextRec = this.getItems().at(0);
                  }
                  if (e.which === constants.key.up) {
                     this.setSelectedKey(prevRec.getId());
                  } else if (e.which === constants.key.down) {
                     this.setSelectedKey(nextRec.getId());
                  }
               }
            }
         }

         if (e.which === constants.key.enter || e.which === constants.key.esc) {
            this.hidePicker()
         }

         return false;
      },

      setText: function (text) {
         ComboBox.superclass.setText.call(this, text);
         this._setKeyByText();
      },

      _drawText: function(text) {
         ComboBox.superclass._drawText.apply(this, arguments);
         this._drawNotEditablePlaceholder(text);
         $('.js-controls-ComboBox__fieldNotEditable', this._container.get(0)).text(text || this._options.placeholder);
         if (this._options.editable) {
            this._setKeyByText();
         }
      },

      _drawNotEditablePlaceholder: function (text) {
         $('.js-controls-ComboBox__fieldNotEditable', this._container.get(0)).toggleClass('controls-ComboBox__fieldNotEditable__placeholder', !text);
      },

      _clearSelection: function(){
         ComboBox.superclass.setText.call(this, '');
         this._drawNotEditablePlaceholder('');
         $('.js-controls-ComboBox__fieldNotEditable', this._container.get(0)).text('');
         if (this._picker) {
            $('.controls-ComboBox__itemRow__selected', this._picker.getContainer().get(0)).removeClass('controls-ComboBox__itemRow__selected');
         }
         this._container.addClass('controls-ComboBox_emptyValue');
      },

      _drawSelectedItem: function (key, index) {
         var def, cKey = key;
         def = new Deferred();

         if (this._getItemsProjection()) {
            if (!this._isEmptyIndex(index)) {
               var projItem = this._getItemsProjection().at(index);
               def.callback(projItem.getContents());
            }
            else {
               if (this._dataSource) {
                  if ((cKey != undefined) && (cKey !== null)) {
                     this._dataSource.read(cKey).addCallback(function (item) {
                        def.callback(item);
                     });
                  }
               }
            }
            def.addCallback(this._drawSelectedItemText.bind(this, cKey));
         }
         if (this._isClearing) {
            this._clearSelection();
            this._isClearing = false;
         }
      },

      _drawSelectedItemText: function(key, item){
         if (item) {
            var newText = this._propertyValueGetter(item, this._options.displayField);
            if (newText != this._options.text) {
               ComboBox.superclass.setText.call(this, newText);
               this._drawNotEditablePlaceholder(newText);
               $('.js-controls-ComboBox__fieldNotEditable', this._container.get(0)).text(newText);                              
            }
            /*управлять этим классом надо только когда имеем дело с рекордами
             * потому что только в этом случае может прийти рекорд с пустым ключом null, в случае ENUM это не нужно
             * вообще этот участок кода нехороший, помечу его TODO
             * планирую избавиться от него по задаче https://inside.tensor.ru/opendoc.html?guid=fb9b0a49-6829-4f06-aa27-7d276a1c9e84&description*/
            if (cInstance.instanceOfModule(item, 'WS.Data/Entity/Model')) {
               this._container.toggleClass('controls-ComboBox_emptyValue', (key === null));
            }
            else {
               this._container.removeClass('controls-ComboBox_emptyValue');
            }
         }
         else {
            this._clearSelection();
         }
         if (this._picker) {
            $('.controls-ComboBox__itemRow__selected', this._picker.getContainer().get(0)).removeClass('controls-ComboBox__itemRow__selected');
            $('.controls-ComboBox__itemRow[data-id=\'' + key + '\']', this._picker.getContainer().get(0)).addClass('controls-ComboBox__itemRow__selected');
         }
      },

      _drawSelectedEmptyRecord: function(){
         this._drawSelectedItemText(null, this._options._emptyRecord);
         this._options.selectedKey = null;
         this.setSelectedIndex(-1);
         this.hidePicker();
      },

      _addItemAttributes : function(container, item) {
         ComboBox.superclass._addItemAttributes.call(this, container, item);
         container.addClass('controls-ComboBox__itemRow').addClass('js-controls-ComboBox__itemRow');
      },

      _setPickerContent: function () {
         var self = this;
         this._picker.getContainer().mousedown(function (e) {
            e.stopPropagation();
         });
         //TODO нужно ли здесь звать redraw? Сейчас без этого не работает.
         this.redraw();
         //Подписка на клик по элементу комбобокса
         //Подписываемся на onClick контрола, т.к. на мобильных платформах может не стрельнуть обработчик события mouseup/mousedown. Связано это с тем,
         //что кто-то может прервать событие touchstart, вследствие чего описанные события не стрельнут.
         //Подписка на платформенное событие более правильное решение, т.к. наше событие будет всегда.
         this._picker.subscribe('onClick', function (eventObject, e) {
            var row = $(e.target).closest('.js-controls-ComboBox__itemRow');
            if (row.length) {

               var hash = $(row).attr('data-hash');
               var projItem, index;
               projItem = self._getItemsProjection().getByHash(hash);
               if (!projItem && self._options.emptyValue){
                  self._drawSelectedEmptyRecord();
                  return;
               }
               index = self._getItemsProjection().getIndex(projItem);
               self.setSelectedIndex(index);
               self.hidePicker();
               if (self._options.autocomplete){
                  self._getItemsProjection().setFilter(null);
                  self.redraw();
               }
               // чтобы не было выделения текста, когда фокус вернули в выпадашку
               self._fromTab = false;
               self.setActive(true);
            }
            e.stopPropagation();
         });
         //TODO: кажется неочевидное место, возможно как то автоматизировать
         this._picker.getContainer().addClass('controls-ComboBox__picker');
      },

      _setPickerConfig: function () {
         return {
            corner: 'bl',
            verticalAlign: {
               side: 'top'
            },
            horizontalAlign: {
               side: 'left'
            },
            closeByExternalClick: true,
            targetPart: true,
            activableByClick: false,
            template : MarkupTransformer(this._dotTplFnPicker)({})
         };
      },

      _getItemsContainer: function () {
         if (this._picker){
         	return $('.controls-ComboBox__list', this._picker.getContainer()[0]);
         } else {
         	return null;
         }
      },

      _getItemTemplate: function (projItem) {
         var
            item = projItem.getContents(),
            title = item.get(this._options.displayField);
         
         if (this._options.itemTemplate) {
            return doT.template(this._options.itemTemplate)({item : item, displayField : title})
         }
         else {
            return '<div>' + title + '</div>';
         }
      },

      _keyDownBind: function (e) {
         //TODO: так как нет итератора заккоментим
         /*описываем здесь поведение стрелок вверх и вниз*/
         /*
          var self = this,
          current = self.getSelectedKey();
          if (e.which == 40 || e.which == 38) {
          e.preventDefault();
          }
          var newItem;
          if (e.which == 40) {
          newItem = self.getItems().getNextItem(current);
          }
          if (e.which == 38) {
          newItem = self.getItems().getPreviousItem(current);
          }
          if (newItem) {
          self.setSelectedKey(this._items.getId(newItem));
          }
          if (e.which == 13) {
          this.hidePicker();
          }
          */      },


      _keyUpBind: function (e) {
         var keys = constants.key;
         /*по изменению текста делаем то же что и в текстбоксе*/
         ComboBox.superclass._keyUpBind.apply(this, arguments);
         /*не делаем смену значения при нажатии на стрелки вверх вниз. Иначе событие смены ключа срабатывает два раза*/
         if ((e.which != keys.down) && (e.which != keys.up)) {
            this._setKeyByText();
         }
         /*при нажатии enter или escape, событие должно всплывать. Возможно эти кнопки являются управляющими командами (например в редактировании по месту)*/
         if ((e.which != keys.enter) && (e.which != keys.esc)) {
            e.stopPropagation();
         }
      },

      _setKeyByText: function () {
         /*устанавливаем ключ, когда текст изменен извне*/
         var

            self = this,
            filterFieldObj = {};

         if (this._dataSource) {
            filterFieldObj[this._options.displayField] = self._options.text;

            self._callQuery(filterFieldObj).addCallback(function (DataSet) {
               self._findItemByKey(DataSet);
            });
         }
         else if (this.getItems()) {
            this._findItemByKey(this.getItems());
         }
         else {
            this._delayedSettingTextByKey = true;
         }
      },

      _findItemByKey: function(items) {
         //Алгоритм ищет нужный рекорд по текстовому полю. Это нужно в случае, если в комбобокс
         //передают текст, и надо оперделить ключ записи
         var noItems = true,
            selKey,
            oldKey = this._options.selectedKey,
            oldText = this.getText(),
            self = this;
         items.each(function (item) {
            noItems = false;
            if (self._propertyValueGetter(item, self._options.displayField) == self._options.text) {
               selKey = item.getId();
               self._options.selectedKey = (selKey !== null && selKey !== undefined && selKey == selKey) ? selKey : null;
               self._options.selectedIndex = self._getItemIndexByKey(self._options.selectedKey);
               //TODO: переделать на setSelectedItem, чтобы была запись в контекст и валидация если надо. Учесть проблемы с первым выделением
               if (oldKey !== self._options.selectedKey) { // при повторном индексе null не стреляет событием
                  self._notifySelectedItem(self._options.selectedKey, self._options.selectedIndex);
                  self._drawSelectedItem(self._options.selectedKey, self._options.selectedIndex);
               }
            }
         });

         if (noItems && oldKey !== null) {
            ComboBox.superclass.setSelectedKey.call(self, null);
            self._drawText(oldText);
         }
      },

      _dataLoadedCallback: function() {
         if (this._delayedSettingTextByKey) {
            this._setKeyByText();
         }
      },

      _clearItems : function(container) {
         if (this._picker) {
            ComboBox.superclass._clearItems.call(this, container);
         }
      },

      redraw: function () {
         if (this._picker) {
            ComboBox.superclass.redraw.call(this);
            // Сделано для того, что бы в при уменьшении колчества пунктов при поиске нормально усеньшались размеры пикера
            // В 3.7.3.200 сделано нормально на уровне попапа
            this._picker.getContainer().css('height', '');
            this._picker.recalcPosition(true);
         }
         else {
            this._drawSelectedItem(this._options.selectedKey, this._options.selectedIndex);
         }
      },
      /**
       * Метод установки/изменения возможности ручного ввода.
       * @remark
       * Возможные значения:
       * <ul>
       *    <li>true - в случае отсутствия среди имеющихся пунктов нужного можнно ввести значение с клавиатуры;</li>
       *    <li>false - значение можно задать только выбором из списка существующих.</li>
       * </ul>
       * @param {Boolean} editable Возможность ручного ввода.
       * @example
       * <pre>
       *     myComboBox.setEditable(false);
       * </pre>
       * @see isEditable
       * @see editable
       */
      setEditable: function (editable) {
         this._options.editable = editable;
         this._container.toggleClass('controls-ComboBox__editable-false', editable === false);
      },
      /**
       * Признак возможности ручного ввода.
       * @remark
       * Возможные значения:
       * <ul>
       *    <li>true - в случае отсутствия среди имеющихся пунктов нужного можнно ввести значение с клавиатуры;</li>
       *    <li>false - значение можно задать только выбором из списка существующих.</li>
       * </ul>
       * @returns {Boolean} Возможен ли ручной ввод.
       * @example
       * <pre>
       *     myComboBox.isEditable();
       * </pre>
       * @see editable
       * @see setEditable
       */
      isEditable: function () {
         return this._options.editable;
      },

      _getElementToFocus: function() {
         return this.isEditable() ? ComboBox.superclass._getElementToFocus.apply(this, arguments) : this.getContainer();
      },

      _setEnabled: function (enabled) {
         TextBox.superclass._setEnabled.call(this, enabled);
         if (enabled === false) {
            this._inputField.attr('readonly', 'readonly');
         }
         else {
            if (this._options.editable) {
               this._inputField.removeAttr('readonly');
            }
         }
      },

      showPicker: function(){
         ComboBox.superclass.showPicker.call(this);
         this._setWidth();
         //После отображения пикера подскроливаем до выбранного элемента
         this._scrollToItem(this.getSelectedKey());
      },

      _initializePicker: function(){
         var self = this;
         ComboBox.superclass._initializePicker.call(self);

         // пробрасываем события пикера в метод комбобокса, т.к. если значение выбрано, то при открытии пикера фокус
         // перейдет на него и комбобокс перестанет реагировать на нажатие клавиш, потому что он наследуется от AreaAbstract
         // TODO чтобы избежать этого нужно переписать Combobox на ItemsControlMixin, тогда метод _scrollToItem не будет переводить фокус на пикер
         self._picker.subscribe('onKeyPressed', function (eventObject, event) {
            self._keyboardHover(event);
         });

         self._setWidth();
      },

      _setWidth: function(){
         var self = this;
         if (self._picker._options.target){
            this._picker.getContainer().css({
               'min-width': self._picker._options.target.outerWidth() - this._border/*ширина бордеров*/
            });
         }
      },

      //TODO заглушка
      /**
       * @noShow
       * @returns {Deferred}
       */
      reviveComponents : function() {
         var def = new Deferred();
         def.callback();
         return def;
      },

      _getKeyByIndex: function(index){
         if (this._options.emptyValue && index === -1){
            return null;
         }
         return ComboBox.superclass._getKeyByIndex.apply(this, arguments);
      },

      setSelectedKey : function(key) {
         if (this._options.emptyValue && key === null){
            this._drawSelectedEmptyRecord();
            return;
         }
         if (key == null && !(this.getItems() && this.getItems().getRecordById(key))) {
            this._isClearing = true;
         }
         ComboBox.superclass.setSelectedKey.apply(this, arguments);
      },

      _scrollToItem: function(itemId) {
         var itemContainer  = $('.controls-ListView__item[data-id="' + itemId + '"]', this._getItemsContainer());
         if (itemContainer.length) {
            itemContainer
               .attr('tabindex', -1)
               .focus();
         }
      }
   });

   return ComboBox;
});
