/**
 * Created by ps.borisov on 18.07.2016.
 */

define('js!SBIS3.CONTROLS.RichEditorToolbar', [
   'js!SBIS3.CONTROLS.RichEditorToolbarBase',
   'html!SBIS3.CONTROLS.RichEditorToolbar',
   'js!SBIS3.CONTROLS.RichEditorToolbar/resources/config',
   'js!SBIS3.CONTROLS.Button',
   'js!SBIS3.CONTROLS.ToggleButton',
   'js!SBIS3.CONTROLS.RichEditor.RichEditorMenuButton',
   'js!SBIS3.CONTROLS.RichEditor.RichEditorDropdown'
   ], function(RichEditorToolbarBase, dotTplFn, defaultConfig) {

   'use strict';

   var
      constants = {
         toolbarHeight: 24
      },
      /**
       * @class SBIS3.CONTROLS.RichEditorToolbar
       * @extends SBIS3.CONTROLS.RichEditorToolbarBase
       * @author Борисов П.С.
       * @public
       * @control
       */
      RichEditorToolbar = RichEditorToolbarBase.extend(/** @lends SBIS3.CONTROLS.RichEditorToolbar.prototype */{
         _dotTplFn: dotTplFn,
         $protected : {
            _options : {
               /**
                * @cfg {Object} Объект с настройками стандартных и пользовательских кнопок
                * Стандартные кнопки мержатся с пользовательскими, последние в приоритете
                * Список стандартных кнопок:
                * <ol>
                *    <li>undo - Шаг назад;</li>
                *    <li>redo - Шаг вперед;</li>
                *    <li>style - Стиль текста;</li>
                *    <li>bold - Полужирный;</li>
                *    <li>italic - Курсив;</li>
                *    <li>underLine - Подчеркнутый;</li>
                *    <li>strike - Зачеркнутый;</li>
                *    <li>justify - Выравнивание текста;</li>
                *    <li>color - Цвет текста;</li>
                *    <li>list - Вставить/Удалить список;</li>
                *    <li>link - Вставить/редактировать ссылку;</li>
                *    <li>unlink - Убрать ссылку;</li>
                *    <li>image - Вставить картинку;</li>
                *    <li>smile - Смайлики;</li>
                *    <li>source - html-разметка;</li>
                *    <li>paste - вставка с сохранением стилей</li>
                * </ol>
                * Пользовательские кнопки задаются аналогично {@link SBIS3.CONTROLS.ItemsControlMixin#items}
                * componentType - обязательный параметр определяющий вид компонента
                * name - имя компонента по которому можно получить элемент тулбара
                * @example
                * <options name="items" type="array">
                *        <options>
                *           <option name="name">myButton</option>
                *           <option name="componentType">SBIS3.CONTROLS.Button</option>
                *           <option name="icon" >sprite:icon-16 icon-Add icon-primary</option>
                *           <options name="handlers">
                *              <option name="onActivated" type="function">js!MyComponentName:prototype.myButtonClick</option>
                *           </options>
                *        </options>
                *</options>
                */
               items: undefined,
               defaultConfig: defaultConfig
            },
            _toggleToolbarButton: undefined,
            _itemsContainer:  undefined,
            _doAnimate: false,
            _textFormats: {
               title: false,
               subTitle: false,
               selectedMainText: false,
               additionalText: false
            },
            _textAlignState: {
               alignleft: false,
               alignright: false,
               aligncenter: false,
               alignjustify: false
            }
         },

         $constructor: function() {
            this._toggleToolbarButton = this._container.find('.controls-RichEditorToolbar__toggleButton').bind('click', this.toggleToolbar.bind(this));
            this._toggleToolbarButton.on('mousedown focus', this._blockFocusEvents);
         },

         setExpanded: function(expanded) {
            var
               self = this;

            if (!this._doAnimate)
            {
               this._doAnimate = true;
               this._itemsContainer.animate(
               {
                  height: expanded ? constants.toolbarHeight : 0
               },
               'fast',
               function () {
                  self._doAnimate = false;
                  self._container.toggleClass('controls-RichEditorToolbar__hide', !expanded);
               }
               );
               RichEditorToolbar.superclass.setExpanded.apply(this, arguments);
            }
         },

         _undoRedoChangeHandler : function(event, hasUndoRedo) {
            this._buttonSetEnabled('redo', hasUndoRedo.hasRedo);
            this._buttonSetEnabled('undo', hasUndoRedo.hasUndo)
         },

         _nodeChangeHandler : function(event, tinyEvent) {
            this._buttonSetEnabled('unlink', tinyEvent.element.nodeName === 'A');
         },

         _formatChangeHandler : function(event, obj, state) {
            switch (obj.format) {
               case 'bold':
               case 'italic':
               case 'underline':
               case 'strikethrough':
                  this._toggleState(state, obj);
               break;
               case 'alignleft':
               case 'aligncenter':
               case 'alignright':
               case 'alignjustify':
                  this._updateTextAlignButtons(state, obj);
                  break;
               case 'title':
               case 'subTitle':
               case 'selectedMainText':
               case 'additionalText':
                  this._updateTextFormat(state, obj);
                  break;
            }
         },

         _toggleState: function(state, obj) {
            var
               selectors = {
                  'bold':  'strong',
                  'italic':  'em',
                  'underline':  'span[style*="decoration: underline"]',
                  'strikethrough':  'span[style*="decoration: line-through"]'
               };
            if (!state && $(obj.node).closest(selectors[obj.format]).length) {
               state = true;
            }
             if (this.getItemInstance(obj.format)) {
                this.getItemInstance(obj.format).setChecked(state);
            }
         },

         _updateTextAlignButtons: function(state, obj) {
            this._textAlignState[obj.format] = state;
            if (this.getItemInstance('align')) {
               var
                  align = 'alignleft';
               for (var a in this._textAlignState) {
                  if (this._textAlignState[a]) {
                     align = a;
                  }
               }
               this.getItemInstance('align')._drawSelectedItems([align]);
            }
         },

         _updateTextFormat: function(state, obj) {
            this._textFormats[obj.format] = state;
            if (this.getItemInstance('style')) {
               var
                  textFormat = 'mainText';
               for (var tf in this._textFormats) {
                  if (this._textFormats[tf]) {
                     textFormat = tf;
                  }
               }
               this.getItemInstance('style')._drawSelectedItems([textFormat]);
            }
         },

         _buttonSetEnabled: function(buttonName,enabled ) {
            this.getItemInstance(buttonName).setEnabled(enabled);
         },

         _toggleContentSourceHandler: function(event, state) {
            var
               buttons = this.getItemsInstances();
            if (state && !this._buttonsState) {
               this._buttonsState = {};
               for (var i in buttons) {
                  if (  buttons[i].getName() !== 'source') {
                     this._buttonsState[i] = buttons[i].isEnabled();
                     buttons[i].setEnabled(false);
                  }
               }
            } else if (this._buttonsState) {
               for (var j in this._buttonsState) {
                  if ( buttons[j].getName() !== 'source') {
                     buttons[j].setEnabled(this._buttonsState[j]);
                  }
               }
               this._buttonsState = undefined;
            }
         },

         _prepareItems: function(){
            var
               items = RichEditorToolbar.superclass._prepareItems.apply(this, arguments);
            for (var i in items) {
               if (items.hasOwnProperty(i)) {
                  items[i] = $ws.core.merge({
                     cssClassName: 'controls-RichEditorToolbar__item mce-',
                     tabindex: -1,
                     caption: '',
                     keyField: 'key',
                     displayField: 'title'
                  }, items[i]);
               }
            }
            return items;
         },

         /*БЛОК ФУНКЦИЙ ОБЁРТОК ДЛЯ ОТПРАВКИ КОМАНД РЕДАКТОРУ*/
         _execCommand : function(name) {
            if (this._options.linkedEditor) {
               this._options.linkedEditor.execCommand(name);
            }
         },

         _setFontStyle: function(style) {
            if (this._options.linkedEditor) {
               this._options.linkedEditor.setFontStyle(style);
            }
         },

         _setTextAlign: function(align) {
            if (this._options.linkedEditor) {
               this._options.linkedEditor.setTextAlign(align);
            }
         },

         _setFontColor: function(color) {
            if (this._options.linkedEditor) {
               this._options.linkedEditor.setFontColor(color);
            }
         },

         _insertLink: function(onAfterCloseHandler, target) {
            if (this._options.linkedEditor) {
               this._options.linkedEditor.insertLink(onAfterCloseHandler, target);
            }
         },

         _selectFile: function(originalEvent) {
            if (this._options.linkedEditor) {
               this._options.linkedEditor._getFileLoader().selectFile(originalEvent);
            }
         },

         _insertSmile: function(smile) {
            if (this._options.linkedEditor) {
               this._options.linkedEditor.insertSmile(smile);
            }
         },

         _pasteFromBufferWithStyles: function(onAfterCloseHandler, target) {
            if (this._options.linkedEditor) {
               this._options.linkedEditor.pasteFromBufferWithStyles(onAfterCloseHandler, target);
            }
         },

         _toggleContentSource: function() {
            if (this._options.linkedEditor) {
               this._options.linkedEditor.toggleContentSource();
            }
         },
         /*БЛОК ФУНКЦИЙ ОБЁРТОК ДЛЯ ОТПРАВКИ КОМАНД РЕДАКТОРУ*/

         destroy: function() {
            this._unbindEditor();
            this._toggleToolbarButton.unbind('click');
            this._handlersInstances = null;
            this._toggleToolbarButton = null;
            RichEditorToolbar.superclass.destroy.apply(this, arguments);
            this._itemsContainer = null;
         }

      });
   return RichEditorToolbar;
});