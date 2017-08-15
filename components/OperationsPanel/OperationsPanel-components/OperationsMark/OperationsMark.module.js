/**
 * Created by as.suhoruchkin on 02.04.2015.
 */
define('js!SBIS3.CONTROLS.OperationsMark', [
   'js!SBIS3.CONTROLS.MenuLink',
   'js!SBIS3.CONTROLS.CheckBox',
   'Core/core-instance',
   'i18n!SBIS3.CONTROLS.OperationsMark'
], function(MenuLink, CheckBox, cInstance) {
   /**
    * Операции выделения.
    *
    * SBIS3.CONTROLS.OperationsMark
    * @class SBIS3.CONTROLS.OperationsMark
    * @extends SBIS3.CONTROLS.MenuLink
    * @author Сухоручкин Андрей Сергеевич
    * @public
    */
   /*TODO Пока что динамическое создание CheckBox, пока не слиты Control и CompaundControl!!!*/
   var OperationsMark = MenuLink.extend(/** @lends SBIS3.CONTROLS.OperationsMark.prototype */{
      $protected: {
         _options: {
             /**
              * @cfg {String} Текст на кнопке
              * @example
              * <pre>
              *     <option name="caption">Операции отметки</option>
              * </pre>
              * @translatable
              */
            caption: undefined,
            /**
             * @cfg {Function} Функция рендеринга заголовка кнопки, которой аргументом приходит
             * количество выделенных записей в связанном представлении данных
             */
            captionRender: undefined,
             /**
              * @noShow
              */
            linkedView: undefined,
             /**
              * @typedef {Object} OperationsMarkItems
              * @property {String} name Имя кнопки операции.
              * @property {String} title Заголовок кнопки операции.
              * @property {String} handler Имя функции обработчика клика по пункту меню операций отметки.
              * @translatable title
              */
             /**
              * @cfg {OperationsMarkItems[]} Операции отметки.
              */
            items: [
               { name: 'selectAll', title: rk('Все') },
               { name: 'selectCurrentPage', title: rk('Всю страницу') },
               { name: 'removeSelection', title: rk('Снять') },
               { name: 'invertSelection', title: rk('Инвертировать') }
            ],
            /**
             * @cfg {Boolean} Использовать функционал выбора всех записей
             */
            useSelectAll: true,
            /**
             * @cfg {Boolean} При отметке всех записей, выделять записи из открытых папок
             * @deprecated
             */
            deepReload: false,
            idProperty: 'name',
            allowChangeEnable: false
         },
         _useSelectAll: false,
         _markCheckBox: undefined,
         _isInternalCheckedChange: false
      },
      $constructor: function() {
         this._createMarkCheckBox();
         this._setCaptionRender();
      },
      init: function() {
         OperationsMark.superclass.init.call(this);
         this.subscribe('onMenuItemActivate', this._onMenuItemActivate.bind(this));
      },
      _parseItem: function(item) {
         if (item.handler) {
            this[item.name] = item.handler;
         }
      },
      /**
       * Добавление операции
       * @param {Object} item Операция.
       */
      addItem: function(item) {
         this._parseItem(item);
         OperationsMark.superclass.addItem.apply(this, [item]);
      },
      onSelectedItemsChange: function() {
         this._updateMark();
      },
      /**
       * Метод установки или замены связанного представления данных.
       * @param {SBIS3.CONTROLS.ListView} linkedView
       */
      setLinkedView: function(linkedView) {
         var self = this;
         if (linkedView && cInstance.instanceOfMixin(linkedView, 'SBIS3.CONTROLS.MultiSelectable')) {
            this._options.linkedView = linkedView;
            this._useSelectAll = linkedView._options.useSelectAll;
            this.once('onPickerOpen', function() {
               //Если есть бесконечный скролл то показываем кнопку "Все", иначе показываем кнопку "Всю страницу"
               self.getItemInstance('selectCurrentPage').toggle(!linkedView._options.infiniteScroll);
               self.getItemInstance('selectAll').toggle(linkedView._options.infiniteScroll);
               self.getPicker().getContainer().find('.controls-MenuLink__header').toggleClass('ws-hidden', !self._options.caption);
            });
            this._updateMark();
         }
      },

      _onMenuItemActivate: function(e, id) {
         if (this[id]) {
            this[id].apply(this);
         }
      },
      _onCheckedChange: function(e, checked) {
         if (!this._isInternalCheckedChange) {
            this._setSelectionOnCheckedChange(checked);
         }
      },

      _setSelectionOnCheckedChange: function(checked) {
         if (checked) {
            this.getItems().getRecordById('selectAll') ? this.selectAll() : this.selectCurrentPage();
         } else {
            this.removeSelection();
         }
      },

      //Необходимо разграничивать изменение состояния CheckBox из кода и при клике по нему, т.к. изменение состояния CheckBox
      //приводит к изменению набора выделенных записей, а изменение набора выделенных записей приводит к изменению состояния CheckBox.
      //Чтобы не получить зацикливание, при изменении состояния CheckBox из кода, поставим флаг, что это изменение не дожно привести
      //к изменению набора выделенных записей.
      _setCheckedInternal: function(checked) {
         this._isInternalCheckedChange = true;
         this._markCheckBox.setChecked(checked);
         this._isInternalCheckedChange = false;
      },

      _updateMarkCheckBox: function() {
         var view = this._options.linkedView,
            //TODO Подумать что делать если нет _dataSet
            recordsCount = view.getItems() ? view.getItems().getCount() : 0,
            selectedCount = view.getSelectedKeys().length;
         this._setCheckedInternal(selectedCount === recordsCount && recordsCount ? true : selectedCount ? null : false);
      },
      _updateMarkButton: function() {
         if (!this._dataSet) {
            this.reload();
         }
         var hasMarkOptions = !!this._dataSet.getCount(),
            selectedCount,
            caption;
         if (hasMarkOptions) {
            selectedCount = this._options.linkedView.getSelectedKeys().length;
            caption = this._options.captionRender ? this._options.captionRender(selectedCount) : this._options.caption;
            this.setCaption(caption);
         }
         this.setVisible(hasMarkOptions);
      },
      _captionRender: function(selectedCount) {
         return selectedCount ? rk('Отмечено') + '(' + selectedCount + ')' : rk('Отметить');
      },
      _setCaptionRender: function() {
         if (typeof this._options.caption !== 'string' && !this._options.captionRender) {
            this._options.captionRender = this._captionRender;
         }
      },
      _updateMark: function() {
         this._updateMarkButton();
         this._updateMarkCheckBox();
      },
      /**
       * Выбрать все элементы.
       */
      selectAll: function() {
         var self = this;
         if (this._useSelectAll) {
            this._options.linkedView.setSelectedAllNew(true);
         } else if (this._options.useSelectAll) {
            //Заблокируем кнопку при отметке 1000 записей, а после выполнения отметки вернём её в исходное состояние.
            this.setAllowChangeEnable(true);
            this.setEnabled(false);
            this._options.linkedView.setSelectedAll(this._options.deepReload).addBoth(function() {
               self.setEnabled(true);
               self.setAllowChangeEnable(false);
            });
         } else {
            this._options.linkedView.setSelectedItemsAll();
         }
      },
      /**
       * Выбрать все видимые элементы.
       */
      selectCurrentPage: function() {
         this._options.linkedView.setSelectedItemsAll();
      },
      /**
       * Снять выделение со всех элементов.
       */
      removeSelection: function() {
         if (this._useSelectAll) {
            this._options.linkedView.setSelectedAllNew(false);
         } else {
            this._options.linkedView.setSelectedKeys([]);
         }
      },
      /**
       * Инвертировать выделение всех элементов.
       */
      invertSelection: function() {
         if (this._useSelectAll) {
            this._options.linkedView.toggleSelectedAll();
         } else {
            this._options.linkedView.toggleItemsSelectionAll();
         }
      },
      _createMarkCheckBox: function() {
         if (!this._markCheckBox) {//TODO костыль для ЭДО, чтоб не создавалось 2 раза
            this._markCheckBox = new CheckBox({
               threeState: true,
               parent: this,
               element: $('<span>').insertBefore(this._container),
               className: 'controls-OperationsMark-checkBox js-controls-operationsPanel__action',
               handlers: {
                  onCheckedChange: this._onCheckedChange.bind(this)
               }
            });
         }
      }
   });

   return OperationsMark;
});
