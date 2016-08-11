/**
 * Created by ps.borisov on 21.05.2016.
 */
define('js!SBIS3.CONTROLS.RichEditor',
   [
      'js!SBIS3.CONTROLS.RichTextArea',
      'html!SBIS3.CONTROLS.RichEditor',
      'js!SBIS3.CONTROLS.RichEditorToolbar'
   ], function(RichTextArea, dotTplFn, Toolbar) {
      'use strict';

   var
      constants = {
         toolbarHeight: 24
      },
      /**
       * @class SBIS3.CONTROLS.RichEditor
       * @extends SBIS3.CONTROLS.RichTextArea
       * @author Борисов П.С.
       * @public
       * @control
       */
      RichEditor = RichTextArea.extend(/** @lends SBIS3.CONTROLS.RichEditor.prototype */{
         _dotTplFn: dotTplFn,
         $protected : {
            _options : {
               /**
                * @cfg {Boolean} Панель инструментов
                * Возможные значения:
                * <ol>
                *    <li>true - использовать панель инструментов вместе с редактором;</li>
                *    <li>false - оставить только поле ввода.</li>
                * </ol>
                */
               toolbar: true,
               /**
                * @cfg {Boolean} Видимость панели инструментов
                * При скрытии панели инструментов работа в текстовом редакторе будет осуществляться только с клавиатуры.
                * Возможные значения:
                * <ol>
                *    <li>true - панель инструментов показана;</li>
                *    <li>false - скрыта.</li>
                * </ol>
                * @see toggleToolbar
                */
               toolbarVisible: true,
               /** Пользовательские элементы тулбара
                *  Конфигурирование опции смотрите в классе {@link SBIS3.CONTROLS.RichEditorToolbar#items}.
                */
               items:undefined
            },
            _toolbar: undefined
         },

         _initToolbar: function() {
            if (this._container.find('.controls-RichEditorToolbar').length) { //если есть конетейнер с тулбаром значит надо лишь установить на него ссылку
               this._toolbar = this.getChildControlByName('RichEditorToolbar');
            } else {//если мы неактивны значит редактор еще не строили на сервере, создадим его через new
               var
                  div = $('<div></div>');
               this._dataReview.before(div);
               this._toolbar = new Toolbar({
                  element: div,
                  name: 'RichEditorToolbar',
                  toolbarVisible: this._options.toolbarVisible,
                  items: this._options.items
               });
            }
            this._toolbar.setLinkedEditor(this);
            this._toolbar.subscribe('onVisibleChange', function(event, toolbarVisible) {
               var
                  newHeight = this._inputControl.outerHeight();
               newHeight += toolbarVisible ? -constants.toolbarHeight : constants.toolbarHeight;
               if (!this._options.autoHeight) {
                  this._inputControl.animate(
                     {
                        height: newHeight
                     },
                     'fast'
                  );
               }
               this.execCommand('');
            }.bind(this));
         },

         _getToolbar: function() {
            if (!this._toolbar) {
               this._initToolbar();
            }
            return this._toolbar;
         },

         _setEnabled: function(enabled){
            if (this._options.toolbar && (this._hasToolbar() || enabled)) {
               this._getToolbar().setEnabled(enabled);
            }
            RichEditor.superclass._setEnabled.apply(this, arguments);
         },

         _hasToolbar: function(){
            return !!this._toolbar;
         },

         _bindEvents: function() {
            RichEditor.superclass._bindEvents.apply(this, arguments);
            this._tinyEditor.on('init', function(){
               var
                  toolbarHeight = this._options.toolbar && this._options.toolbarVisible ? constants.toolbarHeight : 0,
                  editorHeight =  this._inputControl.height();
               if (!this._options.autoHeight){
                  this._inputControl.height(editorHeight - toolbarHeight);
               }
            }.bind(this));
         },

         /**
          * Возращает элемент тулбара с указанным именем или false (если он отсутствует)
          * @param {String} name Имя элемента
          * @returns {$ws.proto.Button|$ws.proto.MenuButton|Boolean}
          * @deprecated
          */
         getToolbarItem: function(buttonName){
            return this._toolbar && this._toolbar.getItemInstance(buttonName);
         }
      });

      return RichEditor;
   });