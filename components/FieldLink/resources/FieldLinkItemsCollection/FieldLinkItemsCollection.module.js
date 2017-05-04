/**
 * Created by am.gerasimov on 06.10.2015.
 */
define('js!SBIS3.CONTROLS.FieldLinkItemsCollection', [
      'js!SBIS3.CORE.CompoundControl',
      'js!SBIS3.CONTROLS.ItemsControlMixin',
      'js!SBIS3.CONTROLS.PickerMixin',
      'tmpl!SBIS3.CONTROLS.FieldLinkItemsCollection',
      'tmpl!SBIS3.CONTROLS.FieldLinkItemsCollection/defaultItemTemplate',
      'tmpl!SBIS3.CONTROLS.FieldLinkItemsCollection/defaultItemContentTemplate',
      'Core/helpers/collection-helpers',
      'Core/core-instance',
      'Core/helpers/functional-helpers'
   ], function(CompoundControl, DSMixin, PickerMixin, dotTplFn, defaultItemTemplate, defaultItemContentTemplate, colHelpers, cInstance, fHelpers) {

      'use strict';

      /**
       * Контрол, отображающий набор элементов поля связи.
       * @class SBIS3.CONTROLS.FieldLinkItemsCollection
       * @extends SBIS3.CORE.CompoundControl
       */

      var FieldLinkItemsCollection =  CompoundControl.extend([DSMixin, PickerMixin], {
         _dotTplFn: dotTplFn,
         $protected: {
            _options: {
               _defaultItemContentTemplate: defaultItemContentTemplate,
               _defaultItemTemplate: defaultItemTemplate,
               _canServerRender: true
            },
            _parentFieldLink: undefined
         },

         $constructor: function() {
            this._publish('onCrossClick', 'onItemActivate', 'onShowPicker', 'onClosePicker');

            /* Запомним контейнер поля связи */
            this._parentFieldLink = this.getParent();
            this._options._buildTplArgs = this._options._buildTplArgs.callNext(this._buildTplArgs);
         },

         _onClickHandler: function(e) {
            FieldLinkItemsCollection.superclass._onClickHandler.apply(this, arguments);
            var $target = $(e.target),
                deleteAction = false,
                itemContainer, id;

            itemContainer = $target.closest('.controls-FieldLink__item', this._container[0]);
            if (itemContainer.length) {
               deleteAction = $target.hasClass('controls-FieldLink__item-cross');
               id = this._getItemProjectionByHash(itemContainer.data('hash')).getContents().getId();
               this._notify(deleteAction ? 'onCrossClick' : 'onItemActivate', id);
            }
         },

         /**
          * Аргументы для шаблона
          */
         _buildTplArgs: function(cfg, newCfg) {
            newCfg.itemsCount = this._getItemsProjection().getCount();
            /* При отображении выбранных элементов в выпадающем списке надо их сортировать,
               чтобы визуально казалось, что последние выбранные будут вверху,
               делается это с помощью аттрибута order (на css), чтобы ускорить отрисовку,
               order навешивается в шаблоне. Для отображения в самом поле связи это не требуется,
               поэтому добавляю проверку на видимость выпадающего списка */
            newCfg.needSort = this.isPickerVisible();
            /* Надо рисовать подсказку для поля связи, если используется дефолтный шаблон,
               в случае прикладного, там может быть вёрстка, и в подсказку её класть нельзя */
            newCfg.needTitle = !this._options.itemContentTpl;
            return newCfg;
         },

         /**
          * Для обратной совместимости, если шаблон задают как itemTemplate,
          * то в качестве базового шаблона всё равно должен использоваться defaultItemTemplate
          */
         _getItemTemplate: function() {
            return this._options._defaultItemTemplate;
         },

         _setEnabled: function () {
            var items = this.getItems();
            /* Т.к. при изменении состояния поля связи, для всех элементов появляются/исчезают крестики удаления,
               то надо вызывать перерисовку элементов, чтобы правильно проставилась ширина */
            this._clearItems();
            FieldLinkItemsCollection.superclass._setEnabled.apply(this, arguments);

            if (items && items.getCount()) {
               this.redraw();
            }
         },

         _getItemsContainer: function() {
            return this.isPickerVisible() ? this._picker.getContainer() : this._container;
         },

         setItems: function(list) {
            if (list) {
               /* RecordSet клонировать нельзя, иначе записи склонируются с ключевым полем
                  рекордсета, хотя оно могло быть изменено */
               if (!cInstance.instanceOfModule(list, 'WS.Data/Collection/RecordSet')) {
                  list = list.clone();
               } else {
                  list.setEventRaising(false, false);
               }
            } else {
               list = [];
            }
            FieldLinkItemsCollection.superclass.setItems.call(this, list);
         },

         /* Контрол не должен принимать фокус ни по клику, ни по табу */
         _initFocusCatch: fHelpers.nop,
         canAcceptFocus: fHelpers.nop,

         /* Скрываем именно в синхронном drawItemsCallback'e,
            иначе пикер скрывается асинхронно и моргает */
         _drawItemsCallbackSync: function() {
            if (this.isPickerVisible() && !this.getItems().getCount()) {
               this.hidePicker();
            }
         },

         showPicker: function() {
            /* Чтобы не было перемаргивания в задизейбленом состоянии,
               просто вешаем класс ws-invisible */
            if (this.isEnabled()) {
               this._clearItems();
            } else {
               this.getContainer().addClass('ws-invisible');
            }
            FieldLinkItemsCollection.superclass.showPicker.apply(this, arguments);
            this.redraw();
            this._picker.recalcPosition(true);
         },

         _setPickerContent: function () {
            this._picker.getContainer().on('click', '.controls-FieldLink__item', this._onClickHandler.bind(this));
            /* Зачем сделано:
               Не надо, чтобы пикер поля связи вызывал перерасчёт размеров,
               т.к. никаких расчётов при его показе не происходит, а просто отрисовываются элементы */
            this._picker._notifyOnSizeChanged = fHelpers.nop;
         },

         _setPickerConfig: function () {
            var self = this,
                fieldLinkContainer = this._parentFieldLink.getContainer(),
                pickerClasses = ['controls-FieldLink__picker'],
                cssModifiers = [
                   'controls-FieldLink__itemsEdited',
                   'controls-FieldLink__itemsBold',
                   'controls-FieldLink__big-fontSize'
                ];

            cssModifiers.forEach(function(value) {
               if (fieldLinkContainer.hasClass(value)) {
                  pickerClasses.push(value);
               }
            });

            return {
               corner: 'bl',
               target: fieldLinkContainer,
               opener: this._parentFieldLink,
               closeByExternalClick: true,
               targetPart: true,
               cssClassName: pickerClasses.join(' '),
               activableByClick: false,
               verticalAlign: {
                  side: 'top'
               },
               horizontalAlign: {
                  side: 'left'
               },
               handlers: {
                  /* Надо сообщить о закрытии пикера полю связи, а так же перерисовать элементы, но только после закрытия */
                  onClose: function() {
                     if (!self.isEnabled()) {
                        self.getContainer().removeClass('ws-invisible');
                     }
                     setTimeout(self.redraw.bind(self), 0);
                  },

                  onShow: function() {
                     var pickerContainer = self._picker.getContainer(),
                         pickerWidth = self._parentFieldLink.getContainer()[0].offsetWidth - (pickerContainer.outerWidth() - pickerContainer.width());

                     pickerContainer[0].style.maxWidth = pickerWidth + 'px';
                     pickerContainer[0].style.minWidth = pickerWidth + 'px';
                  }
               }
            };
         },

         destroy: function() {
            if (this._picker) {
               this._picker.getContainer().off('click');
            }
            FieldLinkItemsCollection.superclass.destroy.apply(this, arguments);
         }
      });

      return FieldLinkItemsCollection;

   });
