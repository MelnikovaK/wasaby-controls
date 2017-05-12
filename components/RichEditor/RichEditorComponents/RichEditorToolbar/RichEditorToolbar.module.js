/**
 * Created by ps.borisov on 18.07.2016.
 */

define('js!SBIS3.CONTROLS.RichEditorToolbar', [
   "Core/core-merge",
   "js!SBIS3.CONTROLS.RichEditorToolbarBase",
   "html!SBIS3.CONTROLS.RichEditorToolbar",
   "js!SBIS3.CONTROLS.RichEditorToolbar/resources/config",
   'js!SBIS3.CONTROLS.RichEditor.ImagePanel',
   "js!WSControls/Buttons/Button",
   "js!WSControls/Buttons/ToggleButton",
   'js!SBIS3.CONTROLS.MenuButton',
   'js!SBIS3.CONTROLS.ComboBox',
   'css!SBIS3.CONTROLS.RichEditorToolbar',
   "css!SBIS3.CONTROLS.ToggleButton/resources/ToggleButton__square"
], function( cMerge, RichEditorToolbarBase, dotTplFn, defaultConfig, ImagePanel) {

   'use strict';

   var
      constants = {
         toolbarHeight: 32
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
                * @cfg {Object} Объект с настройками стандартных и пользовательских кнопок.
                * @remark
                * Стандартные кнопки мержатся с пользовательскими, последние в приоритете.
                * <br/>
                * Список стандартных кнопок:
                * <ol>
                *    <li>undo - шаг назад;</li>
                *    <li>redo - шаг вперед;</li>
                *    <li>style - стиль текста;</li>
                *    <li>bold - полужирный;</li>
                *    <li>italic - курсив;</li>
                *    <li>underLine - подчеркнутый;</li>
                *    <li>strike - зачеркнутый;</li>
                *    <li>justify - выравнивание текста;</li>
                *    <li>color - цвет текста;</li>
                *    <li>list - вставить/Удалить список;</li>
                *    <li>link - вставить/редактировать ссылку;</li>
                *    <li>unlink - убрать ссылку;</li>
                *    <li>image - вставить картинку;</li>
                *    <li>smile - смайлики;</li>
                *    <li>source - html-разметка;</li>
                *    <li>paste - вставка с сохранением стилей</li>
                * </ol>
                * Пользовательские кнопки задаются аналогично {@link SBIS3.CONTROLS.ItemsControlMixin#items}.
                * <ul>
                *    <li>componentType - обязательный параметр, определяющий вид компонента</li>
                *    <li>name - имя компонента, по которому можно получить элемент тулбара.</li>
                * </ul>
                * @example
                * <pre>
                *    <options name="items" type="array">
                *       <options>
                *          <option name="name">myButton</option>
                *          <option name="componentType">SBIS3.CONTROLS.Button</option>
                *          <option name="icon" >sprite:icon-16 icon-Add icon-primary</option>
                *          <options name="handlers">
                *             <option name="onActivated" type="function">js!MyComponentName:prototype.myButtonClick</option>
                *          </options>
                *       </options>
                *    </options>
                * </pre>
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
               additionalText: false
            },
            _textAlignState: {
               alignleft: false,
               alignright: false,
               aligncenter: false,
               alignjustify: false
            },
            _styleBox: undefined,
            _pickerOpenHandler: undefined,
            _fromFormatChange: false
         },
         init: function() {
            var
               self = this;
            RichEditorToolbar.superclass.init.call(this);
            //Необходимо делать блокировку фокуса на пикере comboBox`a чтобы редактор не терял выделение
            //Делаем это при первом показе пикера
            if (this.getItems().getRecordById('style')){
               this._styleBox = this.getItemInstance('style');
               self._pickerOpenHandler = function() {
                  self._styleBox._picker._container.on('mousedown focus', self._blockFocusEvents);
               }.bind(self);
               self._styleBox.once('onPickerOpen', self._pickerOpenHandler);
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
            this._buttonSetEnabled('unlink', $(tinyEvent.element).closest('a').length);
         },

         _formatChangeHandler : function(event, obj, state) {
            switch (obj.format) {
               case 'bold':
               case 'italic':
               case 'underline':
               case 'strikethrough':
               case 'blockquote':
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
               result = RichEditorToolbar.superclass._toggleState.apply(this, arguments);
            if (this.getItems().getRecordById(result.name) && this.getItemInstance(result.name)) {
                this.getItemInstance(result.name).setChecked(result.state);
            }
         },

         _updateTextAlignButtons: function(state, obj) {
            this._textAlignState[obj.format] = state;
            var
               button = this.getItemInstance('align');
            if (button) {
               var
                  align = 'alignleft';
               for (var a in this._textAlignState) {
                  if (this._textAlignState[a]) {
                     align = a;
                  }
               }
               button.setIcon(button.getItems().getRecordById(align).get('icon'));
            }
         },

         _updateTextFormat: function(state, obj) {
            this._textFormats[obj.format] = state;
            var
               button = this.getItemInstance('style');
            if (button) {
               var
                  textFormat = 'mainText';
               for (var tf in this._textFormats) {
                  if (this._textFormats[tf]) {
                     textFormat = tf;
                  }
               }
               this._fromFormatChange = true;
               button.setSelectedKey(button.getItems().getRecordById(textFormat).get('key'));
               this._fromFormatChange = false;
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
                  items[i] = cMerge({
                     cssClassName: 'controls-RichEditorToolbar__item mce-',
                     tabindex: -1,
                     caption: '',
                     idProperty: 'key',
                     displayProperty: 'title'
                  }, items[i]);
               }
            }
            return items;
         },

         _unbindEditor: function() {
            var
               editor = this._options.linkedEditor;
            RichEditorToolbar.superclass._unbindEditor.apply(this, arguments);
            if (editor) {
               editor.unsubscribe('onUndoRedoChange', this._handlersInstances.undoRedo);
               editor.unsubscribe('onNodeChange', this._handlersInstances.node);
               editor.unsubscribe('onToggleContentSource', this._handlersInstances.source);
            }
         },

         _bindEditor: function() {
            var
               editor = this._options.linkedEditor;
            RichEditorToolbar.superclass._bindEditor.apply(this, arguments);

            this._handlersInstances.undoRedo = this._undoRedoChangeHandler.bind(this);
            this._handlersInstances.node = this._nodeChangeHandler.bind(this);
            this._handlersInstances.source = this._toggleContentSourceHandler.bind(this);
            if (this.getItems().getRecordById('undo') && this.getItems().getRecordById('redo')) {
               editor.subscribe('onUndoRedoChange', this._handlersInstances.undoRedo);
            }
            if (this.getItems().getRecordById('unlink')) {
               editor.subscribe('onNodeChange', this._handlersInstances.node);
            }
            if (this.getItems().getRecordById('source')) {
               editor.subscribe('onToggleContentSource', this._handlersInstances.source);
            }
         },

         getImagePanel: function(button){
            var
               self = this;
            if (!this._imagePanel) {
               this._imagePanel = new ImagePanel({
                  parent: button,
                  target: button.getContainer(),
                  verticalAlign: {
                     side: 'top',
                     offset: -10
                  },
                  horizontalAlign: {
                    side: 'right'
                  },
                  element: $('<div></div>'),
                  imageFolder: self.getLinkedEditor()._options.imageFolder
               });
               this._imagePanel.subscribe('onImageChange', function(event, key, fileobj){
                  self._insertImageTemplate(key, fileobj);
               });
            }
            return this._imagePanel;
         },

         /*БЛОК ФУНКЦИЙ ОБЁРТОК ДЛЯ ОТПРАВКИ КОМАНД РЕДАКТОРУ*/
         _execCommand : function(name) {
            if (this._options.linkedEditor) {
               this._options.linkedEditor.execCommand(name);
            }
         },

         _setFontStyle: function(style) {
         //_fromFormatChange - означает, что формат сменился под курсором и не нужно применять стиль
            if (this._options.linkedEditor && !this._fromFormatChange) {
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

         _insertSmile: function(smile) {
            if (this._options.linkedEditor) {
               this._options.linkedEditor.insertSmile(smile);
            }
         },

         _pasteFromBufferWithStyles: function(onAfterCloseHandler, target, saveStyles) {
            if (this._options.linkedEditor) {
               this._options.linkedEditor.pasteFromBufferWithStyles(onAfterCloseHandler, target, saveStyles);
            }
         },

         _toggleContentSource: function() {
            if (this._options.linkedEditor) {
               this._options.linkedEditor.toggleContentSource();
            }
         },
         _insertImageTemplate: function(key, fileobj) {
            if (this._options.linkedEditor) {
               this._options.linkedEditor.insertImageTemplate(key, fileobj);
            }
         },

         _openImagePanel: function(button){
            var
               imagePanel = this.getImagePanel(button);
            imagePanel.show();
         },
         /*БЛОК ФУНКЦИЙ ОБЁРТОК ДЛЯ ОТПРАВКИ КОМАНД РЕДАКТОРУ*/

         destroy: function() {
            this._toggleToolbarButton.unbind('click');
            this._toggleToolbarButton = null;
            if (this.getItems().getRecordById('style') && this._pickerOpenHandler) {
               this._styleBox.unsubscribe('onPickerOpen', this._pickerOpenHandler);
               this._pickerOpenHandler = null;
            }
            RichEditorToolbar.superclass.destroy.apply(this, arguments);
            this._itemsContainer = null;
         }

      });
   return RichEditorToolbar;
});