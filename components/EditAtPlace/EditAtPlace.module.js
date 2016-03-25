define('js!SBIS3.CONTROLS.EditAtPlace',
   ['js!SBIS3.CORE.CompoundControl',
      'js!SBIS3.CONTROLS.TextBox',
      'js!SBIS3.CONTROLS.PickerMixin',
      'js!SBIS3.CORE.Dialog',
      'js!SBIS3.CONTROLS.EditAtPlaceMixin',
      'js!SBIS3.CONTROLS.Utils.HtmlDecorators/DateFormatDecorator',
      'html!SBIS3.CONTROLS.EditAtPlace'],
   function (CompoundControl, TextBox, PickerMixin, Dialog, EditAtPlaceMixin, DateFormatDecorator, dotTplFn) {
      'use strict';
      /**
       * @class SBIS3.CONTROLS.EditAtPlace
       * @extends SBIS3.CONTROLS.CompoundControl
       * @control
       * @public
       * @category Inputs
       * @mixes SBIS3.CONTROLS.PickerMixin
       * @mixes SBIS3.CONTROLS.EditAtPlaceMixin
       * @author Крайнов Дмитрий Олегович
       * @cssModifier controls-EditAtPlace__ellipsis Текстовое поле обрезается троеточием, если не умещается в контейнере
       */

      var EditAtPlace = CompoundControl.extend([PickerMixin, EditAtPlaceMixin], /** @lends SBIS3.CONTROLS.EditAtPlace.prototype */{
         _dotTplFn: dotTplFn,
         _aliasForContent: 'editorTpl',
         $protected: {
            _textField: null,
            _okButton: null,
            _oldText: '',
            _requireDialog: false,
            _dateDecorator: {
               decorator: null,
               mask: 'DD.MM.YY'
            },
            _options: {
               /**
                * @cfg {String} Текст в поле ввода
                * @example
                * <pre>
                *     <option name="text">При нажатии на этот текст его можно будет редактировать</option>
                * </pre>
                * @see setText
                * @see getText
                */
               text: '',
               /* @cfg {String} Текст подсказки внутри редактирования
                * @remark
                * Данный текст отображается внутри поля до момента получения фокуса 
                * и как текст по нажатию на который начнется редактирование
                * @example
                * <pre>
                *     <option name="placeholder">Фамилия</option>
                * </pre>
                * @see setPlaceholder
                */
               placeholder: '',
               /**
                * Компонент которым будет редактируется текст
                * @type {String}
                */
               editorTpl: '<component data-component="SBIS3.CONTROLS.TextBox"></component>',
               /**
                * Будет ли многострочным редактируемый текст
                * Если указано, текст будет переноситься, убираясь в ширину контейнера
                * @type {Boolean}
                */
               multiline: false
            }
         },

         $constructor: function () {
            this._publish('onCancel', 'onApply', 'onShowEditor');
            var self = this;
            this._textField = $('.controls-EditAtPlace__textField', this._container.get(0));
            this._textField.bind('click', function () {
               self._clickHandler();
            });
            /*FixMe: придрот, выпилить когда будет номральный CompoundControl*/
            this._container.removeClass('ws-area');
            
            //TODO: Декораторы не должны разбираться тут (ждем virtualDOM'a) 
            var decorators = this._container.attr('decorators');
            if (decorators && decorators.indexOf('format:') !== -1) {
               decorators = decorators.split('format:');
               if (decorators.length > 1){
                  this._dateDecorator.mask = decorators[1];
               }
            }

            this.subscribe('onTextChange', function(event, text){
               self._requireDialog = text != self._oldText;
            });

            if ($(this._options.editorTpl).attr('data-component') == 'SBIS3.CONTROLS.TextArea'){
               $(this._container.children()[0]).addClass('controls-EditAtPlace__textAreaWrapper');
            }

            $('.js-controls-EditAtPlace__editor', this._container.get(0)).bind('keydown', function (e) {
               self._keyPressHandler(e);
            });
         },

         _saveOldText: function () {
            this._oldText = this._options.text;
         },

         _setOldText: function () {
            this.setText(this._oldText);
         },

         _clickHandler: function () {
            if (this.isEnabled()) {
               this._saveOldText();
               if (this._options.editInPopup) {
                  this.showPicker();
                  this._oldText = this._options.text;
               } else {
                  this.setInPlaceEditMode(true);
                  this._addControlPanel(this._container.parent());
               }
               if (this._options.editInPopup) {
                  if ($('.js-controls-TextBox__field', this._picker._container).get(0)) {
                     $('.js-controls-TextBox__field', this._picker._container).focus();
                  } else if ($('.controls-TextArea__inputField', this._picker._container).get(0)) {
                     $('.controls-TextArea__inputField', this._picker._container).focus();
                  }
               } else {
                  if ($('.js-controls-TextBox__field', this._container).get(0)) {
                     $('.js-controls-TextBox__field', this._container).focus();
                  } else if ($('.controls-TextArea__inputField', this._container).get(0)) {
                     $('.controls-TextArea__inputField', this._container).focus();
                  }
               }
            }
         },

         _setClickHandler: function (newHandler) {
            if (typeof newHandler == 'function') {
               this._textField.unbind('click');
               this._textField.bind('click', newHandler);
               this._clickHandler = newHandler;
            }
         },

         _setKeyPressHandler: function(newHandler){
            if (typeof newHandler == 'function') {
               var editors = $('.js-controls-EditAtPlace__editor', this._container.get(0));
               editors.unbind('keydown', this._keyPressHandler);
               editors.bind('keydown', newHandler);
               this._keyPressHandler = newHandler;
            }
         },

         _setPickerContent: function () {
            var self = this;
            this._picker.getContainer().addClass('controls-EditAtPlace__editorOverlay');
            this._picker.reviveComponents();
            this._addControlPanel(this._picker._container);
            this._picker._container.bind('keydown', function (e) {
               self._keyPressHandler(e);
            });
         },

         /**
          * Установить режим редактирования по месту
          * @param {Boolean} inPlace 
          * true - отображение только редактора
          * false - отображение текста при клике по которому отображается редактор
          * @see displayAsEditor
          */
         setInPlaceEditMode: function (inPlace) {
            this._options.displayAsEditor = inPlace;
            this._container.toggleClass('controls-EditAtPlace__editorHidden', !inPlace).toggleClass('controls-EditAtPlace__fieldWrapperHidden', inPlace);
            if (inPlace) {
               this._notify('onShowEditor');
            }
         },

         _cancelEdit: function () {
            if (this._options.editInPopup) {
               this._requireDialog = false;
               this._picker.hide();
            } else {
               this._removeControlPanel();
               this.setInPlaceEditMode(false);
            }
            this._setOldText();
            this._notify('onCancel');
         },

         _getEditTemplate: function(){
            return this._options.editorTpl;
         },

         /**
          * Установить текст внутри поля. Текст установиться и в редактор и в отображение.
          * @param {String} text Текст для установки.
          * @see text
          * @see getText
          */
         setText: function (text) {
            var oldText = this._options.text;
            this._options.text = text || '';
            if (oldText !== this._options.text) {
               this._notify('onTextChange', this._options.text);
            }
            
            //TODO: Декоратор даты, временно применяется здесь до лучших времен (ждем virtualDOM'a) 
            if (text instanceof(Date)){
               if (!this._dateDecorator.decorator) {
                  this._dateDecorator.decorator = new DateFormatDecorator();
               }
               text = this._dateDecorator.decorator.apply(text, this._dateDecorator.mask);
            }
            text = $ws.helpers.escapeHtml(text);
            this._drawText(text);
         },
         /**
          * Получить текстовое значение контрола
          * @returns {String} Текст - значение поля
          * @example
          * @see text
          * @see setText
          */
         getText: function () {
            return this._options.text;
         },

         _drawText: function(text){
            if (!text){
               text = '<span class="controls-EditAtPlace__placeholder">' + this._options.placeholder + '</span>';
            }
            this._textField.html(text || '&nbsp;');
         }

      });

      return EditAtPlace;
   });