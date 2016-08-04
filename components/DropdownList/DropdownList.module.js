/**
 * Created by am.gerasimov on 10.04.2015.
 */
define('js!SBIS3.CONTROLS.DropdownList',
   [
      'js!SBIS3.CORE.CompoundControl',
      'js!SBIS3.CONTROLS.PickerMixin',
      'js!SBIS3.CONTROLS.DSMixin',
      'js!SBIS3.CONTROLS.MultiSelectable',
      'js!SBIS3.CONTROLS.DataBindMixin',
      'js!SBIS3.CONTROLS.DropdownListMixin',
      'js!SBIS3.CONTROLS.Button',
      'js!SBIS3.CONTROLS.IconButton',
      'js!SBIS3.CONTROLS.Link',
      'js!SBIS3.CORE.MarkupTransformer',
      'js!SBIS3.CONTROLS.Utils.TemplateUtil',
      'html!SBIS3.CONTROLS.DropdownList',
      'html!SBIS3.CONTROLS.DropdownList/DropdownListHead',
      'html!SBIS3.CONTROLS.DropdownList/DropdownListItem',
      'html!SBIS3.CONTROLS.DropdownList/DropdownListPicker',
      'i18n!SBIS3.CONTROLS.DropdownList'
   ],

   function(Control, PickerMixin, DSMixin, MultiSelectable, DataBindMixin, DropdownListMixin, Button, IconButton, Link, MarkupTransformer, TemplateUtil, dotTplFn, dotTplFnHead, dotTplFnForItem, dotTplFnPicker) {

      'use strict';
      /**
       * Контрол, отображающий по клику или ховеру список однотипных сущностей.
       * Выпадающий список с разными вариантами отображения и возможностью задать для сущностей шаблон отображения.
       * @class SBIS3.CONTROLS.DropdownList
       * @extends $ws.proto.CompoundControl
       * @author Крайнов Дмитрий Олегович
       * @mixes SBIS3.CONTROLS.DSMixin
       * @mixes SBIS3.CONTROLS.MultiSelectable
       * @mixes SBIS3.CONTROLS.DropdownListMixin
       * @mixes SBIS3.CONTROLS.PickerMixin
       * @demo SBIS3.CONTROLS.Demo.MyDropdownList Простой пример работы контрола
       * @demo SBIS3.CONTROLS.Demo.MyDropdownListFilter Выпадающий список с фильтрацией
       * @ignoreOptions emptyHTML
       * @ignoreMethods setEmptyHTML
       * @control
       * @public
       * @cssModifier controls-DropdownList__withoutArrow Убрать стрелочку слева от выбранного текста.
       * @cssModifier controls-DropdownList__withoutCross Убрать крестик справа от выбранного текста.
       * @cssModifier controls-DropdownList__linkStyle Отобразить текст в шапке в виде ссылки.
       * @cssModifier controls-DropdownList__ellipsis Текст в шапке обрезается троеточием, если не умещается в контейнере
       */
      var DropdownList = Control.extend([PickerMixin, DSMixin, MultiSelectable, DataBindMixin, DropdownListMixin], /** @lends SBIS3.CONTROLS.DropdownList.prototype */{
         $protected: {
            _options: {
               /**
                * @cfg {String} Устанавливает шаблон отображения заголовка выпадающего списка.
                * @remark
                * Шаблон - это XHTML-файл с вёрсткой заголовка. Этот шаблон должен быть создан в компоненте в подпапке resources.
                * Так его можно использовать, как и любой другой шаблон, в разных компонентах.
                * Кроме шаблона отображения заголовка можно установить шаблон отображения элемента коллекции с помощью опции {@link itemTemplate}.
                * @example
                * Чтобы можно было использовать шаблон в компоненте и передать в опцию headTemplate, нужно выполнить следующее:
                * <ol>
                *    <li>Подключить шаблон в массив зависимостей компонента.</li>
                *    <li>Импортировать его в отдельную переменную.</li>
                *    <li>В сецкии $protected в подсекции _options создать опцию, значением которой передать шаблон (переменная из предыдущего шага).
                *       <pre>
                *          define('js!SBIS3.MyArea.MyComponent',
                *             [ // Массив зависимостей компонента
                *                ...
                *                'html!SBIS3.MyArea.MyComponent/resources/myHeadTpl' // Подключаем шаблон в массив зависимостей компонента
                *             ],
                *             function(..., myHeadTpl){ // Импортируем шаблон в отдельную переменную
                *                ...
                *                $protected: {
                *                   _options: {
                *                      ...
                *                      myHeadTemplate: myHeadTpl // Создаём новую опцию компонента, в которую передаём шаблон заголовка
                *                   }
                *                }
                *                ...
                *          });
                *       </pre>
                *    </li>
                *    <li>В вёрстке компонента в значение опции headTemplate передать значение опции с помощью инструкций шаблонизатора.
                *       <pre>
                *          <option name="headTemplate" type="ref">{{@it.myHeadTemplate}}</option>
                *       </pre>
                *    </li>
                * </ol>
                * Шаблон может быть любым. Например, такой шаблон:
                * <pre>
                *    <div class="docs-myHeadTemplate">
                *       <span class="docs-myHeadTemplate__span">Мой заголовок</span>
                *    </div>
                * </pre>
                * @editor ExternalComponentChooser
                * @see itemTemplate
                */
               headTemplate: dotTplFnHead,
               /**
                * @cfg {String} Устанавливает шаблон отображения элемента коллекции.
                * @remark
                * Шаблон - это XHTML-файл с вёрсткой элемента коллекции. Этот шаблон должен быть создан в компоненте в подпапке resources.
                * Так его можно использовать, как и любой другой шаблон, в разных компонентах.
                * Кроме шаблона отображения элемента коллекции можно установить шаблон отображения заголовка с помощью опции {@link headTemplate}.
                * Из шаблона можно получить доступ к записи с помощью инструкци шаблонизатора:
                * <pre>
                *    {{=it.title}} // получить значение поля title
                * </pre>
                * @example
                * Чтобы можно было использовать шаблон в компоненте и передать в опцию itemTemplate, нужно выполнить следующее:
                * <ol>
                *    <li>Подключить шаблон в массив зависимостей компонента.</li>
                *    <li>Импортировать его в отдельную переменную.</li>
                *    <li>В сецкии $protected в подсекции _options создать опцию, значением которой передать шаблон (переменная из предыдущего шага).
                *       <pre>
                *          define('js!SBIS3.MyArea.MyComponent',
                *             [ // Массив зависимостей компонента
                *                ...
                *                'html!SBIS3.MyArea.MyComponent/resources/myItemTpl' // Подключаем шаблон в массив зависимостей компонента
                *             ],
                *             function(..., myItemTpl){ // Импортируем шаблон в отдельную переменную
                *                ...
                *                $protected: {
                *                   _options: {
                *                      ...
                *                      myItemTemplate: myItemTpl // Создаём новую опцию компонента, в которую передаём шаблон элемента коллекции
                *                   }
                *                }
                *                ...
                *          });
                *       </pre>
                *    </li>
                *    <li>В вёрстке компонента в значение опции itemTemplate передать значение опции с помощью инструкций шаблонизатора.
                *       <pre>
                *          <option name="itemTemplate" type="ref">{{@it.myItemTemplate}}</option>
                *       </pre>
                *    </li>
                * </ol>
                * Шаблон может быть любым. Например, такой шаблон:
                * <pre>
                *    <div class="docs-myItemTemplate">
                *       {{=it.myField}}
                *       <span class="docs-myItemTemplate__span">Мой подтекст рядом с записью</span>
                *    </div>
                * </pre>
                * @editor ExternalComponentChooser
                * @see headTemplate
                */
               itemTemplate: dotTplFnForItem,
               /**
                * @cfg {String} Режим работы выпадающего списка
                * @remark
                * По умолчанию - 'hover'
                * Если задать 'click', то работа будет по клику
                */
               mode: 'hover',
               /**
                * @cfg {String} Текст заголовка
                * @translatable
                */
               text : '',
               /**
                * @cfg {boolean} Отображать Все элементы  в выпадающем списке (включая выбранный)
                */
               showSelectedInList : false,
               allowEmptyMultiSelection: false
            },
            _dotTplFn: dotTplFn,
            _text: null,
            _pickerText: null,
            _pickerListContainer: null,
            _pickerHeadContainer: null,
            _pickerFooterContainer: null,
            _pickerBodyContainer: null,
            _resetButton: null,
            _pickerResetButton: null,
            _defaultId: null,
            _buttonChoose : null,
            _buttonHasMore: null,
            _currentSelection: {},
            _hideAllowed : true,
            _changedSelectedKeys: [] //Массив ключей, которые были выбраны, но еще не сохранены в выпадающем списке
         },
         $constructor: function() {
            this._container.bind(this._options.mode === 'hover' ? 'mouseenter' : 'mouseup', this.showPicker.bind(this));
            this._publish('onClickMore');
         },
         init : function () {
            DropdownList.superclass.init.apply(this, arguments);
            if (!this._picker) {
               if (this._container.hasClass('controls-DropdownList__withoutCross')){
                  this._options.pickerClassName += ' controls-DropdownList__withoutCross';
               }
               this._initializePicker();
            }
         },
         _modifyOptions: function(opts) {
            opts.pickerClassName += ' controls-DropdownList__picker';
            opts.headTemplate = TemplateUtil.prepareTemplate(opts.headTemplate);
            return DropdownList.superclass._modifyOptions.call(this, opts);
         },
         _setPickerContent : function () {
            var self = this,
                pickerContainer = this._getPickerContainer(),
                header = pickerContainer.find('.controls-DropdownList__header'),
                cssModificators = ['controls-DropdownList__withoutArrow',
                                   'controls-DropdownList__withoutCross',
                                   'controls-DropdownList__linkStyle'];
            //Заполняем опцию className навешенными css-модификаторами
            for (var i = 0, l = cssModificators.length; i < l; i++){
               if (this.getContainer().hasClass(cssModificators[i]) && this._options.className.indexOf(cssModificators[i]) < 0){
                  this._options.className += ' ' + cssModificators[i];
               }
            }
            // Собираем header через шаблон, чтобы не тащить стили прикладников
            header.append(dotTplFn(this._options));
            this._setVariables();
            this.reload();
            this._bindItemSelect();
            this._pickerResetButton.click(function() {
               self.removeItemsSelectionAll();
               self.hidePicker();
            });
            if(this._options.mode === 'hover') {
               this._pickerHeadContainer.bind('mouseleave', this._pickerMouseLeaveHandler.bind(this, true));
               this._pickerBodyContainer.bind('mouseleave', this._pickerMouseLeaveHandler.bind(this, false));
            }
            else if (this._options.mode === 'click'){
               this._pickerHeadContainer.click(this.hidePicker.bind(this));
            }
         },
         _buildTplArgs: function(item) {
            return {
               item: item,
               displayField: this._options.displayField,
               multiselect: this._options.multiselect
            };
         },
         setItems: function () {
            DropdownList.superclass.setItems.apply(this, arguments);
            /* После установки нового набора элементов, надо сбросить ранее выбранные */
            this.removeItemsSelectionAll();
         },
         setSelectedKeys : function(idArray){
            //Если у нас есть выбранные элементы, нцжно убрать DefaultId из набора
            //Т.к. ключи могут отличаться по типу (0 !== '0'), то придется перебирать массив самостоятельно.
            if (idArray.length > 1) {
               for (var i = 0; i < idArray.length; i++) {
                  if (idArray[i] == this._defaultId){
                     idArray.splice(i, 1);
                     break;
                  }
               }
            }
            DropdownList.superclass.setSelectedKeys.call(this, idArray);
            this._updateCurrentSelection();
         },
         _updateCurrentSelection: function(){
            var keys;
            this._currentSelection = {};
            keys = this.getSelectedKeys();
            for (var i = 0, len = keys.length; i < len; i++ ) {
               this._currentSelection[keys[i]] = true;
            }
         },
         _initializePicker: function() {
            DropdownList.superclass._initializePicker.apply(this, arguments);
            // Предотвращаем всплытие focus и mousedown с контейнера меню, т.к. это приводит к потере фокуса
            this._picker.getContainer().on('mousedown focus', this._blockFocusEvents);
         },
         _blockFocusEvents: function(event) {
            event.preventDefault();
            event.stopPropagation();
         },
         _getCurrentSelection: function(){
            var keys = [];
            for (var i in this._currentSelection) {
               if (this._currentSelection.hasOwnProperty(i) && this._currentSelection[i]) {
                  //Если ключи были number, они станут здесь строкой
                  keys.push(i);
               }
            }
            return keys;
         },
         //Проверка на нестрогое равенство массивов
         //TODO это дублЬ! нужно вынести в хелпер!!!
         _isSimilarArrays : function(arr1, arr2){
            if (arr1.length === arr2.length) {
               for (var i = 0; i < arr1.length; i ++) {
                  if (arr1[i] != arr2[i]) {
                     return false;
                  }
               }
               return true;
            }
            return false;
         },
         _clickItemHandler : function (e) {
            var  self = this,
                row = $(e.target).closest('.' + self._getItemClass()),
                  selected;
            if (row.length && (e.button === ($ws._const.browser.isIE8 ? 1 : 0))) {

               //Если множественный выбор, то после клика скрыть менюшку можно только по кнопке отобрать
               this._hideAllowed = !this._options.multiselect;
               if (this._options.multiselect && !$(e.target).hasClass('controls-ListView__defaultItem') /* && $(e.target).hasClass('js-controls-DropdownList__itemCheckBox')*/) {
                  var changedSelectionIndex = Array.indexOf(this._changedSelectedKeys, row.data('id'));
                  if (changedSelectionIndex < 0){
                     this._changedSelectedKeys.push(row.data('id'));
                  }
                  else{
                     this._changedSelectedKeys.splice(changedSelectionIndex, 1);
                  }
                  this._buttonChoose.getContainer().toggleClass('ws-hidden', !this._changedSelectedKeys.length);
                  selected =  !row.hasClass('controls-DropdownList__item__selected');
                  row.toggleClass('controls-DropdownList__item__selected', selected);
                  this._currentSelection[row.data('id')] = selected;
               } else {
                  self.setSelectedKeys([row.data('id')]);
                  self.hidePicker();
               }
            }
         },
         _dblClickItemHandler : function(e){
            e.stopImmediatePropagation();
            var  row = $(e.target).closest('.' + this._getItemClass());
            if (row.length && (e.button === ($ws._const.browser.isIE8 ? 1 : 0))) {
               if (this._options.multiselect) {
                  this._hideAllowed = true;
                  this.setSelectedKeys([row.data('id')]);
                  this.hidePicker();
               }
            }

         },
         showPicker: function(ev) {
            if (this.isEnabled()) {
               //Если мы не в режиме хоевера, то клик по крестику нужно пропустить до его обработчика
               if (this._options.mode !== 'hover' && $(ev.target).hasClass('controls-DropdownList__crossIcon')) {
                  return true;
               }
               var items = this._getPickerContainer().find('.controls-DropdownList__item');
               this._updateCurrentSelection();
               this._hideAllowed = true;
               this._changedSelectedKeys = [];
               //Восстановим выделение по элементам
               for (var i = 0 ; i < items.length; i++) {
                  $(items[i]).toggleClass('controls-DropdownList__item__selected', !!this._currentSelection[$(items[i]).data('id')]);
               }
               DropdownList.superclass.showPicker.apply(this, arguments);
               this._getPickerContainer().toggleClass('controls-DropdownList__equalsWidth', this._pickerListContainer[0].offsetWidth === this._pickerHeadContainer[0].offsetWidth);
               if (this._buttonChoose) {
                  this._buttonChoose.getContainer().addClass('ws-hidden');
               }
            }
         },
         hide: function(){
            if (this._hideAllowed) {
               DropdownList.superclass.hide.apply(this, arguments);
            }
         },
         _getItemClass: function(){
            return 'controls-DropdownList__item';
         },
         _getPickerContainer: function() {
            if (!this._picker) {
               this._initializePicker();
            }
            return this._picker.getContainer();
         },
         _pickerMouseLeaveHandler: function(fromHeader, e) {
            if(this._hideAllowed && !$(e.toElement || e.relatedTarget).closest('.controls-DropdownList__' + (fromHeader ? 'body' : 'header')).length) {
               this.hidePicker();
            }
         },
         _drawItemsCallback: function() {
            //Надо вызвать просто для того, чтобы отрисовалось выбранное значение/значения
            this._drawSelectedItems(this._options.selectedKeys)

         },
         _dataLoadedCallback: function() {
            DropdownList.superclass._dataLoadedCallback.apply(this, arguments);
            var item =  this._dataSet.at(0);
            if (item) {
               this._defaultId = item.getId();
               if (this._buttonHasMore) {
                  var needShowHasMoreButton = this._hasNextPage(this._dataSet.getMetaData().more, 0);
                  if (!this._options.multiselect){
                     this._buttonHasMore.getContainer().closest('.controls-DropdownList__buttonsBlock').toggleClass('ws-hidden', !needShowHasMoreButton);
                  }
                  else{
                     this._buttonHasMore[needShowHasMoreButton ? 'show' : 'hide']();
                  }
               }
            }
         },
         _setVariables: function() {
            var pickerContainer = this._getPickerContainer(),
               self = this;

            this._text = this._container.find('.controls-DropdownList__text');
            this._selectedItemContainer = this._container.find('.controls-DropdownList__selectedItem');
            this._resetButton = this._container.find('.controls-DropdownList__crossIcon');
            this._resetButton.click(function() {
               self.removeItemsSelectionAll();
               self.hidePicker();
            });
            this._pickerText  = pickerContainer.find('.controls-DropdownList__text');
            this._pickerResetButton = pickerContainer.find('.controls-DropdownList__crossIcon');
            this._pickerListContainer = pickerContainer.find('.controls-DropdownList__list');
            this._pickerBodyContainer = pickerContainer.find('.controls-DropdownList__body');
            this._pickerHeadContainer = pickerContainer.find('.controls-DropdownList__header');
            this._pickerFooterContainer = pickerContainer.find('.controls-DropdownList__footer');
            this._buttonHasMore = this._picker.getChildControlByName('DropdownList_buttonHasMore');
            this._buttonHasMore.subscribe('onActivated', function(){
               self._notify('onClickMore');
               self.hidePicker();
            });
            if (this._options.multiselect) {
               this._buttonChoose = this._picker.getChildControlByName('DropdownList_buttonChoose');
               this._buttonChoose.subscribe('onActivated', function(){
                  var currSelection = self._getCurrentSelection();
                  self._hideAllowed = true;
                  if (!self._isSimilarArrays(self.getSelectedKeys(), currSelection)) {
                     self.setSelectedKeys(currSelection);
                  }
                  self.hidePicker();
               });
            }
            if (this._options.showSelectedInList) {
               pickerContainer.addClass('controls-DropdownList__showSelectedInList');
            }
         },
         _addItemAttributes: function (container, item) {
            /*implemented from DSMixin*/
            var addClass = 'controls-DropdownList__item';
            DropdownList.superclass._addItemAttributes.apply(this, arguments);
            if (item.getId() == this.getDefaultId()) {
               container.addClass('controls-ListView__defaultItem');
            }

            if (this._options.multiselect) {
               addClass += ' controls-DropdownList__multiselect';
            }
            container.addClass(addClass);
         },

         _drawSelectedItems : function(id) {
            var textValues = [],
                len = id.length,
                self = this,
                record,
                pickerContainer,
                def;

            if(len) {
               def = new $ws.proto.Deferred();

               if(this._dataSet) {
                  for(var i = 0; i < len; i++) {
                     record = this._dataSet.getRecordByKey(id[i]);
                     if (record){ //После установки новых данных, не все ключи останутся актуальными
                        textValues.push(record.get(this._options.displayField));
                     }
                  }
                  def.callback(textValues);
               } else {
                  //TODO переделать, когда БЛ научится отдавать несколько записей при чтении
                  this._dataSource.read(id[0]).addCallback(function(record) {
                     def.callback([record.get(self._options.displayField)]);
                  })
               }

               def.addCallback(function(textValue) {
                  pickerContainer = self._getPickerContainer();
                  if (!self._options.multiselect) {
                     pickerContainer.find('.controls-DropdownList__item__selected').removeClass('controls-DropdownList__item__selected');
                     pickerContainer.find('[data-id="' + id[0] + '"]').addClass('controls-DropdownList__item__selected');
                  }
                  self.setText(textValue.join(', '));
                  if (!self._pickerText.length){ //Если у нас собственный headTpl
                     var headTpl = MarkupTransformer(TemplateUtil.prepareTemplate(self._options.headTemplate.call(self, self._options)))();
                     self._pickerHeadContainer.html(headTpl);
                     self._selectedItemContainer.html(headTpl);
                  }
                  if(id[0] === self._defaultId){
                     self.getContainer().addClass('controls-DropdownList__hideCross');
                     self._getPickerContainer().addClass('controls-DropdownList__hideCross');
                     self._setResetButtonVisibility(true);
                  }else{
                     self.getContainer().removeClass('controls-DropdownList__hideCross');
                     self._getPickerContainer().removeClass('controls-DropdownList__hideCross');
                     self._setResetButtonVisibility(false);
                  }

               });
            }
         },
         /**
          * Получить ключ элемента для выбора "по умолчанию"
          * @returns {*|String|Number}
          */
         getDefaultId: function() {
            return this._defaultId;
         },
         /**
          * Установить текст в заголовок
          * @param text
          */
         setText: function(text) {
            if(typeof text === 'string') {
               this._options.text = text;
               this._text.text(text);
               this._pickerText.text(text);
               this._notifyOnPropertyChanged('text');
            }
         },
         /**
          * Получить значение переменной text
          * @returns {String}
          */
         getText: function() {
            return this._options.text;
         },
         _setResetButtonVisibility: function(show) {
            this._resetButton.toggleClass('ws-hidden', show);
            this._pickerResetButton.toggleClass('ws-hidden', show);
         },
         _getItemsContainer : function () {
            return this._pickerListContainer;
         },
         _setPickerConfig: function () {
            var hasContainerArrow = !this.getContainer().hasClass('controls-DropdownList__withoutArrow');
            return {
               corner: 'tl',
               verticalAlign: {
                  side: 'top',
                  offset: -2
               },
               horizontalAlign: {
                  side: 'left',
                  offset: hasContainerArrow ? -2 : -6
               },
               //Если мы не в ховер-моде, нужно отключить эту опцию, чтобы попап после клика сразу не схлапывался
               closeByExternalOver: this._options.mode === 'hover' && !this._options.multiselect,
               closeByExternalClick : true,
               activableByClick: false,
               targetPart: true,
               template : MarkupTransformer(dotTplFnPicker)({
                  'multiselect' : this._options.multiselect,
                  'footerTpl' : this._options.footerTpl
               })
            };
         },
         //Переопределяю, чтобы элементы чистились в пикере
         _clearItems : function() {
            if (this._picker) {
               DropdownList.superclass._clearItems.call(this, this._pickerListContainer);
            }
         },
         destroy : function(){
            if (this._buttonChoose) {
               this._buttonChoose.destroy();
            }
            if (this._buttonHasMore) {
               this._buttonHasMore.destroy();
            }
            DropdownList.superclass.destroy.apply(this, arguments);
         }
      });

      return DropdownList;
   });
